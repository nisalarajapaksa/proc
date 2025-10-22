from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.task import Task, MicroGoal, ExecutionEvent
from app.schemas.task import (
    TaskInput,
    TaskBreakdownResponse,
    TaskResponse,
    TaskConfirm,
    MicroGoalSchema,
    ExecutionEventSchema,
    ExecutionSummary,
    ProgressDataResponse
)
from app.services.llm_service import llm_service

router = APIRouter()


@router.post("/breakdown", response_model=TaskBreakdownResponse)
async def breakdown_tasks(
    task_input: TaskInput,
    db: Session = Depends(get_db)
):
    """
    Take user's raw task input and break it down into micro-goals using LLM
    """
    try:
        # Call LLM to break down tasks
        micro_goals_data = await llm_service.breakdown_tasks(task_input.tasks_text)

        # Create task record (not confirmed yet)
        task = Task(
            user_input=task_input.tasks_text,
            confirmed=False,
            starting_time=task_input.starting_time
        )
        db.add(task)
        db.flush()  # Get the task ID

        # Calculate times for each micro-goal if starting_time is provided
        current_time = task_input.starting_time
        user_end_time = task_input.end_time

        # Create micro-goal records with Pomodoro breaks
        micro_goals = []
        micro_goal_schemas = []
        accumulated_work_minutes = 0  # Track time since last break
        total_pomodoros_completed = 0  # Track total pomodoros for long break scheduling

        for idx, goal_data in enumerate(micro_goals_data):
            start_time = None
            end_time = None
            exceeds_end_time = False
            estimated_minutes = goal_data.get("estimated_minutes", 30)

            if current_time:
                # Convert time to datetime for calculation
                today = datetime.today()
                current_datetime = datetime.combine(today, current_time)
                start_time = current_time

                # Calculate end time
                end_datetime = current_datetime + timedelta(minutes=estimated_minutes)
                end_time = end_datetime.time()

                # Check if this micro-goal exceeds the user's desired end time
                if user_end_time and end_time > user_end_time:
                    exceeds_end_time = True

                # Update current_time for next item (task or break)
                current_time = end_time

            # Add the actual task
            micro_goal = MicroGoal(
                task_id=task.id,
                title=goal_data.get("title", ""),
                description=goal_data.get("description", ""),
                estimated_minutes=estimated_minutes,
                order=len(micro_goals),  # Use actual position in list
                completed=False,
                starting_time=start_time,
                end_time=end_time
            )
            db.add(micro_goal)
            micro_goals.append(micro_goal)

            # Create schema with exceeds_end_time flag
            schema = MicroGoalSchema.model_validate(micro_goal)
            schema.exceeds_end_time = exceeds_end_time
            schema.is_break = False
            micro_goal_schemas.append(schema)

            # Accumulate work time
            accumulated_work_minutes += estimated_minutes

            # Debug logging
            print(f"DEBUG: Task {idx + 1}: {estimated_minutes} min, Accumulated: {accumulated_work_minutes} min")

            # Check if we should add a break (at least 25 minutes of work, and not the last task)
            if accumulated_work_minutes >= 25 and idx < len(micro_goals_data) - 1 and current_time:
                print(f"DEBUG: Adding break after {accumulated_work_minutes} minutes of work")
                # Increment pomodoro count
                total_pomodoros_completed += 1

                # Determine break type: long break after every 3 pomodoros, short break otherwise
                is_long_break = (total_pomodoros_completed % 3 == 0)
                break_minutes = 15 if is_long_break else 5
                break_type = "long" if is_long_break else "short"

                # Calculate break times
                today = datetime.today()
                break_start = current_time
                break_start_datetime = datetime.combine(today, break_start)
                break_end_datetime = break_start_datetime + timedelta(minutes=break_minutes)
                break_end = break_end_datetime.time()

                # Check if break exceeds end time
                break_exceeds = False
                if user_end_time and break_end > user_end_time:
                    break_exceeds = True

                # Create break as a micro-goal
                break_goal = MicroGoal(
                    task_id=task.id,
                    title=f"{'Long' if is_long_break else 'Short'} Break",
                    description=f"Take a {'15' if is_long_break else '5'} minute break - relax, stretch, hydrate! 🧘",
                    estimated_minutes=break_minutes,
                    order=len(micro_goals),
                    completed=False,
                    starting_time=break_start,
                    end_time=break_end
                )
                db.add(break_goal)
                micro_goals.append(break_goal)

                # Create schema for break
                break_schema = MicroGoalSchema.model_validate(break_goal)
                break_schema.exceeds_end_time = break_exceeds
                break_schema.is_break = True
                break_schema.break_type = break_type
                micro_goal_schemas.append(break_schema)

                # Update current time to after the break
                current_time = break_end

                # Reset accumulated work time
                accumulated_work_minutes = 0

        db.commit()
        db.refresh(task)

        # Calculate total time
        total_minutes = sum(mg.estimated_minutes for mg in micro_goals)

        return TaskBreakdownResponse(
            task_id=task.id,
            micro_goals=micro_goal_schemas,
            total_estimated_minutes=total_minutes
        )

    except Exception as e:
        db.rollback()
        print(f"ERROR in breakdown_tasks: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing tasks: {str(e)}")


@router.post("/confirm", response_model=TaskResponse)
async def confirm_tasks(
    task_confirm: TaskConfirm,
    db: Session = Depends(get_db)
):
    """
    User confirms (possibly edited) micro-goals and saves them permanently
    """
    task = db.query(Task).filter(Task.id == task_confirm.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        # Delete existing micro-goals
        db.query(MicroGoal).filter(MicroGoal.task_id == task.id).delete()

        # Create new micro-goals from user's confirmation
        for goal_data in task_confirm.micro_goals:
            micro_goal = MicroGoal(
                task_id=task.id,
                title=goal_data.title,
                description=goal_data.description,
                estimated_minutes=goal_data.estimated_minutes,
                order=goal_data.order,
                completed=goal_data.completed,
                starting_time=goal_data.starting_time,
                end_time=goal_data.end_time,
                exceeds_end_time=goal_data.exceeds_end_time or False,
                is_break=goal_data.is_break or False,
                break_type=goal_data.break_type
            )
            db.add(micro_goal)

        # Mark task as confirmed
        task.confirmed = True
        db.commit()
        db.refresh(task)

        return TaskResponse.model_validate(task)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error confirming tasks: {str(e)}")


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    confirmed_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all tasks, optionally filter by confirmed status
    """
    query = db.query(Task)
    if confirmed_only:
        query = query.filter(Task.confirmed == True)

    tasks = query.order_by(Task.created_at.desc()).all()
    return [TaskResponse.model_validate(task) for task in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """
    Get a specific task by ID
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse.model_validate(task)


@router.delete("/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """
    Delete a task and all its micro-goals
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}


# Pomodoro Timer Control Endpoints

@router.post("/micro-goals/{goal_id}/start", response_model=MicroGoalSchema)
async def start_micro_goal(goal_id: int, db: Session = Depends(get_db)):
    """
    Start a micro-goal timer
    """
    # Stop any currently active micro-goals
    db.query(MicroGoal).filter(MicroGoal.is_active == True).update({"is_active": False})

    micro_goal = db.query(MicroGoal).filter(MicroGoal.id == goal_id).first()
    if not micro_goal:
        raise HTTPException(status_code=404, detail="Micro-goal not found")

    if micro_goal.completed:
        raise HTTPException(status_code=400, detail="Cannot start a completed task")

    now = datetime.utcnow()
    micro_goal.is_active = True
    micro_goal.is_paused = False
    if not micro_goal.actual_start_time:
        micro_goal.actual_start_time = now

    # Log execution event
    event = ExecutionEvent(
        micro_goal_id=goal_id,
        action="start",
        timestamp=now,
        time_spent_at_event=micro_goal.time_spent_seconds or 0
    )
    db.add(event)

    db.commit()
    db.refresh(micro_goal)

    return MicroGoalSchema.model_validate(micro_goal)


@router.post("/micro-goals/{goal_id}/pause", response_model=MicroGoalSchema)
async def pause_micro_goal(goal_id: int, db: Session = Depends(get_db)):
    """
    Pause a micro-goal timer
    """
    micro_goal = db.query(MicroGoal).filter(MicroGoal.id == goal_id).first()
    if not micro_goal:
        raise HTTPException(status_code=404, detail="Micro-goal not found")

    if not micro_goal.is_active:
        raise HTTPException(status_code=400, detail="Task is not active")

    now = datetime.utcnow()
    micro_goal.is_paused = True

    # Log execution event
    event = ExecutionEvent(
        micro_goal_id=goal_id,
        action="pause",
        timestamp=now,
        time_spent_at_event=micro_goal.time_spent_seconds or 0
    )
    db.add(event)

    db.commit()
    db.refresh(micro_goal)

    return MicroGoalSchema.model_validate(micro_goal)


@router.post("/micro-goals/{goal_id}/resume", response_model=MicroGoalSchema)
async def resume_micro_goal(goal_id: int, db: Session = Depends(get_db)):
    """
    Resume a paused micro-goal timer
    """
    # Stop any currently active micro-goals
    db.query(MicroGoal).filter(MicroGoal.is_active == True, MicroGoal.id != goal_id).update({"is_active": False})

    micro_goal = db.query(MicroGoal).filter(MicroGoal.id == goal_id).first()
    if not micro_goal:
        raise HTTPException(status_code=404, detail="Micro-goal not found")

    if not micro_goal.is_paused:
        raise HTTPException(status_code=400, detail="Task is not paused")

    now = datetime.utcnow()
    micro_goal.is_paused = False

    # Log execution event
    event = ExecutionEvent(
        micro_goal_id=goal_id,
        action="resume",
        timestamp=now,
        time_spent_at_event=micro_goal.time_spent_seconds or 0
    )
    db.add(event)

    db.commit()
    db.refresh(micro_goal)

    return MicroGoalSchema.model_validate(micro_goal)


@router.post("/micro-goals/{goal_id}/complete", response_model=MicroGoalSchema)
async def complete_micro_goal(goal_id: int, db: Session = Depends(get_db)):
    """
    Mark a micro-goal as completed
    """
    micro_goal = db.query(MicroGoal).filter(MicroGoal.id == goal_id).first()
    if not micro_goal:
        raise HTTPException(status_code=404, detail="Micro-goal not found")

    now = datetime.utcnow()
    micro_goal.completed = True
    micro_goal.is_active = False
    micro_goal.is_paused = False
    micro_goal.actual_end_time = now

    # Calculate total time spent
    if micro_goal.actual_start_time:
        time_diff = micro_goal.actual_end_time - micro_goal.actual_start_time
        micro_goal.time_spent_seconds = int(time_diff.total_seconds())

    # Log execution event
    event = ExecutionEvent(
        micro_goal_id=goal_id,
        action="complete",
        timestamp=now,
        time_spent_at_event=micro_goal.time_spent_seconds or 0
    )
    db.add(event)

    db.commit()
    db.refresh(micro_goal)

    return MicroGoalSchema.model_validate(micro_goal)


@router.patch("/micro-goals/{goal_id}/time", response_model=MicroGoalSchema)
async def update_time_spent(goal_id: int, time_spent_seconds: int, db: Session = Depends(get_db)):
    """
    Update the time spent on a micro-goal (for tracking elapsed time from frontend)
    """
    micro_goal = db.query(MicroGoal).filter(MicroGoal.id == goal_id).first()
    if not micro_goal:
        raise HTTPException(status_code=404, detail="Micro-goal not found")

    micro_goal.time_spent_seconds = time_spent_seconds

    db.commit()
    db.refresh(micro_goal)

    return MicroGoalSchema.model_validate(micro_goal)


@router.get("/micro-goals/{goal_id}/execution-summary", response_model=ExecutionSummary)
async def get_execution_summary(goal_id: int, db: Session = Depends(get_db)):
    """
    Get detailed execution summary comparing planned vs actual for a micro-goal
    """
    micro_goal = db.query(MicroGoal).filter(MicroGoal.id == goal_id).first()
    if not micro_goal:
        raise HTTPException(status_code=404, detail="Micro-goal not found")

    # Get all execution events
    events = db.query(ExecutionEvent).filter(
        ExecutionEvent.micro_goal_id == goal_id
    ).order_by(ExecutionEvent.timestamp).all()

    # Calculate statistics
    start_events = [e for e in events if e.action == "start"]
    pause_events = [e for e in events if e.action == "pause"]
    resume_events = [e for e in events if e.action == "resume"]
    complete_events = [e for e in events if e.action == "complete"]

    total_sessions = len(start_events) + len(resume_events)
    total_pauses = len(pause_events)

    actual_duration_seconds = micro_goal.time_spent_seconds or 0
    actual_duration_minutes = actual_duration_seconds / 60.0
    planned_duration_minutes = micro_goal.estimated_minutes
    variance_minutes = actual_duration_minutes - planned_duration_minutes

    return ExecutionSummary(
        planned_duration_minutes=planned_duration_minutes,
        actual_duration_seconds=actual_duration_seconds,
        actual_duration_minutes=actual_duration_minutes,
        variance_minutes=variance_minutes,
        total_pauses=total_pauses,
        total_sessions=total_sessions,
        started_at=micro_goal.actual_start_time,
        completed_at=micro_goal.actual_end_time,
        events=[ExecutionEventSchema.model_validate(e) for e in events]
    )


@router.get("/tasks/{task_id}/progress", response_model=ProgressDataResponse)
async def get_task_progress(task_id: int, db: Session = Depends(get_db)):
    """
    Get progress summary for a task with AI-generated tips
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get all micro-goals (excluding breaks for counting)
    all_goals = db.query(MicroGoal).filter(MicroGoal.task_id == task_id).order_by(MicroGoal.order).all()
    work_goals = [g for g in all_goals if not g.is_break]

    # Calculate statistics
    total_tasks = len(work_goals)
    completed_tasks = sum(1 for g in work_goals if g.completed)
    total_planned_minutes = sum(g.estimated_minutes for g in work_goals)
    total_actual_minutes = sum((g.time_spent_seconds or 0) / 60 for g in work_goals)

    # Find current active task
    current_task = next((g for g in work_goals if g.is_active), None)
    current_task_title = current_task.title if current_task else None

    # Count task statuses
    on_time_tasks_count = sum(1 for g in work_goals if g.completed)
    upcoming_tasks_count = sum(1 for g in work_goals if not g.completed and not g.is_active)
    overdue_tasks_count = sum(1 for g in work_goals if not g.completed and g.exceeds_end_time)

    # Get current time for comparison
    from datetime import datetime, time as dt_time
    now = datetime.now()
    current_time = now.time()

    # Calculate time-based metrics
    session_start_time = task.starting_time
    first_task_start = work_goals[0].starting_time if work_goals and work_goals[0].starting_time else None
    last_task_end = work_goals[-1].end_time if work_goals and work_goals[-1].end_time else None

    # Prepare data for LLM
    task_details = []
    for goal in work_goals:
        task_detail = {
            "title": goal.title,
            "estimated_minutes": goal.estimated_minutes,
            "actual_minutes": round((goal.time_spent_seconds or 0) / 60, 1) if goal.time_spent_seconds else 0,
            "completed": goal.completed,
            "is_active": goal.is_active,
            "exceeds_end_time": goal.exceeds_end_time,
            "scheduled_start": goal.starting_time.strftime("%H:%M") if goal.starting_time else None,
            "scheduled_end": goal.end_time.strftime("%H:%M") if goal.end_time else None,
        }

        # Add status relative to current time
        if goal.starting_time and goal.end_time:
            if current_time < goal.starting_time:
                task_detail["time_status"] = "upcoming"
            elif goal.starting_time <= current_time <= goal.end_time:
                task_detail["time_status"] = "should_be_active_now"
            else:  # current_time > goal.end_time
                task_detail["time_status"] = "past_scheduled_time"

        task_details.append(task_detail)

    progress_data = {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "total_planned_minutes": total_planned_minutes,
        "total_actual_minutes": int(total_actual_minutes),
        "current_task_title": current_task_title,
        "on_time_tasks_count": on_time_tasks_count,
        "overdue_tasks_count": overdue_tasks_count,
        "upcoming_tasks_count": upcoming_tasks_count,
        "task_details": task_details,
        "current_time": current_time.strftime("%H:%M"),
        "session_start_time": session_start_time.strftime("%H:%M") if session_start_time else None,
        "first_task_start": first_task_start.strftime("%H:%M") if first_task_start else None,
        "last_task_end": last_task_end.strftime("%H:%M") if last_task_end else None,
    }

    # Generate tips using LLM
    try:
        tips = await llm_service.generate_progress_tips(progress_data)
    except Exception as e:
        print(f"ERROR generating tips: {str(e)}")
        tips = ["Keep up the good work!", "Stay focused on your goals.", "Take breaks when needed."]

    return ProgressDataResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        total_planned_minutes=total_planned_minutes,
        total_actual_minutes=int(total_actual_minutes),
        current_task_title=current_task_title,
        on_time_tasks_count=on_time_tasks_count,
        overdue_tasks_count=overdue_tasks_count,
        upcoming_tasks_count=upcoming_tasks_count,
        tips=tips
    )

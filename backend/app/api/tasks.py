from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.task import Task, MicroGoal
from app.schemas.task import (
    TaskInput,
    TaskBreakdownResponse,
    TaskResponse,
    TaskConfirm,
    MicroGoalSchema
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
                completed=goal_data.completed
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

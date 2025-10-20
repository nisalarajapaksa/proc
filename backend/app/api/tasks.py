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

        # Create micro-goal records
        micro_goals = []
        for idx, goal_data in enumerate(micro_goals_data):
            start_time = None
            end_time = None

            if current_time:
                # Convert time to datetime for calculation
                today = datetime.today()
                current_datetime = datetime.combine(today, current_time)
                start_time = current_time

                # Calculate end time
                estimated_minutes = goal_data.get("estimated_minutes", 30)
                end_datetime = current_datetime + timedelta(minutes=estimated_minutes)
                end_time = end_datetime.time()

                # Update current_time for next micro-goal
                current_time = end_time

            micro_goal = MicroGoal(
                task_id=task.id,
                title=goal_data.get("title", ""),
                description=goal_data.get("description", ""),
                estimated_minutes=goal_data.get("estimated_minutes", 30),
                order=goal_data.get("order", idx),
                completed=False,
                starting_time=start_time,
                end_time=end_time
            )
            db.add(micro_goal)
            micro_goals.append(micro_goal)

        db.commit()
        db.refresh(task)

        # Calculate total time
        total_minutes = sum(mg.estimated_minutes for mg in micro_goals)

        return TaskBreakdownResponse(
            task_id=task.id,
            micro_goals=[MicroGoalSchema.model_validate(mg) for mg in micro_goals],
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

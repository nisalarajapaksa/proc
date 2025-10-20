from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, time


class TaskInput(BaseModel):
    """User's raw input of daily tasks"""
    tasks_text: str = Field(..., min_length=1, description="Raw text containing all tasks for the day")
    starting_time: Optional[time] = Field(None, description="Starting time for the first micro-goal")


class MicroGoalSchema(BaseModel):
    """Schema for a single micro-goal"""
    id: int | None = None
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    estimated_minutes: int = Field(..., gt=0, le=480, description="Estimated time in minutes (max 8 hours)")
    order: int = Field(..., ge=0)
    completed: bool = False
    starting_time: Optional[time] = None
    end_time: Optional[time] = None

    class Config:
        from_attributes = True


class TaskBreakdownResponse(BaseModel):
    """Response from LLM with broken down micro-goals"""
    task_id: int
    micro_goals: List[MicroGoalSchema]
    total_estimated_minutes: int


class TaskResponse(BaseModel):
    """Complete task response with metadata"""
    id: int
    user_input: str
    created_at: datetime
    confirmed: bool
    starting_time: Optional[time] = None
    micro_goals: List[MicroGoalSchema]

    class Config:
        from_attributes = True


class TaskConfirm(BaseModel):
    """Confirmation request with possibly edited micro-goals"""
    task_id: int
    micro_goals: List[MicroGoalSchema]

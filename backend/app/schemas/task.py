from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, time


class TaskInput(BaseModel):
    """User's raw input of daily tasks"""
    tasks_text: str = Field(..., min_length=1, description="Raw text containing all tasks for the day")
    starting_time: Optional[time] = Field(None, description="Starting time for the first micro-goal")
    end_time: Optional[time] = Field(None, description="Desired end time for tasks")


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
    exceeds_end_time: bool = False  # Flag to indicate if this task goes beyond the user's desired end time
    is_break: bool = False  # Flag to indicate if this is a Pomodoro break
    break_type: Optional[str] = None  # "short" (5 min) or "long" (15 min)

    # Pomodoro timer state (use Optional to handle None from DB)
    is_active: Optional[bool] = False
    is_paused: Optional[bool] = False
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    time_spent_seconds: Optional[int] = 0

    # Execution tracking
    execution_history: Optional[List[Dict[str, Any]]] = []
    execution_events: Optional[List[ExecutionEventSchema]] = []

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


class ExecutionEventSchema(BaseModel):
    """Schema for a single execution event"""
    id: Optional[int] = None
    action: str = Field(..., description="start, pause, resume, or complete")
    timestamp: datetime
    time_spent_at_event: int = Field(default=0, description="Total seconds spent at time of event")
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ExecutionSummary(BaseModel):
    """Summary of task execution comparing plan vs actual"""
    planned_duration_minutes: int
    actual_duration_seconds: int
    actual_duration_minutes: float
    variance_minutes: float
    total_pauses: int
    total_sessions: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    events: List[ExecutionEventSchema] = []

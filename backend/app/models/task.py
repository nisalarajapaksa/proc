from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Time, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_input = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed = Column(Boolean, default=False)
    starting_time = Column(Time, nullable=True)  # Starting time for first micro-goal

    # Relationship
    micro_goals = relationship("MicroGoal", back_populates="task", cascade="all, delete-orphan")


class MicroGoal(Base):
    __tablename__ = "micro_goals"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    estimated_minutes = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    starting_time = Column(Time, nullable=True)  # Calculated starting time
    end_time = Column(Time, nullable=True)  # Calculated end time
    exceeds_end_time = Column(Boolean, default=False)  # Whether task exceeds user's desired end time
    is_break = Column(Boolean, default=False)  # Whether this is a Pomodoro break
    break_type = Column(String(10), nullable=True)  # "short" or "long" break type

    # Pomodoro timer state
    is_active = Column(Boolean, default=False)  # Currently running
    is_paused = Column(Boolean, default=False)  # Paused state
    actual_start_time = Column(DateTime, nullable=True)  # When user actually started
    actual_end_time = Column(DateTime, nullable=True)  # When user actually completed
    time_spent_seconds = Column(Integer, default=0)  # Actual time spent in seconds

    # Detailed execution history
    # JSON array of execution events: [{"action": "start|pause|resume|complete", "timestamp": "ISO datetime"}]
    execution_history = Column(JSON, default=list)

    # Relationship
    task = relationship("Task", back_populates="micro_goals")
    execution_events = relationship("ExecutionEvent", back_populates="micro_goal", cascade="all, delete-orphan")


class ExecutionEvent(Base):
    """Track every start/pause/resume/complete action for detailed analytics"""
    __tablename__ = "execution_events"

    id = Column(Integer, primary_key=True, index=True)
    micro_goal_id = Column(Integer, ForeignKey("micro_goals.id"), nullable=False)
    action = Column(String(50), nullable=False)  # "start", "pause", "resume", "complete"
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    time_spent_at_event = Column(Integer, default=0)  # Seconds spent at time of this event
    notes = Column(Text, nullable=True)  # Optional notes about the event

    # Relationship
    micro_goal = relationship("MicroGoal", back_populates="execution_events")

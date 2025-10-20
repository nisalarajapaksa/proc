from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
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

    # Relationship
    task = relationship("Task", back_populates="micro_goals")

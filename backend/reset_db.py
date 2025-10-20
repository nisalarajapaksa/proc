"""
Script to reset the database - deletes and recreates tables with new schema
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.task import Task, MicroGoal, ExecutionEvent

def reset_database():
    """Drop all tables and recreate them"""
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)

    print("Creating tables with new schema...")
    Base.metadata.create_all(bind=engine)

    print("Database reset complete!")
    print("New tables created:")
    print("  - tasks")
    print("  - micro_goals (with timer state and execution_history)")
    print("  - execution_events (detailed event logging for plan vs actual comparison)")

if __name__ == "__main__":
    reset_database()

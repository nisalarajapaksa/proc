import google.generativeai as genai
from app.core.config import settings
from typing import List, Dict
import json
import asyncio
from functools import partial


class LLMService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def breakdown_tasks(self, tasks_text: str) -> List[Dict]:
        """
        Takes raw task text and returns structured micro-goals

        Args:
            tasks_text: User's raw input of tasks

        Returns:
            List of micro-goals with title, description, and estimated_minutes
        """

        prompt = f"""Break down these tasks into small, focused micro-goals:

{tasks_text}

IMPORTANT Rules:
- Keep tasks SHORT: 10-20 minutes each (NOT 25-30 minutes)
- Break large tasks into multiple smaller steps
- Order logically (dependencies first)
- Add brief description with motivation

Example: Instead of "Write report (30 min)", create:
- "Outline report structure (10 min)"
- "Write introduction (15 min)"
- "Draft main sections (20 min)"

Note: System will auto-add breaks after 25+ min of accumulated work.

Return ONLY a JSON array (no markdown):
[
  {{
    "title": "Specific action to take",
    "description": "Brief context",
    "estimated_minutes": 15,
    "order": 0
  }}
]

Return pure JSON only."""

        try:
            # Generate content using Gemini (run in executor since it's blocking)
            loop = asyncio.get_event_loop()

            # Configure safety settings to be less restrictive
            from google.generativeai.types import HarmCategory, HarmBlockThreshold

            safety_settings = [
                {
                    "category": HarmCategory.HARM_CATEGORY_HARASSMENT,
                    "threshold": HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    "category": HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    "threshold": HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    "category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    "threshold": HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    "category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    "threshold": HarmBlockThreshold.BLOCK_NONE,
                },
            ]

            generate_func = partial(
                self.model.generate_content,
                prompt,
                generation_config={
                    'temperature': 0.7,
                    'top_p': 0.95,
                    'top_k': 40,
                    'max_output_tokens': 4096,  # Increased to avoid truncation
                },
                safety_settings=safety_settings
            )
            response = await loop.run_in_executor(None, generate_func)

            # Check if response was blocked or has no valid parts
            print(f"DEBUG: Response candidates: {response.candidates if hasattr(response, 'candidates') else 'N/A'}")
            print(f"DEBUG: Prompt feedback: {response.prompt_feedback if hasattr(response, 'prompt_feedback') else 'N/A'}")

            # Check if we have valid parts in the response
            if not response.candidates or len(response.candidates) == 0:
                raise ValueError(f"No response generated. The request may have been blocked by safety filters. Please try rephrasing your tasks.")

            candidate = response.candidates[0]
            print(f"DEBUG: Finish reason: {candidate.finish_reason}")
            print(f"DEBUG: Finish reason name: {candidate.finish_reason.name if hasattr(candidate.finish_reason, 'name') else 'N/A'}")

            # Check finish reason
            # FinishReason enum: 0=UNSPECIFIED, 1=STOP (success), 2=MAX_TOKENS, 3=SAFETY, 4=RECITATION, 5=OTHER
            finish_reason_value = int(candidate.finish_reason) if hasattr(candidate.finish_reason, '__int__') else candidate.finish_reason
            finish_reason_name = candidate.finish_reason.name if hasattr(candidate.finish_reason, 'name') else str(finish_reason_value)

            # Check if we have valid content parts first
            if not candidate.content or not candidate.content.parts:
                # No content parts - likely blocked
                if hasattr(candidate, 'safety_ratings'):
                    print(f"DEBUG: Safety ratings: {candidate.safety_ratings}")

                if finish_reason_value == 3 or finish_reason_name == 'SAFETY':
                    raise ValueError(f"Content generation blocked by safety filters. Please try rephrasing your tasks with simpler language.")
                else:
                    raise ValueError(f"No valid content returned. Finish reason: {finish_reason_name} ({finish_reason_value})")

            # If we got here, we have content parts - check for truncation
            if finish_reason_value == 2 or finish_reason_name == 'MAX_TOKENS':
                print(f"WARNING: Response may be truncated due to max tokens limit")
                # We'll try to process it anyway and fix incomplete JSON later

            # Extract text safely
            try:
                content = response.text.strip()
            except ValueError as e:
                # If response.text accessor fails, try to get text from parts directly
                if candidate.content.parts:
                    content = candidate.content.parts[0].text.strip()
                else:
                    raise ValueError(f"Unable to extract text from response: {str(e)}")
            print(f"DEBUG: Full Gemini response length: {len(content)}")
            print(f"DEBUG: Response ends with: '{content[-100:]}'")  # Check ending

            # Remove markdown code blocks if present
            if content.startswith('```json'):
                content = content[7:]  # Remove ```json
            elif content.startswith('```'):
                content = content[3:]  # Remove ```

            if content.endswith('```'):
                content = content[:-3]  # Remove trailing ```

            content = content.strip()

            # Check if response seems incomplete (doesn't end with ] or })
            if not (content.endswith(']') or content.endswith('}')):
                print(f"WARNING: Response appears incomplete!")
                # Try to fix incomplete JSON by adding closing bracket
                if '[' in content and not content.endswith(']'):
                    # Find the last complete object
                    last_complete = content.rfind('}')
                    if last_complete != -1:
                        # Truncate to last complete object and add closing bracket
                        content = content[:last_complete + 1] + '\n]'
                        print(f"DEBUG: Fixed incomplete JSON array by truncating")

            # Parse the JSON response
            try:
                result = json.loads(content)

                # Handle if wrapped in an object
                if isinstance(result, dict) and "micro_goals" in result:
                    return result["micro_goals"]
                elif isinstance(result, dict) and "tasks" in result:
                    return result["tasks"]
                elif isinstance(result, list):
                    return result
                else:
                    # If it's a dict with some key, try to extract the array
                    for key, value in result.items():
                        if isinstance(value, list):
                            return value
                    return []
            except json.JSONDecodeError as e:
                raise ValueError(f"Failed to parse LLM response as JSON: {content}. Error: {str(e)}")

        except Exception as e:
            print(f"ERROR in LLM Service: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error calling Gemini API: {str(e)}")

    async def generate_progress_tips(self, progress_data: Dict) -> List[str]:
        """
        Generate personalized tips based on user's current progress

        Args:
            progress_data: Dictionary containing:
                - total_tasks: int
                - completed_tasks: int
                - total_planned_minutes: int
                - total_actual_minutes: int
                - current_task_title: str (optional)
                - on_time_tasks_count: int
                - overdue_tasks_count: int
                - upcoming_tasks_count: int
                - task_details: List of task info

        Returns:
            List of 3-5 personalized tips as strings
        """

        prompt = f"""You are a productivity coach analyzing a user's work session. Generate 3-5 personalized, actionable tips.

Current Progress:
- Total Tasks: {progress_data.get('total_tasks', 0)}
- Completed: {progress_data.get('completed_tasks', 0)}
- Upcoming: {progress_data.get('upcoming_tasks_count', 0)}
- Behind Schedule: {progress_data.get('overdue_tasks_count', 0)}
- Planned Time: {progress_data.get('total_planned_minutes', 0)} minutes
- Actual Time: {progress_data.get('total_actual_minutes', 0)} minutes
- Current Task: {progress_data.get('current_task_title', 'None')}

Task Details:
{json.dumps(progress_data.get('task_details', []), indent=2)}

Generate 3-5 tips following these principles:

1. 🧩 Include "why" - Connect to larger goals (e.g., "This builds toward your project completion")
2. 🧘 Add mindset cues - Motivational reminders like "Start ugly – progress > perfection" or "Future you will thank you"
3. 🚀 Apply 2-minute rule - If something can start in <2 min, say "Do Now"
4. 🧭 Suggest time blocks - When tasks fit best (Morning Focus, Midday Sprint, Evening Wrap-up)
5. 🏁 Reward milestones - After 2-3 Pomodoros, suggest breaks/rewards

Tips should be:
- Specific to their current situation
- Actionable and practical
- Encouraging but realistic
- 2-3 sentences each
- Use emojis sparingly for emphasis

Return ONLY a JSON array of tip strings (no markdown):
[
  "Tip text here...",
  "Another tip..."
]

Return pure JSON only."""

        try:
            loop = asyncio.get_event_loop()

            from google.generativeai.types import HarmCategory, HarmBlockThreshold

            safety_settings = [
                {"category": HarmCategory.HARM_CATEGORY_HARASSMENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
                {"category": HarmCategory.HARM_CATEGORY_HATE_SPEECH, "threshold": HarmBlockThreshold.BLOCK_NONE},
                {"category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, "threshold": HarmBlockThreshold.BLOCK_NONE},
                {"category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
            ]

            generate_func = partial(
                self.model.generate_content,
                prompt,
                generation_config={
                    'temperature': 0.8,  # Slightly higher for more creative tips
                    'top_p': 0.95,
                    'top_k': 40,
                    'max_output_tokens': 2048,
                },
                safety_settings=safety_settings
            )
            response = await loop.run_in_executor(None, generate_func)

            # Check response validity
            if not response.candidates or len(response.candidates) == 0:
                return ["Keep up the great work! 💪", "Take breaks when needed.", "Focus on one task at a time."]

            candidate = response.candidates[0]

            if not candidate.content or not candidate.content.parts:
                return ["Stay focused on your current task.", "Remember to take breaks.", "You're making progress!"]

            # Extract text
            try:
                content = response.text.strip()
            except ValueError:
                if candidate.content.parts:
                    content = candidate.content.parts[0].text.strip()
                else:
                    return ["Keep going!", "You've got this!", "One step at a time."]

            # Clean markdown
            if content.startswith('```json'):
                content = content[7:]
            elif content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]

            content = content.strip()

            # Parse JSON
            try:
                tips = json.loads(content)
                if isinstance(tips, list) and len(tips) > 0:
                    return tips
                return ["Keep pushing forward!", "Great progress so far!", "Stay consistent!"]
            except json.JSONDecodeError:
                print(f"ERROR: Failed to parse tips JSON: {content}")
                return ["Focus on completing your current task.", "Take a short break if needed.", "You're doing well!"]

        except Exception as e:
            print(f"ERROR generating tips: {type(e).__name__}: {str(e)}")
            return ["Stay focused!", "Keep up the momentum!", "You're making progress!"]


# Singleton instance
llm_service = LLMService()

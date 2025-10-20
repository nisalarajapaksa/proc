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

        prompt = f"""You are a productivity assistant that helps people break down their daily tasks into manageable micro-goals.

Analyze the following tasks and break them down into specific, actionable micro-goals. Each micro-goal should:
1. Be specific and actionable
2. Take between 5-25 minutes to complete(ideal for Pomodoro sessions). If a goal takes longer than 45 minutes, divide it into smaller Pomodoro-sized chunks.
3. Be ordered logically (dependencies first)
4. Have a realistic time estimate
5. Include a short “why” — explain how it connects to the user's larger goal (e.g., completing the online education project or professional growth).
6. Add a mindset cue (motivation booster or reminder such as “Start ugly - progress > perfection” or “Future you will thank you”).
7. Apply the 2-minute rule — if something can be started in under 2 minutes, mark it as “Do Now”.
8. Use time blocks — suggest when in the day each micro-goal could fit (e.g., Morning Focus, Midday Sprint, Evening Wrap-up).
9. Reward milestone — after 2-3 Pomodoros or completing a group of micro-goals, suggest a small break or reward.
10. (Optional) If the task is repetitive or study-based (e.g., revising, memorizing, training problem patterns), emphasize consistency over perfection and spread the micro-goals across days.

User's tasks:
{tasks_text}

Return ONLY a JSON array with this exact structure (no markdown, no code blocks, just pure JSON):
[
  {{
    "title": "Clear, specific action to take",
    "description": "Brief context or additional details",
    "estimated_minutes": 30,
    "order": 0
  }}
]

Important:
- Break large tasks into smaller steps
- Be realistic with time estimates
- Order tasks logically
- Return ONLY valid JSON array, no other text, no markdown formatting
"""

        try:
            # Generate content using Gemini (run in executor since it's blocking)
            loop = asyncio.get_event_loop()

            # Configure safety settings to be less restrictive
            safety_settings = {
                'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
                'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
                'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE',
            }

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

            # Check if response was blocked
            if not response.text:
                print(f"DEBUG: Response blocked. Finish reason: {response.prompt_feedback}")
                raise ValueError(f"Content generation blocked by safety filters. Please try rephrasing your tasks.")

            content = response.text.strip()
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


# Singleton instance
llm_service = LLMService()

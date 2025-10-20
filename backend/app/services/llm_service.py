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


# Singleton instance
llm_service = LLMService()

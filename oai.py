"""Make and process requests to/from the OpenAI API."""

# Import from standard library
import os

# Import from 3rd party libraries
from openai import OpenAI


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class Openai:
    """OpenAI Connector."""

    def __init__(self, logger) -> None:
        self.logger = logger

    def moderate(self, prompt: str) -> bool:
        """Call OpenAI GPT Moderation with text prompt.
        Args:
            prompt: text prompt
        Returns: boolean if flagged
        """
        try:
            response = client.moderations.create(prompt)
            return response["results"][0]["flagged"]

        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")
            return f"OpenAI API error: {e}"

    def complete(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 24,
    ) -> dict:
        """Call OpenAI GPT Completion with text prompt.
        Args:
            prompt: text prompt
            model: OpenAI chat model name, e.g. "gpt-3.5-turbo"
            temperature: float between 0 and 1
            max_tokens: int between 1 and 2048
        Returns: {
            "status": status code, 'response' or 'error'
            "text": predicted response or error text
        }
        """
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert copywriter.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return {
                "status": "response",
                "text": " " + response.choices[0].message.content,
            }

        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")
            return {
                "status": "error",
                "text": f"OpenAI API error: {e}",
            }

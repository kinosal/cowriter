"""Make and process requests to/from the OpenAI API."""

# Import from standard library
import os

# Import from 3rd party libraries
import openai

# Assign credentials from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")


class Openai:
    """OpenAI Connector."""
    def __init__(self, logger) -> None:
        self.logger = logger

    def moderate(self, prompt: str) -> bool:
        """Call OpenAI GPT Moderation with text prompt.
        Args:
            prompt: text prompt
        Return: boolean if flagged
        """
        try:
            response = openai.Moderation.create(prompt)
            return response["results"][0]["flagged"]

        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")

    def complete(self, prompt: str, temperature: float = 0.7, max_tokens: int = 16) -> str:
        """Call OpenAI GPT Completion with text prompt.
        Args:
            prompt: text prompt
        Return: predicted response text
        """
        kwargs = {
            "engine": "text-davinci-003",
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 1,  # default
        }
        try:
            response = openai.Completion.create(**kwargs)
            return response["choices"][0]["text"]

        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")

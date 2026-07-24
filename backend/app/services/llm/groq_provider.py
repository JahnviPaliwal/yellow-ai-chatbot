"""Groq Concrete LLM Provider Implementation."""

from typing import List, Dict
from app.core.config import settings
from app.services.llm.base import BaseLLMProvider


class GroqProvider(BaseLLMProvider):
    """LLM Provider implementation using Groq API."""

    def __init__(self, api_key: str = "", model: str = "") -> None:
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL

    def generate_response(
        self,
        system_prompt: str,
        files_context: List[str],
        messages_history: List[Dict[str, str]],
        user_message: str
    ) -> str:
        """Call Groq API via standard Groq SDK or OpenAI-compatible endpoint."""
        if not self.api_key:
            raise ValueError("Groq API key is not configured or empty.")

        client = None
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
        except Exception:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key, base_url="https://api.groq.com/openai/v1")

        combined_system_prompt = system_prompt.strip() if system_prompt else "You are a helpful AI assistant."
        if files_context:
            files_info = "\n".join([f"- Attached File Provider ID: {f}" for f in files_context])
            combined_system_prompt += f"\n\n[Project Attached Files Context]:\n{files_info}"

        formatted_messages: List[Dict[str, str]] = [
            {"role": "system", "content": combined_system_prompt}
        ]

        for msg in messages_history:
            formatted_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        formatted_messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model=self.model,
            messages=formatted_messages,
            temperature=0.7
        )

        if response.choices and response.choices[0].message.content:
            return response.choices[0].message.content.strip()

        raise RuntimeError("Groq returned an empty response.")

    def generate_response_stream(
        self,
        system_prompt: str,
        files_context: List[str],
        messages_history: List[Dict[str, str]],
        user_message: str
    ):
        """Call Groq API with streaming response."""
        if not self.api_key:
            raise ValueError("Groq API key is not configured or empty.")

        client = None
        try:
            from groq import Groq
            client = Groq(api_key=self.api_key)
        except Exception:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key, base_url="https://api.groq.com/openai/v1")

        combined_system_prompt = system_prompt.strip() if system_prompt else "You are a helpful AI assistant."
        if files_context:
            files_info = "\n".join([f"- Attached File Provider ID: {f}" for f in files_context])
            combined_system_prompt += f"\n\n[Project Attached Files Context]:\n{files_info}"

        formatted_messages: List[Dict[str, str]] = [
            {"role": "system", "content": combined_system_prompt}
        ]

        for msg in messages_history:
            formatted_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        formatted_messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model=self.model,
            messages=formatted_messages,
            temperature=0.7,
            stream=True
        )

        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

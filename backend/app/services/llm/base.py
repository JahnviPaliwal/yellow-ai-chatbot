"""Abstract Base Interface for LLM Providers."""

from abc import ABC, abstractmethod
from typing import List, Dict


class BaseLLMProvider(ABC):
    """Abstract Base Class defining standard LLM provider interface."""

    @abstractmethod
    def generate_response(
        self,
        system_prompt: str,
        files_context: List[str],
        messages_history: List[Dict[str, str]],
        user_message: str
    ) -> str:
        """Generate response from LLM provider given system prompt, files, history, and message."""
        pass

    @abstractmethod
    def generate_response_stream(
        self,
        system_prompt: str,
        files_context: List[str],
        messages_history: List[Dict[str, str]],
        user_message: str
    ):
        """Stream response tokens from LLM provider."""
        pass

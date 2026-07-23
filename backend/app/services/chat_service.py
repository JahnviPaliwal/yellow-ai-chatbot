"""Chat Processing Orchestration Service."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.conversation import Conversation
from app.models.message import Message
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.services.project_service import ProjectService
from app.services.prompt_service import PromptService
from app.services.file_service import FileService
from app.services.memory_service import MemoryService
from app.services.llm_service import LLMService
from app.schemas.chat import ChatMessageSend, ChatResponse, MessageResponse, ConversationDetailResponse, ConversationResponse


class ChatService:
    """Service handling conversation management, persistent history, and chat processing pipeline."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.project_service = ProjectService(db)
        self.prompt_service = PromptService(db)
        self.file_service = FileService(db)
        self.memory_service = MemoryService(db)
        self.llm_service = LLMService()

    def list_user_conversations(self, user_id: int) -> List[ConversationResponse]:
        """List all conversations for user, including project tags if linked."""
        results = self.conv_repo.get_by_user_id(user_id)
        responses = []
        for conv, proj_name in results:
            resp = ConversationResponse.model_validate(conv)
            resp.project_name = proj_name
            responses.append(resp)
        return responses

    def list_project_conversations(self, project_id: int, user_id: int) -> List[Conversation]:
        """List all conversations for a specific project after verifying owner authorization."""
        self.project_service.get_project_with_auth(project_id, user_id)
        return self.conv_repo.get_by_project_id(project_id)

    def create_conversation(self, user_id: int, title: str, project_id: Optional[int] = None) -> ConversationResponse:
        """Create a new conversation thread (standalone or project-linked)."""
        if project_id:
            self.project_service.get_project_with_auth(project_id, user_id)

        conv = self.conv_repo.create(user_id=user_id, title=title, project_id=project_id)
        resp = ConversationResponse.model_validate(conv)
        if project_id:
            proj = self.project_service.get_project_with_auth(project_id, user_id)
            resp.project_name = proj.name
        return resp

    def get_conversation_detail(self, conversation_id: int, user_id: int) -> ConversationDetailResponse:
        """Fetch conversation with all stored historical messages."""
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv:
            raise NotFoundException("Conversation")

        if conv.user_id != user_id:
            raise ForbiddenException("You do not have permission to access this conversation.")

        messages = self.msg_repo.get_by_conversation_id(conversation_id)
        message_responses = [MessageResponse.model_validate(m) for m in messages]

        resp = ConversationDetailResponse(
            id=conv.id,
            user_id=conv.user_id,
            project_id=conv.project_id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=message_responses
        )
        if conv.project_id:
            proj = self.project_service.get_project_with_auth(conv.project_id, user_id)
            resp.project_name = proj.name
        return resp

    def process_chat_message(self, user_id: int, chat_in: ChatMessageSend) -> ChatResponse:
        """Execute end-to-end chat processing pipeline for standalone or project chats."""
        # 1. Load Conversation
        conv = self.conv_repo.get_by_id(chat_in.conversation_id)
        if not conv or conv.user_id != user_id:
            raise NotFoundException("Conversation")

        # 2. System Prompt & Project Files Context (if conversation belongs to a project)
        system_prompt = ""
        file_provider_ids = []

        if conv.project_id:
            project = self.project_service.get_project_with_auth(conv.project_id, user_id)
            prompt_record = self.prompt_service.get_prompt(project.id, user_id)
            if prompt_record:
                system_prompt = prompt_record.content
            project_files = self.file_service.get_project_files(project.id, user_id)
            file_provider_ids.extend([f.provider_file_id for f in project_files])

        # 3. Load In-Chat Attached Files Context
        chat_files = self.file_service.get_conversation_files(conv.id)
        file_provider_ids.extend([f.provider_file_id for f in chat_files if f.provider_file_id not in file_provider_ids])

        # 4. Load Persistent History BEFORE adding user turn
        existing_messages = self.msg_repo.get_by_conversation_id(conv.id)
        history_payload = [
            {"role": m.role, "content": m.content}
            for m in existing_messages
        ]

        # 5. Save User Message
        user_msg_db = self.msg_repo.create(
            conversation_id=conv.id,
            role="user",
            content=chat_in.message
        )

        # Update title if it is the first prompt in the conversation
        if len(existing_messages) == 0:
            prompt_summary = chat_in.message.strip()
            prompt_summary = " ".join(prompt_summary.split())
            if len(prompt_summary) > 40:
                words = prompt_summary.split()
                title_candidate = ""
                for w in words:
                    if len(title_candidate) + len(w) + 1 > 35:
                        break
                    title_candidate += (" " if title_candidate else "") + w
                conv.title = title_candidate + "..." if len(prompt_summary) > len(title_candidate) else title_candidate
            else:
                conv.title = prompt_summary
            self.db.add(conv)
            self.db.commit()

        # Load user memories to inject into system prompt
        memories = self.memory_service.list_memories(user_id, conv.id)
        if memories:
            memory_context = "\n\nYou have the following saved user memories/facts that you must remember:\n" + "\n".join([f"- {m.content}" for m in memories])
            system_prompt = (system_prompt or "") + memory_context

        # 6. Call LLM Engine
        assistant_content = self.llm_service.generate_response(
            system_prompt=system_prompt,
            files_context=file_provider_ids,
            messages_history=history_payload,
            user_message=chat_in.message
        )

        # Check if the user asked to save/remember something
        extracted_fact = self.llm_service.extract_memory_if_requested(chat_in.message)
        if extracted_fact:
            self.memory_service.create_memory(user_id, conv.id, extracted_fact)
            assistant_content += f"\n\n*(Note: I have saved this to your memory: \"{extracted_fact}\")*"

        # 7. Save Assistant Message
        assistant_msg_db = self.msg_repo.create(
            conversation_id=conv.id,
            role="assistant",
            content=assistant_content
        )

        return ChatResponse(
            user_message=MessageResponse.model_validate(user_msg_db),
            assistant_message=MessageResponse.model_validate(assistant_msg_db)
        )

    def delete_conversation(self, conversation_id: int, user_id: int) -> None:
        """Permanently delete a conversation and its messages."""
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv or conv.user_id != user_id:
            raise NotFoundException("Conversation")
        self.db.delete(conv)
        self.db.commit()

    def toggle_conversation_pin(self, conversation_id: int, user_id: int) -> Conversation:
        """Toggle is_pinned state of a conversation."""
        conv = self.conv_repo.get_by_id(conversation_id)
        if not conv or conv.user_id != user_id:
            raise NotFoundException("Conversation")
        conv.is_pinned = not conv.is_pinned
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

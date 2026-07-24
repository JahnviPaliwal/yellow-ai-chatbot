"""Chat Processing Orchestration Service."""

from typing import List, Optional
import json
import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.file_chunk import FileChunkModel
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.services.project_service import ProjectService
from app.services.prompt_service import PromptService
from app.services.file_service import FileService
from app.services.memory_service import MemoryService
from app.services.llm_service import LLMService
from app.schemas.chat import ChatMessageSend, ChatResponse, MessageResponse, ConversationDetailResponse, ConversationResponse

logger = logging.getLogger(__name__)


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
            
            # Fetch RAG context and append to system prompt
            rag_context = self._get_rag_context(project.id, chat_in.message)
            if rag_context:
                system_prompt = (system_prompt or "") + rag_context

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

    def _get_rag_context(self, project_id: int, query_text: str) -> str:
        """Embed user query, fetch project chunks, calculate cosine similarity, and return context string."""
        if not settings.OPENAI_API_KEY:
            return ""

        # 1. Embed query
        query_embedding = None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.embeddings.create(
                input=[query_text],
                model="text-embedding-3-small"
            )
            query_embedding = response.data[0].embedding
        except Exception as exc:
            logger.error(f"Failed to generate query embedding: {exc}")
            return ""

        if not query_embedding:
            return ""

        # 2. Fetch project files
        project_files = self.file_service.file_repo.get_by_project_id(project_id)
        file_ids = [f.id for f in project_files]
        if not file_ids:
            return ""

        # 3. Query all chunks
        chunks = self.db.query(FileChunkModel).filter(FileChunkModel.file_id.in_(file_ids)).all()
        if not chunks:
            return ""

        # 4. Calculate similarity
        similar_chunks = []
        for chunk in chunks:
            try:
                chunk_vector = json.loads(chunk.embedding)
                
                # Inline cosine similarity calculation
                if len(query_embedding) != len(chunk_vector) or not query_embedding or not chunk_vector:
                    similarity = 0.0
                else:
                    dot_product = sum(a * b for a, b in zip(query_embedding, chunk_vector))
                    norm_a = sum(a * a for a in query_embedding) ** 0.5
                    norm_b = sum(b * b for b in chunk_vector) ** 0.5
                    similarity = dot_product / (norm_a * norm_b) if norm_a > 0.0 and norm_b > 0.0 else 0.0

                if similarity >= 0.25:
                    similar_chunks.append((similarity, chunk.content))
            except Exception:
                continue

        # 5. Take top 5 chunks
        similar_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = similar_chunks[:5]
        if not top_chunks:
            return ""

        return "\n\n[Retrieved Context from Project Documents]:\n" + "\n---\n".join([c[1] for c in top_chunks])

    async def process_chat_message_stream(self, user_id: int, chat_in: ChatMessageSend):
        """Execute end-to-end chat processing with Server-Sent Events (SSE) streaming."""
        # 1. Load Conversation
        conv = self.conv_repo.get_by_id(chat_in.conversation_id)
        if not conv or conv.user_id != user_id:
            yield f"data: {json.dumps({'error': 'Conversation not found'})}\n\n"
            return

        # 2. System Prompt & Project Files Context
        system_prompt = ""
        file_provider_ids = []

        if conv.project_id:
            project = self.project_service.get_project_with_auth(conv.project_id, user_id)
            prompt_record = self.prompt_service.get_prompt(project.id, user_id)
            if prompt_record:
                system_prompt = prompt_record.content
            
            # Fetch RAG context and append it to system_prompt
            rag_context = self._get_rag_context(project.id, chat_in.message)
            if rag_context:
                system_prompt = (system_prompt or "") + rag_context

            project_files = self.file_service.get_project_files(project.id, user_id)
            file_provider_ids.extend([f.provider_file_id for f in project_files])

        # 3. Load In-Chat Attached Files Context
        chat_files = self.file_service.get_conversation_files(conv.id)
        file_provider_ids.extend([f.provider_file_id for f in chat_files if f.provider_file_id not in file_provider_ids])

        # 4. Load History before user turn
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

        # Yield User Message immediately so frontend can render it
        user_msg_val = MessageResponse.model_validate(user_msg_db)
        yield f"data: {json.dumps({'event': 'user_message', 'message': user_msg_val.model_dump()})}\n\n"

        # 6. Stream from LLM Engine
        assistant_content = ""
        try:
            for token in self.llm_service.generate_response_stream(
                system_prompt=system_prompt,
                files_context=file_provider_ids,
                messages_history=history_payload,
                user_message=chat_in.message
            ):
                assistant_content += token
                yield f"data: {json.dumps({'event': 'token', 'token': token})}\n\n"
        except Exception as exc:
            logger.error(f"Error during LLM token streaming: {exc}")
            yield f"data: {json.dumps({'event': 'error', 'message': 'LLM streaming error'})}\n\n"

        # Check if the user asked to save/remember something
        extracted_fact = self.llm_service.extract_memory_if_requested(chat_in.message)
        if extracted_fact:
            self.memory_service.create_memory(user_id, conv.id, extracted_fact)
            assistant_content += f"\n\n*(Note: I have saved this to your memory: \"{extracted_fact}\")*"
            # Yield extra fact notification token so client gets it
            yield f"data: {json.dumps({'event': 'token', 'token': f'\n\n*(Note: I have saved this to your memory: \"{extracted_fact}\")*'})}\n\n"

        # 7. Save Assistant Message
        assistant_msg_db = self.msg_repo.create(
            conversation_id=conv.id,
            role="assistant",
            content=assistant_content
        )

        assistant_msg_val = MessageResponse.model_validate(assistant_msg_db)
        yield f"data: {json.dumps({'event': 'assistant_message', 'message': assistant_msg_val.model_dump()})}\n\n"
        yield "data: [DONE]\n\n"

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

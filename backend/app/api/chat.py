"""Chat Execution API Endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.chat import ChatMessageSend, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(tags=["Chat Engine"])


@router.post("/chat", response_model=APIResponse[ChatResponse])
def send_chat_message(
    chat_in: ChatMessageSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> APIResponse[ChatResponse]:
    """Process user message using project prompt, history, files, and return LLM response."""
    service = ChatService(db)
    result = service.process_chat_message(current_user.id, chat_in)
    return APIResponse(
        success=True,
        message="Chat response generated and saved.",
        data=result
    )

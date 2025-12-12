from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict
import json

from app.core.database import get_db
from app.models.note import Note
from app.services.ai_service import ai_service

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class DiscussQuoteRequest(BaseModel):
    quote: str
    context: str | None = None
    note_id: int | None = None
    history: List[ChatMessage] | None = None


class DiscussQuoteResponse(BaseModel):
    response: str
    history: List[ChatMessage]


@router.post("/discuss", response_model=DiscussQuoteResponse)
async def discuss_quote(
    request: DiscussQuoteRequest,
    db: Session = Depends(get_db)
):
    """Обсуждение цитаты с AI"""
    
    # Подготавливаем историю разговора
    history_messages = []
    if request.history:
        history_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.history
        ]
    
    # Получаем ответ от AI
    response = ai_service.discuss_quote(
        quote=request.quote,
        context=request.context or "",
        history=history_messages if history_messages else None
    )
    
    if not response:
        raise HTTPException(
            status_code=500,
            detail="AI service not available or error occurred"
        )
    
    # Обновляем историю
    new_history = history_messages.copy() if history_messages else []
    
    # Добавляем новый вопрос пользователя если нет истории
    if not history_messages:
        context_text = request.context.strip() if request.context else "Что это значит?"
        # Формируем первое сообщение с цитатой и вопросом
        user_message = f'"{request.quote}"\n\n{context_text}'
        new_history.append({"role": "user", "content": user_message})
    else:
        # Если есть история, добавляем только новый вопрос пользователя
        context_text = request.context.strip() if request.context else "Продолжай."
        new_history.append({"role": "user", "content": context_text})
    
    # Добавляем ответ ассистента
    new_history.append({"role": "assistant", "content": response})
    
    # Если указана заметка, сохраняем историю
    if request.note_id:
        note = db.query(Note).filter(Note.id == request.note_id).first()
        if note:
            note.ai_discussion = json.dumps(new_history, ensure_ascii=False)
            db.commit()
    
    return {
        "response": response,
        "history": [
            ChatMessage(role=msg["role"], content=msg["content"])
            for msg in new_history
        ]
    }


@router.get("/discussion/{note_id}")
async def get_discussion_history(note_id: int, db: Session = Depends(get_db)):
    """Получение истории обсуждения для заметки"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note.ai_discussion:
        return {"history": []}
    
    try:
        history = json.loads(note.ai_discussion)
        return {
            "history": [
                ChatMessage(role=msg["role"], content=msg["content"])
                for msg in history
            ]
        }
    except json.JSONDecodeError:
        return {"history": []}


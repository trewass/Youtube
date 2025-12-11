from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import json

from app.core.database import get_db
from app.models.note import Note
from app.models.audiobook import Audiobook

router = APIRouter()


class NoteCreate(BaseModel):
    content: str
    quote: str | None = None
    timestamp: float | None = None
    audiobook_id: int


class NoteUpdate(BaseModel):
    content: str | None = None
    quote: str | None = None
    timestamp: float | None = None


class NoteResponse(BaseModel):
    id: int
    content: str
    quote: str | None
    timestamp: float | None
    audiobook_id: int
    ai_discussion: str | None
    
    class Config:
        from_attributes = True


@router.post("/", response_model=NoteResponse)
async def create_note(note_data: NoteCreate, db: Session = Depends(get_db)):
    """Создание заметки"""
    # Проверяем существование аудиокниги
    audiobook = db.query(Audiobook).filter(Audiobook.id == note_data.audiobook_id).first()
    if not audiobook:
        raise HTTPException(status_code=404, detail="Audiobook not found")
    
    note = Note(**note_data.dict())
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return note


@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    audiobook_id: int | None = None,
    db: Session = Depends(get_db)
):
    """Получение заметок (опционально по аудиокниге)"""
    query = db.query(Note)
    
    if audiobook_id:
        query = query.filter(Note.audiobook_id == audiobook_id)
    
    notes = query.all()
    return notes


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, db: Session = Depends(get_db)):
    """Получение конкретной заметки"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db)
):
    """Обновление заметки"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    db.commit()
    db.refresh(note)
    
    return note


@router.delete("/{note_id}")
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Удаление заметки"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}


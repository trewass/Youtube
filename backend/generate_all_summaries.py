#!/usr/bin/env python3
"""
Скрипт для массовой генерации описаний для всех аудиокниг
"""
import sys
import time
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.audiobook import Audiobook
from app.services.ai_service import ai_service


def generate_summaries(batch_size: int = 10, delay: int = 2):
    """Генерация описаний для всех аудиокниг без описаний"""
    db: Session = SessionLocal()
    
    try:
        # Получаем все аудиокниги без описаний
        audiobooks = db.query(Audiobook).filter(Audiobook.ai_summary == None).all()
        
        total = len(audiobooks)
        print(f"📚 Найдено {total} аудиокниг без описаний\n")
        
        if total == 0:
            print("✅ Все аудиокниги уже имеют описания!")
            return
        
        success_count = 0
        error_count = 0
        
        for i, audiobook in enumerate(audiobooks, 1):
            print(f"[{i}/{total}] 📖 {audiobook.title[:60]}...")
            
            try:
                # Генерируем описание
                summary = ai_service.generate_book_summary(
                    audiobook.title,
                    audiobook.description or ""
                )
                
                if summary:
                    audiobook.ai_summary = summary
                    db.commit()
                    print(f"    ✅ Готово: {summary[:80]}...")
                    success_count += 1
                else:
                    print(f"    ⚠️  Пропущено (нет описания)")
                    error_count += 1
                
                # Задержка между запросами
                if i < total:
                    time.sleep(delay)
                    
            except Exception as e:
                print(f"    ❌ Ошибка: {e}")
                error_count += 1
                db.rollback()
                time.sleep(delay * 2)  # Больше задержка при ошибке
            
            # Прогресс каждые 10 книг
            if i % batch_size == 0:
                print(f"\n📊 Прогресс: {i}/{total} | Успешно: {success_count} | Ошибок: {error_count}\n")
        
        print(f"\n🎉 Генерация завершена!")
        print(f"   ✅ Успешно: {success_count}")
        print(f"   ❌ Ошибок: {error_count}")
        print(f"   📚 Всего обработано: {total}")
        
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Запуск генерации описаний для всех аудиокниг...")
    print("=" * 60)
    
    try:
        generate_summaries(batch_size=10, delay=2)
    except KeyboardInterrupt:
        print("\n\n⚠️  Генерация прервана пользователем")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Критическая ошибка: {e}")
        sys.exit(1)

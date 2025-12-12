# 🚀 Инструкция по деплою на Vercel

## Шаг 1: Авторизация в Vercel

```bash
cd /Users/aleksandrkoza/Projects/Youtube-mp3
vercel login
```

Откроется браузер для авторизации через GitHub/Email.

---

## Шаг 2: Деплой

После авторизации запусти:

```bash
vercel --prod
```

**При первом деплое ответь на вопросы:**

1. **Set up and deploy?** → `Y`
2. **Which scope?** → Выбери свой аккаунт
3. **Link to existing project?** → `N` (создаем новый)
4. **What's your project's name?** → `youtube-audiobooks` (или любое другое)
5. **In which directory is your code located?** → `./frontend`
6. **Want to override settings?** → `Y`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Development Command:** `npm run dev`
   - **Install Command:** `npm install`

7. **Deploy?** → `Y`

---

## Шаг 3: Получение URL

После успешного деплоя получишь URL вида:
```
https://youtube-audiobooks.vercel.app
```

---

## Шаг 4: Проверка

1. Открой URL в браузере
2. Открой консоль (F12) и проверь логи
3. Попробуй добавить канал

---

## Альтернатива: Деплой через GitHub

Если хочешь автоматические деплои при каждом push:

1. **Закоммить код:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **На Vercel:**
   - Зайди на [vercel.com](https://vercel.com)
   - Add New Project
   - Выбери репозиторий
   - Настройки:
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Deploy

---

## ✅ Готово!

После деплоя приложение будет доступно по URL от Vercel.

**Важно:** Убедись что backend на Railway запущен и доступен по адресу:
`https://youtube-production-ee12.up.railway.app`

Если backend не работает, фронтенд не сможет загрузить данные.

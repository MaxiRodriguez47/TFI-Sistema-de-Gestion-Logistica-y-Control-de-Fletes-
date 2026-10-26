# Frontend — Logística Agro (TFI)

SPA en React 18 + TypeScript + Vite + Tailwind. Consume la API FastAPI existente (no se modifica `backend/`).

## Uso
```bash
cp .env.example .env     # VITE_API_URL=http://127.0.0.1:8000/api/v1
npm install
npm run dev              # desarrollo
npm run build            # compilar
npm test                 # tests
```
Backend: ver el prompt del TFI (`uvicorn app.main:app --reload` dentro de `backend/`).

## Estado
Versión básica: login con sesión persistente (`tfi_token` + `/auth/me`), rutas por rol,
layout, y catálogo de Localidades. El resto de las pantallas son placeholders.

## Decisiones
- Token en `localStorage`; el rol se toma siempre de `/auth/me`.
- Un 401 posterior al login cierra la sesión y vuelve a `/login`.
- Errores centralizados en `src/utils/errors.ts`.

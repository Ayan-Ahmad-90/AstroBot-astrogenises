@echo off
call .venv\Scripts\activate
uvicorn back-end.app:app --reload
pause

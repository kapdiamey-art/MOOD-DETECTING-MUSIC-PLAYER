@echo off
:: schedule_retraining.bat
:: Runs the Moodify feedback retraining script.
:: Triggered by Windows Task Scheduler every 2 days.

set PROJECT_ROOT=c:\Users\ameyk\OneDrive\Desktop\PERSISTENT INTERNSHIP\Mood Detecting Music Player
set PYTHON_EXE=%PROJECT_ROOT%\Emotion Detection Model\venv\Scripts\python.exe
set SCRIPT=%PROJECT_ROOT%\Emotion Detection Model\src\retrain_from_feedback.py

echo ============================================================
echo Moodify - Automated Feedback Retraining
echo %DATE% %TIME%
echo ============================================================

"%PYTHON_EXE%" "%SCRIPT%"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Retraining script exited with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo [DONE] Retraining run completed.

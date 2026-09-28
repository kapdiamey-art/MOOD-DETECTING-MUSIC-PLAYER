# setup_retraining_schedule.ps1
# Run this ONCE (as administrator) to register the automated retraining task.
# Runs every 2 days at 3:00 AM, starting TODAY.

$TaskName = "Moodify_FeedbackRetrain"
$BatPath  = "c:\Users\ameyk\OneDrive\Desktop\PERSISTENT INTERNSHIP\Mood Detecting Music Player\schedule_retraining.bat"
$LogPath  = "c:\Users\ameyk\OneDrive\Desktop\PERSISTENT INTERNSHIP\Mood Detecting Music Player\Emotion Detection Model\models\scheduler.log"

# Start TODAY at 3:00 AM
$startDate = (Get-Date).Date.AddHours(3)

$trigger  = New-ScheduledTaskTrigger -Daily -DaysInterval 2 -At $startDate
$action   = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BatPath`" >> `"$LogPath`" 2>&1"
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 2) -RunOnlyIfNetworkAvailable -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Trigger $trigger -Action $action -Settings $settings -RunLevel Limited -Force

Write-Host ""
Write-Host "Task '$TaskName' registered successfully." -ForegroundColor Green
Write-Host "First run: $startDate (today at 3:00 AM)" -ForegroundColor Cyan
Write-Host "Repeats:   Every 2 days at 3:00 AM" -ForegroundColor Cyan
Write-Host "Log file:  $LogPath" -ForegroundColor Gray
Write-Host ""
Write-Host "To trigger manually RIGHT NOW:"
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""
Write-Host "To remove the task:"
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm"
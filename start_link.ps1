Write-Host " Starting LINK Network Health Portal..." -ForegroundColor Green
Write-Host ""

Write-Host " Starting Backend API..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; python -m link dashboard" -WindowStyle Normal

Write-Host " Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host " Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host " LINK Network Health Portal is starting!" -ForegroundColor Green
Write-Host " Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host " Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 
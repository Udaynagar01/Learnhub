# Run as Administrator to copy project to C:\Learnhub
$Source = "C:\Users\udayd\Learnhub"
$Dest = "C:\Learnhub"

Write-Host "Copying LearnHub to $Dest ..." -ForegroundColor Cyan
if (-not (Test-Path $Dest)) { New-Item -ItemType Directory -Path $Dest -Force | Out-Null }
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls $Dest /grant "${me}:(OI)(CI)F" /T 2>$null
robocopy $Source $Dest /E /XD node_modules /R:2 /W:3
Write-Host "Open C:\Learnhub in Cursor (File -> Open Folder)" -ForegroundColor Green
pause

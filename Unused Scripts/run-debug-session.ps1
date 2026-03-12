
# Start dotnet run in background
Write-Host "Starting backend..."
$proc = Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory "c:\Users\User\Desktop\FYP Project II" -PassThru -NoNewWindow
$procId = $proc.Id

# Wait for backend to be ready
$url = "http://localhost:5191/api/announcements"
$retries = 30
$running = $false

Write-Host "Waiting for backend to start (PID: $procId)..."
for ($i = 0; $i -lt $retries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $running = $true
            break
        }
    }
    catch {
        # Check if process is still running
        if ((Get-Process -Id $procId -ErrorAction SilentlyContinue) -eq $null) {
            Write-Host "Process exited unexpectedly."
            break
        }
    }
}

if ($running) {
    Write-Host "Backend is ready. Running debug script..."
    & .\debug-announcement.ps1
}
else {
    Write-Host "Backend failed to start or timed out."
}

# Cleanup
if (Get-Process -Id $procId -ErrorAction SilentlyContinue) {
    Write-Host "Stopping backend..."
    Stop-Process -Id $procId -Force
}

# Delete All Users Script
# WARNING: This will delete ALL users from the database
# Run this PowerShell script to clear users before testing seeding

Write-Host "=== Delete All Users Tool ===" -ForegroundColor Red
Write-Host ""

# Check if backend is running
Write-Host "Checking if backend is running on localhost:5000..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:5000" -Method Head -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ Backend is not running!" -ForegroundColor Red
    Write-Host "Please start the backend with: dotnet run" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "WARNING: This will delete ALL users from the database!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"

if ($confirmation -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Deleting all users..." -ForegroundColor Cyan

# List of user IDs to delete
$userIds = @("admin001", "officer001", "shelter001", "resource001")

$deleteCount = 0
$notFoundCount = 0

foreach ($userId in $userIds) {
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/account/delete/$userId" `
            -Method Delete `
            -ErrorAction Stop | Out-Null
        
        Write-Host "✓ Deleted: $userId" -ForegroundColor Green
        $deleteCount++
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "○ Not found: $userId (already deleted)" -ForegroundColor Gray
            $notFoundCount++
        }
        else {
            $errorMessage = $_.Exception.Message
            Write-Host "✗ Failed to delete: $userId" -ForegroundColor Red
            Write-Host "  Error: $errorMessage" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Deletion Complete ===" -ForegroundColor Cyan
Write-Host "Deleted: $deleteCount | Not Found: $notFoundCount" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now restart the app to test automatic seeding." -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

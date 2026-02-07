# Database User Seeding Script
# Run this PowerShell script to create users via the API

Write-Host "=== Database User Seeding Tool ===" -ForegroundColor Cyan
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

# Define users to create
$users = @(
    @{
        userId   = "admin001"
        password = "Admin@123"
        name     = "Ahmad bin Abdullah"
        email    = "ahmad@daecs.gov.my"
        phone    = "+60123456789"
        role     = "Admin"
    },
    @{
        userId   = "responder001"
        password = "Responder@123"
        name     = "Siti Nurhaliza"
        email    = "siti@daecs.gov.my"
        phone    = "+60123456790"
        role     = "First Responder"
    },
    @{
        userId   = "shelter001"
        password = "Shelter@123"
        name     = "Kumar Rajendran"
        email    = "kumar@daecs.gov.my"
        phone    = "+60123456791"
        role     = "Shelter Manager"
    },
    @{
        userId   = "resource001"
        password = "Resource@123"
        name     = "Tan Mei Ling"
        email    = "tan@daecs.gov.my"
        phone    = "+60123456792"
        role     = "Resource Manager"
    }
)

Write-Host "Creating users..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($user in $users) {
    $body = $user | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/account/register" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop | Out-Null
        
        Write-Host "✓ Created: $($user.userId) / $($user.password)" -ForegroundColor Green
        Write-Host "  Name: $($user.name)" -ForegroundColor Gray
        Write-Host "  Role: $($user.role)" -ForegroundColor Gray
        Write-Host "  Email: $($user.email)" -ForegroundColor Gray
        Write-Host ""
        $successCount++
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            $errorMessage = ($_.ErrorDetails.Message | ConvertFrom-Json).message
        }
        
        Write-Host "✗ Failed: $($user.userId)" -ForegroundColor Red
        Write-Host "  Error: $errorMessage" -ForegroundColor Red
        Write-Host ""
        $failCount++
    }
}

Write-Host "=== Seeding Complete ===" -ForegroundColor Cyan
Write-Host "Success: $successCount | Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "You can now login with:" -ForegroundColor Cyan
Write-Host "  admin001 / Admin@123" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"

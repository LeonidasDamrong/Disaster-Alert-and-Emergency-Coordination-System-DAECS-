# Reset Database Script
# This will drop the database and recreate it with migrations
# WARNING: This deletes ALL data, not just users!

Write-Host "=== Database Reset Tool ===" -ForegroundColor Red
Write-Host ""
Write-Host "WARNING: This will DELETE ALL DATA in the database!" -ForegroundColor Red
Write-Host "This includes users, migrations, and all other tables." -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you ABSOLUTELY sure? (type 'RESET' to confirm)"

if ($confirmation -ne "RESET") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Checking for project file..." -ForegroundColor Cyan

if (Test-Path "..\..\FYP Project II.csproj") {
    Push-Location "..\..\"
    Write-Host "Found project in parent directory. Switching context." -ForegroundColor Green
}
elseif (Test-Path "FYP Project II.csproj") {
    Write-Host "Found project in current directory." -ForegroundColor Green
}
else {
    Write-Host "Error: Could not find 'FYP Project II.csproj'. Please run this script from the project root or 'scripts/database' folder." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Dropping existing database..." -ForegroundColor Yellow
dotnet ef database drop --force

Write-Host ""
Write-Host "Cleaning up old migrations..." -ForegroundColor Yellow
if (Test-Path "Migrations") {
    Remove-Item -Path "Migrations" -Recurse -Force
    Write-Host "Removed Migrations folder."
}
if (Test-Path "Data/Migrations") {
    Remove-Item -Path "Data/Migrations" -Recurse -Force
    Write-Host "Removed Data/Migrations folder."
}

Write-Host ""
Write-Host "Adding new migration (InitialCreate)..." -ForegroundColor Yellow
dotnet ef migrations add InitialCreate --output-dir Data/Migrations

Write-Host ""
Write-Host "Recreating database with migrations..." -ForegroundColor Yellow
dotnet ef database update

Write-Host ""
Write-Host "=== Database Reset Complete ===" -ForegroundColor Green
Write-Host "The database is now empty and ready for seeding." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to run 'dotnet run', or type 'x' and Enter to exit..." -ForegroundColor Cyan
$action = Read-Host
if ($action -eq "") {
    Write-Host "`nStarting application..." -ForegroundColor Green
    dotnet run
}
else {
    Write-Host "`nExiting..." -ForegroundColor Yellow
}

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
Write-Host "Dropping database..." -ForegroundColor Yellow
dotnet ef database drop --force

Write-Host ""
Write-Host "Recreating database with migrations..." -ForegroundColor Yellow
dotnet ef database update

Write-Host ""
Write-Host "=== Database Reset Complete ===" -ForegroundColor Green
Write-Host "The database is now empty and ready for seeding." -ForegroundColor Green
Write-Host ""
Write-Host "Run 'dotnet run' to start the app and test automatic seeding." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"

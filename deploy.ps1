#!/usr/bin/env pwsh
# Quick deployment script
# Run this after making any code changes

Write-Host "`n🚀 Starting deployment process...`n" -ForegroundColor Cyan

# Step 1: Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully`n" -ForegroundColor Green

# Step 2: Publish backend
Write-Host "📦 Publishing backend..." -ForegroundColor Yellow
dotnet publish -c Release -o ./publish

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend publish failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend published successfully`n" -ForegroundColor Green

# Done
Write-Host "✅ Build complete! Ready to deploy to Azure.`n" -ForegroundColor Green
Write-Host "Next step: Open Visual Studio and click Publish`n" -ForegroundColor Cyan

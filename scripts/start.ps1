# ============================================
# CODE-GUY PLATFORM - STARTUP SCRIPT
# ============================================

Write-Host "`n🚀 Starting Code-Guy Platform with Firebase Authentication`n" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor DarkGray
for ($i = 0; $i -lt 60; $i++) { Write-Host "=" -NoNewline -ForegroundColor DarkGray }
Write-Host "`n"

# Step 1: Database Migration
Write-Host "📊 Step 1: Running Database Migration..." -ForegroundColor Yellow
Set-Location server
$migrationOutput = node run-migration.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migration completed successfully!`n" -ForegroundColor Green
} else {
    Write-Host "❌ Database migration failed. Check the error above.`n" -ForegroundColor Red
    Write-Host "Migration output:" -ForegroundColor Yellow
    Write-Host $migrationOutput
    exit 1
}

# Step 2: Kill any existing processes on port 5000
Write-Host "🔄 Step 2: Checking for existing server processes..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "   Found process on port 5000, stopping it..." -ForegroundColor Yellow
    $processId = $port5000.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Cleared port 5000`n" -ForegroundColor Green
} else {
    Write-Host "✅ Port 5000 is available`n" -ForegroundColor Green
}

# Step 3: Start Backend Server
Write-Host "🖥️  Step 3: Starting Backend Server..." -ForegroundColor Yellow
Set-Location -Path (Get-Location).Path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host '🖥️  BACKEND SERVER' -ForegroundColor Cyan; Write-Host '==================' -ForegroundColor DarkGray; node index.js"
Start-Sleep -Seconds 3
Write-Host "✅ Backend server started on port 5000`n" -ForegroundColor Green

# Step 4: Start Frontend
Write-Host "🌐 Step 4: Starting Frontend..." -ForegroundColor Yellow
Set-Location ..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; Write-Host '🌐 FRONTEND SERVER' -ForegroundColor Cyan; Write-Host '==================' -ForegroundColor DarkGray; npm start"
Write-Host "✅ Frontend server starting...`n" -ForegroundColor Green

# Final Message
Write-Host "=" -NoNewline -ForegroundColor DarkGray
for ($i = 0; $i -lt 60; $i++) { Write-Host "=" -NoNewline -ForegroundColor DarkGray }
Write-Host "`n"
Write-Host "🎉 CODE-GUY PLATFORM IS STARTING!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Wait for browser to open at http://localhost:3000" -ForegroundColor White
Write-Host "   2. Click 'Register' to create a new account" -ForegroundColor White
Write-Host "   3. Check your email for verification link" -ForegroundColor White
Write-Host "   4. Or use 'Sign in with Google' for instant access!" -ForegroundColor White
Write-Host "`n💡 Tip: To make yourself admin, run:" -ForegroundColor Yellow
Write-Host "   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`n" -ForegroundColor Gray
Write-Host "=" -NoNewline -ForegroundColor DarkGray
for ($i = 0; $i -lt 60; $i++) { Write-Host "=" -NoNewline -ForegroundColor DarkGray }
Write-Host "`n"

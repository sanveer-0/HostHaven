# Find and kill process on port 5000
$port = 5000
$processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1

if ($processId) {
    Write-Host "Stopping process $processId on port $port..."
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
    Write-Host "Process stopped."
} else {
    Write-Host "No process found on port $port"
}

# Start the server
Write-Host "Starting server..."
npm start

# Smart Study Planner - Auto-Start Script
# Easy launcher for running both frontend and backend servers.

# Set working directory to script directory to ensure relative paths resolve correctly
Set-Location $PSScriptRoot

Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "       SMART STUDY PLANNER LAUNCHER      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Helper function to check if a TCP port is open with a custom timeout
function Test-PortOpen {
    param (
        [string]$ComputerName = "localhost",
        [int]$Port,
        [int]$TimeoutMs = 500
    )
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    try {
        $asyncResult = $tcpClient.BeginConnect($ComputerName, $Port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if ($wait -and $tcpClient.Connected) {
            $tcpClient.Close()
            return $true
        }
    } catch {
        # Connection failed or port closed
    } finally {
        if ($tcpClient) { $tcpClient.Dispose() }
    }
    return $false
}

# Helper function to clear a port and verify it was cleared
function Clear-Port {
    param (
        [int]$Port
    )
    # Target only actively listening or established sockets that aren't system/idle processes
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" -or $_.State -eq "Established" }
    if ($conn) {
        $pidToKill = $conn.OwningProcess[0]
        if ($pidToKill -eq 0) {
            # PID 0 represents the system idle process (often transient TIME_WAIT states). Do not attempt to kill.
            return $true
        }
        try {
            $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
            $procName = if ($proc) { $proc.Name } else { "Unknown" }
            Write-Host "Found process '$procName' (PID $pidToKill) listening on port $Port." -ForegroundColor Cyan
            Write-Host "Attempting to stop process..." -ForegroundColor Cyan
            Stop-Process -Id $pidToKill -Force -ErrorAction Stop
            Start-Sleep -Seconds 1 # Give the OS a second to release the port
        } catch {
            Write-Host "WARNING: Failed to stop process PID $pidToKill on port ${Port}: $_" -ForegroundColor Yellow
        }
        
        # Verify if port is still occupied by a listening process
        $verify = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        if ($verify) {
            $verifyPid = $verify.OwningProcess[0]
            if ($verifyPid -ne 0) {
                $verifyProc = Get-Process -Id $verifyPid -ErrorAction SilentlyContinue
                $verifyProcName = if ($verifyProc) { $verifyProc.Name } else { "Unknown" }
                Write-Host "CRITICAL WARNING: Port $Port is still occupied by '$verifyProcName' (PID $verifyPid)!" -ForegroundColor Red
                Write-Host "Please manually close '$verifyProcName' or run this launcher as Administrator to force stop it." -ForegroundColor Yellow
                return $false
            }
        }
    }
    return $true
}

# 1. Check Node/NPM dependencies
Write-Host "[1/5] Checking environment dependencies..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCheck -or -not $npmCheck) {
    Write-Host "ERROR: Node.js and NPM are required to run the frontend, but they were not found!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/ to continue." -ForegroundColor Yellow
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "[OK] Node.js and NPM are available." -ForegroundColor Green

# 2. Check if MySQL is running
Write-Host ""
Write-Host "[2/5] Checking MySQL status..." -ForegroundColor Yellow
$mysqlPort = 3306
$mysqlActive = Get-NetTCPConnection -LocalPort $mysqlPort -ErrorAction SilentlyContinue
if (-not $mysqlActive) {
    Write-Host "WARNING: MySQL does not appear to be running on port 3306!" -ForegroundColor Red
    Write-Host "Please ensure your MySQL service is started before proceeding." -ForegroundColor Red
} else {
    Write-Host "[OK] MySQL is running on port 3306." -ForegroundColor Green
}

# 3. Free up ports 8080 and 3000 if occupied
Write-Host ""
Write-Host "[3/5] Clearing ports 8080 and 3000..." -ForegroundColor Yellow
$cleared8080 = Clear-Port -Port 8080
$cleared3000 = Clear-Port -Port 3000
if (-not $cleared8080 -or -not $cleared3000) {
    Write-Host "WARNING: Some ports could not be cleared. Startup may fail if ports remain bound." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Ports cleared." -ForegroundColor Green
}

# 4. Start Backend & Frontend Servers
Write-Host ""
Write-Host "[4/5] Launching backend and frontend servers..." -ForegroundColor Yellow

# Clean up old backend log if it exists
if (Test-Path "backend-run.log") {
    Remove-Item "backend-run.log" -Force -ErrorAction SilentlyContinue
}

# Start Java Spring Boot Backend in a separate window, keeping it open on exit/failure for debugging
Write-Host "Starting Java Spring Boot Backend (Port 8080)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File .\run-maven.ps1 spring-boot:run -f backend/pom.xml" -WorkingDirectory $PSScriptRoot -WindowStyle Normal

# Start Frontend Web Server in a separate window
Write-Host "Starting Frontend Web Server (Port 3000)..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx -y serve -l 3000 frontend" -WorkingDirectory $PSScriptRoot -WindowStyle Normal

# 5. Wait for servers to initialize and verify they are online
Write-Host ""
Write-Host "[5/5] Waiting for servers to initialize..." -ForegroundColor Yellow

$backendOnline = $false
$frontendOnline = $false
$maxRetries = 90 # Allow up to 90 seconds for Maven compilation + Spring Boot boot sequence
$attempt = 1

while ($attempt -le $maxRetries) {
    # Check Backend (port 8080)
    if (-not $backendOnline) {
        if (Test-PortOpen -Port 8080) {
            $backendOnline = $true
            Write-Host "[OK] Backend server is online (Port 8080)." -ForegroundColor Green
        }
    }

    # Check Frontend (port 3000)
    if (-not $frontendOnline) {
        if (Test-PortOpen -Port 3000) {
            $frontendOnline = $true
            Write-Host "[OK] Frontend server is online (Port 3000)." -ForegroundColor Green
        }
    }

    if ($backendOnline -and $frontendOnline) {
        break
    }

    # Display progress indicator
    $dots = "." * ($attempt % 4)
    $spaces = " " * (3 - ($attempt % 4))
    Write-Host -NoNewline "`rChecking server status$dots$spaces (elapsed: $attempt seconds)..."
    Start-Sleep -Seconds 1
    $attempt++
}
Write-Host ""

if ($backendOnline -and $frontendOnline) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  Both servers successfully initialized!  " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Opening http://localhost:3000/login.html in browser..." -ForegroundColor Green
    Start-Process "http://localhost:3000/login.html"
} else {
    Write-Host ""
    if (-not $backendOnline) {
        Write-Host "WARNING: Backend server (Port 8080) did not start within $maxRetries seconds." -ForegroundColor Red
        Write-Host "Please inspect the separate PowerShell window running the backend for compile or runtime errors." -ForegroundColor Yellow
    }
    if (-not $frontendOnline) {
        Write-Host "WARNING: Frontend server (Port 3000) did not start within $maxRetries seconds." -ForegroundColor Red
        Write-Host "Please check the frontend console window to ensure Node/NPM/Serve are operating correctly." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Press any key to attempt to open the browser anyway, or exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "http://localhost:3000/login.html"
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Setup complete! Enjoy Smart Study Planner!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

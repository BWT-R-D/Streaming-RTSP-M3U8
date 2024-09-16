@echo off
setlocal

:: Step 1: Ask user for RTSP link
echo.
echo Step 1: Enter your RTSP link:
set /p rtsp_link=

:: Step 2: Log the RTSP URL for debugging
echo RTSP URL: "%rtsp_link%"

:: Step 3: Start Node.js process to handle the RTSP stream with FFmpeg
echo Step 3: Starting Node.js server at C:\Streaming-RTSP-M3U8\index.js with RTSP URL: "%rtsp_link%"
start node C:\Streaming-RTSP-M3U8\index.js "%rtsp_link%"

:: Step 4: Run Cloudflared login, only if needed
if not exist "%USERPROFILE%\.cloudflared\cert.pem" (
    echo Step 4: Running Cloudflared login...
    cloudflared login
) else (
    echo Cloudflare is already logged in, skipping login step.
)

:: Step 5: Check if the tunnel already exists
cloudflared tunnel list | findstr /i "%rtsp_link%"
if %ERRORLEVEL% equ 0 (
    echo Tunnel with the name already exists, skipping tunnel creation.
) else (
    echo Step 5: Creating Cloudflared tunnel named after IP from the RTSP link...
    cloudflared tunnel create %rtsp_link%
)

:: Step 6: Get the tunnel ID (from the JSON filename created)
for /f %%a in ('dir /b /a-d %USERPROFILE%\.cloudflared\*.json') do (
    set tunnel_id=%%~na
)

:: Step 7: Ask user for CNAME to set DNS route
echo Step 7: Enter the CNAME you want to use (e.g., stream.example.com):
set /p cname=

:: Set DNS routing for the tunnel
echo Setting DNS route for tunnel with CNAME %cname%...
cloudflared tunnel route dns %tunnel_id% %cname%

:: Step 8: Run the tunnel
echo.
echo Step 8: Running the tunnel...
cloudflared tunnel run %tunnel_id%

endlocal

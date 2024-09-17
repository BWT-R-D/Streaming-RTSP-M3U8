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

:: Step 4: Ask user for CNAME to set DNS route
echo.
echo Step 4: Enter the CNAME you want to use (e.g., stream.example.com):
set /p cname=

:: Step 5: Run Cloudflared tunnel with the provided CNAME
echo.
echo Step 5: Running Cloudflared tunnel for CNAME %cname%...
cloudflared tunnel run %cname%

endlocal

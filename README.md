# Create video floder in public floder
public 
|-video

# First installation cmd
- npm init
- npm instal
  
# Download FFmeg 
- https://www.gyan.dev/ffmpeg/builds/
- Change your ffmeg path in your index.js

# Testing Url
- Localhost:8080

# Connect with Cloudfare tunnel
Download cloudfare tunnel
- https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Installtion  cmd 
- winget install --id Cloudflare.cloudflared
- cloudflared --version
- cloudflared tunnel --url http://localhost:8080

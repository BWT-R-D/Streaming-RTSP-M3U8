#First installation cmd
- npm init
- npm instal
#Download FFmeg (https://www.gyan.dev/ffmpeg/builds/) to tis path or change location in index.js file 
- C:\ffmpeg-2024-07-07-git-0619138639-essentials_build\bin
#Testing Url
- Localhost:8080
#Point to domain Clouafare 
1. Download cloudfare tunnel
- https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2.Installtion  cmd 
- winget install --id Cloudflare.cloudflared
- cloudflared --version
- cloudflared tunnel --url http://localhost:8080
# Create floder in public floder
public 
|-video

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Define your RTSP stream URLs
const rtspUrls = {
    '192.168.150.101': 'rtsp://admin:itc123456@192.168.150.101:554/cam/realmonitor?channel=1&subtype=0',
  //  '192.168.150.102': 'rtsp://admin:itc123456@192.168.150.102:554/cam/realmonitor?channel=1&subtype=0',
 //   '192.168.160.101': 'rtsp://admin:itc123456@192.168.160.101:554/cam/realmonitor?channel=1&subtype=0',
 //   '192.168.160.102': 'rtsp://admin:itc123456@192.168.160.102:554/cam/realmonitor?channel=1&subtype=0'
};

// Full path to ffmpeg executable
const ffmpegPath = 'C:\\ffmpeg-2024-07-07-git-0619138639-essentials_build\\bin\\ffmpeg.exe';

// Directory to store the segments
const segmentsDir = path.join(__dirname, 'public');

// Function to start FFmpeg process for a specific RTSP URL and segment directory
function startFfmpeg(rtspUrl, streamFile, segmentDir) {
    const ffmpegProcess = spawn(ffmpegPath, [
        '-rtsp_transport', 'tcp', // Use TCP for more reliable transport
        '-i', rtspUrl,
        '-vf', 'scale=1920:1080', // Adjusted the resolution to 1080p
        '-preset', 'veryfast', // Use a faster preset for lower CPU usage
        '-codec:v', 'libx264',
        '-b:v', '800k', // Reduced the target bitrate
        '-maxrate', '800k', // Ensure bitrate doesn't exceed this value
        '-bufsize', '1600k', // Set the buffer size to handle fluctuations
        '-g', '50', // Keyframe interval
        '-c:a', 'aac',
        '-b:a', '128k', // Set audio bitrate
        '-strict', '-2',
        '-movflags', '+faststart',
        '-f', 'hls',
        '-hls_time', '10', // Segment duration
        '-hls_list_size', '5', // Increased the number of segments in the playlist
        '-hls_flags', 'delete_segments',
        '-max_delay', '1000000000', // Increase max delay (10 seconds)
        '-hls_segment_filename', path.join(segmentDir, 'segment%03d.ts'),
        streamFile
    ]);

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        // Restart FFmpeg process if it exits
        setTimeout(() => startFfmpeg(rtspUrl, streamFile, segmentDir), 1000);
    });

    return ffmpegProcess;
}

// Start FFmpeg processes for each RTSP URL
Object.keys(rtspUrls).forEach(ip => {
    const segmentDir = path.join(segmentsDir, ip);
    const streamFile = path.join(segmentDir, 'stream.m3u8');

    // Ensure the segment directory exists
    if (!fs.existsSync(segmentDir)) {
        fs.mkdirSync(segmentDir, { recursive: true });
    }

    // Start the FFmpeg process
    startFfmpeg(rtspUrls[ip], streamFile, segmentDir);

    // Set up the route to serve the stream file
    app.get(`/${ip}/stream.m3u8`, (req, res) => {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        fs.access(streamFile, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Stream file not found:', err);
                // Serve an older version or an error message
                res.status(404).send('Stream not available');
            } else {
                res.sendFile(streamFile);
            }
        });
    });
});

// Middleware to set cache control headers
app.use((req, res, next) => {
    if (req.url.endsWith('.m3u8') || req.url.endsWith('.ts')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Serve static files
app.use(express.static(segmentsDir));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

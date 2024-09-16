const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Get the RTSP URL from the command-line argument
const rtspUrl = process.argv[2]; // The second argument will be the RTSP URL passed from the batch file

// Log the RTSP URL for debugging purposes
console.log(`RTSP URL provided: ${rtspUrl}`);

// Validate that the RTSP URL is provided
if (!rtspUrl) {
    console.error('Error: RTSP URL not provided. Please pass the RTSP URL as an argument.');
    process.exit(1);
}

// Extract IP address from RTSP URL (used for folder naming)
const ipMatch = rtspUrl.match(/(\d+\.\d+\.\d+\.\d+)/);
if (!ipMatch) {
    console.error('Error: Invalid RTSP URL format. Could not extract IP address.');
    process.exit(1);
}
const ip = ipMatch[0];

// Full path to ffmpeg executable
const ffmpegPath = 'C:\\ffmpeg-6.1.1-essentials_build\\bin\\ffmpeg.exe';

// Directory to store the segments
const segmentsDir = path.join(__dirname, 'public', ip);

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

// Ensure the segment directory exists
if (!fs.existsSync(segmentsDir)) {
    fs.mkdirSync(segmentsDir, { recursive: true });
}

// Start the FFmpeg process
const streamFile = path.join(segmentsDir, 'stream.m3u8');
startFfmpeg(rtspUrl, streamFile, segmentsDir);

// Set up the route to serve the stream file
app.get(`/${ip}/stream.m3u8`, (req, res) => {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    fs.access(streamFile, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('Stream file not found:', err);
            res.status(404).send('Stream not available');
        } else {
            res.sendFile(streamFile);
        }
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
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

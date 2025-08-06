const express = require("express");
const cors = require("cors");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// CORS configuration - Allow your frontend domains
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3001",
    "https://your-frontend-domain.vercel.app", // Replace this with your actual frontend URL
    /\.vercel\.app$/, // Allow all vercel apps for development
    /localhost:\d+$/, // Allow all localhost ports for development
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "YouTube to WAV server is running" });
});

// Test endpoint to debug ytdl-core
app.post("/api/test-url", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log("Testing URL:", url);

    // Validate URL
    const isValid = ytdl.validateURL(url);
    console.log("URL is valid:", isValid);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Get basic info
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, "audioonly");

    console.log("Available audio formats:", formats.length);
    formats.forEach((format, index) => {
      console.log(`Format ${index + 1}:`, {
        itag: format.itag,
        container: format.container,
        codecs: format.codecs,
        bitrate: format.bitrate,
        audioSampleRate: format.audioSampleRate,
      });
    });

    res.json({
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      audioFormats: formats.length,
      formats: formats.map((f) => ({
        itag: f.itag,
        container: f.container,
        codecs: f.codecs,
        bitrate: f.bitrate,
        audioSampleRate: f.audioSampleRate,
      })),
    });
  } catch (error) {
    console.error("Test URL error:", error);
    res.status(500).json({ error: "Test failed: " + error.message });
  }
});

// Get video info endpoint
app.post("/api/video-info", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    console.log("Getting info for URL:", url);
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    });
    const videoDetails = info.videoDetails;

    // Check if video is available
    if (!videoDetails) {
      return res.status(400).json({ error: "Video information not available" });
    }

    // Check if video is too long (optional limit)
    const maxDuration = 3600; // 1 hour limit
    if (parseInt(videoDetails.lengthSeconds) > maxDuration) {
      return res
        .status(400)
        .json({ error: "Video is too long (max 1 hour allowed)" });
    }

    console.log("Video info retrieved:", {
      title: videoDetails.title,
      duration: videoDetails.lengthSeconds,
      isLive: videoDetails.isLiveContent,
    });

    res.json({
      title: videoDetails.title,
      duration: videoDetails.lengthSeconds,
      thumbnail:
        videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      author: videoDetails.author.name,
      viewCount: videoDetails.viewCount,
      isLive: videoDetails.isLiveContent,
    });
  } catch (error) {
    console.error("Error getting video info:", error);
    res
      .status(500)
      .json({ error: "Failed to get video information: " + error.message });
  }
});

// Convert and download endpoint
app.post("/api/convert-to-wav", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    console.log("Processing URL:", url);
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Check if video is available and not restricted
    if (!videoDetails || videoDetails.isLiveContent) {
      return res.status(400).json({
        error: "Video is not available for download or is a live stream",
      });
    }

    const title = videoDetails.title
      .replace(/[^a-z0-9\s]/gi, "_")
      .toLowerCase();
    const filename = `${title}.wav`;

    console.log("Video title:", videoDetails.title);
    console.log("Video duration:", videoDetails.lengthSeconds, "seconds");

    // Set response headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "audio/wav");

    // Get the highest quality audio stream
    const audioStream = ytdl(url, {
      quality: "highestaudio",
      filter: "audioonly",
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    });

    // Add error handling for the audio stream
    audioStream.on("error", (err) => {
      console.error("Audio stream error:", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Failed to fetch audio stream from YouTube" });
      }
    });

    audioStream.on("progress", (chunkLength, downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      console.log(`Download progress: ${percent}%`);
    });

    // Convert to WAV using ffmpeg with better settings
    const ffmpegProcess = ffmpeg(audioStream)
      .audioCodec("pcm_s16le")
      .audioChannels(2)
      .audioFrequency(44100)
      .audioBitrate(1411) // High quality
      .format("wav")
      .on("start", (commandLine) => {
        console.log("FFmpeg process started:", commandLine);
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ error: "Audio conversion failed: " + err.message });
        }
      })
      .on("end", () => {
        console.log("Conversion completed successfully");
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(
            "Conversion progress:",
            progress.percent.toFixed(2) + "%"
          );
        }
      });

    // Pipe the converted audio to response
    ffmpegProcess.pipe(res);
  } catch (error) {
    console.error("Error converting video:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to convert video" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎵 API endpoints:`);
  console.log(`   - POST /api/video-info`);
  console.log(`   - POST /api/convert-to-wav`);
  console.log(`   - POST /api/test-url (for debugging)`);
});

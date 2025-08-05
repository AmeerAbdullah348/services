const ytdl = require("@distube/ytdl-core");
const fs = require("fs");

async function testYouTubeDownload() {
  // Test with a copyright-free video
  const testUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // Creative Commons video

  console.log("🔍 Testing YouTube download functionality...");
  console.log("Test URL:", testUrl);

  try {
    // Validate URL
    if (!ytdl.validateURL(testUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    console.log("✅ URL is valid");

    // Get video info
    const info = await ytdl.getInfo(testUrl);
    console.log("✅ Video info retrieved");
    console.log("Title:", info.videoDetails.title);
    console.log("Duration:", info.videoDetails.lengthSeconds, "seconds");

    // Check available formats
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
    console.log("✅ Available audio formats:", audioFormats.length);

    if (audioFormats.length === 0) {
      throw new Error("No audio formats available");
    }

    // Test download stream (just first few bytes)
    const stream = ytdl(testUrl, {
      quality: "highestaudio",
      filter: "audioonly",
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    });

    let dataReceived = false;
    let bytesReceived = 0;

    stream.on("data", (chunk) => {
      dataReceived = true;
      bytesReceived += chunk.length;
      if (bytesReceived > 1000) {
        // Just test first 1KB
        stream.destroy();
        console.log(
          "✅ Audio stream is working - received",
          bytesReceived,
          "bytes"
        );
        console.log("🎉 YouTube download functionality is working correctly!");
        process.exit(0);
      }
    });

    stream.on("error", (err) => {
      console.error("❌ Stream error:", err.message);
      console.log("💡 This might be due to:");
      console.log("  - YouTube blocking requests");
      console.log("  - Network connectivity issues");
      console.log("  - Video restrictions");
      process.exit(1);
    });

    setTimeout(() => {
      if (!dataReceived) {
        console.error("❌ No data received after 10 seconds");
        console.log("💡 Possible issues:");
        console.log("  - YouTube may be blocking requests");
        console.log("  - Try updating ytdl-core to the latest version");
        console.log("  - Check your internet connection");
        process.exit(1);
      }
    }, 10000);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("💡 Troubleshooting steps:");
    console.log(
      "  1. Make sure you have the latest version of @distube/ytdl-core"
    );
    console.log("  2. Check your internet connection");
    console.log("  3. Try a different YouTube URL");
    console.log("  4. Restart your server");
    process.exit(1);
  }
}

testYouTubeDownload();

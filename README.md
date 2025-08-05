# YouTube to WAV Converter Backend

This is the backend server for the YouTube to WAV converter application.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- FFmpeg (will be installed automatically via ffmpeg-static)

## Installation

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will run on `http://localhost:3002` by default.

## API Endpoints

### Health Check

- **GET** `/health`
- Returns server status

### Get Video Info

- **POST** `/api/video-info`
- Body: `{ "url": "https://youtube.com/watch?v=..." }`
- Returns video metadata (title, duration, thumbnail, etc.)

### Convert to WAV

- **POST** `/api/convert-to-wav`
- Body: `{ "url": "https://youtube.com/watch?v=..." }`
- Returns the converted WAV file as a download

## Environment Variables

Create a `.env` file in the server directory:

```
PORT=3002
NODE_ENV=development
```

## Important Notes

1. This server is for educational and personal use only
2. Respect YouTube's Terms of Service
3. Only use with copyright-free content or content you have permission to download
4. The server uses `ytdl-core` and `ffmpeg` for audio extraction and conversion

## Dependencies

- **express**: Web framework
- **ytdl-core**: YouTube video downloader
- **ffmpeg-static**: Static FFmpeg binary
- **fluent-ffmpeg**: FFmpeg wrapper for Node.js
- **cors**: Cross-origin resource sharing

## Legal Disclaimer

This tool is provided for educational purposes only. Users are responsible for complying with applicable laws and YouTube's Terms of Service. Only download content that you have the right to download.

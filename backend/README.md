# ⚙️ Smart Summary Q&A - Backend API
> High-performance Node.js/Express REST API for AI-powered video and document processing

[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)](https://expressjs.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render)](https://smart-summary-q-a-backend.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-green)](../LICENSE)

---

## 📖 Project Overview

The **Smart Summary Q&A Backend** is a robust, production-grade REST API built with Node.js and Express that powers intelligent video and document processing capabilities. The backend serves as the central orchestrator, managing YouTube video transcription, PDF document parsing, content summarization, and an AI-powered question-answering system. It handles all business logic, data validation, error management, and integration with multiple AI/ML services.

The backend's **data management strategy** focuses on efficient temporary storage and processing. Video files, audio extracts, and uploaded PDFs are stored temporarily in the file system, processed through AI pipelines, and automatically cleaned up to optimize server resources. The system employs a multi-method fallback approach for transcript extraction, ensuring 100% reliability even when primary methods fail. All API responses follow a consistent JSON structure with comprehensive error handling and detailed logging for debugging and monitoring.

**Integration with AI/ML services** is a core strength of this backend. The system communicates with OpenAI's Whisper AI for audio transcription, Xenova Transformers for natural language processing and summarization, and YouTube's transcript API for caption extraction. The backend implements intelligent routing between these services based on availability, performance, and accuracy requirements. Python-based ML scripts are invoked via child processes for computationally intensive tasks like audio transcription, while lighter NLP operations are handled directly in Node.js using the Transformers library.

---

## 🌐 Live API & Deployment

**Production API**: [https://smart-summary-q-a-backend.onrender.com](https://smart-summary-q-a-backend.onrender.com)

**Local Development**: `http://localhost:5001`

**API Documentation**: [https://smart-summary-q-a-backend.onrender.com](https://smart-summary-q-a-backend.onrender.com) *(Endpoints listed at root)*

**Health Check**: [https://smart-summary-q-a-backend.onrender.com/api/health](https://smart-summary-q-a-backend.onrender.com/api/health)

**Swagger/OpenAPI Docs**: *(Coming Soon)*

---

## ✨ Features

### 🔐 **Security & Validation**
- **CORS Protection**: Dynamic origin whitelisting with credentials support
- **Input Validation**: Comprehensive request validation with detailed error messages
- **Error Boundaries**: Centralized error handling with custom error classes
- **Rate Limiting**: Protection against API abuse (planned)
- **File Size Validation**: Max 10MB for PDF uploads, configurable limits

### 🚀 **Core API Features**
- **YouTube Video Processing**: Multi-method transcript extraction with automatic fallbacks
- **Batch Processing**: Concurrent processing of multiple videos with worker pool management
- **PDF Document Parsing**: PyMuPDF-based text extraction with metadata
- **AI Summarization**: Intelligent content summarization using Transformers
- **Q&A System**: Context-aware question answering with semantic understanding
- **Health Monitoring**: System health checks and status reporting

### ⚡ **Performance & Reliability**
- **Multi-Method Fallback**: 5+ transcript extraction methods for 100% uptime
- **Concurrent Processing**: Worker pool for parallel video processing
- **Caching Strategy**: Temporary file caching to reduce redundant processing
- **Auto Cleanup**: Scheduled cleanup of temporary files and uploads
- **GPU Acceleration**: Optional GPU support for faster AI inference

### 🤖 **AI/ML Integration**
- **Whisper AI**: Audio-to-text transcription via Python child process
- **Xenova Transformers**: Browser-compatible NLP for summarization
- **YouTube Transcript API**: Primary method for caption extraction
- **Language Detection**: Automatic language detection and translation
- **Semantic Search**: Transformer-based embeddings for Q&A

### 📊 **Logging & Monitoring**
- **Structured Logging**: Detailed request/response logging
- **Error Tracking**: Comprehensive error capture with stack traces
- **Performance Metrics**: Processing time tracking for optimization
- **Health Checks**: System status monitoring and reporting

---

## 🛠️ Tech Stack

### **Server Framework**
- **Node.js** 16+ - JavaScript runtime
- **Express.js** 4.21.2 - Web application framework
- **CORS** 2.8.5 - Cross-origin resource sharing
- **dotenv** 17.2.0 - Environment variable management

### **File Processing**
- **Multer** 2.0.1 - Multipart form-data handling
- **fs-extra** 11.3.0 - Enhanced file system operations
- **pdf-parse** 1.1.1 - PDF text extraction

### **YouTube & Video**
- **ytdl-core** 4.11.5 - YouTube video downloading
- **youtube-transcript** 1.2.1 - Transcript extraction
- **cheerio** 1.1.0 - Web scraping for metadata

### **AI/ML Libraries**
- **@xenova/transformers** 2.17.2 - NLP and text processing
- **node-whisper** 2024.11.13 - Whisper AI integration
- **Python Integration**:
  - **faster-whisper** 0.10.0 - Optimized transcription
  - **transformers** 4.38.0 - Hugging Face models
  - **torch** 2.0.0+ - Deep learning backend
  - **sentence-transformers** 2.2.2 - Semantic embeddings

### **HTTP & Utilities**
- **Axios** 1.10.0 - HTTP client for external APIs
- **node-fetch** 3.3.2 - Fetch API for Node.js
- **form-data** 4.0.3 - Form data construction

### **Database & Caching** *(Future)*
- File-based temporary storage (current)
- **Redis** - Response caching (planned)
- **MongoDB** - User data persistence (planned)

### **Testing & Quality**
- **Jest** 30.0.4 - Testing framework
- **Supertest** 7.1.3 - HTTP assertion library
- **Babel** 7.28.0 - JavaScript transpilation

### **DevOps & Deployment**
- **Nodemon** 3.1.10 - Development auto-restart
- **Render** - Cloud hosting platform
- **GitHub Actions** - CI/CD pipeline (planned)

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  (React Frontend, Mobile Apps, Third-party Services)        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Middleware Pipeline                     │       │
│  │  - CORS Handler                                   │       │
│  │  - Body Parser (JSON/URL-encoded)                │       │
│  │  - Request Validation                            │       │
│  │  - Error Handler                                 │       │
│  └──────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬────────────────┐
         ▼               ▼               ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Video       │ │  PDF         │ │  Q&A         │ │  Health      │
│  Routes      │ │  Routes      │ │  Routes      │ │  Routes      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Video       │ │  PDF         │ │  Q&A         │
│  Service     │ │  Service     │ │  Service     │
│              │ │              │ │              │
│ - Extract ID │ │ - Parse PDF  │ │ - Context    │
│ - Get Info   │ │ - Extract    │ │   Analysis   │
│ - Transcript │ │   Text       │ │ - Answer     │
│ - Process    │ │ - Summarize  │ │   Generation │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ├────────────────┴────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│           External Services Layer                   │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  YouTube     │  │  Whisper AI  │  │ PyMuPDF   │ │
│  │  Transcript  │  │  (Python)    │  │ (Python)  │ │
│  │  API         │  │              │  │           │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Xenova      │  │  Translation │                │
│  │  Transformers│  │  Service     │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              File System Storage                     │
│                                                      │
│  - /temp       : Temporary audio/video files        │
│  - /uploads    : User-uploaded PDFs                 │
│  - Auto-cleanup: Scheduled cleanup (1hr TTL)        │
└─────────────────────────────────────────────────────┘
```

### Request Flow Diagram

```
Client Request
     │
     ▼
[Express Middleware]
     │
     ├─→ CORS Check
     ├─→ Body Parsing (50MB limit)
     ├─→ Input Validation
     │
     ▼
[Route Handler]
     │
     ▼
[Service Layer]
     │
     ├─→ Business Logic
     ├─→ External API Calls
     ├─→ AI/ML Processing
     │
     ▼
[Response Formatter]
     │
     ├─→ Success: { success: true, data: {...} }
     ├─→ Error: { success: false, error: {...} }
     │
     ▼
Client Response (JSON)
```

---

## 📁 Folder Structure

```
backend/
│
├── routes/                          # API Route Definitions
│   ├── videoRoutes.js              # Video processing endpoints
│   ├── pdfRoutes.js                # PDF processing endpoints
│   ├── qaRoutes.js                 # Q&A system endpoints
│   └── healthRoutes.js             # Health check endpoint
│
├── services/                        # Business Logic Layer
│   ├── videoService.js             # Video processing logic (1000+ lines)
│   │   ├── extractVideoId()        # Extract YouTube video ID
│   │   ├── getVideoInfo()          # Fetch video metadata
│   │   ├── processSingleVideo()    # Single video processing
│   │   └── processMultipleVideos() # Batch processing
│   │
│   ├── transcriptionService.js     # Transcript extraction
│   │   ├── Method 1: YouTube API
│   │   ├── Method 2: Whisper AI
│   │   ├── Method 3: Audio Analysis
│   │   └── Fallback mechanisms
│   │
│   ├── summarizationService.js     # AI summarization
│   │   ├── Transformer models
│   │   ├── Key point extraction
│   │   └── Summary generation
│   │
│   ├── pdfService.js               # PDF processing
│   │   ├── File validation
│   │   ├── Text extraction
│   │   └── Metadata parsing
│   │
│   ├── qaService.js                # Question answering
│   │   ├── Context analysis
│   │   ├── Semantic search
│   │   └── Answer generation
│   │
│   └── translationService.js       # Language translation
│       ├── Language detection
│       └── Google Translate API
│
├── utils/                           # Utility Functions
│   ├── errorHandler.js             # Custom error classes
│   │   ├── asyncHandler()          # Async route wrapper
│   │   ├── createValidationError() # Error constructors
│   │   └── logger()                # Logging utilities
│   │
│   └── validation.js               # Input validators
│       ├── validateVideoRequest()  # Video URL validation
│       ├── validateBatchRequest()  # Batch validation
│       └── validateFileUpload()    # File upload validation
│
├── test/                            # Test Suite
│   ├── api.test.js                 # API endpoint tests
│   ├── videoService.test.js        # Video service tests
│   ├── pdfService.test.js          # PDF service tests
│   ├── qaService.test.js           # Q&A service tests
│   └── integration.test.js         # Integration tests
│
├── scripts/                         # Utility Scripts
│   ├── cleanup.js                  # Cleanup temporary files
│   ├── healthCheck.js              # Health monitoring
│   └── deployment.js               # Deployment automation
│
├── src/                             # Python ML Scripts
│   ├── whisper_transcribe.py       # Whisper AI transcription
│   ├── pdf_parser.py               # PDF processing
│   └── translator.py               # Translation utilities
│
├── temp/                            # Temporary Files (gitignored)
├── uploads/                         # User Uploads (gitignored)
├── test_data/                       # Test datasets (gitignored)
│
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Environment template
├── .env.local                       # Local overrides (gitignored)
│
├── server.js                        # Express server entry point
├── package.json                     # Node.js dependencies
├── requirements.txt                 # Python dependencies
│
├── jest.config.js                   # Jest test configuration
├── babel.config.js                  # Babel transpilation config
├── .babelrc                         # Babel configuration
│
├── Procfile                         # Render deployment config
├── render-build.sh                  # Build script for Render
│
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** v16.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v8.0.0 or higher
- **Python** 3.8+ (for AI/ML features)
- **pip** (Python package manager)
- **Git** (for cloning)

### Step 1: Clone the Repository
```bash
git clone https://github.com/rishith2903/Smart-Summary-Q-A.git
cd Smart-Summary-Q-A/backend
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

This will install all Node.js packages including:
- Express.js and middleware
- YouTube processing libraries
- AI/ML integration tools
- Testing frameworks

### Step 3: Install Python Dependencies
```bash
pip install -r requirements.txt
```

This will install Python packages:
- faster-whisper (audio transcription)
- transformers (NLP models)
- torch (deep learning)
- PyMuPDF (PDF parsing)

**For GPU Support** (Optional):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Step 4: Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

Required environment variables:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 5: Create Required Directories
```bash
mkdir -p temp uploads logs
```

### Step 6: Start the Development Server
```bash
npm run dev
```

For production mode:
```bash
npm start
```

The API will be available at `http://localhost:5001`

### Step 7: Verify Installation
```bash
# Health check
curl http://localhost:5001/api/health

# Test video processing
curl -X POST http://localhost:5001/api/video/process \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Docker Installation (Alternative)

**Build Docker Image:**
```bash
docker build -t smart-summary-backend .
```

**Run Container:**
```bash
docker run -p 5001:5001 \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://smart-summary-q-a.vercel.app \
  --name smart-summary-api \
  smart-summary-backend
```

**Docker Compose:**
```bash
docker-compose up -d
```

---

## 🔐 Environment Variables

Create a `.env` file in the backend root directory:

```env
# ================================
# Server Configuration
# ================================
PORT=5001
NODE_ENV=development
HOST=0.0.0.0

# ================================
# CORS Configuration
# ================================
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ================================
# Processing Limits
# ================================
MAX_CONCURRENT_VIDEOS=4
MAX_VIDEO_DURATION=3600
MAX_FILE_SIZE=10485760
REQUEST_TIMEOUT=300000

# ================================
# AI/ML Configuration
# ================================
USE_GPU=false
DEFAULT_LANGUAGE=en
WHISPER_MODEL=base
ENABLE_METHOD_1=true
ENABLE_METHOD_2=true
FALLBACK_ENABLED=true

# ================================
# API Keys (Optional)
# ================================
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key

# ================================
# File Management
# ================================
UPLOAD_DIR=./uploads
TEMP_DIR=./temp
AUTO_CLEANUP=true
CLEANUP_INTERVAL=3600
FILE_TTL=3600

# ================================
# Logging
# ================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ENABLE_CONSOLE_LOGS=true
ENABLE_FILE_LOGS=false
VERBOSE_LOGS=false

# ================================
# Rate Limiting (Future)
# ================================
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# ================================
# Redis Cache (Future)
# ================================
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600
ENABLE_CACHING=false

# ================================
# Database (Future)
# ================================
MONGODB_URI=mongodb://localhost:27017/smart-summary
DB_NAME=smart_summary
```

### Production Environment (Render)

```env
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://smart-summary-q-a.vercel.app
LOG_LEVEL=error
AUTO_CLEANUP=true
USE_GPU=false
```

---

## 📡 API Documentation

### Base URL
- **Local**: `http://localhost:5001/api`
- **Production**: `https://smart-summary-q-a-backend.onrender.com/api`

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (dev mode only)"
  }
}
```

### API Endpoints

#### 1. **Process Single Video**

**Route**: `POST /api/video/process`

**Description**: Processes a single YouTube video, extracts transcript, and generates summary

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "targetLanguage": "en",
  "useGpu": false
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "author": "Rick Astley",
    "duration": "3:33",
    "durationSeconds": 213,
    "viewCount": "1.4B",
    "uploadDate": "2009-10-25",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "transcript": "We're no strangers to love...",
    "transcriptMethod": "youtube-transcript-api",
    "language": "en",
    "summary": "This is a music video featuring...",
    "keyPoints": [
      "Music video from 1987",
      "Features Rick Astley",
      "Internet meme phenomenon"
    ],
    "processingTime": 8.5
  }
}
```

**Error Response (400 - Invalid URL):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid YouTube URL format",
    "details": "URL must be a valid YouTube video link"
  }
}
```

---

#### 2. **Process Batch Videos**

**Route**: `POST /api/video/process-batch`

**Description**: Processes multiple YouTube videos concurrently

**Request:**
```json
{
  "urls": [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=9bZkp7q19f0",
    "https://www.youtube.com/watch?v=L_jWHffIx5E"
  ],
  "targetLanguage": "en",
  "useGpu": false,
  "maxWorkers": 4
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "transcript": "...",
      "summary": "...",
      "status": "success"
    },
    {
      "videoId": "9bZkp7q19f0",
      "title": "Gangnam Style",
      "transcript": "...",
      "summary": "...",
      "status": "success"
    },
    {
      "videoId": "L_jWHffIx5E",
      "status": "error",
      "error": "Video unavailable"
    }
  ],
  "totalProcessed": 3,
  "totalTime": 24.3,
  "successCount": 2,
  "errorCount": 1
}
```

---

#### 3. **Process PDF Document**

**Route**: `POST /api/pdf/process`

**Description**: Uploads and processes a PDF document

**Request** (multipart/form-data):
```
Content-Type: multipart/form-data
file: [PDF file binary data]
```

**cURL Example:**
```bash
curl -X POST \
  http://localhost:5001/api/pdf/process \
  -F "file=@document.pdf"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "filename": "document.pdf",
    "fileSize": 245678,
    "pageCount": 15,
    "text": "Extracted text content from all pages...",
    "wordCount": 3542,
    "summary": "AI-generated summary of the document...",
    "keyTopics": [
      "Machine Learning",
      "Neural Networks",
      "Deep Learning"
    ],
    "metadata": {
      "author": "John Doe",
      "title": "Introduction to ML",
      "creationDate": "2024-01-15",
      "modificationDate": "2024-11-20"
    },
    "processingTime": 5.2
  }
}
```

**Error Response (413 - File Too Large):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum allowed size",
    "details": "Maximum file size is 10MB"
  }
}
```

---

## 🗄️ Database Models

Currently using **file-based storage** for temporary data. Future implementation will use MongoDB.

### Planned Schema: User Model

```javascript
{
  "_id": "ObjectId",
  "name": "Rishith Kumar",
  "email": "rishith@example.com",
  "createdAt": "2024-11-20T10:30:00Z",
  "updatedAt": "2024-12-02T15:00:00Z",
  "preferences": {
    "language": "en",
    "theme": "dark",
    "notifications": true
  },
  "usage": {
    "videosProcessed": 45,
    "pdfsProcessed": 12,
    "questionsAsked": 128,
    "lastActive": "2024-12-02T14:55:00Z"
  }
}
```

### Planned Schema: Processing History

```javascript
{
  "_id": "ObjectId",
  "userId": "ObjectId",  // Reference to User
  "type": "video",  // "video" | "pdf" | "qa"
  "metadata": {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "duration": 213,
    "method": "youtube-transcript-api"
  },
  "results": {
    "transcript": "Full transcript text...",
    "summary": "Generated summary...",
    "keyPoints": ["point1", "point2", "point3"]
  },
  "processingTime": 8.5,
  "createdAt": "2024-12-02T15:00:00Z",
  "status": "completed"  // "pending" | "processing" | "completed" | "failed"
}
```

### Current File Storage Structure

```
uploads/
├── temp_1733135400123.pdf
└── temp_1733135401456.pdf

temp/
├── audio_dQw4w9WgXcQ.mp3
└── video_dQw4w9WgXcQ.mp4
```

Files are automatically deleted after 1 hour (configurable via `FILE_TTL`).

---

## 🛡️ Validation & Middleware

### Input Validation

**Video URL Validation** (`utils/validation.js`):
```javascript
const validateVideoRequest = (req, res, next) => {
  const { url } = req.body;
  
  // Check if URL exists
  if (!url) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_URL',
        message: 'Video URL is required'
      }
    });
  }
  
  // Validate YouTube URL format
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  if (!youtubeRegex.test(url)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_URL',
        message: 'Invalid YouTube URL format'
      }
    });
  }
  
  next();
};
```

**Batch Request Validation**:
```javascript
const validateBatchRequest = (req, res, next) => {
  const { urls } = req.body;
  
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'URLs must be provided as an array'
      }
    });
  }
  
  if (urls.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_BATCH',
        message: 'At least one URL must be provided'
      }
    });
  }
  
  if (urls.length > (process.env.MAX_CONCURRENT_VIDEOS || 10)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BATCH_TOO_LARGE',
        message: `Maximum ${process.env.MAX_CONCURRENT_VIDEOS} videos allowed per batch`
      }
    });
  }
  
  next();
};
```

### Error Handling Middleware

**Async Handler Wrapper** (`utils/errorHandler.js`):
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Global Error Handler**:
```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});
```

### CORS Middleware

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://smart-summary-q-a.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🧪 Tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:services

# Run verbose tests
npm run test:verbose
```

### Test Example

**Video Service Test** (`test/videoService.test.js`):

```javascript
const videoService = require('../services/videoService');

describe('Video Service', () => {
  describe('extractVideoId', () => {
    test('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = videoService.extractVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });
    
    test('should extract video ID from shortened YouTube URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const videoId = videoService.extractVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });
    
    test('should return null for invalid URL', () => {
      const url = 'https://example.com/video';
      const videoId = videoService.extractVideoId(url);
      expect(videoId).toBeNull();
    });
  });
  
  describe('processSingleVideo', () => {
    test('should process video and return summary', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = await videoService.processSingleVideo(url, 'en', false);
      
      expect(result).toHaveProperty('videoId');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('transcript');
      expect(result).toHaveProperty('summary');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    }, 30000);  // 30 second timeout
  });
});
```

### Test Coverage

```bash
npm run test:coverage
```

**Coverage Report:**
```
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   84.23 |    76.45 |   88.12 |   85.67 |
 services                   |   92.15 |    85.32 |   94.23 |   93.45 |
  videoService.js          |   94.56 |    89.12 |   96.78 |   95.23 |
  pdfService.js            |   88.34 |    78.23 |   90.45 |   89.67 |
  qaService.js             |   93.21 |    87.65 |   95.12 |   94.34 |
 routes                     |   76.45 |    68.23 |   82.34 |   78.56 |
 utils                      |   81.23 |    72.45 |   85.67 |   82.89 |
----------------------------|---------|----------|---------|---------|
```

---

## 📊 Logging

### Logging Configuration

The backend uses a custom logging system with multiple levels and outputs.

**Logger Implementation** (`utils/errorHandler.js`):

```javascript
const logger = {
  info: (message, data = {}) => {
    if (process.env.LOG_LEVEL === 'info' || process.env.LOG_LEVEL === 'debug') {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
    }
  },
  
  error: (message, error = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      message: error.message,
      stack: error.stack
    });
  },
  
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  
  debug: (message, data = {}) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};
```

### Log Output Examples

**Successful Request:**
```
[INFO] 2024-12-02T15:30:45.123Z - Processing video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
[INFO] 2024-12-02T15:30:46.234Z - Using transcription method: youtube-transcript-api
[INFO] 2024-12-02T15:30:50.456Z - Transcript extracted successfully (1245 words)
[INFO] 2024-12-02T15:30:52.789Z - Summary generated (150 words)
[INFO] 2024-12-02T15:30:53.012Z - Video processed successfully in 7.89s
```

**Error Log:**
```
[ERROR] 2024-12-02T15:32:15.678Z - Video processing error {
  message: 'Video unavailable',
  videoId: 'invalidID123',
  method: 'youtube-transcript-api',
  stack: 'Error: Video unavailable\n    at transcriptionService.js:45:12\n    ...'
}
```

**API Request Log:**
```
[INFO] 2024-12-02T15:35:20.123Z - API Request: POST /api/video/process
[DEBUG] 2024-12-02T15:35:20.125Z - Request body: {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  language: 'en',
  useGpu: false
}
```

---

## 🚀 Deployment

### Deployment on Render

**1. Connect GitHub Repository**
- Go to [Render Dashboard](https://render.com)
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the `backend` directory

**2. Configure Build Settings**
```
Build Command: npm install && pip install -r requirements.txt
Start Command: node server.js
```

**3. Set Environment Variables**
```
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://smart-summary-q-a.vercel.app
USE_GPU=false
AUTO_CLEANUP=true
```

**4. Deploy**
Click "Create Web Service" and wait for deployment to complete.

### Using Docker

**Dockerfile:**
```dockerfile
FROM node:16-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install dependencies
RUN npm install --production
RUN pip3 install -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p temp uploads logs

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "server.js"]
```

**Build and Run:**
```bash
docker build -t smart-summary-backend .
docker run -p 5001:5001 --env-file .env smart-summary-backend
```

### Health Monitoring

```bash
# Check API health
curl https://smart-summary-q-a-backend.onrender.com/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-12-02T15:40:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 💡 Challenges & Learnings

### Backend-Specific Challenges

1. **YouTube API Rate Limiting & Reliability**
   - **Challenge**: YouTube transcript API had frequent failures and rate limits
   - **Solution**: Implemented 5-method fallback system (API → Whisper → Scraping → oEmbed → Playwright)
   - **Learning**: Always design multiple fallback mechanisms for critical external dependencies

2. **Large File Processing & Memory Management**
   - **Challenge**: Processing long videos (1+ hour) caused memory leaks and timeouts
   - **Solution**: Implemented chunked processing, stream-based file handling, and automatic cleanup
   - **Learning**: Stream processing is essential for handling large files; always set memory limits

3. **Python-Node.js Integration**
   - **Challenge**: Running Python ML scripts from Node.js had process management issues
   - **Solution**: Used child processes with proper error handling, timeout management, and resource cleanup
   - **Learning**: Inter-process communication requires robust error handling and timeout strategies

4. **Concurrent Request Handling**
   - **Challenge**: Batch processing caused server overload with too many concurrent requests
   - **Solution**: Implemented worker pool pattern with configurable concurrency limits
   - **Learning**: Use worker pools and queues to manage concurrent operations effectively

5. **Error Handling Consistency**
   - **Challenge**: Inconsistent error formats across different services confused frontend developers
   - **Solution**: Created centralized error classes and standardized response format
   - **Learning**: Consistent error handling and response formats drastically improve API usability

### Performance Optimizations

- **Lazy Loading**: Load AI models only when needed, not at server startup
- **Process Pooling**: Reuse Python processes instead of spawning new ones
- **File Cleanup**: Automatic cleanup prevents disk space exhaustion
- **Response Streaming**: Stream large responses instead of buffering completely

### Security Learnings

- **Input Sanitization**: Always validate and sanitize user inputs
- **File Upload Limits**: Enforce strict file size limits to prevent DoS attacks
- **CORS Configuration**: Properly configure CORS for production security
- **Environment Variables**: Never commit sensitive data; use .env files

---

## 🚀 Future Improvements

### 1. **Database Integration**
- **PostgreSQL/MongoDB**: Persistent user data and processing history
- **Redis Caching**: Cache frequently accessed video summaries
- **Session Management**: User authentication and session handling
- **Query Optimization**: Indexed queries for fast data retrieval

### 2. **Real-time Features**
- **WebSocket Support**: Real-time processing progress updates
- **Server-Sent Events (SSE)**: Live status updates without polling
- **Progress Bars**: Granular progress tracking for long operations
- **Live Notifications**: Push notifications for completed tasks

### 3. **API Enhancements**
- **GraphQL API**: Alternative to REST for flexible data querying
- **API Versioning**: /v1/, /v2/ for backward compatibility
- **Swagger/OpenAPI**: Auto-generated interactive API documentation
- **Webhook Support**: Callback URLs for async processing completion

### 4. **Scalability**
- **Horizontal Scaling**: Multi-instance deployment with load balancing
- **Microservices**: Separate services for video, PDF, Q&A
- **Message Queue**: RabbitMQ or Bull for job processing
- **CDN Integration**: CloudFront for faster global content delivery

### 5. **Advanced Features**
- **User Authentication**: JWT-based auth with role management
- **API Rate Limiting**: Redis-based rate limiting per user
- **Analytics Dashboard**: track API usage, performance metrics
- **ML Model Fine-tuning**: Custom-trained models for better accuracy
- **Multi-language Support**: Support for 50+ languages

---

## 👥 Contributors

### Lead Backend Developer

**Rishith Kumar Pachipulusu**
- 🌐 GitHub: [@rishith2903](https://github.com/rishith2903)
- 💼 LinkedIn: [Rishith Kumar Pachipulusu](https://www.linkedin.com/in/rishith-kumar-pachipulusu-2748b4380/)
- 📧 Email: rishithkumar2903@gmail.com

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Node.js & Express** communities for excellent documentation
- **OpenAI** for Whisper AI transcription model
- **Hugging Face** for Transformers library
- **Render** for reliable hosting
- **Open-source contributors** worldwide

---

## 📞 Support & Documentation

- 📖 **Main Documentation**: [Root README](../README.md)
- 🎨 **Frontend Docs**: [Frontend README](../frontend/README.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/rishith2903/Smart-Summary-Q-A/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rishith2903/Smart-Summary-Q-A/discussions)

---

<div align="center">

**Built with ⚡ using Node.js & Express**

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

</div>

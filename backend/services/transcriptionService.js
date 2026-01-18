const { YoutubeTranscript } = require('youtube-transcript');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.log(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.log(`[ERROR] ${new Date().toISOString()} ${msg}`)
};

class TranscriptionService {
  constructor() {
    this.transcriptCache = new Map();
    this.transformers = null;
    this.whisperPipeline = null;
    this.tempDir = path.join(__dirname, '../temp');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Initialize @xenova/transformers lazily
  async initializeTransformers() {
    if (this.transformers) return true;

    try {
      logger.info('🔧 Initializing @xenova/transformers...');
      this.transformers = await import('@xenova/transformers');
      logger.info('✅ @xenova/transformers loaded successfully');
      return true;
    } catch (error) {
      logger.warn(`⚠️ Failed to load @xenova/transformers: ${error.message}`);
      return false;
    }
  }

  // Main method to get transcript from YouTube video
  async getYouTubeTranscript(url) {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Check cache first
      if (this.transcriptCache.has(videoId)) {
        logger.info(`📦 Using cached transcript for: ${videoId}`);
        return this.transcriptCache.get(videoId);
      }

      logger.info(`🎬 Getting transcript for video: ${videoId}`);
      logger.info('📋 Fallback order: youtube-transcript → Innertube API → Caption Track → Web Scraping → Deepgram → Local Whisper');

      // ============================================
      // LEVEL 1: youtube-transcript npm package
      // ============================================
      try {
        logger.info('🥇 Level 1: youtube-transcript npm package...');
        const transcript = await this.getYouTubeTranscriptNpm(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: youtube-transcript npm');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error1) {
        logger.warn(`Level 1 failed: ${error1.message}`);
      }

      // ============================================
      // LEVEL 2: YouTube Innertube API
      // ============================================
      try {
        logger.info('🥈 Level 2: YouTube Innertube API...');
        const transcript = await this.getInnertubeTranscript(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Innertube API');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error2) {
        logger.warn(`Level 2 failed: ${error2.message}`);
      }

      // ============================================
      // LEVEL 3: Direct Caption Track + Web Scraping
      // ============================================
      try {
        logger.info('🥉 Level 3: Caption Track + Web Scraping...');
        const transcript = await this.scrapeTranscript(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Web Scraping');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error3) {
        logger.warn(`Level 3 failed: ${error3.message}`);
      }

      // ============================================
      // LEVEL 4: Deepgram API (for videos WITHOUT captions)
      // ============================================
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (deepgramApiKey) {
        try {
          logger.info('🏅 Level 4: Deepgram Speech-to-Text API...');
          const transcript = await this.transcribeWithDeepgram(url, videoId, deepgramApiKey);
          if (transcript && transcript.length > 100) {
            logger.info('✅ SUCCESS: Deepgram API');
            this.transcriptCache.set(videoId, transcript);
            return transcript;
          }
        } catch (error4) {
          logger.warn(`Level 4 failed: ${error4.message}`);
        }
      } else {
        logger.warn('Level 4 skipped: DEEPGRAM_API_KEY not configured');
      }

      // ============================================
      // LEVEL 5: @xenova/transformers (Local Whisper)
      // ============================================
      try {
        logger.info('🎖️ Level 5: Local Whisper (@xenova/transformers)...');
        const transcript = await this.transcribeWithLocalWhisper(url, videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Local Whisper');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error5) {
        logger.warn(`Level 5 failed: ${error5.message}`);
      }

      // All methods failed
      logger.error('❌ All 5 transcription methods failed');
      return this.generateHonestResponse();

    } catch (error) {
      logger.error(`Critical error: ${error.message}`);
      throw error;
    }
  }

  // Extract video ID from YouTube URL
  extractVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Decode HTML entities
  decodeHtmlEntities(text) {
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ============================================
  // LEVEL 1: youtube-transcript npm package
  // ============================================
  async getYouTubeTranscriptNpm(videoId) {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    });

    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript from youtube-transcript package');
    }

    const transcriptText = transcriptArray
      .map(item => item.text)
      .join(' ');

    return this.decodeHtmlEntities(transcriptText);
  }

  // ============================================
  // LEVEL 2: YouTube Innertube API
  // ============================================
  async getInnertubeTranscript(videoId) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        context: {
          client: {
            hl: 'en',
            gl: 'US',
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00'
          }
        },
        videoId: videoId
      });

      const options = {
        hostname: 'www.youtube.com',
        path: '/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`Innertube returned ${res.statusCode}`);
            }

            const jsonData = JSON.parse(data);
            const transcriptText = this.extractInnertubeTranscript(jsonData);

            if (!transcriptText || transcriptText.length < 100) {
              throw new Error('Innertube transcript too short');
            }

            resolve(this.decodeHtmlEntities(transcriptText));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Innertube timeout')); });
      req.write(postData);
      req.end();
    });
  }

  extractInnertubeTranscript(jsonData) {
    // Try multiple paths to find transcript
    const paths = [
      jsonData?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments,
      jsonData?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups
    ];

    for (const cueGroups of paths) {
      if (cueGroups && cueGroups.length > 0) {
        return cueGroups
          .map(group => {
            return group?.transcriptCueGroupRenderer?.cues?.[0]?.transcriptCueRenderer?.cue?.simpleText ||
              group?.transcriptSegmentRenderer?.snippet?.simpleText || '';
          })
          .filter(text => text.length > 0)
          .join(' ');
      }
    }

    throw new Error('No transcript cues found in Innertube response');
  }

  // ============================================
  // LEVEL 3: Web Scraping + Caption Track
  // ============================================
  async scrapeTranscript(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return new Promise((resolve, reject) => {
      https.get(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 20000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            // Try to find caption track URL
            const captionUrlMatch = data.match(/"captionTracks":\s*\[\s*\{[^}]*"baseUrl":\s*"([^"]+)"/);

            if (captionUrlMatch) {
              let captionUrl = captionUrlMatch[1].replace(/\\u0026/g, '&');
              const transcript = await this.fetchCaptionXml(captionUrl);
              if (transcript && transcript.length > 100) {
                resolve(transcript);
                return;
              }
            }

            // Try ytInitialPlayerResponse
            const playerMatch = data.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (playerMatch) {
              const playerData = JSON.parse(playerMatch[1]);
              const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

              if (captions && captions.length > 0) {
                const englishCaption = captions.find(c => c.languageCode?.startsWith('en')) || captions[0];
                if (englishCaption?.baseUrl) {
                  const transcript = await this.fetchCaptionXml(englishCaption.baseUrl);
                  if (transcript && transcript.length > 100) {
                    resolve(transcript);
                    return;
                  }
                }
              }
            }

            reject(new Error('No caption tracks found'));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject)
        .on('timeout', function () { this.destroy(); reject(new Error('Scrape timeout')); });
    });
  }

  async fetchCaptionXml(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const textMatches = data.match(/<text[^>]*>([^<]*)<\/text>/g);
            if (!textMatches || textMatches.length === 0) {
              throw new Error('No text in caption XML');
            }

            const transcriptText = textMatches
              .map(match => match.replace(/<[^>]+>/g, ''))
              .join(' ');

            resolve(this.decodeHtmlEntities(transcriptText));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject)
        .on('timeout', function () { this.destroy(); reject(new Error('Caption XML timeout')); });
    });
  }

  // ============================================
  // LEVEL 4: Deepgram API
  // ============================================
  async transcribeWithDeepgram(url, videoId, apiKey) {
    logger.info('📥 Downloading audio for Deepgram...');

    // Download audio first
    const audioPath = await this.downloadAudioWithYtdl(url, videoId);

    if (!audioPath || !fs.existsSync(audioPath)) {
      throw new Error('Failed to download audio');
    }

    logger.info(`🎵 Audio downloaded: ${audioPath}`);
    logger.info('📤 Sending to Deepgram...');

    try {
      const audioBuffer = fs.readFileSync(audioPath);
      const transcript = await this.callDeepgramApi(audioBuffer, apiKey);

      // Cleanup
      this.cleanupFile(audioPath);

      return transcript;
    } catch (error) {
      this.cleanupFile(audioPath);
      throw error;
    }
  }

  async downloadAudioWithYtdl(url, videoId) {
    return new Promise((resolve, reject) => {
      try {
        const ytdl = require('ytdl-core');
        const audioPath = path.join(this.tempDir, `${videoId}_${Date.now()}.mp3`);
        const writeStream = fs.createWriteStream(audioPath);

        const timeout = setTimeout(() => {
          writeStream.destroy();
          reject(new Error('Audio download timeout (60s)'));
        }, 60000);

        ytdl(url, {
          quality: 'lowestaudio',
          filter: 'audioonly'
        })
          .on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          })
          .pipe(writeStream)
          .on('finish', () => {
            clearTimeout(timeout);
            logger.info(`✅ Audio saved: ${audioPath}`);
            resolve(audioPath);
          })
          .on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });

      } catch (error) {
        reject(error);
      }
    });
  }

  async callDeepgramApi(audioBuffer, apiKey) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.deepgram.com',
        path: '/v1/listen?model=nova-2&smart_format=true&language=en',
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/mp3',
          'Content-Length': audioBuffer.length
        },
        timeout: 120000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`Deepgram returned ${res.statusCode}: ${data}`);
            }

            const result = JSON.parse(data);
            const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

            if (!transcript || transcript.length < 50) {
              throw new Error('Deepgram returned empty transcript');
            }

            resolve(transcript);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Deepgram timeout')); });
      req.write(audioBuffer);
      req.end();
    });
  }

  // ============================================
  // LEVEL 5: @xenova/transformers (Local Whisper)
  // ============================================
  async transcribeWithLocalWhisper(url, videoId) {
    logger.info('🔧 Starting local Whisper transcription...');

    // Initialize transformers
    const loaded = await this.initializeTransformers();
    if (!loaded) {
      throw new Error('@xenova/transformers not available');
    }

    // Download audio
    logger.info('📥 Downloading audio for local Whisper...');
    const audioPath = await this.downloadAudioWithYtdl(url, videoId);

    if (!audioPath || !fs.existsSync(audioPath)) {
      throw new Error('Failed to download audio for Whisper');
    }

    try {
      logger.info('🎤 Running Whisper model (this may take a few minutes)...');

      // Use whisper-tiny for fastest processing
      const { pipeline } = this.transformers;

      if (!this.whisperPipeline) {
        logger.info('📦 Loading Whisper model (first time is slow)...');
        this.whisperPipeline = await pipeline(
          'automatic-speech-recognition',
          'Xenova/whisper-tiny.en',
          {
            quantized: true,
            revision: 'main'
          }
        );
        logger.info('✅ Whisper model loaded');
      }

      // Read audio file
      const audioBuffer = fs.readFileSync(audioPath);

      // Transcribe
      const result = await this.whisperPipeline(audioBuffer, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false
      });

      // Cleanup
      this.cleanupFile(audioPath);

      const transcript = result?.text || '';

      if (transcript.length < 50) {
        throw new Error('Local Whisper returned empty transcript');
      }

      return transcript;

    } catch (error) {
      this.cleanupFile(audioPath);
      throw error;
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  cleanupFile(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`🗑️ Cleaned up: ${filePath}`);
      }
    } catch (error) {
      logger.warn(`Cleanup failed: ${error.message}`);
    }
  }

  // Legacy method for backward compatibility
  async transcribeAudio(audioPath) {
    logger.warn('Direct audio transcription called - using local Whisper');

    const loaded = await this.initializeTransformers();
    if (!loaded) {
      throw new Error('@xenova/transformers not available');
    }

    const { pipeline } = this.transformers;

    if (!this.whisperPipeline) {
      this.whisperPipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        { quantized: true }
      );
    }

    const audioBuffer = fs.readFileSync(audioPath);
    const result = await this.whisperPipeline(audioBuffer);

    return result?.text || '';
  }

  generateHonestResponse() {
    return `TRANSCRIPT NOT AVAILABLE

We tried 5 different methods to get the transcript for this video:
1. ✗ YouTube Transcript API
2. ✗ YouTube Innertube API  
3. ✗ Web Scraping/Caption Tracks
4. ✗ Deepgram Speech-to-Text
5. ✗ Local Whisper AI

POSSIBLE REASONS:
• Video has no captions enabled
• Video is private or age-restricted
• Audio could not be processed
• Regional restrictions apply

WHAT TO DO:
🎬 Choose a video with captions (CC) enabled
📝 Try videos from educational channels
🔍 Check if video is publicly accessible

RECOMMENDATION:
Please try a different video that has captions enabled.`;
  }
}

module.exports = new TranscriptionService();

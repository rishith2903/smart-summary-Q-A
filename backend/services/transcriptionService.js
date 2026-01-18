const { YoutubeTranscript } = require('youtube-transcript');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.log(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.log(`[ERROR] ${new Date().toISOString()} ${msg}`)
};

class TranscriptionService {
  constructor() {
    this.transcriptCache = new Map();
    this.tempDir = path.join(__dirname, '../temp');

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
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
      logger.info('📋 Fallback order: youtube-transcript → Innertube API → Web Scraping → Deepgram URL API');

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
      // LEVEL 4: Deepgram API with direct URL transcription
      // ============================================
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (deepgramApiKey) {
        try {
          logger.info('🏅 Level 4: Deepgram Speech-to-Text (URL-based)...');
          const transcript = await this.transcribeWithDeepgramUrl(url, videoId, deepgramApiKey);
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
      // LEVEL 5: Try alternate caption languages
      // ============================================
      try {
        logger.info('🎖️ Level 5: Trying alternate languages...');
        const transcript = await this.getAlternateLanguageTranscript(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Alternate language transcript');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error5) {
        logger.warn(`Level 5 failed: ${error5.message}`);
      }

      // All methods failed
      logger.error('❌ All transcription methods failed');
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
    // Try multiple language configurations
    const configs = [
      { lang: 'en' },
      { lang: 'en-US' },
      { lang: 'en-GB' },
      {}  // default/auto
    ];

    for (const config of configs) {
      try {
        const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, config);

        if (transcriptArray && transcriptArray.length > 0) {
          const transcriptText = transcriptArray
            .map(item => item.text)
            .join(' ');

          const decoded = this.decodeHtmlEntities(transcriptText);
          if (decoded.length > 100) {
            return decoded;
          }
        }
      } catch (e) {
        // Try next config
        continue;
      }
    }

    throw new Error('No transcript from youtube-transcript package');
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 20000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            // Method 1: Try to find caption track URL directly
            const captionUrlMatch = data.match(/"captionTracks":\s*\[\s*\{[^}]*"baseUrl":\s*"([^"]+)"/);

            if (captionUrlMatch) {
              let captionUrl = captionUrlMatch[1].replace(/\\u0026/g, '&');
              const transcript = await this.fetchCaptionXml(captionUrl);
              if (transcript && transcript.length > 100) {
                resolve(transcript);
                return;
              }
            }

            // Method 2: Try ytInitialPlayerResponse
            const playerMatch = data.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (playerMatch) {
              try {
                const playerData = JSON.parse(playerMatch[1]);
                const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

                if (captions && captions.length > 0) {
                  // Try English first, then any available language
                  const sortedCaptions = [...captions].sort((a, b) => {
                    const aIsEn = a.languageCode?.startsWith('en') ? 0 : 1;
                    const bIsEn = b.languageCode?.startsWith('en') ? 0 : 1;
                    return aIsEn - bIsEn;
                  });

                  for (const caption of sortedCaptions) {
                    if (caption?.baseUrl) {
                      try {
                        const transcript = await this.fetchCaptionXml(caption.baseUrl);
                        if (transcript && transcript.length > 100) {
                          resolve(transcript);
                          return;
                        }
                      } catch (e) {
                        continue;
                      }
                    }
                  }
                }
              } catch (parseErr) {
                logger.warn(`Player response parse error: ${parseErr.message}`);
              }
            }

            reject(new Error('No caption tracks found in page'));
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
  // LEVEL 4: Deepgram with URL-based transcription
  // This uses Deepgram's ability to transcribe from a URL
  // ============================================
  async transcribeWithDeepgramUrl(youtubeUrl, videoId, apiKey) {
    // First, try to get an audio stream URL from YouTube
    const audioUrl = await this.getYouTubeAudioUrl(videoId);

    if (!audioUrl) {
      throw new Error('Could not get audio URL for Deepgram');
    }

    logger.info('🎵 Got audio URL, sending to Deepgram...');

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        url: audioUrl
      });

      const options = {
        hostname: 'api.deepgram.com',
        path: '/v1/listen?model=nova-2&smart_format=true&language=en&punctuate=true',
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 180000  // 3 minutes for longer videos
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`Deepgram returned ${res.statusCode}: ${data.substring(0, 200)}`);
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
      req.write(postData);
      req.end();
    });
  }

  // Get YouTube audio stream URL
  async getYouTubeAudioUrl(videoId) {
    return new Promise((resolve, reject) => {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      https.get(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            // Extract player response
            const playerMatch = data.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (!playerMatch) {
              throw new Error('Could not find player response');
            }

            const playerData = JSON.parse(playerMatch[1]);
            const formats = playerData?.streamingData?.adaptiveFormats || [];

            // Find audio-only format
            const audioFormats = formats.filter(f =>
              f.mimeType?.includes('audio') && f.url
            );

            if (audioFormats.length > 0) {
              // Sort by bitrate (lower is faster to process)
              audioFormats.sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0));
              resolve(audioFormats[0].url);
              return;
            }

            // No direct URL, try signatureCipher
            const cipherFormats = formats.filter(f =>
              f.mimeType?.includes('audio') && f.signatureCipher
            );

            if (cipherFormats.length > 0) {
              // Can't decode cipher without additional work
              logger.warn('Audio URL is encrypted with signature cipher');
            }

            throw new Error('No accessible audio format found');
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject)
        .on('timeout', function () { this.destroy(); reject(new Error('Audio URL timeout')); });
    });
  }

  // ============================================
  // LEVEL 5: Try alternate language transcripts
  // ============================================
  async getAlternateLanguageTranscript(videoId) {
    const languages = ['en', 'en-US', 'en-GB', 'es', 'fr', 'de', 'pt', 'hi', 'ja', 'ko', 'auto'];

    for (const lang of languages) {
      try {
        const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, { lang });

        if (transcriptArray && transcriptArray.length > 0) {
          const transcriptText = transcriptArray
            .map(item => item.text)
            .join(' ');

          const decoded = this.decodeHtmlEntities(transcriptText);
          if (decoded.length > 100) {
            logger.info(`Found transcript in language: ${lang}`);
            return decoded;
          }
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error('No transcript in any language');
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

  generateHonestResponse() {
    return `TRANSCRIPT NOT AVAILABLE

We tried 5 different methods to get the transcript for this video:
1. ✗ YouTube Transcript API
2. ✗ YouTube Innertube API  
3. ✗ Web Scraping/Caption Tracks
4. ✗ Deepgram Speech-to-Text
5. ✗ Alternate Language Search

POSSIBLE REASONS:
• Video has no captions enabled
• Video is private or age-restricted
• Audio stream is encrypted
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

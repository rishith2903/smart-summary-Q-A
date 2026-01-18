const { YoutubeTranscript } = require('youtube-transcript');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`)
};

class TranscriptionService {
  constructor() {
    this.transcriptCache = new Map();
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
        logger.info(`Using cached transcript for: ${videoId}`);
        return this.transcriptCache.get(videoId);
      }

      logger.info(`Getting transcript for video: ${videoId}`);
      logger.info('Attempting 4 methods: youtube-transcript → Innertube API → Caption Track → Web Scraping');

      // METHOD 1: YouTube Transcript API (npm package)
      try {
        logger.info('🥇 Method 1: YouTube Transcript API (npm package)...');
        const transcript = await this.getYouTubeTranscriptAPI(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: YouTube Transcript API');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error1) {
        logger.warn(`Method 1 failed: ${error1.message}`);
      }

      // METHOD 2: YouTube Innertube API (direct API call)
      try {
        logger.info('🥈 Method 2: YouTube Innertube API...');
        const transcript = await this.getInnertubeTranscript(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Innertube API');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error2) {
        logger.warn(`Method 2 failed: ${error2.message}`);
      }

      // METHOD 3: Direct Caption Track URL
      try {
        logger.info('🥉 Method 3: Direct Caption Track...');
        const transcript = await this.getCaptionTrack(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Caption Track');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error3) {
        logger.warn(`Method 3 failed: ${error3.message}`);
      }

      // METHOD 4: Web Scraping for captions
      try {
        logger.info('🏅 Method 4: Web Scraping...');
        const transcript = await this.scrapeTranscript(videoId);
        if (transcript && transcript.length > 100) {
          logger.info('✅ SUCCESS: Web Scraping');
          this.transcriptCache.set(videoId, transcript);
          return transcript;
        }
      } catch (error4) {
        logger.warn(`Method 4 failed: ${error4.message}`);
      }

      // All methods failed - provide honest response
      logger.info('❌ All transcript methods failed');
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

  // METHOD 1: YouTube Transcript API (npm package)
  async getYouTubeTranscriptAPI(videoId) {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    });

    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript available from youtube-transcript package');
    }

    const transcriptText = transcriptArray
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    if (transcriptText.length < 100) {
      throw new Error('Transcript too short');
    }

    return transcriptText;
  }

  // METHOD 2: YouTube Innertube API
  async getInnertubeTranscript(videoId) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        context: {
          client: {
            hl: 'en',
            gl: 'US',
            clientName: 'WEB',
            clientVersion: '2.20231219.04.00'
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
              throw new Error(`Innertube API returned ${res.statusCode}`);
            }

            const jsonData = JSON.parse(data);

            // Extract transcript from response
            const transcriptRenderer = jsonData?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer;
            const cueGroups = transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments ||
              transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups || [];

            if (cueGroups.length === 0) {
              throw new Error('No transcript cues found');
            }

            const transcriptText = cueGroups
              .map(group => {
                const cue = group?.transcriptCueGroupRenderer?.cues?.[0]?.transcriptCueRenderer?.cue?.simpleText ||
                  group?.transcriptSegmentRenderer?.snippet?.simpleText || '';
                return cue;
              })
              .filter(text => text.length > 0)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            if (transcriptText.length < 100) {
              throw new Error('Innertube transcript too short');
            }

            resolve(transcriptText);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Innertube API timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  // METHOD 3: Direct Caption Track URL
  async getCaptionTrack(videoId) {
    // First get video page to find caption track URL
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return new Promise((resolve, reject) => {
      https.get(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            // Look for timedtext URLs in the page
            const captionUrlMatch = data.match(/"captionTracks":\s*\[\s*\{[^}]*"baseUrl":\s*"([^"]+)"/);

            if (!captionUrlMatch) {
              // Try alternative pattern
              const altMatch = data.match(/playerCaptionsTracklistRenderer.*?"baseUrl":"([^"]+)"/);
              if (!altMatch) {
                throw new Error('No caption track URL found');
              }
            }

            let captionUrl = captionUrlMatch ? captionUrlMatch[1] : null;
            if (!captionUrl) {
              throw new Error('Could not extract caption URL');
            }

            // Unescape the URL
            captionUrl = captionUrl.replace(/\\u0026/g, '&');

            // Fetch the caption track
            const transcript = await this.fetchCaptionXml(captionUrl);
            resolve(transcript);

          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject)
        .on('timeout', () => reject(new Error('Caption track timeout')));
    });
  }

  // Helper: Fetch and parse caption XML
  async fetchCaptionXml(url) {
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            // Parse the timedtext XML
            const textMatches = data.match(/<text[^>]*>([^<]+)<\/text>/g);

            if (!textMatches || textMatches.length === 0) {
              throw new Error('No text found in caption XML');
            }

            const transcriptText = textMatches
              .map(match => {
                const textContent = match.replace(/<[^>]+>/g, '');
                return textContent
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .trim();
              })
              .filter(text => text.length > 0)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            if (transcriptText.length < 100) {
              throw new Error('Caption XML transcript too short');
            }

            resolve(transcriptText);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject)
        .on('timeout', () => reject(new Error('Caption XML timeout')));
    });
  }

  // METHOD 4: Web Scraping
  async scrapeTranscript(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return new Promise((resolve, reject) => {
      https.get(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 20000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            // Try to extract transcript from ytInitialPlayerResponse
            const playerResponseMatch = data.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);

            if (playerResponseMatch) {
              try {
                const playerResponse = JSON.parse(playerResponseMatch[1]);
                const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

                if (captions && captions.length > 0) {
                  // Find English caption or first available
                  const englishCaption = captions.find(c => c.languageCode === 'en' || c.languageCode === 'en-US') || captions[0];

                  if (englishCaption && englishCaption.baseUrl) {
                    // Fetch this caption track
                    this.fetchCaptionXml(englishCaption.baseUrl)
                      .then(resolve)
                      .catch(reject);
                    return;
                  }
                }
              } catch (parseErr) {
                logger.warn(`Player response parse error: ${parseErr.message}`);
              }
            }

            // Try extracting from ytInitialData
            const initialDataMatch = data.match(/ytInitialData\s*=\s*({.+?});/);

            if (initialDataMatch) {
              try {
                const initialData = JSON.parse(initialDataMatch[1]);
                // Look for engagementPanels containing transcript
                const panels = initialData?.engagementPanels || [];

                for (const panel of panels) {
                  const renderer = panel?.engagementPanelSectionListRenderer;
                  if (renderer?.panelIdentifier === 'engagement-panel-searchable-transcript') {
                    // Found transcript panel
                    const content = renderer?.content?.transcriptRenderer?.content?.transcriptSearchPanelRenderer;
                    const segments = content?.body?.transcriptSegmentListRenderer?.initialSegments || [];

                    if (segments.length > 0) {
                      const transcriptText = segments
                        .map(seg => seg?.transcriptSegmentRenderer?.snippet?.simpleText || '')
                        .filter(text => text.length > 0)
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                      if (transcriptText.length > 100) {
                        resolve(transcriptText);
                        return;
                      }
                    }
                  }
                }
              } catch (parseErr) {
                logger.warn(`Initial data parse error: ${parseErr.message}`);
              }
            }

            reject(new Error('Could not extract transcript from page'));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject)
        .on('timeout', () => reject(new Error('Web scraping timeout')));
    });
  }

  // Legacy method for backward compatibility
  async transcribeAudio(audioPath) {
    logger.warn('Audio transcription not available on this platform');
    return this.generateHonestResponse();
  }

  // Helper: Clean up temporary files
  async cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Cleanup failed: ${error.message}`);
    }
  }

  // Generate honest response when all methods fail
  generateHonestResponse() {
    return `TRANSCRIPT NOT AVAILABLE

We cannot get the transcript for this video.

WHAT TO DO:
🎬 Choose a video with captions enabled
📝 Look for videos that show "CC" (closed captions) button
🔍 Try educational channels that typically have transcripts

RECOMMENDATION:
Please try a different video that has captions enabled.`;
  }
}

module.exports = new TranscriptionService();

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configure FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Add the missing functions
async function startRecording(page) {
  await page.evaluate(() => {
    if (!window.mediaRecorder) {
      const audio = document.querySelector('audio');
      if (audio) {
        const stream = audio.captureStream();
        window.recordedChunks = [];
        const options = { mimeType: 'audio/webm' };
        window.mediaRecorder = new MediaRecorder(stream, options);
        window.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            window.recordedChunks.push(event.data);
          }
        };
        window.mediaRecorder.start();
      }
    }
  });
}

async function stopRecording(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      if (window.mediaRecorder) {
        window.mediaRecorder.onstop = () => {
          const blob = new Blob(window.recordedChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        };
        window.mediaRecorder.stop();
      }
    });
  });
}

async function saveRecording(base64Data) {
  console.log('[DEBUG] Received base64 data length:', base64Data?.length || 0);

  // Add validation
  if (!base64Data || base64Data.length < 1000) {
    throw new Error('Insufficient audio data received');
  }
  const base64Prefix = "data:audio/webm;base64,";
  if (base64Data.startsWith(base64Prefix)) {
    base64Data = base64Data.substring(base64Prefix.length);
  }
  
  const buffer = Buffer.from(base64Data, 'base64');
  const webmPath = path.join(process.cwd(), 'temp_audio.webm');
  const mp3Path = path.join(process.cwd(), 'meeting_audio.mp3');

  fs.writeFileSync(webmPath, buffer);

  await new Promise((resolve, reject) => {
    ffmpeg(webmPath)
      .outputOptions('-ab', '192k')
      .save(mp3Path)
      .on('end', () => {
        fs.unlinkSync(webmPath);
        resolve();
      })
      .on('error', reject);
  });
  

  return mp3Path;
}

// Export all three functions
export { startRecording, stopRecording, saveRecording };
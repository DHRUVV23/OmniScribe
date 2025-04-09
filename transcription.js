// import 'dotenv/config';
// import fs from 'fs';
// import { createClient } from '@deepgram/sdk';

// // Initialize Deepgram client
// const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// async function transcribeAudio(filePath) {
//   try {
//     // Validate file exists
//     if (!fs.existsSync(filePath)) {
//       throw new Error(`Audio file not found: ${filePath}`);
//     }

//     // Read audio file
//     const audio = fs.readFileSync(filePath);

//     // Transcribe using Deepgram
//     const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
//       audio,
//       {
//         model: 'nova-3',
//         smart_format: true,
//         language: 'en',
//         mimetype: 'audio/mpeg' // For MP3 files
//       }
//     );

//     if (error) throw error;
//     if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
//       throw new Error('No transcription returned');
//     }

//     return result.results.channels[0].alternatives[0].transcript;
//   } catch (error) {
//     console.error('Deepgram Error:', {
//       message: error.message,
//       code: error.code,
//       filePath
//     });
//     throw error;
//   }
// }

// async function transcribeAndSummarize(filePath) {
//   try {
//     // Validate file exists
//     if (!fs.existsSync(filePath)) {
//       throw new Error(`Audio file not found: ${filePath}`);
//     }

//     // Read audio file
//     const audio = fs.readFileSync(filePath);

//     // Transcribe using Deepgram with summary features
//     const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
//       audio,
//       {
//         model: 'nova-3',
//         smart_format: true,
//         language: 'en',
//         mimetype: 'audio/mpeg',
//         summarize: 'v2',
//         extra: {
//           summarize: {
//             format: 'bullets'
//           }
//         }
//       }
//     );

//     if (error) throw error;

//     // Extract results
//     const transcript = result.results.channels[0].alternatives[0].transcript;
//     const summary = result.results?.summary?.short || 'No summary generated';

//     return {
//       transcript,
//       summary,
//       fullResult: result
//     };
//   } catch (error) {
//     console.error('Deepgram Error:', {
//       message: error.message,
//       code: error.code,
//       filePath
//     });
//     throw error;
//   }
// }

// export { transcribeAudio,transcribeAndSummarize  };

import 'dotenv/config';
import fs from 'fs';
import { createClient } from '@deepgram/sdk';

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

async function transcribeAudio(filePath) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    
    // Read audio file
    const audio = fs.readFileSync(filePath);
    
    // Transcribe using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audio,
      {
        model: 'nova-3',
        smart_format: true,
        language: 'en',
        diarize: true,
        punctuate: true,
        utterances: true,
        mimetype: 'audio/mpeg' // For MP3 files
      }
    );
    
    if (error) throw error;
    if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      throw new Error('No transcription returned');
    }
    
    return result.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error('Deepgram Error:', {
      message: error.message,
      code: error.code,
      filePath
    });
    throw error;
  }
}

async function transcribeAndSummarize(filePath) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    
    // Read audio file
    const audio = fs.readFileSync(filePath);
    
    // Transcribe using Deepgram with enhanced summary features
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audio,
      {
        model: 'nova-3',
        smart_format: true,
        language: 'en',
        diarize: true,
        punctuate: true,
        utterances: true,
        mimetype: 'audio/mpeg',
        summarize: 'v2',
        detect_topics: true,
        extra: {
          summarize: {
            format: 'bullets',
            model: 'summarize',
            length: 'medium' // Options: 'short', 'medium', 'long'
          }
        }
      }
    );
    
    if (error) throw error;
    
    // Extract results
    const transcript = result.results.channels[0].alternatives[0].transcript;
    
    // Get summary or return default message
    const summary = result.results?.summary?.short || 'No summary generated';
    
    // Get topics if available
    const topics = result.results?.topics || [];
    
    return {
      transcript,
      summary,
      topics,
      fullResult: result
    };
  } catch (error) {
    console.error('Deepgram Error:', {
      message: error.message,
      code: error.code,
      filePath
    });
    throw error;
  }
}

// New function that provides a detailed, more accurate summary
async function enhancedSummarization(filePath) {
  try {
    // First get full transcript with all features enabled
    const audio = fs.readFileSync(filePath);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audio,
      {
        model: 'nova-3', // Their most accurate model
        smart_format: true,
        language: 'en',
        diarize: true, // Speaker identification
        punctuate: true,
        utterances: true,
        detect_topics: true,
        summarize: 'v2',
        extra: {
          summarize: {
            format: 'paragraphs', // More detailed than bullets
            model: 'summarize-complex', // Request more thorough analysis
            length: 'medium' // Options: 'short', 'medium', 'long'
          }
        },
        tier: 'enhanced', // Request highest quality processing
        mimetype: 'audio/mpeg'
      }
    );
    
    if (error) throw error;
    
    // Extract all the useful information
    const transcript = result.results.channels[0].alternatives[0].transcript;
    const paragraphSummary = result.results?.summary?.long || result.results?.summary?.medium || result.results?.summary?.short || 'No summary generated';
    const bulletSummary = result.results?.summary?.bullets || [];
    const topics = result.results?.topics || [];
    
    // Combine all the insights for a more comprehensive view
    return {
      transcript,
      paragraphSummary,
      bulletSummary,
      topics,
      speakers: result.results.channels[0].alternatives[0].speaker_labels || [],
      confidence: result.results.channels[0].alternatives[0].confidence,
      fullResult: result
    };
  } catch (error) {
    console.error('Enhanced Summarization Error:', {
      message: error.message,
      code: error.code,
      filePath
    });
    throw error;
  }
}

export { 
  transcribeAudio,
  transcribeAndSummarize,
  enhancedSummarization 
};
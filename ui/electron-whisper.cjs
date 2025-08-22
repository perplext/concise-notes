const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Model configuration
const MODELS_DIR = path.join(__dirname, '..', 'models');
const MODEL_FILES = {
  tiny: 'ggml-tiny.bin',
  base: 'ggml-base.bin',
  small: 'ggml-small.bin',
  medium: 'ggml-medium.bin',
  large: 'ggml-large-v3.bin'
};

class WhisperService {
  constructor() {
    this.Whisper = null;
    this.whisperInstance = null;
    this.currentModelSize = null;
    this.currentUseGpu = true;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Try to load smart-whisper-electron
      const smartWhisper = require('smart-whisper-electron');
      this.Whisper = smartWhisper.Whisper || smartWhisper;
      this.isInitialized = true;
      console.log('✅ Whisper service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Whisper:', error);
      // Fallback mode if smart-whisper-electron is not available
      this.isInitialized = false;
      return false;
    }
  }

  async loadModel(modelSize = 'base', options = {}) {
    if (!this.isInitialized) {
      throw new Error('Whisper service not initialized');
    }

    const modelPath = path.join(MODELS_DIR, MODEL_FILES[modelSize]);
    
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    const useGpu = options.useGpu !== undefined ? options.useGpu : true;

    try {
      console.log(`Loading model: ${modelSize} from ${modelPath} (GPU: ${useGpu})`);
      
      // Free previous model if exists
      if (this.whisperInstance) {
        await this.whisperInstance.free();
        this.whisperInstance = null;
      }
      
      // Create new whisper instance with the model
      this.whisperInstance = new this.Whisper(modelPath, {
        gpu: useGpu, // Enable GPU based on options
        threads: useGpu ? 4 : 8, // More threads for CPU-only mode
      });
      
      this.currentModelSize = modelSize;
      this.currentUseGpu = useGpu;
      console.log(`✅ Model loaded: ${modelSize} (GPU: ${useGpu})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load model: ${error.message}`);
      throw error;
    }
  }

  async transcribe(audioPath, options = {}) {
    if (!this.whisperInstance) {
      throw new Error('No model loaded. Call loadModel() first.');
    }

    const defaultOptions = {
      language: options.language || 'auto',
      ...options
    };

    const progressCallback = options.progressCallback || (() => {});

    try {
      console.log(`Transcribing: ${audioPath}`);
      const startTime = Date.now();
      
      // Convert audio/video to PCM WAV format first
      // Use OS temp directory for temporary files
      const os = require('os');
      const tempDir = os.tmpdir();
      const tempWavPath = path.join(tempDir, `whisper_temp_${Date.now()}.wav`);
      
      try {
        // Check if input file exists (use async for better network support)
        try {
          await fs.promises.access(audioPath, fs.constants.R_OK);
        } catch (err) {
          throw new Error(`Cannot access input file: ${audioPath} - ${err.message}`);
        }
        
        // Get file stats to verify it's readable and check size
        const stats = await fs.promises.stat(audioPath);
        if (!stats.isFile()) {
          throw new Error(`Path is not a file: ${audioPath}`);
        }
        
        const fileSizeGB = stats.size / (1024 * 1024 * 1024);
        const fileSizeMB = stats.size / (1024 * 1024);
        console.log(`File size: ${fileSizeGB > 1 ? fileSizeGB.toFixed(2) + ' GB' : fileSizeMB.toFixed(2) + ' MB'}`);
        
        // Very generous limit - 20GB max (suitable for long videos)
        const maxSizeGB = 20;
        if (fileSizeGB > maxSizeGB) {
          throw new Error(`File too large: ${fileSizeGB.toFixed(2)} GB exceeds maximum of ${maxSizeGB} GB. Consider splitting the video into parts.`);
        }
        
        // Warning for very large files
        if (fileSizeGB > 5) {
          console.warn(`⚠️ Large file detected (${fileSizeGB.toFixed(2)} GB). Transcription may take a while...`);
        }
        
        // Use ffmpeg to convert to 16kHz mono PCM WAV
        console.log(`Converting audio to PCM format...`);
        console.log(`Input: ${audioPath}`);
        console.log(`Output: ${tempWavPath}`);
        
        progressCallback({
          stage: 'converting',
          progress: 30,
          message: 'Converting audio format...'
        });
        
        // Escape path for shell command (handle spaces and special chars)
        const escapedInputPath = audioPath.replace(/"/g, '\\"');
        const escapedOutputPath = tempWavPath.replace(/"/g, '\\"');
        
        await execAsync(`ffmpeg -i "${escapedInputPath}" -ar 16000 -ac 1 -f wav "${escapedOutputPath}" -y`);
        
        // Read the WAV file (use async for better performance)
        progressCallback({
          stage: 'reading',
          progress: 40,
          message: 'Reading audio data...'
        });
        
        const wavBuffer = await fs.promises.readFile(tempWavPath);
        
        // Extract PCM data from WAV (skip 44-byte header)
        const pcmData = new Float32Array(wavBuffer.buffer.slice(44).byteLength / 2);
        const dataView = new DataView(wavBuffer.buffer, 44);
        
        progressCallback({
          stage: 'preparing',
          progress: 50,
          message: 'Preparing audio for transcription...'
        });
        
        for (let i = 0; i < pcmData.length; i++) {
          const sample = dataView.getInt16(i * 2, true);
          pcmData[i] = sample / 32768.0; // Convert to float32 [-1, 1]
        }
        
        // Transcribe the PCM data
        console.log('Transcribing PCM data, length:', pcmData.length);
        
        progressCallback({
          stage: 'transcribing',
          progress: 60,
          message: 'Transcribing audio with Whisper...'
        });
        
        const task = await this.whisperInstance.transcribe(pcmData, defaultOptions);
        
        console.log('Task object:', task);
        console.log('Task properties:', Object.keys(task || {}));
        
        // Wait for the result - handle different possible structures
        progressCallback({
          stage: 'processing',
          progress: 80,
          message: 'Processing transcription results...'
        });
        
        let result;
        if (task && typeof task.result === 'function') {
          result = await task.result();
        } else if (task && task.result) {
          result = await task.result;
        } else {
          result = task;
        }
        
        console.log('Raw Whisper task result:', result);
        console.log('Result type:', typeof result);
        console.log('Result keys:', Object.keys(result || {}));
        
        // Clean up temp file
        if (fs.existsSync(tempWavPath)) {
          fs.unlinkSync(tempWavPath);
        }
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Transcription complete in ${duration}s`);
        console.log('Whisper result type:', typeof result);
        console.log('Whisper result:', result);
        
        progressCallback({
          stage: 'finalizing',
          progress: 95,
          message: 'Finalizing transcription...'
        });
        
        // Extract text from the result
        let transcriptionText = '';
        if (typeof result === 'string') {
          transcriptionText = result;
        } else if (result && typeof result === 'object') {
          if (typeof result.text === 'string') {
            transcriptionText = result.text;
          } else if (Array.isArray(result)) {
            transcriptionText = result.map(s => s.text || s).join(' ');
          } else if (result.segments && Array.isArray(result.segments)) {
            transcriptionText = result.segments.map(s => s.text || '').join(' ');
          }
        }
        
        return {
          text: transcriptionText,
          segments: result.segments || [],
          language: result.language || defaultOptions.language,
          duration: duration
        };
      } catch (ffmpegError) {
        // Clean up temp file on error
        if (fs.existsSync(tempWavPath)) {
          fs.unlinkSync(tempWavPath);
        }
        
        console.error('❌ Audio conversion failed:', ffmpegError);
        throw new Error(`Failed to convert audio: ${ffmpegError.message}`);
      }
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      throw error;
    }
  }

  async transcribeRealtime(audioBuffer, options = {}) {
    if (!this.whisperInstance) {
      throw new Error('No model loaded. Call loadModel() first.');
    }

    try {
      // The audioBuffer comes as an ArrayBuffer containing Int16 samples
      // We need to convert it to Float32Array for Whisper
      
      // Create Int16Array view of the buffer
      const int16Array = new Int16Array(audioBuffer);
      
      // Convert Int16 to Float32 [-1.0, 1.0] with normalization
      const pcmData = new Float32Array(int16Array.length);
      
      // First pass: find peak for normalization
      let peak = 0;
      for (let i = 0; i < int16Array.length; i++) {
        const abs = Math.abs(int16Array[i]);
        if (abs > peak) peak = abs;
      }
      
      // Normalize to prevent clipping but maintain good signal level
      const normalizer = peak > 30000 ? 30000.0 / peak : 1.0;
      
      for (let i = 0; i < int16Array.length; i++) {
        pcmData[i] = (int16Array[i] * normalizer) / 32768.0;
      }
      
      console.log(`Processing real-time audio: ${pcmData.length} samples`);
      
      // Only transcribe if we have enough audio (at least 3 seconds at 16kHz for better context)
      if (pcmData.length < 48000) {
        console.log(`Buffering more audio: ${pcmData.length}/48000 samples`);
        return {
          text: '',
          confidence: 0.5,
          isFinal: false
        };
      }
      
      // Check audio amplitude to ensure we have actual sound
      let maxAmplitude = 0;
      for (let i = 0; i < pcmData.length; i++) {
        const abs = Math.abs(pcmData[i]);
        if (abs > maxAmplitude) maxAmplitude = abs;
      }
      
      console.log(`Audio amplitude: max=${maxAmplitude.toFixed(4)}, samples=${pcmData.length}`);
      
      // If audio is too quiet, it might be silence
      if (maxAmplitude < 0.01) {
        console.log('Audio too quiet, likely silence');
        return {
          text: '',
          confidence: 0.5,
          isFinal: false
        };
      }
      
      const task = await this.whisperInstance.transcribe(pcmData, {
        language: options.language || 'en', // Force English instead of auto
        task: 'transcribe',
        temperature: 0.0, // More deterministic results
        suppress_non_speech_tokens: true, // Try to suppress non-speech tokens
        ...options
      });
      
      const result = await task.result;
      
      console.log('Real-time transcription result:', result);
      
      // Extract text from result - handle different formats
      let transcribedText = '';
      
      if (typeof result === 'string') {
        transcribedText = result;
      } else if (Array.isArray(result)) {
        // Result is an array of segments with 'from', 'to', 'text' properties
        transcribedText = result
          .map(segment => segment.text || '')
          .join(' ')
          .trim();
      } else if (result && typeof result === 'object') {
        if (result.text) {
          transcribedText = result.text;
        } else if (result.segments && Array.isArray(result.segments)) {
          transcribedText = result.segments
            .map(s => s.text || '')
            .join(' ')
            .trim();
        }
      }
      
      // Filter out non-speech sounds in parentheses
      // These are typically Whisper's way of indicating non-speech audio
      const nonSpeechPattern = /^\s*\([^)]+\)\s*$/;
      
      if (nonSpeechPattern.test(transcribedText)) {
        console.log('Detected non-speech sound:', transcribedText);
        // Return empty for non-speech sounds
        return {
          text: '',
          confidence: 0.5,
          isFinal: false
        };
      }
      
      console.log('Extracted text:', transcribedText);
      
      return {
        text: transcribedText,
        confidence: 0.9,
        isFinal: true
      };
    } catch (error) {
      console.error('❌ Realtime transcription failed:', error);
      throw error;
    }
  }

  listAvailableModels() {
    const models = {};
    
    for (const [size, filename] of Object.entries(MODEL_FILES)) {
      const modelPath = path.join(MODELS_DIR, filename);
      const exists = fs.existsSync(modelPath);
      
      models[size] = {
        name: size,
        filename: filename,
        path: modelPath,
        exists: exists,
        size: exists ? fs.statSync(modelPath).size : 0,
        sizeFormatted: exists ? this.formatFileSize(fs.statSync(modelPath).size) : 'Not downloaded'
      };
    }
    
    return models;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async downloadModel(modelSize) {
    // For now, return instruction since models should be downloaded via CLI
    return {
      success: false,
      message: `Please download the ${modelSize} model using the CLI:\n./target/release/concise-note-taker download --model ${modelSize}`,
      modelPath: path.join(MODELS_DIR, MODEL_FILES[modelSize])
    };
  }

  async cleanup() {
    if (this.whisperInstance) {
      try {
        await this.whisperInstance.free();
      } catch (error) {
        console.error('Error freeing Whisper instance:', error);
      }
      this.whisperInstance = null;
    }
    this.currentModelSize = null;
    this.currentUseGpu = true;
  }
}

// Export singleton instance
module.exports = new WhisperService();
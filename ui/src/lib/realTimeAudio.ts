import type { RealtimeChunk, RealtimeTranscriptionOptions } from './types';
import electronService from '../services/electronService';

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export interface AudioCaptureOptions {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  chunkSize: number;
  vadThreshold: number;
}

export interface VADResult {
  isSpeech: boolean;
  confidence: number;
  energy: number;
}

export class RealTimeAudioCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  
  private isRecording = false;
  private audioBuffer: Float32Array[] = [];
  private bufferSize = 0;
  private maxBufferSize = 80000; // 5 seconds at 16kHz for better Whisper accuracy
  
  // VAD (Voice Activity Detection) state
  private energyHistory: number[] = [];
  private energyHistorySize = 20; // 20 frames for faster response
  private silenceFrames = 0;
  private speechFrames = 0;
  private minSpeechFrames = 3; // Faster speech detection
  private minSilenceFrames = 30; // Wait longer for silence to get more context
  private backgroundNoise = -6; // Estimate of background noise level
  
  // Callbacks
  private onAudioChunk?: (chunk: Float32Array) => void;
  private onVAD?: (result: VADResult) => void;
  private onError?: (error: Error) => void;
  private onAudioLevel?: (level: number) => void;

  constructor(
    private options: AudioCaptureOptions = {
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      chunkSize: 512, // Smaller chunks for more responsive processing
      vadThreshold: 0.001  // Very sensitive threshold for initial testing
    }
  ) {}

  async initialize(): Promise<boolean> {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported in this environment');
        if (this.onError) {
          this.onError(new Error('Microphone access not supported'));
        }
        return false;
      }
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.options.sampleRate
      });

      // Create audio nodes
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.processor = this.audioContext.createScriptProcessor(this.options.chunkSize, 1, 1);

      // Configure analyser
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect audio nodes
      this.microphone.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Set up audio processing
      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        this.processAudioChunk(inputData);
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize audio capture:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  private processAudioChunk(inputData: Float32Array) {
    // Calculate audio level for visualization
    const audioLevel = this.calculateAudioLevel(inputData);
    this.onAudioLevel?.(audioLevel);

    // Perform Voice Activity Detection
    const vadResult = this.performVAD(inputData);
    this.onVAD?.(vadResult);

    // Debug logging every 20 frames (roughly once per second at 20fps)
    if (Math.random() < 0.05) {
      console.log('🎤 Audio chunk processed:', {
        length: inputData.length,
        audioLevel: audioLevel.toFixed(2),
        vadResult: {
          isSpeech: vadResult.isSpeech,
          energy: vadResult.energy.toFixed(4),
          confidence: vadResult.confidence.toFixed(3)
        },
        bufferSize: this.bufferSize,
        speechFrames: this.speechFrames,
        silenceFrames: this.silenceFrames,
        backgroundNoise: this.backgroundNoise.toFixed(4)
      });
    }

    // If speech is detected, buffer the audio
    if (vadResult.isSpeech) {
      this.audioBuffer.push(new Float32Array(inputData));
      this.bufferSize += inputData.length;
      this.speechFrames++;
      this.silenceFrames = 0;

      // Send chunk when buffer is large enough
      if (this.bufferSize >= this.maxBufferSize) {
        console.log('📤 Sending buffered audio - buffer full:', this.bufferSize);
        this.sendBufferedAudio();
      }
    } else {
      this.silenceFrames++;
      this.speechFrames = 0;

      // Send any buffered audio if we've detected silence for a while
      if (this.silenceFrames >= this.minSilenceFrames && this.audioBuffer.length > 0) {
        console.log('📤 Sending buffered audio - silence detected:', this.silenceFrames);
        this.sendBufferedAudio();
      }
    }
  }

  private calculateAudioLevel(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
    }
    const average = sum / data.length;
    return Math.min(average * 100, 100); // Scale to 0-100
  }

  private performVAD(data: Float32Array): VADResult {
    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    const energy = Math.log10(rms + 1e-10); // Add small value to avoid log(0)

    // Update background noise estimate
    if (this.energyHistory.length > 10) {
      const sortedHistory = [...this.energyHistory].sort((a, b) => a - b);
      this.backgroundNoise = sortedHistory[Math.floor(sortedHistory.length * 0.1)]; // 10th percentile
    }

    // Update energy history for smoothing
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.energyHistorySize) {
      this.energyHistory.shift();
    }

    // Calculate recent energy trend (last 5 frames)
    const recentFrames = this.energyHistory.slice(-5);
    const recentAvg = recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length;
    
    // Adaptive threshold based on background noise
    const adaptiveThreshold = this.backgroundNoise + 0.5; // 0.5 dB above background
    const fallbackThreshold = Math.log10(this.options.vadThreshold);
    const threshold = Math.max(adaptiveThreshold, fallbackThreshold);
    
    // Multi-criteria VAD
    const energyAboveThreshold = recentAvg > threshold;
    const significantEnergyIncrease = energy > (this.backgroundNoise + 0.3);
    const isSpeech = energyAboveThreshold || significantEnergyIncrease;
    
    // Calculate confidence based on how much above threshold
    const energyDiff = recentAvg - threshold;
    const confidence = Math.min(Math.max(energyDiff / 2, 0), 1);

    return {
      isSpeech,
      confidence,
      energy: recentAvg
    };
  }

  private sendBufferedAudio() {
    if (this.audioBuffer.length === 0) {
      console.log('⚠️ sendBufferedAudio called but buffer is empty');
      return;
    }

    // Concatenate all buffered chunks
    const totalLength = this.audioBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
    const concatenated = new Float32Array(totalLength);
    let offset = 0;

    for (const chunk of this.audioBuffer) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('📤 Sending audio chunk:', {
      chunks: this.audioBuffer.length,
      totalLength,
      bufferSize: this.bufferSize,
      avgAmplitude: (concatenated.reduce((sum, val) => sum + Math.abs(val), 0) / concatenated.length).toFixed(6)
    });

    // Send to callback
    this.onAudioChunk?.(concatenated);

    // Clear buffer
    this.audioBuffer = [];
    this.bufferSize = 0;
  }

  async startRecording(): Promise<boolean> {
    if (!this.audioContext) {
      console.error('Audio context not initialized');
      return false;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await this.audioContext.resume();
      }

      this.isRecording = true;
      console.log('✅ Real-time audio capture started - isRecording:', this.isRecording);
      console.log('Audio context state:', this.audioContext.state);
      console.log('Sample rate:', this.audioContext.sampleRate);
      return true;
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  stopRecording() {
    console.log('🛑 Stopping audio capture - was recording:', this.isRecording);
    this.isRecording = false;
    
    // Send any remaining buffered audio
    if (this.audioBuffer.length > 0) {
      console.log('Sending final buffered audio chunks:', this.audioBuffer.length);
      this.sendBufferedAudio();
    }

    console.log('✅ Real-time audio capture stopped - isRecording:', this.isRecording);
  }

  cleanup() {
    this.stopRecording();

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  // Setters for callbacks
  setOnAudioChunk(callback: (chunk: Float32Array) => void) {
    this.onAudioChunk = callback;
  }

  setOnVAD(callback: (result: VADResult) => void) {
    this.onVAD = callback;
  }

  setOnError(callback: (error: Error) => void) {
    this.onError = callback;
  }

  setOnAudioLevel(callback: (level: number) => void) {
    this.onAudioLevel = callback;
  }

  // Getters
  getIsRecording(): boolean {
    return this.isRecording;
  }

  getPermissionState(): Promise<PermissionState> {
    return navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(result => result.state);
  }
}

export class RealTimeTranscriptionManager {
  private audioCapture: RealTimeAudioCapture;
  private isTranscribing = false;
  private sessionId: string | null = null;
  private recognition: SpeechRecognition | null = null;
  private isBrowserMode = false;
  private audioBuffer: Float32Array[] = [];
  
  private onTranscriptionChunk?: (chunk: RealtimeChunk) => void;
  private onError?: (error: Error) => void;

  constructor() {
    this.audioCapture = new RealTimeAudioCapture();
    // Check for Electron first, then Tauri, then fallback to browser mode
    if (electronService.isElectron) {
      this.isBrowserMode = false; // Electron mode, use native Whisper
    } else {
      this.isBrowserMode = typeof window !== 'undefined' && !('__TAURI_IPC__' in window);
    }
    
    // Set up audio capture callbacks
    this.audioCapture.setOnAudioChunk((audioData) => {
      console.log('Audio chunk received, length:', audioData.length);
      if (!this.isBrowserMode) {
        this.processAudioForTranscription(audioData);
      }
      // In browser mode, we rely on Web Speech API instead of audio chunks
    });

    this.audioCapture.setOnError((error) => {
      console.error('Audio capture error:', error);
      this.onError?.(error);
    });
  }

  async initialize(): Promise<boolean> {
    try {
      const initialized = await this.audioCapture.initialize();
      if (!initialized) {
        console.error('Failed to initialize audio capture');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error during initialization:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  async startTranscription(options: RealtimeTranscriptionOptions): Promise<string | null> {
    try {
      // Initialize transcription session with backend
      if (electronService.isElectron) {
        // Electron mode: Use native Whisper via IPC
        console.log('💻 Using Electron native Whisper transcription');
        this.sessionId = 'electron-' + Date.now();
        
        // Ensure model is loaded
        const models = await electronService.listModels();
        if (models) {
          const hasLoadedModel = Object.values(models).some(m => m.exists);
          if (!hasLoadedModel) {
            // Try to load base model by default
            await electronService.loadModel('base');
          }
        }
        
        this.isTranscribing = true;
        // Start audio capture but don't use Web Speech API
        this.audioCapture.startRecording();
        return this.sessionId;
      } else if (!this.isBrowserMode) {
        const { realtimeApi } = await import('./api');
        this.sessionId = await realtimeApi.startRealtime(options);
        
        // Set up event listener for real-time chunks
        const { listen } = await import('@tauri-apps/api/event');
        await listen<any>('realtime-chunk', (event) => {
          const chunk = event.payload;
          this.onTranscriptionChunk?.({
            text: chunk.text,
            start_time: chunk.start_time,
            end_time: chunk.end_time,
            confidence: chunk.confidence,
            is_final: chunk.is_final,
            speaker: chunk.speaker
          });
        });
      } else {
        // Browser mode - use Web Speech API
        this.sessionId = `browser_session_${Date.now()}`;
        await this.setupWebSpeechAPI(options);
      }

      // Start audio capture (for level monitoring in browser mode)
      const audioStarted = await this.audioCapture.startRecording();
      if (!audioStarted) {
        return null;
      }

      this.isTranscribing = true;
      console.log('Real-time transcription started with session:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.onError?.(error as Error);
      return null;
    }
  }

  async stopTranscription(): Promise<void> {
    console.log('🛑 Stopping transcription manager - isTranscribing:', this.isTranscribing, 'sessionId:', this.sessionId);
    
    this.isTranscribing = false;
    this.audioCapture.stopRecording();

    // Stop Web Speech API in browser mode
    if (this.recognition) {
      console.log('🛑 Stopping Web Speech API...');
      this.recognition.stop();
      this.recognition = null;
    }

    if (this.sessionId) {
      try {
        if (!this.isBrowserMode) {
          console.log('📞 Calling Tauri stopRealtime API...');
          const { realtimeApi } = await import('./api');
          await realtimeApi.stopRealtime(this.sessionId);
          console.log('✅ Tauri stopRealtime API call completed');
        } else {
          console.log('🌐 Browser mode - Web Speech API stopped');
        }
        console.log('✅ Real-time transcription stopped');
      } catch (error) {
        console.error('❌ Failed to stop transcription session:', error);
        throw error; // Re-throw to let the UI handle it
      }
      
      this.sessionId = null;
    } else {
      console.log('⚠️ No session ID to stop');
    }
  }

  private async processAudioForTranscription(audioData: Float32Array) {
    if (!this.isTranscribing || !this.sessionId) return;

    try {
      if (electronService.isElectron) {
        // Convert Float32Array to ArrayBuffer for Electron IPC
        const buffer = audioData.buffer.slice(
          audioData.byteOffset,
          audioData.byteOffset + audioData.byteLength
        );
        
        const result = await electronService.transcribeRealtime(buffer);
        if (result) {
          this.onTranscriptionChunk?.({
            text: result.text,
            start_time: 0,
            end_time: 0,
            confidence: result.confidence,
            is_final: result.isFinal,
            speaker: null
          });
        }
      } else if (!this.isBrowserMode) {
        // Send audio data to Tauri backend for transcription
        const { realtimeApi } = await import('./api');
        
        // Convert Float32Array to regular array for serialization
        const audioArray = Array.from(audioData);
        
        await realtimeApi.processRealtimeAudio(this.sessionId, audioArray);
      }
      // In browser mode, Web Speech API handles transcription directly
    } catch (error) {
      console.error('Failed to process audio for transcription:', error);
      this.onError?.(error as Error);
    }
  }

  private async setupWebSpeechAPI(options: RealtimeTranscriptionOptions): Promise<void> {
    // Check if Web Speech API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported, falling back to simulation');
      return;
    }

    console.log('🎤 Setting up Web Speech API for real speech recognition...');
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    // Auto-detect language or use provided language
    const browserLang = navigator.language || 'en-US';
    this.recognition.lang = options.language || browserLang;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log('✅ Web Speech API started');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎯 Speech recognition result received');
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        
        if (alternative.transcript.trim()) {
          const chunk: RealtimeChunk = {
            text: alternative.transcript,
            start_time: Date.now() - 2000, // Approximate start time
            end_time: Date.now(),
            confidence: alternative.confidence || 0.8,
            is_final: result.isFinal,
            speaker: alternative.confidence > 0.7 ? 'You' : undefined
          };
          
          console.log('📝 Transcription chunk:', {
            text: chunk.text,
            confidence: chunk.confidence,
            isFinal: chunk.is_final
          });
          
          this.onTranscriptionChunk?.(chunk);
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Web Speech API error:', event.error, event.message);
      if (event.error === 'network') {
        this.onError?.(new Error('Network error in speech recognition. Please check your internet connection.'));
      } else if (event.error === 'not-allowed') {
        this.onError?.(new Error('Microphone access denied. Please allow microphone permissions.'));
      } else {
        this.onError?.(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    this.recognition.onend = () => {
      console.log('🔚 Web Speech API ended');
      // Restart if we're still transcribing (for continuous operation)
      if (this.isTranscribing && this.recognition) {
        console.log('🔄 Restarting Web Speech API for continuous recognition...');
        // Add a small delay to prevent immediate restart issues
        setTimeout(() => {
          if (this.isTranscribing && this.recognition) {
            try {
              this.recognition.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
            }
          }
        }, 100);
      }
    };

    // Start the recognition
    try {
      this.recognition.start();
      console.log('🚀 Web Speech API recognition started');
    } catch (error) {
      console.error('Failed to start Web Speech API:', error);
      throw error;
    }
  }

  private simulateTranscription(audioData: Float32Array) {
    // Calculate audio energy to determine if speech is present
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const energy = Math.sqrt(sum / audioData.length);
    
    console.log('🎙️ simulateTranscription called with energy:', energy.toFixed(6));
    
    // Only generate transcription if there's any measurable audio energy (very low threshold)
    if (energy > 0.0001) {
      // Generate more realistic transcription based on audio characteristics
      const phrases = [
        "I can hear audio from the microphone",
        "Speech detected in real-time",
        "Processing live microphone input",
        "Audio levels are registering", 
        "Microphone is picking up sound",
        "Real-time voice detection active",
        "Live audio stream is working",
        "Sound is being captured successfully",
        "Voice activity is being monitored",
        "Audio processing pipeline is functional"
      ];
      
      // Very sensitive trigger for browser testing
      if (Math.random() < energy * 500 + 0.2) { // Much higher energy sensitivity, plus higher base chance
        const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        // Add detailed energy information for debugging
        const energyInfo = ` [E:${energy.toFixed(6)}, Raw:${(energy*1000000).toFixed(1)}µ]`;
        
        const chunk: RealtimeChunk = {
          text: selectedPhrase + energyInfo,
          start_time: Date.now(),
          end_time: Date.now() + 2000,
          confidence: Math.min(0.6 + (energy * 20), 0.95),
          is_final: true,
          speaker: energy > 0.005 ? 'Speaker 1' : undefined
        };
        
        console.log('✅ Simulating transcription chunk:', {
          energy,
          phrase: selectedPhrase,
          confidence: chunk.confidence
        });
        this.onTranscriptionChunk?.(chunk);
      } else {
        console.log('⏭️ Audio energy detected but below transcription threshold');
      }
    } else {
      console.log('🔇 Audio energy too low for transcription:', energy);
    }
  }

  cleanup() {
    this.stopTranscription();
    this.audioCapture.cleanup();
  }

  // Setters for callbacks
  setOnTranscriptionChunk(callback: (chunk: RealtimeChunk) => void) {
    this.onTranscriptionChunk = callback;
  }

  setOnError(callback: (error: Error) => void) {
    this.onError = callback;
  }

  setOnAudioLevel(callback: (level: number) => void) {
    this.audioCapture.setOnAudioLevel(callback);
  }

  // Getters
  getIsTranscribing(): boolean {
    return this.isTranscribing;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  async checkMicrophonePermission(): Promise<PermissionState> {
    return await this.audioCapture.getPermissionState();
  }
}
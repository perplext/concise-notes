import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { useToast } from '../hooks/useToast';
import {
  MicrophoneIcon,
  PlayIcon,
  StopIcon,
  SpeakerWaveIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig, RealtimeChunk } from '../lib/types';
// Removed RealTimeTranscriptionManager - using record-then-transcribe approach

interface RealtimePageProps {
  config: AppConfig;
}

interface TranscriptionChunk {
  id: string;
  timestamp: string;
  speaker?: string;
  text: string;
  confidence?: number;
  energy?: number;
}

function RealtimePage({ config }: RealtimePageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionChunks, setTranscriptionChunks] = useState<TranscriptionChunk[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [microphoneStatus, setMicrophoneStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionTimer = useRef<NodeJS.Timeout | null>(null);
  const transcriptionScrollRef = useRef<HTMLDivElement>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);

  // Initialize microphone access
  useEffect(() => {
    const initializeMicrophone = async () => {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000
          } 
        });
        
        // Stop the stream immediately - we just wanted to check permission
        stream.getTracks().forEach(track => track.stop());
        
        setMicrophoneStatus('connected');
        setError(null);
      } catch (err) {
        console.error('Microphone access error:', err);
        setMicrophoneStatus('error');
        setError('Microphone permission denied. Please allow microphone access.');
      }
    };
    
    initializeMicrophone();
    
    // Cleanup on unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
    };
  }, []);
  
  // Session timer
  useEffect(() => {
    if (isRecording) {
      sessionTimer.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
        sessionTimer.current = null;
      }
    }
    
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
    };
  }, [isRecording]);

  // Auto-scroll to bottom when new transcription chunks are added
  useEffect(() => {
    if (transcriptionScrollRef.current) {
      transcriptionScrollRef.current.scrollTop = transcriptionScrollRef.current.scrollHeight;
    }
  }, [transcriptionChunks]);

  const handleStartRecording = async () => {
    console.log('🎬 Start recording button clicked!');
    
    try {
      setError(null);
      setIsProcessing(true);
      
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Set up audio level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      audioLevelIntervalRef.current = window.setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
        }
      }, 100);
      
      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Generate session ID
      const newSessionId = `record_${Date.now()}`;
      setSessionId(newSessionId);
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      
      setIsRecording(true);
      setIsProcessing(false);
      setTranscriptionChunks([]);
      setSessionDuration(0);
      
      console.log('✅ Started recording session:', newSessionId);
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setError('Failed to start recording: ' + (error as Error).message);
      setIsProcessing(false);
      
      // Cleanup on error
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const handleStopRecording = async () => {
    console.log('🛑 Stop recording button clicked!');
    
    if (!mediaRecorderRef.current) {
      console.error('❌ No media recorder available');
      return;
    }
    
    try {
      setError(null);
      setIsProcessing(true);
      setIsRecording(false);
      
      // Stop audio level monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      setAudioLevel(0);
      
      // Stop recording and wait for final data
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
        
        // Stop all tracks
        mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
      });
      
      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log(`📦 Recorded audio blob: ${audioBlob.size} bytes`);
      
      // Check if we're in Electron and can use native Whisper
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.isElectron) {
        console.log('🖥️ Using Electron native Whisper for transcription');
        
        // Convert blob to ArrayBuffer for Electron
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // Send to Electron for transcription
        const result = await electronAPI.transcribeAudioBuffer(arrayBuffer, {
          modelSize: config.model.default_size,
          language: config.realtime.default_language
        });
        
        if (result.success) {
          // Extract text from result - handle different formats
          let transcribedText = '';
          
          if (typeof result.text === 'string') {
            transcribedText = result.text;
          } else if (Array.isArray(result.text)) {
            // Result is an array of segments
            transcribedText = result.text
              .map((segment: any) => typeof segment === 'string' ? segment : segment.text || '')
              .join(' ')
              .trim();
          } else if (result.segments && Array.isArray(result.segments)) {
            // Use segments array
            transcribedText = result.segments
              .map((segment: any) => segment.text || '')
              .join(' ')
              .trim();
          }
          
          if (transcribedText) {
            // Add transcription as a single chunk
            const newChunk: TranscriptionChunk = {
              id: `${Date.now()}_${Math.random()}`,
              timestamp: new Date().toLocaleTimeString(),
              text: transcribedText,
              confidence: 0.95
            };
            setTranscriptionChunks([newChunk]);
            console.log('✅ Transcription complete:', transcribedText.substring(0, 100) + '...');
          } else {
            throw new Error('No transcription text received');
          }
        } else {
          throw new Error(result.error || 'Transcription failed');
        }
      } else {
        // Fallback for browser - use Web Speech API or show error
        console.log('🌐 Browser mode - native transcription not available');
        setError('Native transcription only available in desktop app. Please use the Electron app for full functionality.');
      }
      
      setIsProcessing(false);
      setSessionId(null);
      console.log('✅ Recording and transcription complete');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      setError('Failed to process recording: ' + (error as Error).message);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handleSaveSession = async () => {
    if (transcriptionChunks.length === 0) return;
    
    try {
      const sessionData = {
        timestamp: new Date().toISOString(),
        duration: formatDuration(sessionDuration),
        chunks: transcriptionChunks,
        totalWords: transcriptionChunks.reduce((acc, chunk) => {
          const text = chunk.text || '';
          return acc + (typeof text === 'string' ? text.split(' ').length : 0);
        }, 0),
        sessionId: sessionId
      };
      
      // Create downloadable transcript
      const transcript = transcriptionChunks
        .map(chunk => {
          const speakerLabel = chunk.speaker ? `[${chunk.speaker}] ` : '';
          const confidence = chunk.confidence ? ` (${Math.round(chunk.confidence * 100)}%)` : '';
          return `${chunk.timestamp} - ${speakerLabel}${chunk.text}${confidence}`;
        })
        .join('\n');
      
      const fullTranscript = `Real-time Transcription Session\n` +
        `Date: ${new Date().toLocaleString()}\n` +
        `Duration: ${formatDuration(sessionDuration)}\n` +
        `Total Segments: ${transcriptionChunks.length}\n` +
        `Total Words: ${sessionData.totalWords}\n` +
        `Session ID: ${sessionId || 'N/A'}\n` +
        `\n--- TRANSCRIPT ---\n\n` +
        transcript;
      
      // Download as text file
      const blob = new Blob([fullTranscript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `realtime-transcript-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
      setError('Failed to save session');
    }
  };

  const handleClearSession = () => {
    if (isRecording) {
      setError('Cannot clear session while recording is active');
      return;
    }
    
    setTranscriptionChunks([]);
    setSessionDuration(0);
    setError(null);
    console.log('Session cleared');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioLevelColor = (level: number) => {
    if (level > 70) return 'bg-red-500';
    if (level > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Real-time Transcription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Live transcription from your microphone with speaker identification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recording Controls */}
            <div className="card">
              <div className="card-body text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Recording Controls
                </h2>
                
                {/* Microphone Visualization */}
                <div className="relative mb-6">
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-100 dark:bg-red-900/30 border-4 border-red-300 dark:border-red-700' 
                      : 'bg-gray-100 dark:bg-gray-700 border-4 border-gray-300 dark:border-gray-600'
                  }`}>
                    <MicrophoneIcon className={`w-12 h-12 ${
                      isRecording ? 'text-red-600' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  {isRecording && (
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-red-400 animate-ping" />
                  )}
                </div>

                {/* Audio Level Meter */}
                {isRecording && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Audio Level</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-100 ${getAudioLevelColor(audioLevel)}`}
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Session Timer */}
                <div className="mb-6">
                  <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                    {formatDuration(sessionDuration)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Session Duration</p>
                </div>

                {/* Record Button */}
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={microphoneStatus !== 'connected' && !isRecording}
                  className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <StopIcon className="w-5 h-5" />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Settings
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model Size
                    </label>
                    <select className="form-select" defaultValue={config.model.default_size}>
                      <option value="tiny">Tiny (Fastest)</option>
                      <option value="base">Base (Recommended)</option>
                      <option value="small">Small (Better Quality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      VAD Threshold
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      defaultValue={config.realtime.vad_threshold}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Sensitive</span>
                      <span>Conservative</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="realtime-gpu"
                      className="form-checkbox"
                      defaultChecked={config.model.use_gpu}
                    />
                    <label htmlFor="realtime-gpu" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      GPU acceleration
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Status
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Microphone</span>
                    <span className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        microphoneStatus === 'connected' ? 'bg-green-500' : 
                        microphoneStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-sm ${
                        microphoneStatus === 'connected' ? 'text-green-600' : 
                        microphoneStatus === 'error' ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {microphoneStatus === 'connected' ? 'Connected' : 
                         microphoneStatus === 'error' ? 'Error' : 'Disconnected'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Model</span>
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Loaded</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                    <span className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-sm ${isProcessing ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isProcessing ? 'Active' : 'Idle'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Transcription */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card h-[600px] flex flex-col">
              <div className="card-body flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Live Transcription
                  </h2>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveSession}
                      disabled={transcriptionChunks.length === 0}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
                      startContent={<DocumentTextIcon className="w-4 h-4" />}
                    >
                      Save Session
                    </Button>
                    <Button
                      onClick={handleClearSession}
                      disabled={transcriptionChunks.length === 0}
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div 
                  ref={transcriptionScrollRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-full"
                >
                  <div className="space-y-3">
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h4>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                          {error.includes('permission') && (
                            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                              <p>To fix this:</p>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Click the microphone icon in your browser's address bar</li>
                                <li>Select "Allow" for microphone access</li>
                                <li>Refresh the page and try again</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {transcriptionChunks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {microphoneStatus === 'error' ? (
                        <div className="space-y-2">
                          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400" />
                          <p>Microphone access required</p>
                          <p className="text-sm">Please allow microphone permissions to continue</p>
                        </div>
                      ) : isRecording ? (
                        <div className="space-y-2">
                          <SpeakerWaveIcon className="w-12 h-12 mx-auto opacity-50" />
                          <p>Recording audio...</p>
                          <p className="text-sm">
                            Click "Stop Recording" to transcribe
                          </p>
                          {sessionId && (
                            <p className="text-xs text-primary-600 dark:text-primary-400">
                              Session: {sessionId.substring(0, 8)}...
                              {sessionId?.startsWith('browser_') && (
                                <span className="ml-2 text-green-600 dark:text-green-400">🌐 Browser Mode</span>
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <MicrophoneIcon className="w-12 h-12 mx-auto opacity-50" />
                          <p>Transcription will appear here</p>
                          <p className="text-sm">Click "Start Recording" to begin</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    transcriptionChunks.map((chunk) => (
                      <motion.div
                        key={chunk.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {chunk.timestamp}
                            </span>
                            {chunk.speaker && (
                              <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                                {chunk.speaker}
                              </span>
                            )}
                          </div>
                          {chunk.confidence && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(chunk.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-white">
                          {chunk.text}
                        </p>
                      </motion.div>
                    ))
                  )}
                  </div>
                </div>

                {/* Session Statistics */}
                {transcriptionChunks.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Segments: {transcriptionChunks.length}</span>
                      <span>Duration: {formatDuration(sessionDuration)}</span>
                      <span>Words: {transcriptionChunks.reduce((acc, chunk) => {
                        const text = chunk.text || '';
                        return acc + (typeof text === 'string' ? text.split(' ').length : 0);
                      }, 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default RealtimePage;
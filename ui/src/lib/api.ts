import type {
  AppConfig,
  TranscriptionJob,
  ModelInfo,
  ProgressUpdate,
  FileInfo,
  BatchProcessingOptions,
  RealtimeTranscriptionOptions,
  RealtimeChunk,
  ModelSize,
  OutputFormat
} from './types';

// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI_IPC__' in window;

// Lazy import Tauri APIs only when needed
let tauriAPI: any = null;
const getTauriAPI = async () => {
  if (!isTauri) {
    throw new Error('Tauri APIs not available in browser environment');
  }
  
  if (!tauriAPI) {
    tauriAPI = await import('@tauri-apps/api/tauri');
  }
  return tauriAPI;
};

// Helper function to safely invoke Tauri commands with fallbacks
const safeInvoke = async (command: string, args?: any): Promise<any> => {
  if (isTauri) {
    const api = await getTauriAPI();
    return api.invoke(command, args);
  }
  
  // Browser fallback - return mock data
  return getMockData(command, args);
};

// Mock data for browser environment
const getMockData = (command: string, args?: any): any => {
  switch (command) {
    case 'get_config':
      return {
        model: {
          default_size: 'Base',
          models_directory: './models',
          use_gpu: false,
          auto_download: true,
        },
        output: {
          default_format: 'Text',
          timestamps: false,
          skip_existing: true,
          naming_pattern: '{filename}_{timestamp}',
        },
        realtime: {
          vad_threshold: 0.01,
          enable_diarization: false,
        },
        batch: {
          max_concurrent: 2,
          enable_diarization: false,
        },
        diarization: {
          enabled: false,
          min_speakers: 1,
          max_speakers: 10,
        },
        logging: {
          level: 'info',
          colored: true,
        },
        post_processing: {
          enabled: true,
          text_formatting: {
            enabled: true,
            model: 'phi3.5',
            add_paragraphs: true,
            fix_punctuation: true,
            improve_readability: true,
          },
          summarization: {
            enabled: false,
            model: 'llama3.2',
            format: 'key_points',
            max_length: 500,
            include_key_points: true,
            extract_action_items: true,
            focus_on_insights: true,
          },
        },
      } as AppConfig;
    
    case 'list_models':
      return [
        {
          size: 'Tiny',
          filename: 'ggml-tiny.bin',
          size_mb: 39,
          downloaded: true,
        },
        {
          size: 'Base',
          filename: 'ggml-base.bin',
          size_mb: 142,
          downloaded: true,
        },
        {
          size: 'Small',
          filename: 'ggml-small.bin',
          size_mb: 466,
          downloaded: false,
        },
      ] as ModelInfo[];
    
    case 'get_system_info':
      // Simulate different GPU availability for testing
      const hasGPU = Math.random() > 0.5; // 50% chance of having GPU in browser demo
      return {
        platform: 'browser',
        arch: 'x86_64',
        gpu_available: hasGPU,
        gpu_type: hasGPU ? 'Simulated GPU' : null,
      };
    
    case 'set_config':
    case 'reset_config':
    case 'validate_config':
    case 'download_model':
    case 'transcribe_file':
      return Promise.resolve();
    
    case 'check_model_exists':
      return true;
    
    case 'get_config_path':
      return '~/.config/concise-note-taker/config.toml';
    
    default:
      console.warn(`Mock data not available for command: ${command}`);
      return Promise.resolve();
  }
};

// Configuration API
export const configApi = {
  async getConfig(): Promise<AppConfig> {
    return safeInvoke('get_config');
  },

  async setConfig(config: AppConfig): Promise<void> {
    return safeInvoke('set_config', { config });
  },

  async resetConfig(): Promise<void> {
    return safeInvoke('reset_config');
  },

  async validateConfig(config: AppConfig): Promise<boolean> {
    return safeInvoke('validate_config', { config });
  },

  async getConfigPath(): Promise<string> {
    return safeInvoke('get_config_path');
  }
};

// Model management API
export const modelApi = {
  async listModels(): Promise<ModelInfo[]> {
    return safeInvoke('list_models');
  },

  async downloadModel(modelSize: ModelSize): Promise<void> {
    return safeInvoke('download_model', { modelSize });
  },

  async checkModelExists(modelSize: ModelSize): Promise<boolean> {
    return safeInvoke('check_model_exists', { modelSize });
  },

  async getModelPath(modelSize: ModelSize): Promise<string> {
    return safeInvoke('get_model_path', { modelSize });
  }
};

// File operations API
export const fileApi = {
  async selectFiles(): Promise<string[]> {
    if (isTauri) {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Media Files',
          extensions: ['mp4', 'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'avi', 'mkv', 'webm', 'mov']
        }]
      });
      
      if (selected === null) {
        return [];
      }
      
      return Array.isArray(selected) ? selected : [selected];
    }
    
    // Browser fallback - return mock file paths
    return ['/mock/path/sample_audio.mp3', '/mock/path/sample_video.mp4'];
  },

  async selectDirectory(): Promise<string | null> {
    if (isTauri) {
      const { open } = await import('@tauri-apps/api/dialog');
      return open({ directory: true }) as Promise<string | null>;
    }
    
    // Browser fallback
    return '/mock/path/recordings';
  },

  async selectSaveLocation(defaultName?: string): Promise<string | null> {
    if (isTauri) {
      const { save } = await import('@tauri-apps/api/dialog');
      return save({
        defaultPath: defaultName,
        filters: [{
          name: 'Text Files',
          extensions: ['txt', 'json', 'srt', 'vtt']
        }]
      });
    }
    
    // Browser fallback
    return `/mock/path/${defaultName || 'transcript.txt'}`;
  },

  async getFileInfo(path: string): Promise<FileInfo> {
    return safeInvoke('get_file_info', { path });
  },

  async scanDirectory(path: string, patterns: string[]): Promise<FileInfo[]> {
    return safeInvoke('scan_directory', { path, patterns });
  },

  async readFile(path: string): Promise<string> {
    if (isTauri) {
      const { readTextFile } = await import('@tauri-apps/api/fs');
      return readTextFile(path);
    }
    
    // Browser fallback
    return 'Mock file content';
  },

  async writeFile(path: string, content: string): Promise<void> {
    if (isTauri) {
      const { writeTextFile } = await import('@tauri-apps/api/fs');
      return writeTextFile(path, content);
    }
    
    // Browser fallback - just log
    console.log(`Mock write to ${path}:`, content);
  }
};

// Transcription API
export const transcriptionApi = {
  async transcribeFile(
    inputPath: string,
    outputPath?: string,
    modelSize: ModelSize = 'Base',
    format: OutputFormat = 'Text',
    language?: string,
    timestamps: boolean = false,
    gpu: boolean = false,
    diarization: boolean = false
  ): Promise<string> {
    return safeInvoke('transcribe_file', {
      inputPath,
      outputPath,
      modelSize,
      format,
      language,
      timestamps,
      gpu,
      diarization
    });
  },

  async batchProcess(options: BatchProcessingOptions): Promise<string> {
    return safeInvoke('batch_process', { options });
  },

  async cancelJob(jobId: string): Promise<void> {
    return safeInvoke('cancel_job', { jobId });
  },

  async getJobStatus(jobId: string): Promise<TranscriptionJob> {
    return safeInvoke('get_job_status', { jobId });
  },

  async listActiveJobs(): Promise<TranscriptionJob[]> {
    return safeInvoke('list_active_jobs');
  }
};

// Real-time transcription API
export const realtimeApi = {
  async startRealtime(options: RealtimeTranscriptionOptions): Promise<string> {
    return safeInvoke('start_realtime_transcription', { options });
  },

  async stopRealtime(sessionId: string): Promise<void> {
    return safeInvoke('stop_realtime_transcription', { sessionId });
  },

  async getRealTimeStatus(sessionId: string): Promise<any> {
    return safeInvoke('get_realtime_status', { sessionId });
  },

  async processRealtimeAudio(sessionId: string, audioData: number[]): Promise<void> {
    return safeInvoke('process_realtime_audio', { sessionId, audioData });
  },

  async listRealtimeSessions(): Promise<string[]> {
    return safeInvoke('list_realtime_sessions');
  }
};

// Event listeners
export const eventApi = {
  async onProgressUpdate(callback: (update: ProgressUpdate) => void) {
    if (isTauri) {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<ProgressUpdate>('progress-update', (event) => {
        callback(event.payload);
      });
    }
    
    // Browser fallback - return a dummy unsubscribe function
    return () => {};
  },

  async onJobComplete(callback: (job: TranscriptionJob) => void) {
    if (isTauri) {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<TranscriptionJob>('job-complete', (event) => {
        callback(event.payload);
      });
    }
    
    return () => {};
  },

  async onRealtimeChunk(callback: (chunk: RealtimeChunk) => void) {
    if (isTauri) {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<RealtimeChunk>('realtime-chunk', (event) => {
        callback(event.payload);
      });
    }
    
    return () => {};
  },

  async onModelDownloadProgress(callback: (progress: { model: ModelSize; progress: number }) => void) {
    if (isTauri) {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<{ model: ModelSize; progress: number }>('model-download-progress', (event) => {
        callback(event.payload);
      });
    }
    
    return () => {};
  },

  async onError(callback: (error: { message: string; details?: any }) => void) {
    if (isTauri) {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<{ message: string; details?: any }>('error', (event) => {
        callback(event.payload);
      });
    }
    
    return () => {};
  }
};

// System information API
export const systemApi = {
  async getSystemInfo(): Promise<{
    platform: string;
    arch: string;
    gpu_available: boolean;
    gpu_type?: string;
  }> {
    return safeInvoke('get_system_info');
  },

  async checkDependencies(): Promise<{
    ffmpeg: boolean;
    models_dir: boolean;
    config_file: boolean;
  }> {
    return safeInvoke('check_dependencies');
  },

  async openInExplorer(path: string): Promise<void> {
    return safeInvoke('open_in_explorer', { path });
  },

  async openUrl(url: string): Promise<void> {
    return safeInvoke('open_url', { url });
  }
};

// Utility functions for the API
export function createProgressListener(
  onProgress: (update: ProgressUpdate) => void,
  onComplete?: (job: TranscriptionJob) => void,
  onError?: (error: any) => void
) {
  const unsubscribers: (() => void)[] = [];

  // Set up progress listener
  eventApi.onProgressUpdate(onProgress).then((unsubscribe) => {
    unsubscribers.push(unsubscribe);
  });

  // Set up completion listener
  if (onComplete) {
    eventApi.onJobComplete(onComplete).then((unsubscribe) => {
      unsubscribers.push(unsubscribe);
    });
  }

  // Set up error listener
  if (onError) {
    eventApi.onError(onError).then((unsubscribe) => {
      unsubscribers.push(unsubscribe);
    });
  }

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}
export interface ElectronAPI {
  // File operations
  selectFile: () => Promise<string | null>;
  selectDirectory: () => Promise<string | null>;
  saveFile: (defaultName: string) => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  
  // Model operations
  listModels: () => Promise<Record<string, ModelInfo>>;
  loadModel: (modelSize: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  downloadModel: (modelSize: string) => Promise<{ success: boolean; message: string; modelPath: string }>;
  
  // Transcription
  transcribeFile: (filePath: string, options?: TranscriptionOptions) => Promise<TranscriptionResult>;
  transcribeRealtime: (audioBuffer: ArrayBuffer) => Promise<RealtimeTranscriptionResult>;
  
  // System info
  isElectron: boolean;
  platform: string;
  getSystemInfo: () => Promise<SystemInfo>;
  getSystemResources: () => Promise<SystemResources>;
  getFileInfo: (filePath: string) => Promise<FileInfo | null>;
  scanDirectory: (dirPath: string) => Promise<MediaFile[]>;
  
  // Events
  onProgress: (callback: (progress: TranscriptionProgress) => void) => () => void;
  removeAllListeners: (channel: string) => void;
}

export interface ModelInfo {
  name: string;
  filename: string;
  path: string;
  exists: boolean;
  size: number;
  sizeFormatted: string;
}

export interface TranscriptionOptions {
  modelSize?: string;
  language?: string;
  timestamps?: boolean;
  translate?: boolean;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  segments?: TranscriptionSegment[];
  language?: string;
  duration?: number;
  error?: string;
}

export interface RealtimeTranscriptionResult {
  success: boolean;
  text?: string;
  confidence?: number;
  isFinal?: boolean;
  error?: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionProgress {
  stage: 'processing' | 'complete' | 'error';
  message: string;
  progress?: number;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  whisperInitialized: boolean;
  modelsPath: string;
}

export interface SystemResources {
  cpuUsage: number;
  memoryUsage: number;
  loadAverage: number;
  totalMemory: number;
  freeMemory: number;
  cpuCount: number;
}

export interface FileInfo {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  modifiedTime: Date;
  createdTime: Date;
}

export interface MediaFile {
  path: string;
  name: string;
  size: number;
  extension: string;
  modifiedTime: Date;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
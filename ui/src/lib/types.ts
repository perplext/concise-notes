export interface ModelConfig {
  default_size: ModelSize;
  models_directory: string;
  use_gpu: boolean;
  auto_download: boolean;
}

export interface OutputConfig {
  default_format: OutputFormat;
  output_directory?: string;
  timestamps: boolean;
  naming_pattern: string;
  skip_existing: boolean;
}

export interface RealtimeConfig {
  default_language?: string;
  vad_threshold: number;
  min_silence_duration_ms: number;
  max_chunk_duration_ms: number;
  buffer_duration_ms: number;
  sample_rate: number;
  enable_diarization: boolean;
  auto_save_sessions: boolean;
  sessions_directory?: string;
}

export interface BatchConfig {
  max_concurrent: number;
  default_language?: string;
  enable_diarization: boolean;
  generate_reports: boolean;
  reports_directory?: string;
  file_patterns: string[];
}

export interface DiarizationConfig {
  enabled: boolean;
  vad_threshold: number;
  min_segment_duration_ms: number;
  change_sensitivity: number;
}

export interface LoggingConfig {
  level: string;
  colored: boolean;
  log_to_file: boolean;
  log_file?: string;
  show_timestamps: boolean;
}

export interface AppConfig {
  model: ModelConfig;
  output: OutputConfig;
  realtime: RealtimeConfig;
  batch: BatchConfig;
  diarization: DiarizationConfig;
  logging: LoggingConfig;
  post_processing: PostProcessingConfig;
}

export type ModelSize = 
  | 'Tiny' 
  | 'Base' 
  | 'Small' 
  | 'Medium' 
  | 'Large' 
  | 'LargeV2' 
  | 'LargeV3';

export type OutputFormat = 'Text' | 'Json' | 'Srt' | 'Vtt';

export interface TranscriptionJob {
  id: string;
  input_path: string;
  output_path?: string;
  model_size: ModelSize;
  format: OutputFormat;
  language?: string;
  timestamps: boolean;
  gpu: boolean;
  diarization: boolean;
  status: JobStatus;
  progress: number;
  start_time?: string;
  end_time?: string;
  duration?: number;
  error?: string;
  result?: TranscriptionResult;
}

export type JobStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language?: string;
  duration: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface ModelInfo {
  size: ModelSize;
  filename: string;
  size_mb: number;
  downloaded: boolean;
  download_url?: string;
}

export interface ProgressUpdate {
  job_id: string;
  progress: number;
  status: JobStatus;
  message?: string;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  duration?: number;
}

export interface BatchProcessingOptions {
  files: FileInfo[];
  output_directory?: string;
  model_size: ModelSize;
  format: OutputFormat;
  language?: string;
  timestamps: boolean;
  gpu: boolean;
  diarization: boolean;
  max_concurrent: number;
  skip_existing: boolean;
}

export interface RealtimeTranscriptionOptions {
  model_size: ModelSize;
  language?: string;
  gpu: boolean;
  diarization: boolean;
  vad_threshold: number;
  min_silence_ms: number;
  max_chunk_ms: number;
  output_file?: string;
}

export interface RealtimeChunk {
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
  is_final: boolean;
  speaker?: string;
}

export interface ModelRecommendation {
  recommended_model: ModelSize;
  reason: string;
  confidence: number;
  alternatives?: {
    model: ModelSize;
    reason: string;
  }[];
}

export interface GPURecommendation {
  should_use_gpu: boolean;
  reason: string;
  estimated_speedup?: string;
  requirements?: string[];
}

export interface OptimizationSuggestion {
  type: 'model' | 'gpu' | 'format' | 'settings';
  title: string;
  description: string;
  action?: () => void;
  severity: 'info' | 'warning' | 'suggestion';
}

export type PostProcessingModel = 'llama3.2' | 'phi3.5' | 'qwen2.5' | 'gemma2';

export type SummaryFormat = 'paragraphs' | 'bullets' | 'markdown' | 'key_points' | 'outline';

export interface PostProcessingConfig {
  enabled: boolean;
  text_formatting: {
    enabled: boolean;
    model: PostProcessingModel;
    add_paragraphs: boolean;
    fix_punctuation: boolean;
    improve_readability: boolean;
  };
  summarization: {
    enabled: boolean;
    model: PostProcessingModel;
    format: SummaryFormat;
    max_length: number;
    include_key_points: boolean;
    extract_action_items: boolean;
    focus_on_insights: boolean;
  };
}

export interface ProcessedTranscript {
  original_text: string;
  formatted_text?: string;
  summary?: {
    content: string;
    format: SummaryFormat;
    key_points?: string[];
    action_items?: string[];
    insights?: string[];
  };
  processing_time: number;
  models_used: {
    formatting?: PostProcessingModel;
    summarization?: PostProcessingModel;
  };
}
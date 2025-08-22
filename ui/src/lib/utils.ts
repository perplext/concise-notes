import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getFileNameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

export function isVideoFile(filename: string): boolean {
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'];
  return videoExts.includes(getFileExtension(filename));
}

export function isAudioFile(filename: string): boolean {
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff'];
  return audioExts.includes(getFileExtension(filename));
}

export function isMediaFile(filename: string): boolean {
  return isVideoFile(filename) || isAudioFile(filename);
}

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function validateVadThreshold(value: number): boolean {
  return value >= 0 && value <= 1;
}

export function validateConcurrency(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 16;
}

export function validateSampleRate(value: number): boolean {
  const validRates = [8000, 16000, 22050, 44100, 48000];
  return validRates.includes(value);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  } finally {
    document.body.removeChild(textArea);
  }
}

export const SUPPORTED_FILE_TYPES = {
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'],
  audio: ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma', '.aiff']
};

export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_FILE_TYPES.video,
  ...SUPPORTED_FILE_TYPES.audio
];

export const MODEL_SIZES = [
  { value: 'Tiny', label: 'Tiny (39MB)', description: 'Fastest, least accurate' },
  { value: 'Base', label: 'Base (142MB)', description: 'Good balance of speed and accuracy' },
  { value: 'Small', label: 'Small (466MB)', description: 'Better accuracy, slower' },
  { value: 'Medium', label: 'Medium (1.5GB)', description: 'High accuracy, much slower' },
  { value: 'Large', label: 'Large (3GB)', description: 'Highest accuracy, very slow' },
  { value: 'LargeV2', label: 'Large V2 (3GB)', description: 'Improved large model' },
  { value: 'LargeV3', label: 'Large V3 (3GB)', description: 'Latest and most accurate' }
] as const;

export const OUTPUT_FORMATS = [
  { value: 'Text', label: 'Text (.txt)', description: 'Plain text output' },
  { value: 'Json', label: 'JSON (.json)', description: 'Structured data with timestamps' },
  { value: 'Srt', label: 'SubRip (.srt)', description: 'Subtitle format' },
  { value: 'Vtt', label: 'WebVTT (.vtt)', description: 'Web subtitle format' }
] as const;
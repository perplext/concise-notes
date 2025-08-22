import { useToast } from '../hooks/useToast';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class TranscriptionError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, true);
    this.name = 'TranscriptionError';
  }
}

export class FileError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, true);
    this.name = 'FileError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, true);
    this.name = 'NetworkError';
  }
}

export class ModelError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, false);
    this.name = 'ModelError';
  }
}

/**
 * Handles errors consistently across the app
 */
export function handleError(error: unknown, context?: string): string {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.message.includes('permission') || error.message.includes('access')) {
      return 'Permission denied. Please check file/folder permissions.';
    }
    
    if (error.message.includes('memory') || error.message.includes('heap')) {
      return 'Out of memory. Try processing smaller files or closing other applications.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Operation timed out. The file may be too large or the system may be busy.';
    }
    
    if (error.message.includes('model')) {
      return 'Model error. Please check that the model is properly loaded.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Hook for error handling with toast notifications
 */
export function useErrorHandler() {
  const { showToast } = useToast();
  
  const handleErrorWithToast = (error: unknown, context?: string) => {
    const message = handleError(error, context);
    
    // Determine severity
    if (error instanceof AppError && !error.recoverable) {
      showToast('error', 'Critical Error', message, 0); // No auto-dismiss for critical errors
    } else if (error instanceof NetworkError) {
      showToast('warning', 'Network Issue', message, 7000);
    } else {
      showToast('error', 'Error', message, 5000);
    }
    
    return message;
  };
  
  return { handleError: handleErrorWithToast };
}

/**
 * Retry logic for flaky operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry non-recoverable errors
      if (error instanceof AppError && !error.recoverable) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}
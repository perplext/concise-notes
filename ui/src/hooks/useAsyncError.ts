import { useCallback } from 'react';

/**
 * Hook to handle async errors that would otherwise be swallowed
 * Throws them so they can be caught by error boundaries
 */
export function useAsyncError() {
  const [, setError] = useState();

  return useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}

/**
 * Wraps an async function to handle errors properly
 */
export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  deps: React.DependencyList
) {
  const throwError = useAsyncError();

  return useCallback(
    async (...args: Parameters<T>) => {
      try {
        return await callback(...args);
      } catch (error) {
        console.error('Async operation failed:', error);
        if (error instanceof Error) {
          throwError(error);
        } else {
          throwError(new Error(String(error)));
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, throwError]
  ) as T;
}

import { useState } from 'react';

/**
 * Safe async state management with error handling
 */
export function useSafeAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (promise: Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await promise;
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}
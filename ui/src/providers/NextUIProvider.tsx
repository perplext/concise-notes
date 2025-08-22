import React from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ToastProvider } from '../hooks/useToast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextUIProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </NextUIProvider>
  );
}
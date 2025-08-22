import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import electronService from '../services/electronService';

interface ShortcutHandler {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[] = []) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Determine if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const modifierKey = navigator.platform.includes('Mac') ? event.metaKey : event.ctrlKey;

      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesModifier = shortcut.ctrlOrCmd ? modifierKey : true;
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;

        if (matchesKey && matchesModifier && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global keyboard shortcuts that work across the entire app
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  // Listen for menu actions from Electron
  useEffect(() => {
    const unsubscribe = electronService.onMenuAction((action: string) => {
      switch (action) {
        case 'open-file':
        case 'new-transcription':
        case 'navigate-transcribe':
          navigate('/transcribe');
          // Trigger file selection for open-file
          if (action === 'open-file') {
            setTimeout(() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }, 100);
          }
          break;
        case 'navigate-home':
          navigate('/');
          break;
        case 'navigate-batch':
          navigate('/batch');
          break;
        case 'navigate-realtime':
          navigate('/realtime');
          break;
        case 'navigate-models':
          navigate('/models');
          break;
        case 'navigate-settings':
          navigate('/config');
          break;
        case 'save-transcription':
          // Trigger save in transcribe page
          const saveButton = document.querySelector('[data-action="save"]') as HTMLButtonElement;
          if (saveButton) saveButton.click();
          break;
        case 'show-shortcuts':
          showKeyboardShortcutsHelp();
          break;
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  const globalShortcuts: ShortcutHandler[] = [
    {
      key: 'o',
      ctrlOrCmd: true,
      handler: () => {
        // Open file - navigate to transcribe page
        navigate('/transcribe');
        // Trigger file selection after navigation
        setTimeout(() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.click();
        }, 100);
      },
      description: 'Open file for transcription'
    },
    {
      key: 'n',
      ctrlOrCmd: true,
      handler: () => navigate('/transcribe'),
      description: 'New transcription'
    },
    {
      key: 'b',
      ctrlOrCmd: true,
      handler: () => navigate('/batch'),
      description: 'Batch processing'
    },
    {
      key: 'r',
      ctrlOrCmd: true,
      handler: () => navigate('/realtime'),
      description: 'Real-time mode'
    },
    {
      key: 'm',
      ctrlOrCmd: true,
      handler: () => navigate('/models'),
      description: 'Model management'
    },
    {
      key: ',',
      ctrlOrCmd: true,
      handler: () => navigate('/config'),
      description: 'Settings'
    },
    {
      key: 'h',
      ctrlOrCmd: true,
      shift: true,
      handler: () => navigate('/'),
      description: 'Go to home'
    },
    {
      key: '?',
      handler: () => {
        // Show keyboard shortcuts help
        showKeyboardShortcutsHelp();
      },
      description: 'Show keyboard shortcuts'
    }
  ];

  useKeyboardShortcuts(globalShortcuts);
}

// Page-specific keyboard shortcuts for the transcribe page
export function useTranscribeKeyboardShortcuts(
  onSave?: () => void,
  onStartTranscription?: () => void,
  isTranscribing?: boolean
) {
  const shortcuts: ShortcutHandler[] = [
    {
      key: 's',
      ctrlOrCmd: true,
      handler: () => {
        if (onSave) {
          onSave();
        }
      },
      description: 'Save transcription'
    },
    {
      key: 'Enter',
      ctrlOrCmd: true,
      handler: () => {
        if (onStartTranscription && !isTranscribing) {
          onStartTranscription();
        }
      },
      description: 'Start transcription'
    },
    {
      key: 'Escape',
      handler: () => {
        // Cancel current operation if any
        const cancelButton = document.querySelector('[data-action="cancel"]') as HTMLButtonElement;
        if (cancelButton) cancelButton.click();
      },
      description: 'Cancel operation'
    }
  ];

  useKeyboardShortcuts(shortcuts);
}

// Show keyboard shortcuts help modal
function showKeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: 'Ctrl/Cmd + O', description: 'Open file' },
    { keys: 'Ctrl/Cmd + S', description: 'Save transcription' },
    { keys: 'Ctrl/Cmd + N', description: 'New transcription' },
    { keys: 'Ctrl/Cmd + B', description: 'Batch processing' },
    { keys: 'Ctrl/Cmd + R', description: 'Real-time mode' },
    { keys: 'Ctrl/Cmd + M', description: 'Model management' },
    { keys: 'Ctrl/Cmd + ,', description: 'Settings' },
    { keys: 'Ctrl/Cmd + Shift + H', description: 'Go to home' },
    { keys: 'Ctrl/Cmd + Enter', description: 'Start transcription' },
    { keys: 'Escape', description: 'Cancel operation' },
    { keys: '?', description: 'Show this help' }
  ];

  // Create a simple modal to show shortcuts
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
      <div class="space-y-2">
        ${shortcuts.map(s => `
          <div class="flex justify-between text-sm">
            <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono">
              ${s.keys}
            </kbd>
            <span class="text-gray-600 dark:text-gray-400">${s.description}</span>
          </div>
        `).join('')}
      </div>
      <button class="mt-6 w-full btn-primary" onclick="this.closest('.fixed').remove()">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Close on escape or click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  const closeOnEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', closeOnEscape);
    }
  };
  document.addEventListener('keydown', closeOnEscape);
}

// Export helper to get platform-specific modifier key label
export function getModifierKeyLabel(): string {
  return navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl';
}
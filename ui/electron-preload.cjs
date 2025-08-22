const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (defaultName) => ipcRenderer.invoke('save-file', defaultName),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Model operations
  listModels: () => ipcRenderer.invoke('list-models'),
  loadModel: (modelSize) => ipcRenderer.invoke('load-model', modelSize),
  downloadModel: (modelSize) => ipcRenderer.invoke('download-model', modelSize),
  
  // Transcription
  transcribeFile: (filePath, options) => 
    ipcRenderer.invoke('transcribe-file', filePath, options),
  transcribeRealtime: (audioBuffer) => 
    ipcRenderer.invoke('transcribe-realtime', audioBuffer),
  transcribeAudioBuffer: (audioBuffer, options) =>
    ipcRenderer.invoke('transcribe-audio-buffer', audioBuffer, options),
  
  // System info
  isElectron: true,
  platform: process.platform,
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getSystemResources: () => ipcRenderer.invoke('get-system-resources'),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  scanDirectory: (dirPath) => ipcRenderer.invoke('scan-directory', dirPath),
  
  // Events
  onProgress: (callback) => {
    ipcRenderer.on('transcription-progress', (event, progress) => {
      callback(progress);
    });
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeAllListeners('transcription-progress');
    };
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
import type { ElectronAPI, ModelInfo, TranscriptionOptions, TranscriptionResult } from '../types/electron';

class ElectronService {
  private api: ElectronAPI | undefined;
  
  constructor() {
    this.api = window.electronAPI;
  }
  
  get isElectron(): boolean {
    return !!this.api?.isElectron;
  }
  
  get platform(): string {
    return this.api?.platform || 'web';
  }
  
  async selectFile(): Promise<string | null> {
    if (!this.api) return null;
    return this.api.selectFile();
  }
  
  async selectDirectory(): Promise<string | null> {
    if (!this.api) return null;
    return this.api.selectDirectory();
  }
  
  async saveFile(defaultName: string): Promise<string | null> {
    if (!this.api) return null;
    return this.api.saveFile(defaultName);
  }
  
  async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.writeFile(filePath, content);
    return result.success;
  }
  
  async readFile(filePath: string): Promise<string | null> {
    if (!this.api) return null;
    const result = await this.api.readFile(filePath);
    return result.success ? result.content || null : null;
  }
  
  async listModels(): Promise<Record<string, ModelInfo> | null> {
    if (!this.api) return null;
    return this.api.listModels();
  }
  
  async loadModel(modelSize: string): Promise<boolean> {
    if (!this.api) return false;
    const result = await this.api.loadModel(modelSize);
    if (!result.success && result.error) {
      console.error('Failed to load model:', result.error);
    }
    return result.success;
  }
  
  async downloadModel(modelSize: string): Promise<{ success: boolean; message: string } | null> {
    if (!this.api) return null;
    return this.api.downloadModel(modelSize);
  }
  
  async transcribeFile(filePath: string, options?: TranscriptionOptions): Promise<TranscriptionResult | null> {
    if (!this.api) return null;
    return this.api.transcribeFile(filePath, options);
  }
  
  async transcribeRealtime(audioBuffer: ArrayBuffer): Promise<{ text: string; confidence: number; isFinal: boolean } | null> {
    if (!this.api) return null;
    const result = await this.api.transcribeRealtime(audioBuffer);
    if (result.success && result.text) {
      return {
        text: result.text,
        confidence: result.confidence || 0.9,
        isFinal: result.isFinal || true
      };
    }
    return null;
  }
  
  async getSystemInfo() {
    if (!this.api) return null;
    return this.api.getSystemInfo();
  }
  
  async getSystemResources() {
    if (!this.api) return null;
    return this.api.getSystemResources();
  }
  
  async getFileInfo(filePath: string) {
    if (!this.api) return null;
    return this.api.getFileInfo(filePath);
  }
  
  async scanDirectory(dirPath: string) {
    if (!this.api) return [];
    return this.api.scanDirectory(dirPath);
  }
  
  onProgress(callback: (progress: any) => void): (() => void) | null {
    if (!this.api) return null;
    return this.api.onProgress(callback);
  }

  onMenuAction(callback: (action: string) => void): (() => void) | null {
    if (!this.api) return null;
    // Listen for menu actions from the main process
    const listener = (_event: any, action: string) => {
      callback(action);
    };
    
    if (window.electronAPI?.on) {
      window.electronAPI.on('menu-action', listener);
      
      // Return unsubscribe function
      return () => {
        window.electronAPI.removeListener('menu-action', listener);
      };
    }
    
    return null;
  }
  
  removeAllListeners(channel: string): void {
    if (this.api) {
      this.api.removeAllListeners(channel);
    }
  }
}

// Export singleton instance
export const electronService = new ElectronService();

// Export for use in other services
export default electronService;
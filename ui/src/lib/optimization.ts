import type { 
  ModelSize, 
  ModelRecommendation, 
  GPURecommendation, 
  OptimizationSuggestion,
  FileInfo 
} from './types';

export class OptimizationEngine {
  private static instance: OptimizationEngine;
  
  static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  /**
   * Analyze file characteristics and recommend optimal model size
   */
  analyzeFileForModelRecommendation(file: File): ModelRecommendation {
    const fileSizeMB = file.size / (1024 * 1024);
    const fileName = file.name.toLowerCase();
    const isVideo = fileName.includes('.mp4') || fileName.includes('.avi') || fileName.includes('.mov') || fileName.includes('.mkv');
    
    // Estimate duration based on file size (rough approximation)
    const estimatedDurationMinutes = this.estimateFileDuration(fileSizeMB, isVideo);
    
    let recommendedModel: ModelSize;
    let reason: string;
    let confidence: number;
    let alternatives: { model: ModelSize; reason: string; }[] = [];

    if (estimatedDurationMinutes <= 5) {
      // Short files - prioritize speed
      recommendedModel = 'Base';
      reason = 'Short duration file - Base model provides good balance of speed and accuracy';
      confidence = 0.9;
      alternatives = [
        { model: 'Tiny', reason: 'Even faster processing for quick previews' },
        { model: 'Small', reason: 'Better accuracy for important short content' }
      ];
    } else if (estimatedDurationMinutes <= 30) {
      // Medium files - balance speed and quality
      if (fileSizeMB > 500) {
        recommendedModel = 'Small';
        reason = 'Medium-length, high-quality file - Small model offers better accuracy';
        confidence = 0.85;
      } else {
        recommendedModel = 'Base';
        reason = 'Medium-length file - Base model provides optimal speed/accuracy balance';
        confidence = 0.9;
      }
      alternatives = [
        { model: 'Tiny', reason: 'Faster processing if speed is critical' },
        { model: 'Medium', reason: 'Higher accuracy for professional use' }
      ];
    } else if (estimatedDurationMinutes <= 120) {
      // Long files - prioritize accuracy
      recommendedModel = 'Small';
      reason = 'Long duration file - Small model recommended for better accuracy over time';
      confidence = 0.8;
      alternatives = [
        { model: 'Base', reason: 'Faster processing with acceptable accuracy' },
        { model: 'Medium', reason: 'Highest accuracy for critical transcriptions' }
      ];
    } else {
      // Very long files - suggest smaller models for practicality
      recommendedModel = 'Base';
      reason = 'Very long file - Base model balances processing time with accuracy';
      confidence = 0.75;
      alternatives = [
        { model: 'Tiny', reason: 'Much faster processing for draft transcriptions' },
        { model: 'Small', reason: 'Better accuracy if processing time is not critical' }
      ];
    }

    return {
      recommended_model: recommendedModel,
      reason,
      confidence,
      alternatives
    };
  }

  /**
   * Analyze file and system for GPU recommendations
   */
  analyzeGPURecommendation(file: File, currentGPUSetting: boolean, systemInfo?: any): GPURecommendation {
    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedDurationMinutes = this.estimateFileDuration(fileSizeMB, file.name.includes('.mp4'));
    
    // Check if GPU is available (mock implementation for browser)
    const gpuAvailable = systemInfo?.gpu_available || false;
    const gpuType = systemInfo?.gpu_type;
    
    if (!gpuAvailable) {
      return {
        should_use_gpu: false,
        reason: 'No compatible GPU detected',
        requirements: ['NVIDIA GPU with CUDA support', 'AMD GPU with OpenCL', 'Apple Silicon with Metal']
      };
    }

    if (currentGPUSetting) {
      return {
        should_use_gpu: true,
        reason: 'GPU acceleration already enabled',
        estimated_speedup: this.calculateSpeedupEstimate(estimatedDurationMinutes, gpuType)
      };
    }

    // Recommend GPU for longer files or larger models
    if (estimatedDurationMinutes > 10 || fileSizeMB > 100) {
      return {
        should_use_gpu: true,
        reason: `File duration (~${Math.round(estimatedDurationMinutes)} min) would benefit from GPU acceleration`,
        estimated_speedup: this.calculateSpeedupEstimate(estimatedDurationMinutes, gpuType),
        requirements: ['Compatible GPU with sufficient VRAM (4GB+ recommended)']
      };
    }

    return {
      should_use_gpu: false,
      reason: 'File is small enough that CPU processing will be sufficient',
      estimated_speedup: 'Minimal speedup expected for short files'
    };
  }

  /**
   * Generate comprehensive optimization suggestions
   */
  generateOptimizationSuggestions(
    file: File, 
    currentModel: ModelSize, 
    currentGPU: boolean,
    currentFormat: string,
    systemInfo?: any
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Model optimization
    const modelRec = this.analyzeFileForModelRecommendation(file);
    if (modelRec.recommended_model !== currentModel) {
      suggestions.push({
        type: 'model',
        title: `Consider using ${modelRec.recommended_model} model`,
        description: modelRec.reason,
        severity: modelRec.confidence > 0.8 ? 'warning' : 'suggestion'
      });
    }

    // GPU optimization
    const gpuRec = this.analyzeGPURecommendation(file, currentGPU, systemInfo);
    if (gpuRec.should_use_gpu && !currentGPU) {
      suggestions.push({
        type: 'gpu',
        title: 'Enable GPU acceleration',
        description: `${gpuRec.reason}. ${gpuRec.estimated_speedup ? `Expected speedup: ${gpuRec.estimated_speedup}` : ''}`,
        severity: 'warning'
      });
    }

    // Format optimization
    const formatSuggestion = this.analyzeFormatRecommendation(file, currentFormat);
    if (formatSuggestion) {
      suggestions.push(formatSuggestion);
    }

    // File-specific suggestions
    const fileSuggestions = this.analyzeFileSpecificSuggestions(file);
    suggestions.push(...fileSuggestions);

    return suggestions;
  }

  private estimateFileDuration(fileSizeMB: number, isVideo: boolean): number {
    // Rough estimation based on typical bitrates
    if (isVideo) {
      // Assume average video bitrate of 2 Mbps for duration estimation
      return (fileSizeMB * 8) / (2 * 60); // Convert to minutes
    } else {
      // Assume average audio bitrate of 128 kbps
      return (fileSizeMB * 8) / (0.128 * 60); // Convert to minutes
    }
  }

  private calculateSpeedupEstimate(durationMinutes: number, gpuType?: string): string {
    if (durationMinutes < 5) return '1.5-2x faster';
    if (durationMinutes < 30) return '2-4x faster';
    if (durationMinutes < 120) return '3-6x faster';
    return '4-8x faster';
  }

  private analyzeFormatRecommendation(file: File, currentFormat: string): OptimizationSuggestion | null {
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('meeting') || fileName.includes('interview')) {
      if (currentFormat === 'Text') {
        return {
          type: 'format',
          title: 'Consider SRT format for meetings',
          description: 'SRT format with timestamps helps track conversation flow in meetings',
          severity: 'suggestion'
        };
      }
    }

    if (fileName.includes('lecture') || fileName.includes('presentation')) {
      if (currentFormat === 'Text') {
        return {
          type: 'format',
          title: 'Consider VTT format for lectures',
          description: 'VTT format is ideal for educational content and web playback',
          severity: 'suggestion'
        };
      }
    }

    return null;
  }

  private analyzeFileSpecificSuggestions(file: File): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const fileSizeMB = file.size / (1024 * 1024);
    const fileName = file.name.toLowerCase();

    // Large file suggestions
    if (fileSizeMB > 1000) { // 1GB+
      suggestions.push({
        type: 'settings',
        title: 'Large file detected',
        description: 'Consider enabling speaker diarization for better organization of long content',
        severity: 'info'
      });
    }

    // Audio quality suggestions
    if (fileName.includes('phone') || fileName.includes('call')) {
      suggestions.push({
        type: 'model',
        title: 'Phone audio detected',
        description: 'Small or Medium models perform better on compressed phone audio',
        severity: 'suggestion'
      });
    }

    return suggestions;
  }
}

// Export singleton instance
export const optimizationEngine = OptimizationEngine.getInstance();
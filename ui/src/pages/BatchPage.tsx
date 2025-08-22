import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig } from '../lib/types';
import electronService from '../services/electronService';
import { postProcessingEngine } from '../lib/postProcessing';

interface BatchPageProps {
  config: AppConfig;
}

interface BatchJob {
  id: string;
  filename: string;
  filepath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration?: string;
  size: string;
  transcriptionResult?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

function BatchPage({ config }: BatchPageProps) {
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [enablePostProcessing, setEnablePostProcessing] = useState(true);
  const [generateSummaries, setGenerateSummaries] = useState(true);
  const [summaryFormat, setSummaryFormat] = useState<'bullet_points' | 'paragraphs' | 'structured'>('paragraphs');
  const [selectedModel, setSelectedModel] = useState(config.model.default_size);
  const [outputDirectory, setOutputDirectory] = useState('./transcripts');
  const [concurrentJobs, setConcurrentJobs] = useState(1);
  const [useGpu, setUseGpu] = useState(config.model.use_gpu);

  const handleDirectorySelect = async () => {
    if (electronService.isElectron) {
      const directory = await electronService.selectDirectory();
      if (directory) {
        setSelectedDirectory(directory);
        // TODO: Scan directory for media files and populate jobs list
        scanDirectoryForFiles(directory);
      }
    } else {
      // Browser fallback - simulated
      setSelectedDirectory('/Users/example/Documents/recordings');
      // Add some demo files when in browser mode
      setJobs([
        {
          id: '1',
          filename: 'demo_recording.mp4',
          status: 'pending',
          progress: 0,
          size: '45.2 MB',
          duration: '15:30'
        }
      ]);
    }
  };

  const scanDirectoryForFiles = async (directory: string) => {
    // Clear existing jobs
    setJobs([]);
    
    if (electronService.isElectron) {
      try {
        // Scan directory for media files
        const result = await electronService.scanDirectory(directory);
        
        // Check if we got an error response
        if (result && result.error) {
          console.error(`Failed to scan directory: ${result.message}`);
          alert(`Failed to scan directory: ${result.message}\n\nPlease ensure the network share is accessible and you have read permissions.`);
          return;
        }
        
        const files = result || [];
        console.log(`Found ${files.length} valid media files in ${directory}`);
        console.log('Note: Hidden files (.*), macOS metadata (._*), and system files were automatically excluded');
        
        // Convert to BatchJob format
        const newJobs: BatchJob[] = files.map((file, index) => {
          const sizeGB = file.size / (1024 * 1024 * 1024);
          const sizeMB = file.size / (1024 * 1024);
          
          return {
            id: `file-${index}`,
            filename: file.name,
            filepath: file.path,
            status: 'pending' as const,
            progress: 0,
            size: sizeGB >= 1 ? `${sizeGB.toFixed(2)} GB` : `${sizeMB.toFixed(1)} MB`,
            duration: '00:00' // We don't know duration until we process
          };
        });
        
        setJobs(newJobs);
        
        if (files.length === 0) {
          alert('No valid media files found in the selected directory.\n\nSupported formats: mp4, mp3, wav, flac, aac, m4a, ogg, avi, mkv, webm, mov\n\nNote: Hidden files (starting with .), macOS metadata files (._*), and system files are automatically excluded.');
        } else {
          // Check for very large files
          const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024 * 1024); // Files > 5GB
          const veryLargeFiles = files.filter(f => f.size > 20 * 1024 * 1024 * 1024); // Files > 20GB
          
          if (veryLargeFiles.length > 0) {
            alert(`Warning: ${veryLargeFiles.length} file(s) exceed the 20GB limit and will fail processing.\n\nConsider splitting these files first.`);
          } else if (largeFiles.length > 0) {
            alert(`Note: Found ${largeFiles.length} large file(s) over 5GB.\n\nThese may take several hours each to transcribe. Consider processing them individually or overnight.`);
          }
        }
      } catch (error) {
        console.error('Error scanning directory:', error);
        alert(`Error scanning directory: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis may occur with network shares that are not properly mounted or accessible.`);
      }
    }
  };

  const getOptimalBatchSettings = () => {
    if (!selectedDirectory) return null;

    // Analyze the current job queue to suggest optimal settings
    const totalFiles = jobs.length;
    const totalSizeMB = jobs.reduce((acc, job) => acc + parseFloat(job.size.replace(' MB', '')), 0);
    const avgSizeMB = totalSizeMB / totalFiles;
    
    const suggestions = [];

    // Model suggestion based on batch size
    if (totalFiles > 10) {
      suggestions.push({
        type: 'model',
        suggestion: 'Base model recommended for large batches to balance speed and accuracy',
        icon: RocketLaunchIcon
      });
    }

    // Concurrency suggestion
    if (totalFiles > 5 && totalSizeMB > 500) {
      suggestions.push({
        type: 'concurrency',
        suggestion: 'Consider 4+ concurrent jobs for large batches with powerful hardware',
        icon: SparklesIcon
      });
    }

    // GPU suggestion for large batches
    if (totalSizeMB > 1000) {
      suggestions.push({
        type: 'gpu',
        suggestion: 'GPU acceleration highly recommended for large batch processing',
        icon: RocketLaunchIcon
      });
    }

    return suggestions;
  };

  const processJob = async (job: BatchJob) => {
    const startTime = Date.now();
    
    // Update job status to processing
    setJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { ...j, status: 'processing' as const, progress: 10, startTime }
        : j
    ));
      
    try {
      if (electronService.isElectron && job.filepath) {
        // Real transcription using Electron
        console.log(`Starting transcription for: ${job.filename}`);
        
        // Update progress to 30%
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, progress: 30 } : j
        ));
          
        // Perform actual transcription
        const result = await electronService.transcribeFile(job.filepath, {
          modelSize: selectedModel.toLowerCase(),
          language: 'auto',
          useGpu: useGpu,
        });
        
        // Update progress to 90%
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, progress: 90 } : j
        ));
        
        if (result && result.success) {
          // Extract text from result - handle all possible formats
          let transcriptionText = '';
          
          // Debug log to see what we're getting
          console.log('Transcription result structure:', {
            hasText: 'text' in result,
            textType: typeof result.text,
            hasSegments: 'segments' in result,
            segmentsLength: result.segments?.length
          });
          
          if (result.text && typeof result.text === 'string') {
            transcriptionText = result.text;
          } else if (result.segments && Array.isArray(result.segments)) {
            // If we have segments, join their text
            transcriptionText = result.segments
              .map((segment: any) => {
                if (typeof segment === 'string') return segment;
                if (segment.text) return segment.text;
                return '';
              })
              .join(' ')
              .trim();
          } else if (result.text && Array.isArray(result.text)) {
            // Handle case where text is an array
            transcriptionText = result.text
              .map((item: any) => {
                if (typeof item === 'string') return item;
                if (item.text) return item.text;
                return '';
              })
              .join(' ')
              .trim();
          } else {
            // Last resort - try to stringify whatever we got
            console.warn('Unexpected result format:', result);
            transcriptionText = JSON.stringify(result.text || result) || 'No text extracted';
          }
          
          console.log(`Transcription completed for ${job.filename}:`, {
            textLength: transcriptionText.length,
            preview: transcriptionText.substring(0, 100),
            fullResult: result
          });
          
          // Apply post-processing if enabled
          let finalText = transcriptionText;
          if (enablePostProcessing && transcriptionText.length > 0) {
            console.log(`Applying post-processing to ${job.filename}`);
            try {
              const processedResult = await postProcessingEngine.processTranscript(
                transcriptionText,
                {
                  enabled: true,
                  text_formatting: {
                    enabled: true,
                    model: 'phi3.5',
                    add_paragraphs: true,
                    fix_punctuation: true,
                    improve_readability: true
                  },
                  summarization: {
                    enabled: generateSummaries,
                    model: 'llama3.2',
                    format: summaryFormat,
                    max_length: 500,
                    include_key_points: true,
                    extract_action_items: false,
                    focus_on_insights: false
                  }
                }
              );
              
              // Use formatted text if available
              if (processedResult.formatted_text) {
                console.log(`Post-processing applied successfully for ${job.filename}`);
                finalText = processedResult.formatted_text;
              }
              
              // Append summary if available
              if (generateSummaries && processedResult.summary) {
                console.log(`Appending summary for ${job.filename}`);
                finalText += '\n\n' + '='.repeat(50) + '\n';
                finalText += 'SUMMARY\n';
                finalText += '='.repeat(50) + '\n\n';
                finalText += processedResult.summary;
              }
            } catch (error) {
              console.error(`Failed to apply post-processing to ${job.filename}:`, error);
              // Continue with original text if post-processing fails
            }
          }
          
          // Calculate duration
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          // Save to file if output directory is specified
          if (outputDirectory && electronService.isElectron && finalText.length > 0) {
            const outputFilename = job.filename.replace(/\.[^/.]+$/, '') + '_transcript.txt';
            const outputPath = `${outputDirectory}/${outputFilename}`;
            
            try {
              const saveResult = await electronService.writeFile(outputPath, finalText);
              if (saveResult) {
                console.log(`Saved transcript to: ${outputPath} (${finalText.length} bytes)`);
              } else {
                console.error(`Failed to save transcript for ${job.filename}`);
              }
            } catch (err) {
              console.error(`Failed to save transcript for ${job.filename}:`, err);
            }
          }
          
          // Success - mark as completed
          setJobs(prev => prev.map(j => 
            j.id === job.id 
              ? { 
                  ...j, 
                  status: 'completed' as const, 
                  progress: 100,
                  transcriptionResult: finalText,
                  duration: duration,
                  endTime: endTime
                }
              : j
          ));
        } else {
          // Failed
          const endTime = Date.now();
          const durationMs = endTime - startTime;
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          setJobs(prev => prev.map(j => 
            j.id === job.id 
              ? { 
                  ...j, 
                  status: 'failed' as const, 
                  progress: 0,
                  error: result?.error || 'Transcription failed',
                  duration: duration,
                  endTime: endTime
                }
              : j
          ));
        }
      } else {
        // Fallback simulation for browser mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setJobs(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, status: 'completed' as const, progress: 100, duration, endTime }
            : j
        ));
      }
    } catch (error) {
      console.error(`Failed to transcribe ${job.filename}:`, error);
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      setJobs(prev => prev.map(j => 
        j.id === job.id 
          ? { 
              ...j, 
              status: 'failed' as const, 
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
              duration: duration,
              endTime: endTime
            }
          : j
      ));
    }
  };
  
  const handleStartBatch = async () => {
    if (jobs.length === 0) {
      console.warn('No jobs to process');
      return;
    }
    
    setIsProcessing(true);
    setIsStopping(false);
    
    // Process files with concurrency
    const pendingJobs = jobs.filter(j => j.status === 'pending');
    const maxConcurrent = parseInt(concurrentJobs.toString());
    
    if (useGpu) {
      // Process jobs sequentially when GPU is enabled to avoid Metal backend crashes
      // The native Whisper library with Metal acceleration isn't thread-safe
      for (const job of pendingJobs) {
        if (isStopping) {
          setIsStopping(false);
          break;
        }
        
        await processJob(job);
      }
    } else {
      // Process in batches when using CPU-only (thread-safe)
      for (let i = 0; i < pendingJobs.length; i += maxConcurrent) {
        if (isStopping) {
          setIsStopping(false);
          break;
        }
        
        const batch = pendingJobs.slice(i, i + maxConcurrent);
        
        // Process batch concurrently with CPU backend
        await Promise.all(batch.map(job => processJob(job)));
      }
    }
    
    setIsProcessing(false);
  };
  
  const handleStopBatch = () => {
    // Set stopping flag for the loop to check
    setIsStopping(true);
    setIsProcessing(false);
    
    // Mark all processing jobs as pending again
    setJobs(prev => prev.map(j => 
      j.status === 'processing' 
        ? { ...j, status: 'pending' as const, progress: 0 }
        : j
    ));
  };

  const getStatusIcon = (status: BatchJob['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: BatchJob['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600 dark:text-gray-400';
      case 'processing':
        return 'text-primary-600 dark:text-primary-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const totalJobs = jobs.length;

  return (
    <div className="min-h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Batch Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process multiple audio and video files simultaneously
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Source Directory
                </h2>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <FolderIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {selectedDirectory || 'No directory selected'}
                    </p>
                    <button
                      onClick={handleDirectorySelect}
                      className="btn-primary text-sm"
                    >
                      Select Directory
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File Pattern
                    </label>
                    <input
                      type="text"
                      defaultValue="*.{mp4,mp3,wav,m4a}"
                      className="form-input"
                      placeholder="e.g., *.mp4"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Optimization Suggestions */}
            {selectedDirectory && getOptimalBatchSettings()?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card border-blue-200 dark:border-blue-800"
              >
                <div className="card-body">
                  <div className="flex items-center space-x-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Batch Optimization
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {getOptimalBatchSettings()?.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <item.icon className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {item.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                    💡 Analyzing {jobs.length} files (~{jobs.reduce((acc, job) => acc + parseFloat(job.size.replace(' MB', '')), 0).toFixed(0)}MB total)
                  </div>
                </div>
              </motion.div>
            )}

            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Batch Settings
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model Size
                    </label>
                    <select 
                      className="form-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="Tiny">Tiny (Fastest)</option>
                      <option value="Base">Base (Recommended)</option>
                      <option value="Small">Small (Better Quality)</option>
                      <option value="Medium">Medium (High Quality)</option>
                      <option value="Large">Large (Best Quality)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Concurrent Jobs
                    </label>
                    <select 
                      className="form-select" 
                      value={concurrentJobs}
                      onChange={(e) => setConcurrentJobs(parseInt(e.target.value))}
                    >
                      <option value="1">1 (Sequential)</option>
                      <option value="2">2 (Parallel)</option>
                      <option value="4">4 (Fast CPU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Output Directory
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={outputDirectory}
                        onChange={(e) => setOutputDirectory(e.target.value)}
                        className="form-input flex-1 min-w-0"
                        placeholder="Output directory"
                      />
                      {electronService.isElectron && (
                        <button
                          type="button"
                          onClick={async () => {
                            const dir = await electronService.selectDirectory();
                            if (dir) setOutputDirectory(dir);
                          }}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex-shrink-0"
                        >
                          Browse
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="skip-existing"
                      className="form-checkbox"
                      defaultChecked
                    />
                    <label htmlFor="skip-existing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skip existing files
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="batch-gpu"
                      className="form-checkbox"
                      checked={useGpu}
                      onChange={(e) => setUseGpu(e.target.checked)}
                    />
                    <label htmlFor="batch-gpu" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Use GPU acceleration
                    </label>
                  </div>
                  {useGpu && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      ⚠️ GPU mode forces sequential processing to prevent crashes
                    </p>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Post-Processing</h3>
                    
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        type="checkbox"
                        id="enable-post-processing"
                        className="form-checkbox"
                        checked={enablePostProcessing}
                        onChange={(e) => setEnablePostProcessing(e.target.checked)}
                      />
                      <label htmlFor="enable-post-processing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Format text (paragraphs, punctuation)
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <input
                        type="checkbox"
                        id="generate-summaries"
                        className="form-checkbox"
                        checked={generateSummaries}
                        onChange={(e) => setGenerateSummaries(e.target.checked)}
                      />
                      <label htmlFor="generate-summaries" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Generate AI summaries
                      </label>
                    </div>
                    
                    {generateSummaries && (
                      <div className="ml-6">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Summary Format
                        </label>
                        <select 
                          className="form-select text-sm"
                          value={summaryFormat}
                          onChange={(e) => setSummaryFormat(e.target.value as any)}
                        >
                          <option value="bullet_points">Bullet Points</option>
                          <option value="paragraphs">Paragraphs</option>
                          <option value="structured">Structured (Sections)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isProcessing) {
                      handleStopBatch();
                    } else {
                      handleStartBatch();
                    }
                  }}
                  disabled={!selectedDirectory || jobs.length === 0}
                  className={`w-full mt-6 ${isProcessing ? 'btn-danger' : 'btn-primary'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                >
                  {isProcessing ? (
                    <>
                      <StopIcon className="w-5 h-5" />
                      <span>Stop Processing</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Start Batch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress */}
            {isProcessing && (
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Overall Progress
                    </h2>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {completedJobs} of {totalJobs} completed
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(completedJobs / totalJobs) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Queue */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Processing Queue
                </h2>
                
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FolderIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No files in queue</p>
                    <p className="text-sm mt-2">Select a directory to scan for media files</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {job.filename}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {job.size} • {job.duration}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm capitalize ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Processing...</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {job.status === 'failed' && job.error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          Error: {job.error}
                        </div>
                      )}
                      
                      {job.status === 'completed' && (
                        <div className="flex space-x-2">
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              console.log('View Transcript clicked for:', job.filename, {
                                hasTranscriptionResult: !!job.transcriptionResult,
                                transcriptionLength: job.transcriptionResult?.length || 0,
                                preview: job.transcriptionResult?.substring(0, 100) || 'No content'
                              });
                              
                              if (job.transcriptionResult) {
                                // Show in a modal or new tab
                                const newWindow = window.open('', '_blank');
                                if (newWindow) {
                                  newWindow.document.write(`<pre>${job.transcriptionResult}</pre>`);
                                }
                              } else {
                                alert('No transcription result available for this file.');
                              }
                            }}
                          >
                            View Transcript
                          </button>
                          <button 
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              console.log('Download clicked for:', job.filename, {
                                hasTranscriptionResult: !!job.transcriptionResult,
                                transcriptionLength: job.transcriptionResult?.length || 0
                              });
                              
                              if (job.transcriptionResult) {
                                const blob = new Blob([job.transcriptionResult], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${job.filename.replace(/\.[^/.]+$/, '')}_transcript.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } else {
                                alert('No transcription result available for this file.');
                              }
                            }}
                          >
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Results Summary */}
            {completedJobs > 0 && (
              <div className="card">
                <div className="card-body">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Results Summary
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <DocumentTextIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{totalJobs - completedJobs}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Remaining</p>
                    </div>
                  </div>

                  <button 
                    className="w-full mt-4 btn-secondary"
                    onClick={() => {
                      const completedJobs = jobs.filter(j => j.status === 'completed' && j.transcriptionResult);
                      
                      console.log('Download All clicked:', {
                        totalJobs: jobs.length,
                        completedWithText: completedJobs.length,
                        jobDetails: jobs.map(j => ({
                          filename: j.filename,
                          status: j.status,
                          hasTranscript: !!j.transcriptionResult,
                          transcriptLength: j.transcriptionResult?.length || 0
                        }))
                      });
                      
                      // Create a combined transcript
                      let combinedTranscript = '';
                      completedJobs.forEach(job => {
                        combinedTranscript += `\n\n===== ${job.filename} =====\n\n`;
                        combinedTranscript += job.transcriptionResult || '';
                      });
                      
                      console.log('Combined transcript length:', combinedTranscript.length);
                      
                      if (combinedTranscript.trim().length === 0) {
                        alert('No transcription results available to download.');
                        return;
                      }
                      
                      // Download the combined file
                      const blob = new Blob([combinedTranscript], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `batch_transcripts_${new Date().toISOString().slice(0, 10)}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download All Transcripts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default BatchPage;
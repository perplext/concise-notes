import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CloudArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  InformationCircleIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig } from '../lib/types';
import electronService from '../services/electronService';
import type { ModelInfo as ElectronModelInfo } from '../types/electron';

interface ModelsPageProps {
  config: AppConfig;
}

interface ModelInfo {
  size: string;
  filename: string;
  size_mb: number;
  downloaded: boolean;
  description: string;
  recommended?: boolean;
}

function ModelsPage({ config }: ModelsPageProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const getModelDescription = (size: string): string => {
    switch (size.toLowerCase()) {
      case 'tiny':
        return 'Fastest processing, basic accuracy. Good for real-time applications.';
      case 'base':
        return 'Balanced speed and accuracy. Recommended for most use cases.';
      case 'small':
        return 'Better accuracy with reasonable speed. Good for longer recordings.';
      case 'medium':
        return 'High accuracy, slower processing. Best for detailed transcriptions.';
      case 'large':
        return 'Maximum accuracy, slowest processing. For professional use.';
      default:
        return 'Whisper model for speech recognition.';
    }
  };

  useEffect(() => {
    // Load models information
    const loadModels = async () => {
      if (electronService.isElectron) {
        // Load from Electron
        const electronModels = await electronService.listModels();
        if (electronModels) {
          const modelList: ModelInfo[] = Object.entries(electronModels).map(([size, info]) => ({
            size: size.charAt(0).toUpperCase() + size.slice(1),
            filename: info.filename,
            size_mb: Math.round(info.size / (1024 * 1024)),
            downloaded: info.exists,
            description: getModelDescription(size),
            recommended: size === 'base'
          }));
          setModels(modelList);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to simulated data
      setTimeout(() => {
        setModels([
          {
            size: 'Tiny',
            filename: 'ggml-tiny.bin',
            size_mb: 39,
            downloaded: true,
            description: 'Fastest processing, basic accuracy. Good for real-time applications.',
          },
          {
            size: 'Base',
            filename: 'ggml-base.bin',
            size_mb: 142,
            downloaded: true,
            description: 'Balanced speed and accuracy. Recommended for most use cases.',
            recommended: true,
          },
          {
            size: 'Small',
            filename: 'ggml-small.bin',
            size_mb: 466,
            downloaded: false,
            description: 'Better accuracy than base, moderate speed. Good for important content.',
          },
          {
            size: 'Medium',
            filename: 'ggml-medium.bin',
            size_mb: 1533,
            downloaded: false,
            description: 'High accuracy, slower processing. Ideal for professional transcription.',
          },
          {
            size: 'Large',
            filename: 'ggml-large.bin',
            size_mb: 3094,
            downloaded: false,
            description: 'Excellent accuracy, requires powerful hardware and time.',
          },
          {
            size: 'Large V2',
            filename: 'ggml-large-v2.bin',
            size_mb: 3094,
            downloaded: false,
            description: 'Improved version of Large model with better multilingual support.',
          },
          {
            size: 'Large V3',
            filename: 'ggml-large-v3.bin',
            size_mb: 3094,
            downloaded: false,
            description: 'Latest version with enhanced accuracy and language detection.',
          },
        ]);
        setIsLoading(false);
      }, 1000);
    };
    
    loadModels();
  }, []);

  const handleDownload = async (modelSize: string) => {
    setDownloadingModels(prev => new Set([...prev, modelSize]));
    setDownloadProgress(prev => ({ ...prev, [modelSize]: 0 }));

    // Handle Electron download
    if (electronService.isElectron) {
      const result = await electronService.downloadModel(modelSize.toLowerCase());
      if (result) {
        // Show instruction message
        alert(result.message);
      }
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelSize);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelSize];
        return newProgress;
      });
      
      // Reload models after download attempt
      const electronModels = await electronService.listModels();
      if (electronModels) {
        const modelList: ModelInfo[] = Object.entries(electronModels).map(([size, info]) => ({
          size: size.charAt(0).toUpperCase() + size.slice(1),
          filename: info.filename,
          size_mb: Math.round(info.size / (1024 * 1024)),
          downloaded: info.exists,
          description: getModelDescription(size),
          recommended: size === 'base'
        }));
        setModels(modelList);
      }
      return;
    }

    // Simulate download progress for browser mode
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        const currentProgress = prev[modelSize] || 0;
        const newProgress = Math.min(currentProgress + Math.random() * 15, 100);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setDownloadingModels(prevDownloading => {
            const newSet = new Set(prevDownloading);
            newSet.delete(modelSize);
            return newSet;
          });
          
          setModels(prev => prev.map(model => 
            model.size === modelSize 
              ? { ...model, downloaded: true }
              : model
          ));
          
          return { ...prev, [modelSize]: 100 };
        }
        
        return { ...prev, [modelSize]: newProgress };
      });
    }, 300);
  };

  const handleDelete = (modelSize: string) => {
    setModels(prev => prev.map(model => 
      model.size === modelSize 
        ? { ...model, downloaded: false }
        : model
    ));
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  };

  const getProcessingSpeed = (modelSize: string) => {
    const speeds: Record<string, string> = {
      'Tiny': '~16x faster than realtime',
      'Base': '~8x faster than realtime',
      'Small': '~4x faster than realtime',
      'Medium': '~2x faster than realtime',
      'Large': '~1x realtime speed',
      'Large V2': '~1x realtime speed',
      'Large V3': '~1x realtime speed',
    };
    return speeds[modelSize] || 'Speed varies';
  };

  const totalDownloaded = models.filter(m => m.downloaded).length;
  const totalSize = models.filter(m => m.downloaded).reduce((acc, m) => acc + m.size_mb, 0);

  if (isLoading) {
    return (
      <div className="min-h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading model information...</p>
        </div>
      </div>
    );
  }

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
            Model Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Download and manage Whisper AI models for transcription
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <CpuChipIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDownloaded}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Models Downloaded</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <CloudArrowDownIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(totalSize)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body text-center">
              <CheckCircleIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{config.model.default_size}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Default Model</p>
            </div>
          </div>
        </div>

        {/* Models List */}
        <div className="space-y-4">
          {models.map((model) => {
            const isDownloading = downloadingModels.has(model.size);
            const progress = downloadProgress[model.size] || 0;
            
            return (
              <motion.div
                key={model.size}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {model.size} Model
                        </h3>
                        {model.recommended && (
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        )}
                        {model.downloaded ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {model.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Size:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {formatFileSize(model.size_mb)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Speed:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {getProcessingSpeed(model.size)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Status:</span>
                          <span className={`ml-2 ${
                            model.downloaded 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {model.downloaded ? 'Downloaded' : 'Not Downloaded'}
                          </span>
                        </div>
                      </div>
                      
                      {isDownloading && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Downloading...</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-6">
                      {model.downloaded ? (
                        <>
                          <button
                            onClick={() => handleDelete(model.size)}
                            className="btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                            disabled={isDownloading}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownload(model.size)}
                          className="btn-primary"
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <CloudArrowDownIcon className="w-4 h-4 mr-1" />
                              Download
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="card-body">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Model Selection Guide
                </h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p>
                    <strong>Tiny/Base:</strong> Best for real-time transcription and when speed is critical.
                  </p>
                  <p>
                    <strong>Small/Medium:</strong> Good balance of accuracy and speed for most professional use cases.
                  </p>
                  <p>
                    <strong>Large models:</strong> Highest accuracy but require more time and computational resources.
                  </p>
                  <p>
                    <strong>Note:</strong> All models support multiple languages. Larger models have better multilingual capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ModelsPage;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  PlayIcon,
  StopIcon,
  CogIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig, ModelSize, OptimizationSuggestion, PostProcessingConfig, ProcessedTranscript, SummaryFormat } from '../lib/types';
import { optimizationEngine } from '../lib/optimization';
import { postProcessingEngine } from '../lib/postProcessing';
import { systemApi } from '../lib/api';

interface TranscribePageProps {
  config: AppConfig;
}

function TranscribePage({ config }: TranscribePageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelSize, setModelSize] = useState<ModelSize>(config.model.default_size as ModelSize);
  const [useGPU, setUseGPU] = useState(config.model.use_gpu);
  const [outputFormat, setOutputFormat] = useState(config.output.default_format);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(true);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [postProcessingConfig, setPostProcessingConfig] = useState<PostProcessingConfig>(config.post_processing);
  const [processedResult, setProcessedResult] = useState<ProcessedTranscript | null>(null);
  const [isPostProcessing, setIsPostProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'formatted' | 'summary'>('original');

  // Load system info on component mount
  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const info = await systemApi.getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.warn('Could not load system info:', error);
      }
    };
    
    loadSystemInfo();
  }, []);

  // Analyze file when selected and generate optimization suggestions
  useEffect(() => {
    if (selectedFile && autoOptimizationEnabled) {
      analyzeAndOptimize(selectedFile);
    } else {
      setOptimizationSuggestions([]);
    }
  }, [selectedFile, modelSize, useGPU, outputFormat, autoOptimizationEnabled]);

  const analyzeAndOptimize = async (file: File) => {
    try {
      const suggestions = optimizationEngine.generateOptimizationSuggestions(
        file,
        modelSize,
        useGPU,
        outputFormat,
        systemInfo
      );

      // Filter out dismissed suggestions
      const filteredSuggestions = suggestions.filter(
        suggestion => !dismissedSuggestions.has(suggestion.title)
      );

      setOptimizationSuggestions(filteredSuggestions);

      // Auto-apply model recommendation if confidence is high
      const modelRec = optimizationEngine.analyzeFileForModelRecommendation(file);
      if (modelRec.confidence > 0.85 && modelRec.recommended_model !== modelSize) {
        setModelSize(modelRec.recommended_model);
      }

      // Auto-suggest GPU if beneficial
      const gpuRec = optimizationEngine.analyzeGPURecommendation(file, useGPU, systemInfo);
      if (gpuRec.should_use_gpu && !useGPU && systemInfo?.gpu_available) {
        // Don't auto-enable, but make it prominent in suggestions
      }
    } catch (error) {
      console.warn('Error analyzing file for optimization:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const applySuggestion = (suggestion: OptimizationSuggestion) => {
    switch (suggestion.type) {
      case 'model':
        // Extract model name from suggestion title
        const modelMatch = suggestion.title.match(/(Tiny|Base|Small|Medium|Large|LargeV2|LargeV3)/);
        if (modelMatch) {
          setModelSize(modelMatch[0] as ModelSize);
        }
        break;
      case 'gpu':
        setUseGPU(true);
        break;
      case 'format':
        if (suggestion.title.includes('SRT')) setOutputFormat('Srt');
        if (suggestion.title.includes('VTT')) setOutputFormat('Vtt');
        break;
    }
    
    dismissSuggestion(suggestion.title);
  };

  const dismissSuggestion = (title: string) => {
    setDismissedSuggestions(prev => new Set([...prev, title]));
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;
    
    setIsTranscribing(true);
    setProgress(0);
    setProcessedResult(null);
    setActiveTab('original');
    
    // Simulate transcription progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeTranscription();
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const completeTranscription = async () => {
    setIsTranscribing(false);
    
    // Simulate raw transcription result
    const rawTranscript = `This is a sample transcription result from the audio file. It contains the spoken content but might need formatting and could benefit from summarization. The transcript includes various topics and key points that could be extracted for better understanding. This demonstrates how the post-processing pipeline can improve readability and extract valuable insights from the raw transcription output.

The content covers multiple important topics including technology implementation challenges and solutions. There are several action items mentioned throughout the discussion that need to be followed up on. The speakers also shared valuable insights about best practices and lessons learned from their experience.`;

    // Apply post-processing if enabled
    if (postProcessingConfig.enabled) {
      setIsPostProcessing(true);
      try {
        const processed = await postProcessingEngine.processTranscript(rawTranscript, postProcessingConfig);
        setProcessedResult(processed);
        
        // Set default active tab based on available content
        if (processed.formatted_text) {
          setActiveTab('formatted');
        } else if (processed.summary) {
          setActiveTab('summary');
        } else {
          setActiveTab('original');
        }
      } catch (error) {
        console.error('Post-processing failed:', error);
        // Fall back to raw transcript
        setProcessedResult({
          original_text: rawTranscript,
          processing_time: 0,
          models_used: {}
        });
        setActiveTab('original');
      } finally {
        setIsPostProcessing(false);
      }
    } else {
      setProcessedResult({
        original_text: rawTranscript,
        processing_time: 0,
        models_used: {}
      });
      setActiveTab('original');
    }
  };

  return (
    <div className="min-h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Transcribe File
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert your audio or video files into accurate text transcriptions
          </p>
        </div>

        {/* File Upload Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Select File
                </h2>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-400 transition-colors duration-200">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedFile ? selectedFile.name : 'Choose a file or drag it here'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supports MP4, MP3, WAV, M4A, and more
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="audio/*,video/*"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-4 btn-primary cursor-pointer inline-block"
                  >
                    Browse Files
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transcription Controls */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Transcription Settings
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model Size
                      {selectedFile && (
                        <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
                          {modelSize === config.model.default_size ? '' : '(Auto-selected)'}
                        </span>
                      )}
                    </label>
                    <select 
                      className="form-select" 
                      value={modelSize}
                      onChange={(e) => setModelSize(e.target.value as ModelSize)}
                    >
                      <option value="Tiny">Tiny (Fastest)</option>
                      <option value="Base">Base (Recommended)</option>
                      <option value="Small">Small (Better Quality)</option>
                      <option value="Medium">Medium (High Quality)</option>
                      <option value="Large">Large (Best Quality)</option>
                      <option value="LargeV2">Large V2 (Latest)</option>
                      <option value="LargeV3">Large V3 (Newest)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Output Format
                    </label>
                    <select 
                      className="form-select"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                    >
                      <option value="Text">Plain Text</option>
                      <option value="Srt">SRT (Subtitles)</option>
                      <option value="Vtt">VTT (Web Subtitles)</option>
                      <option value="Json">JSON (Detailed)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="timestamps"
                      className="form-checkbox"
                      defaultChecked
                    />
                    <label htmlFor="timestamps" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include timestamps
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="gpu"
                      className="form-checkbox"
                      checked={useGPU}
                      onChange={(e) => setUseGPU(e.target.checked)}
                    />
                    <label htmlFor="gpu" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Use GPU acceleration
                      {systemInfo?.gpu_available === false && (
                        <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                      )}
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="diarization"
                      className="form-checkbox"
                      defaultChecked={config.diarization.enabled}
                    />
                    <label htmlFor="diarization" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Speaker diarization
                    </label>
                  </div>

                  {/* Auto-optimization toggle */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="auto-optimization"
                        className="form-checkbox"
                        checked={autoOptimizationEnabled}
                        onChange={(e) => setAutoOptimizationEnabled(e.target.checked)}
                      />
                      <label htmlFor="auto-optimization" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable auto-optimization
                      </label>
                    </div>
                    <SparklesIcon className="w-4 h-4 text-primary-500" />
                  </div>
                </div>

                <button
                  onClick={handleTranscribe}
                  disabled={!selectedFile || isTranscribing}
                  className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isTranscribing ? (
                    <>
                      <StopIcon className="w-5 h-5" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-5 h-5" />
                      <span>Start Transcription</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Post-Processing Settings */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center space-x-2 mb-4">
                  <RocketLaunchIcon className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    AI Post-Processing
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {/* Enable post-processing */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="enable-post-processing"
                      className="form-checkbox"
                      checked={postProcessingConfig.enabled}
                      onChange={(e) => setPostProcessingConfig(prev => ({
                        ...prev,
                        enabled: e.target.checked
                      }))}
                    />
                    <label htmlFor="enable-post-processing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable AI post-processing
                    </label>
                  </div>

                  {postProcessingConfig.enabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                      {/* Text Formatting */}
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <input
                            type="checkbox"
                            id="text-formatting"
                            className="form-checkbox"
                            checked={postProcessingConfig.text_formatting.enabled}
                            onChange={(e) => setPostProcessingConfig(prev => ({
                              ...prev,
                              text_formatting: {
                                ...prev.text_formatting,
                                enabled: e.target.checked
                              }
                            }))}
                          />
                          <label htmlFor="text-formatting" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Text Formatting & Readability
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Add paragraphs, fix punctuation, improve readability
                        </p>
                        
                        {postProcessingConfig.text_formatting.enabled && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="add-paragraphs"
                                className="form-checkbox"
                                checked={postProcessingConfig.text_formatting.add_paragraphs}
                                onChange={(e) => setPostProcessingConfig(prev => ({
                                  ...prev,
                                  text_formatting: {
                                    ...prev.text_formatting,
                                    add_paragraphs: e.target.checked
                                  }
                                }))}
                              />
                              <label htmlFor="add-paragraphs" className="text-xs text-gray-600 dark:text-gray-400">
                                Add paragraph breaks
                              </label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="fix-punctuation"
                                className="form-checkbox"
                                checked={postProcessingConfig.text_formatting.fix_punctuation}
                                onChange={(e) => setPostProcessingConfig(prev => ({
                                  ...prev,
                                  text_formatting: {
                                    ...prev.text_formatting,
                                    fix_punctuation: e.target.checked
                                  }
                                }))}
                              />
                              <label htmlFor="fix-punctuation" className="text-xs text-gray-600 dark:text-gray-400">
                                Fix punctuation
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summarization */}
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <input
                            type="checkbox"
                            id="summarization"
                            className="form-checkbox"
                            checked={postProcessingConfig.summarization.enabled}
                            onChange={(e) => setPostProcessingConfig(prev => ({
                              ...prev,
                              summarization: {
                                ...prev.summarization,
                                enabled: e.target.checked
                              }
                            }))}
                          />
                          <label htmlFor="summarization" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            AI Summarization & Key Points
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Extract key insights, action items, and wisdom
                        </p>
                        
                        {postProcessingConfig.summarization.enabled && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Summary Format
                              </label>
                              <select
                                className="form-select text-sm"
                                value={postProcessingConfig.summarization.format}
                                onChange={(e) => setPostProcessingConfig(prev => ({
                                  ...prev,
                                  summarization: {
                                    ...prev.summarization,
                                    format: e.target.value as SummaryFormat
                                  }
                                }))}
                              >
                                <option value="key_points">Key Points</option>
                                <option value="bullets">Bullet Points</option>
                                <option value="paragraphs">Paragraphs</option>
                                <option value="markdown">Markdown</option>
                                <option value="outline">Outline</option>
                              </select>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="extract-actions"
                                className="form-checkbox"
                                checked={postProcessingConfig.summarization.extract_action_items}
                                onChange={(e) => setPostProcessingConfig(prev => ({
                                  ...prev,
                                  summarization: {
                                    ...prev.summarization,
                                    extract_action_items: e.target.checked
                                  }
                                }))}
                              />
                              <label htmlFor="extract-actions" className="text-xs text-gray-600 dark:text-gray-400">
                                Extract action items
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="focus-insights"
                                className="form-checkbox"
                                checked={postProcessingConfig.summarization.focus_on_insights}
                                onChange={(e) => setPostProcessingConfig(prev => ({
                                  ...prev,
                                  summarization: {
                                    ...prev.summarization,
                                    focus_on_insights: e.target.checked
                                  }
                                }))}
                              />
                              <label htmlFor="focus-insights" className="text-xs text-gray-600 dark:text-gray-400">
                                Focus on insights & wisdom
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress and Results */}
          <div className="space-y-6">
            {/* Optimization Suggestions */}
            <AnimatePresence>
              {optimizationSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card border-primary-200 dark:border-primary-800"
                >
                  <div className="card-body">
                    <div className="flex items-center space-x-2 mb-4">
                      <RocketLaunchIcon className="w-5 h-5 text-primary-600" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Optimization Suggestions
                      </h2>
                    </div>
                    
                    <div className="space-y-3">
                      {optimizationSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.title}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border-l-4 ${
                            suggestion.severity === 'warning' 
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400'
                              : suggestion.severity === 'suggestion'
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {suggestion.severity === 'warning' && (
                                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                                )}
                                {suggestion.severity === 'suggestion' && (
                                  <LightBulbIcon className="w-4 h-4 text-blue-500" />
                                )}
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {suggestion.title}
                                </h3>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {suggestion.description}
                              </p>
                            </div>
                            <div className="flex space-x-1 ml-3">
                              <button
                                onClick={() => applySuggestion(suggestion)}
                                className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => dismissSuggestion(suggestion.title)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isTranscribing && (
              <div className="card">
                <div className="card-body">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Progress
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Transcribing...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>• Audio extraction: Complete</p>
                      <p>• Model loading: Complete</p>
                      <p>• Transcription: In progress...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Post-processing Progress */}
            {isPostProcessing && (
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center space-x-2 mb-4">
                    <RocketLaunchIcon className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      AI Post-Processing
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Processing transcript with AI models...
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {postProcessingConfig.text_formatting.enabled && (
                        <p>• Formatting text with {postProcessingConfig.text_formatting.model}</p>
                      )}
                      {postProcessingConfig.summarization.enabled && (
                        <p>• Generating summary with {postProcessingConfig.summarization.model}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Results
                </h2>
                
                {processedResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-green-800 dark:text-green-300 font-medium">
                          ✓ Transcription completed successfully!
                        </p>
                        {processedResult.processing_time > 0 && (
                          <span className="text-xs text-green-700 dark:text-green-400">
                            +{(processedResult.processing_time / 1000).toFixed(1)}s processing
                          </span>
                        )}
                      </div>
                      {Object.keys(processedResult.models_used).length > 0 && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          Models used: {Object.values(processedResult.models_used).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Content Tabs */}
                    {(processedResult.formatted_text || processedResult.summary) && (
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                          <button
                            onClick={() => setActiveTab('original')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'original'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            Original Text
                          </button>
                          {processedResult.formatted_text && (
                            <button
                              onClick={() => setActiveTab('formatted')}
                              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'formatted'
                                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                              }`}
                            >
                              Formatted Text
                            </button>
                          )}
                          {processedResult.summary && (
                            <button
                              onClick={() => setActiveTab('summary')}
                              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'summary'
                                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                              }`}
                            >
                              Summary ({processedResult.summary.format})
                            </button>
                          )}
                        </nav>
                      </div>
                    )}

                    {/* Content Display */}
                    <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                      {activeTab === 'original' && (
                        <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {processedResult.original_text}
                        </div>
                      )}
                      
                      {activeTab === 'formatted' && processedResult.formatted_text && (
                        <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          {processedResult.formatted_text}
                        </div>
                      )}
                      
                      {activeTab === 'summary' && processedResult.summary && (
                        <div className="space-y-4">
                          {/* Main Summary */}
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div 
                              className="text-sm text-gray-700 dark:text-gray-300"
                              dangerouslySetInnerHTML={{
                                __html: processedResult.summary.format === 'markdown' 
                                  ? processedResult.summary.content.replace(/\n/g, '<br>')
                                  : processedResult.summary.content.replace(/\n/g, '<br>')
                              }}
                            />
                          </div>

                          {/* Key Points */}
                          {processedResult.summary.key_points && processedResult.summary.key_points.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Points</h4>
                              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {processedResult.summary.key_points.map((point, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Items */}
                          {processedResult.summary.action_items && processedResult.summary.action_items.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Action Items</h4>
                              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {processedResult.summary.action_items.map((item, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Insights */}
                          {processedResult.summary.insights && processedResult.summary.insights.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Insights</h4>
                              <div className="space-y-2">
                                {processedResult.summary.insights.map((insight, index) => (
                                  <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-2 border-yellow-400">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <button className="btn-secondary w-full">
                        Download Transcript
                      </button>
                      <button className="btn-outline w-full">
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                ) : progress === 100 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-800 dark:text-green-300 font-medium">
                        ✓ Transcription completed successfully!
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <button className="btn-secondary w-full">
                        Download Transcript
                      </button>
                      <button className="btn-outline w-full">
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <DocumentIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Transcription results will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default TranscribePage;
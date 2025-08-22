import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch, Select, SelectItem, Card, CardBody, Divider } from '@nextui-org/react';
import {
  CogIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  FolderIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig } from '../lib/types';

interface ConfigPageProps {
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => Promise<void>;
}

function ConfigPage({ config, onConfigUpdate }: ConfigPageProps) {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('nextui-theme') || 'system';
    setTheme(savedTheme as any);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    localStorage.setItem('nextui-theme', newTheme);
    applyTheme(newTheme);
  };

  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...localConfig };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onConfigUpdate(localConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
    setShowResetWarning(false);
  };

  const handleResetToDefaults = () => {
    // Reset to default values
    const defaultConfig: AppConfig = {
      model: {
        default_size: 'Base',
        models_directory: './models',
        use_gpu: false,
        auto_download: true,
      },
      output: {
        default_format: 'Text',
        timestamps: false,
        skip_existing: true,
        naming_pattern: '{filename}_{timestamp}',
      },
      realtime: {
        vad_threshold: 0.01,
        enable_diarization: false,
      },
      batch: {
        max_concurrent: 2,
        enable_diarization: false,
      },
      diarization: {
        enabled: false,
        min_speakers: 1,
        max_speakers: 10,
      },
      logging: {
        level: 'info',
        colored: true,
      },
    };
    
    setLocalConfig(defaultConfig);
    setHasChanges(true);
    setShowResetWarning(false);
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
            Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your transcription settings and preferences
          </p>
        </div>

        {/* Save Bar */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-300">
                You have unsaved changes
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleReset}
                className="btn-outline btn-sm"
                disabled={isSaving}
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Discard
              </button>
              <button
                onClick={handleSave}
                className="btn-primary btn-sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CheckIcon className="w-4 h-4 mr-1" />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-8">
          {/* UI Settings */}
          <Card className="shadow-medium">
            <CardBody>
              <div className="flex items-center space-x-3 mb-6">
                <SunIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <Select 
                    selectedKeys={[theme]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      handleThemeChange(value);
                    }}
                    className="max-w-xs"
                    label="Select theme"
                    variant="bordered"
                  >
                    <SelectItem key="light" startContent={<SunIcon className="w-4 h-4" />}>
                      Light
                    </SelectItem>
                    <SelectItem key="dark" startContent={<MoonIcon className="w-4 h-4" />}>
                      Dark
                    </SelectItem>
                    <SelectItem key="system" startContent={<ComputerDesktopIcon className="w-4 h-4" />}>
                      System
                    </SelectItem>
                  </Select>
                </div>

                <Divider />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme Preview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Card isPressable className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-all">
                      <CardBody className="text-center py-3">Primary</CardBody>
                    </Card>
                    <Card isPressable className="bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-lg transition-all">
                      <CardBody className="text-center py-3">Secondary</CardBody>
                    </Card>
                    <Card isPressable className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-lg transition-all">
                      <CardBody className="text-center py-3">Success</CardBody>
                    </Card>
                    <Card isPressable className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white hover:shadow-lg transition-all">
                      <CardBody className="text-center py-3">Warning</CardBody>
                    </Card>
                    <Card isPressable className="bg-gradient-to-br from-red-500 to-rose-600 text-white hover:shadow-lg transition-all">
                      <CardBody className="text-center py-3">Danger</CardBody>
                    </Card>
                    <Card isPressable className="bg-gradient-to-br from-gray-500 to-slate-600 text-white hover:shadow-lg transition-all">
                      <CardBody className="text-center py-3">Default</CardBody>
                    </Card>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Model Settings */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <CpuChipIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Model Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Model Size
                  </label>
                  <select
                    value={localConfig.model.default_size}
                    onChange={(e) => updateConfig('model.default_size', e.target.value)}
                    className="form-select"
                  >
                    <option value="Tiny">Tiny (39MB, Fastest)</option>
                    <option value="Base">Base (142MB, Recommended)</option>
                    <option value="Small">Small (466MB, Better Quality)</option>
                    <option value="Medium">Medium (1.5GB, High Quality)</option>
                    <option value="Large">Large (3GB, Best Quality)</option>
                    <option value="LargeV2">Large V2 (3GB, Latest)</option>
                    <option value="LargeV3">Large V3 (3GB, Newest)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Models Directory
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={localConfig.model.models_directory}
                      onChange={(e) => updateConfig('model.models_directory', e.target.value)}
                      className="form-input rounded-r-none"
                    />
                    <button className="btn-outline rounded-l-none border-l-0">
                      <FolderIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="use-gpu"
                      checked={localConfig.model.use_gpu}
                      onChange={(e) => updateConfig('model.use_gpu', e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="use-gpu" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Use GPU acceleration
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Requires compatible GPU (CUDA/Metal/CoreML)
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="auto-download"
                      checked={localConfig.model.auto_download}
                      onChange={(e) => updateConfig('model.auto_download', e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="auto-download" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-download models
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Automatically download missing models when needed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Output Settings */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <DocumentTextIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Output Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Format
                  </label>
                  <select
                    value={localConfig.output.default_format}
                    onChange={(e) => updateConfig('output.default_format', e.target.value)}
                    className="form-select"
                  >
                    <option value="Text">Plain Text (.txt)</option>
                    <option value="Json">JSON (.json)</option>
                    <option value="Srt">SRT Subtitles (.srt)</option>
                    <option value="Vtt">VTT Subtitles (.vtt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Naming Pattern
                  </label>
                  <input
                    type="text"
                    value={localConfig.output.naming_pattern}
                    onChange={(e) => updateConfig('output.naming_pattern', e.target.value)}
                    className="form-input"
                    placeholder="{filename}_{timestamp}"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use {'{filename}'}, {'{timestamp}'}, {'{date}'} placeholders
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="timestamps"
                      checked={localConfig.output.timestamps}
                      onChange={(e) => updateConfig('output.timestamps', e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="timestamps" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include timestamps
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="skip-existing"
                      checked={localConfig.output.skip_existing}
                      onChange={(e) => updateConfig('output.skip_existing', e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="skip-existing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skip existing files
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Settings */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <SpeakerWaveIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Real-time Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voice Activity Detection Threshold
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localConfig.realtime.vad_threshold}
                      onChange={(e) => updateConfig('realtime.vad_threshold', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Sensitive (0.00)</span>
                      <span className="font-medium">{localConfig.realtime.vad_threshold.toFixed(2)}</span>
                      <span>Conservative (1.00)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Processing */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <CogIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Batch Processing
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Concurrent Jobs
                  </label>
                  <select
                    value={localConfig.batch.max_concurrent}
                    onChange={(e) => updateConfig('batch.max_concurrent', parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value="1">1 (Sequential)</option>
                    <option value="2">2 (Recommended)</option>
                    <option value="4">4 (Fast CPU)</option>
                    <option value="8">8 (Powerful CPU)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Logging */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Logging
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Log Level
                  </label>
                  <select
                    value={localConfig.logging.level}
                    onChange={(e) => updateConfig('logging.level', e.target.value)}
                    className="form-select"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                    <option value="trace">Trace</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="colored-logs"
                      checked={localConfig.logging.colored}
                      onChange={(e) => updateConfig('logging.colored', e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="colored-logs" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Colored output
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Section */}
          <div className="card border-orange-200 dark:border-orange-800">
            <div className="card-body">
              <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100 mb-4">
                Reset Configuration
              </h2>
              <p className="text-orange-700 dark:text-orange-300 mb-4">
                Reset all settings to their default values. This action cannot be undone.
              </p>
              
              {showResetWarning ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-orange-800 dark:text-orange-200 mb-4">
                    Are you sure you want to reset all settings to defaults?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleResetToDefaults}
                      className="btn-primary bg-orange-600 hover:bg-orange-700"
                    >
                      Yes, Reset All
                    </button>
                    <button
                      onClick={() => setShowResetWarning(false)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetWarning(true)}
                  className="btn-outline border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ConfigPage;
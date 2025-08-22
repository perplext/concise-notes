import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  FolderIcon,
  MicrophoneIcon,
  CogIcon,
  CloudIcon,
  ArrowRightIcon,
  SparklesIcon,
  BoltIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig } from '../lib/types';
import electronService from '../services/electronService';

interface HomePageProps {
  config: AppConfig;
}

const quickActions = [
  {
    name: 'Transcribe File',
    description: 'Convert audio or video to text',
    href: '/transcribe',
    icon: DocumentTextIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Batch Process',
    description: 'Process multiple files at once',
    href: '/batch',
    icon: FolderIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Real-time',
    description: 'Live transcription from microphone',
    href: '/realtime',
    icon: MicrophoneIcon,
    color: 'bg-purple-500',
  },
  {
    name: 'Manage Models',
    description: 'Download and organize AI models',
    href: '/models',
    icon: CloudIcon,
    color: 'bg-orange-500',
  },
];

const features = [
  {
    name: 'Lightning Fast',
    description: 'Process audio faster than real-time with optimized AI models',
    icon: BoltIcon,
  },
  {
    name: 'Privacy First',
    description: 'Everything runs locally on your machine - no data sent to servers',
    icon: GlobeAltIcon,
  },
  {
    name: 'AI Powered',
    description: 'Uses OpenAI Whisper models for state-of-the-art accuracy',
    icon: SparklesIcon,
  },
];

function HomePage({ config }: HomePageProps) {
  const isBrowserMode = typeof window !== 'undefined' && !('__TAURI_IPC__' in window) && !electronService.isElectron;

  return (
    <div className="min-h-full">
      {/* Browser Mode Notice */}
      {isBrowserMode && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Running in Browser Demo Mode
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  For full functionality, download and run the desktop application
                </p>
              </div>
            </div>
            <button className="text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="text-primary-600 dark:text-primary-400">Concise Notes</span> from
              <br />
              Audio & Video
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Transform your audio and video files into accurate, searchable text using 
              state-of-the-art AI - all running locally on your machine.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Link
                  to={action.href}
                  className="block p-6 card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {action.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Current Configuration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Current Configuration
            </h2>
            <Link
              to="/config"
              className="btn-secondary"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              Modify Settings
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Default Model
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {config.model.default_size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">GPU:</span>
                    <span className={`status-badge ${config.model.use_gpu ? 'status-success' : 'status-info'}`}>
                      {config.model.use_gpu ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Output Settings
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Format:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {config.output.default_format}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timestamps:</span>
                    <span className={`status-badge ${config.output.timestamps ? 'status-success' : 'status-info'}`}>
                      {config.output.timestamps ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Advanced Features
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Diarization:</span>
                    <span className={`status-badge ${config.diarization.enabled ? 'status-success' : 'status-info'}`}>
                      {config.diarization.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Batch Limit:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {config.batch.max_concurrent} files
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why Choose Concise Note Taker?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="text-center"
              >
                <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default HomePage;
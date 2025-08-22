import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Progress, Divider } from '@nextui-org/react';
import { motion } from 'framer-motion';
import {
  MicrophoneIcon,
  DocumentTextIcon,
  CpuChipIcon,
  CloudArrowDownIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import type { AppConfig } from '../lib/types';
import electronService from '../services/electronService';

interface HomePageProps {
  config: AppConfig;
}

function HomePage({ config }: HomePageProps) {
  const [systemResources, setSystemResources] = useState<{
    cpuUsage: number;
    memoryUsage: number;
    loadAverage: number;
  } | null>(null);

  useEffect(() => {
    // Fetch system resources on mount and every 5 seconds
    const fetchResources = async () => {
      if (electronService.isElectron) {
        const resources = await electronService.getSystemResources();
        if (resources) {
          setSystemResources(resources);
        }
      }
    };

    fetchResources();
    const interval = setInterval(fetchResources, 5000);

    return () => clearInterval(interval);
  }, []);
  const features = [
    {
      icon: <MicrophoneIcon className="w-6 h-6" />,
      title: 'Real-time Transcription',
      description: 'Live transcription with speaker detection',
      color: 'primary'
    },
    {
      icon: <DocumentTextIcon className="w-6 h-6" />,
      title: 'Batch Processing',
      description: 'Process multiple audio files at once',
      color: 'secondary'
    },
    {
      icon: <CpuChipIcon className="w-6 h-6" />,
      title: 'Local Processing',
      description: 'Everything runs on your device',
      color: 'success'
    },
    {
      icon: <CloudArrowDownIcon className="w-6 h-6" />,
      title: 'Multiple Models',
      description: 'Download and use different model sizes',
      color: 'warning'
    }
  ];

  const stats = [
    { label: 'Models Available', value: '5', color: 'primary' },
    { label: 'Languages', value: '99+', color: 'secondary' },
    { label: 'Processing', value: 'Fast', color: 'success', subtitle: 'Faster than real-time' },
    { label: 'Privacy', value: '100%', color: 'danger' }
  ];

  return (
    <div className="min-h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Concise Note Taker
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Powerful local transcription powered by OpenAI's Whisper
          </motion.p>
          
          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              as={Link}
              to="/transcribe"
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg"
              startContent={<SparklesIcon className="w-5 h-5" />}
            >
              Start Transcribing
            </Button>
            <Button
              as={Link}
              to="/models"
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 shadow-md"
              startContent={<CloudArrowDownIcon className="w-5 h-5" />}
            >
              Download Models
            </Button>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-medium">
              <CardBody className="text-center">
                <div className="text-3xl font-bold mb-1">
                  <Chip color={stat.color as any} variant="flat" size="lg">
                    {stat.value}
                  </Chip>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {features.map((feature, index) => {
            const gradients = [
              'bg-gradient-to-br from-blue-400 to-purple-600',
              'bg-gradient-to-br from-green-400 to-cyan-600',
              'bg-gradient-to-br from-orange-400 to-red-600',
              'bg-gradient-to-br from-pink-400 to-rose-600'
            ];
            return (
              <Card 
                key={index} 
                className={`${gradients[index]} text-white hover:shadow-xl transition-all hover:scale-105`}
                isPressable
              >
                <CardHeader className="pb-0">
                  <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm inline-flex">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/90">
                    {feature.description}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="shadow-medium">
            <CardHeader>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <RocketLaunchIcon className="w-6 h-6" />
                Quick Actions
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="flex flex-wrap gap-3">
                <Button 
                  as={Link} 
                  to="/transcribe"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                  startContent={<MicrophoneIcon className="w-4 h-4" />}
                >
                  Transcribe Audio
                </Button>
                <Button 
                  as={Link} 
                  to="/batch"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  startContent={<DocumentTextIcon className="w-4 h-4" />}
                >
                  Batch Process
                </Button>
                <Button 
                  as={Link} 
                  to="/realtime"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                  startContent={<SparklesIcon className="w-4 h-4" />}
                >
                  Real-time Mode
                </Button>
                <Button 
                  as={Link} 
                  to="/config"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                  startContent={<CogIcon className="w-4 h-4" />}
                >
                  Settings
                </Button>
              </div>
              
              <Divider className="my-4" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Default Model</span>
                  <Chip color="primary" size="sm" variant="flat">
                    {config.model.default_size}
                  </Chip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">GPU Acceleration</span>
                  <Chip 
                    color={config.model.use_gpu ? "success" : "default"} 
                    size="sm"
                    variant="flat"
                  >
                    {config.model.use_gpu ? 'Enabled' : 'Disabled'}
                  </Chip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Output Format</span>
                  <Chip color="secondary" size="sm" variant="flat">
                    {config.output?.format?.toUpperCase() || 'TXT'}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8"
        >
          <Card className="shadow-medium">
            <CardHeader>
              <h3 className="text-lg font-semibold">System Status</h3>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-success" />
                <span className="text-sm">Whisper Engine Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-success" />
                <span className="text-sm">Model Loaded: {config.model.default_size}</span>
              </div>
              {electronService.isElectron && systemResources ? (
                <div className="space-y-3">
                  <Progress 
                    label="CPU Usage" 
                    value={systemResources.cpuUsage} 
                    color={systemResources.cpuUsage > 80 ? "danger" : systemResources.cpuUsage > 60 ? "warning" : "success"}
                    showValueLabel={true}
                    className="max-w-md"
                    formatOptions={{ style: 'unit', unit: 'percent' }}
                  />
                  <Progress 
                    label="Memory Usage" 
                    value={systemResources.memoryUsage} 
                    color={systemResources.memoryUsage > 80 ? "danger" : systemResources.memoryUsage > 60 ? "warning" : "success"}
                    showValueLabel={true}
                    className="max-w-md"
                    formatOptions={{ style: 'unit', unit: 'percent' }}
                  />
                  <Progress 
                    label="System Load" 
                    value={systemResources.loadAverage} 
                    color={systemResources.loadAverage > 80 ? "danger" : systemResources.loadAverage > 60 ? "warning" : "success"}
                    showValueLabel={true}
                    className="max-w-md"
                    formatOptions={{ style: 'unit', unit: 'percent' }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span>System monitoring available in Electron mode only</span>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HomePage;
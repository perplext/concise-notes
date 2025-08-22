import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  DocumentTextIcon,
  FolderIcon,
  MicrophoneIcon,
  CogIcon,
  CloudIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

const navigationItems = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Transcribe', href: '/transcribe', icon: DocumentTextIcon },
  { name: 'Batch Process', href: '/batch', icon: FolderIcon },
  { name: 'Real-time', href: '/realtime', icon: MicrophoneIcon },
  { name: 'Models', href: '/models', icon: CloudIcon },
  { name: 'Settings', href: '/config', icon: CogIcon },
];

function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  return (
    <motion.div
      animate={{ width: isOpen ? 256 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 h-full flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <SpeakerWaveIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3"
            >
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Concise Notes
              </h1>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3"
                >
                  {item.name}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            <p>Version 0.1.0</p>
            <p className="mt-1">Fast local transcription</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default Sidebar;
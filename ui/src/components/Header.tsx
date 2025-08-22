import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import electronService from '../services/electronService';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/transcribe': 'Transcribe File',
  '/batch': 'Batch Processing',
  '/realtime': 'Real-time Transcription',
  '/models': 'Model Management',
  '/config': 'Settings',
};

function Header({ darkMode, onToggleDarkMode, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const currentPageName = pageNames[location.pathname] || 'Concise Note Taker';

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <motion.h1
              key={currentPageName}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {currentPageName}
            </motion.h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 relative">
            <BellIcon className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {darkMode ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* Environment indicator */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            (typeof window !== 'undefined' && '__TAURI_IPC__' in window) || electronService.isElectron
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              (typeof window !== 'undefined' && '__TAURI_IPC__' in window) || electronService.isElectron
                ? 'bg-blue-500'
                : 'bg-orange-500'
            }`}></div>
            <span>
              {(typeof window !== 'undefined' && '__TAURI_IPC__' in window) || electronService.isElectron ? 'Desktop' : 'Browser'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomePage from './pages/HomePage-nextui';
import TranscribePage from './pages/TranscribePage';
import BatchPage from './pages/BatchPage';
import RealtimePage from './pages/RealtimePage';
import ConfigPage from './pages/ConfigPage';
import ModelsPage from './pages/ModelsPage';
import ErrorBoundary from './components/ErrorBoundary';
import PageErrorBoundary from './components/PageErrorBoundary';
import { configApi } from './lib/api';
import type { AppConfig } from './lib/types';
import { useGlobalKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  // Set up global keyboard shortcuts
  useGlobalKeyboardShortcuts();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Load configuration on startup
    loadConfig();
    
    // Check for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    
    // Apply dark mode class
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const loadConfig = async () => {
    try {
      const appConfig = await configApi.getConfig();
      setConfig(appConfig);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateConfig = async (newConfig: AppConfig) => {
    try {
      await configApi.setConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  };

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out`}>
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route 
                path="/" 
                element={
                  <PageErrorBoundary pageName="Home">
                    <HomePage config={config} />
                  </PageErrorBoundary>
                } 
              />
              <Route 
                path="/transcribe" 
                element={
                  <PageErrorBoundary pageName="Transcribe">
                    <TranscribePage config={config} />
                  </PageErrorBoundary>
                } 
              />
              <Route 
                path="/batch" 
                element={
                  <PageErrorBoundary pageName="Batch Processing">
                    <BatchPage config={config} />
                  </PageErrorBoundary>
                } 
              />
              <Route 
                path="/realtime" 
                element={
                  <PageErrorBoundary pageName="Real-time">
                    <RealtimePage config={config} />
                  </PageErrorBoundary>
                } 
              />
              <Route 
                path="/models" 
                element={
                  <PageErrorBoundary pageName="Models">
                    <ModelsPage config={config} />
                  </PageErrorBoundary>
                } 
              />
              <Route 
                path="/config" 
                element={
                  <PageErrorBoundary pageName="Settings">
                    <ConfigPage 
                      config={config} 
                      onConfigUpdate={updateConfig} 
                    />
                  </PageErrorBoundary>
                } 
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
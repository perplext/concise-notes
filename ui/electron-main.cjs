const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const whisperService = require('./electron-whisper.cjs');

let mainWindow;

// Initialize Whisper on app start
async function initializeWhisper() {
  try {
    const initialized = await whisperService.initialize();
    if (initialized) {
      console.log('✅ Whisper service ready');
      // Load default model
      try {
        await whisperService.loadModel('base');
        console.log('✅ Default model (base) loaded');
      } catch (error) {
        console.log('⚠️ Could not load default model:', error.message);
      }
    } else {
      console.log('⚠️ Whisper service running in fallback mode');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Whisper:', error);
  }
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open-file');
          }
        },
        {
          label: 'Save Transcription',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save-transcription');
          }
        },
        { type: 'separator' },
        {
          label: 'New Transcription',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-transcription');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    
    // Navigate menu
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate-home');
          }
        },
        {
          label: 'Transcribe',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate-transcribe');
          }
        },
        {
          label: 'Batch Processing',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate-batch');
          }
        },
        {
          label: 'Real-time Mode',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate-realtime');
          }
        },
        {
          label: 'Model Management',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate-models');
          }
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'navigate-settings');
          }
        }
      ]
    },
    
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+?',
          click: () => {
            mainWindow.webContents.send('menu-action', 'show-shortcuts');
          }
        },
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/yourusername/concise-note-taker');
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.cjs'),
      // Enable media access
      webSecurity: true,
    },
    title: 'Concise Note Taker - Desktop',
    icon: path.join(__dirname, 'public', 'favicon.ico') // Add icon if available
  });

  // Set Content Security Policy for production
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"]
        }
      });
    });
  }

  // Load the existing React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', async () => {
    await whisperService.cleanup();
    mainWindow = null;
  });
}

// IPC Handlers for Whisper operations

// List available models
ipcMain.handle('list-models', async () => {
  return whisperService.listAvailableModels();
});

// Load a specific model
ipcMain.handle('load-model', async (event, modelSize) => {
  try {
    await whisperService.loadModel(modelSize);
    return { success: true, message: `Model ${modelSize} loaded successfully` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// File selection dialog
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'avi', 'mkv', 'webm', 'mov'] },
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'] },
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mkv', 'webm', 'mov'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

// Directory selection dialog
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

// Save file dialog
ipcMain.handle('save-file', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'SRT Subtitles', extensions: ['srt'] },
      { name: 'VTT Subtitles', extensions: ['vtt'] },
      { name: 'JSON', extensions: ['json'] }
    ]
  });
  return result.canceled ? null : result.filePath;
});

// Transcribe a file
ipcMain.handle('transcribe-file', async (event, filePath, options = {}) => {
  try {
    // Send initial progress
    mainWindow.webContents.send('transcription-progress', {
      stage: 'starting',
      progress: 0,
      message: 'Preparing transcription...'
    });

    // Check if we need to reload the model with different GPU setting
    const needsReload = !whisperService.whisperInstance || 
                       whisperService.currentModelSize !== options.modelSize ||
                       whisperService.currentUseGpu !== options.useGpu;
    
    if (needsReload && options.modelSize) {
      mainWindow.webContents.send('transcription-progress', {
        stage: 'loading_model',
        progress: 10,
        message: `Loading ${options.modelSize} model...`
      });
      await whisperService.loadModel(options.modelSize, { useGpu: options.useGpu });
    }

    // Send progress updates
    mainWindow.webContents.send('transcription-progress', {
      stage: 'processing',
      progress: 20,
      message: 'Processing audio file...'
    });

    // Set up progress callback for whisper service
    const progressCallback = (progressInfo) => {
      mainWindow.webContents.send('transcription-progress', progressInfo);
    };

    const result = await whisperService.transcribe(filePath, {
      language: options.language || 'auto',
      timestamps: options.timestamps || false,
      translate: options.translate || false,
      progressCallback
    });

    mainWindow.webContents.send('transcription-progress', {
      stage: 'complete',
      progress: 100,
      message: 'Transcription complete!'
    });

    return {
      success: true,
      text: result.text,
      segments: result.segments,
      language: result.language,
      duration: result.duration
    };
  } catch (error) {
    console.error('Transcription error:', error);
    mainWindow.webContents.send('transcription-progress', {
      stage: 'error',
      progress: 0,
      message: `Error: ${error.message}`
    });
    return {
      success: false,
      error: error.message
    };
  }
});

// Real-time transcription from audio buffer
ipcMain.handle('transcribe-realtime', async (event, audioBuffer) => {
  try {
    const result = await whisperService.transcribeRealtime(audioBuffer);
    return {
      success: true,
      ...result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Get system information
ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    whisperInitialized: whisperService.isInitialized,
    modelsPath: path.join(__dirname, '..', 'models')
  };
});

// Get system resource usage
ipcMain.handle('get-system-resources', async () => {
  const os = require('os');
  
  // Calculate CPU usage percentage
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const cpuUsage = 100 - ~~(100 * idle / total);
  
  // Calculate memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = Math.round((usedMem / totalMem) * 100);
  
  // Get load average (Unix systems)
  const loadAvg = os.loadavg();
  const loadAverage = loadAvg[0]; // 1-minute load average
  const numCPUs = os.cpus().length;
  const loadPercentage = Math.min(100, Math.round((loadAverage / numCPUs) * 100));
  
  return {
    cpuUsage: cpuUsage,
    memoryUsage: memUsage,
    loadAverage: loadPercentage,
    totalMemory: totalMem,
    freeMemory: freeMem,
    cpuCount: numCPUs
  };
});

// Get file information
ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      modifiedTime: stats.mtime,
      createdTime: stats.birthtime
    };
  } catch (error) {
    console.error('Failed to get file info:', error);
    return null;
  }
});

// Scan directory for media files (improved for network shares)
ipcMain.handle('scan-directory', async (event, dirPath) => {
  try {
    const mediaExtensions = ['.mp4', '.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.avi', '.mkv', '.webm', '.mov'];
    const files = [];
    
    // Normalize path for network shares (handle SMB paths on macOS)
    let normalizedPath = dirPath;
    if (process.platform === 'darwin' && dirPath.startsWith('/Volumes/')) {
      // macOS network shares are typically mounted under /Volumes
      normalizedPath = dirPath;
    } else if (process.platform === 'win32' && dirPath.startsWith('\\\\')) {
      // Windows UNC paths
      normalizedPath = dirPath;
    }
    
    // Add timeout for network operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Directory scan timeout - network share may be unresponsive')), 30000);
    });
    
    // Use async version for better network support
    const scanDir = async (dir) => {
      try {
        // First check if directory is accessible
        await fs.promises.access(dir, fs.constants.R_OK);
        
        const items = await fs.promises.readdir(dir);
        
        for (const item of items) {
          // Skip hidden files, system files, and metadata
          // - Files starting with . (hidden files on Unix/Mac/Linux)
          // - Files starting with ._ (macOS resource forks/metadata)
          // - .DS_Store (macOS folder metadata)
          // - Thumbs.db, desktop.ini (Windows system files)
          if (item.startsWith('.') || // All hidden files and ._ files
              item === 'Thumbs.db' || 
              item === 'desktop.ini' ||
              item === 'System Volume Information') {
            console.log(`Skipping system/hidden file: ${item}`);
            continue;
          }
          
          const fullPath = path.join(dir, item);
          try {
            // Use async stat for better network handling with individual file timeout
            const statPromise = fs.promises.stat(fullPath);
            const fileTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('File stat timeout')), 5000);
            });
            
            const stats = await Promise.race([statPromise, fileTimeoutPromise]);
            
            if (stats.isFile()) {
              const ext = path.extname(fullPath).toLowerCase();
              if (mediaExtensions.includes(ext)) {
                // Skip files that are too small to be valid media (< 1KB)
                if (stats.size < 1024) {
                  console.log(`Skipping file too small to be valid media: ${item} (${stats.size} bytes)`);
                  continue;
                }
                
                files.push({
                  path: fullPath,
                  name: path.basename(fullPath),
                  size: stats.size,
                  extension: ext,
                  modifiedTime: stats.mtime
                });
              }
            }
            // Optionally recurse into subdirectories
            // else if (stats.isDirectory()) {
            //   await scanDir(fullPath);
            // }
          } catch (err) {
            console.warn(`Could not access ${fullPath}:`, err.message);
            // Continue scanning other files even if one fails
          }
        }
      } catch (err) {
        console.error(`Failed to read directory ${dir}:`, err.message);
        throw err;
      }
    };
    
    // Race between scan operation and timeout
    await Promise.race([scanDir(normalizedPath), timeoutPromise]);
    return files;
  } catch (error) {
    console.error('Failed to scan directory:', error);
    // Return more detailed error info
    return { 
      error: true, 
      message: error.message,
      path: dirPath 
    };
  }
});

// Download model (returns instructions for now)
ipcMain.handle('download-model', async (event, modelSize) => {
  return whisperService.downloadModel(modelSize);
});

// Write text to file
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Read file
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Transcribe audio buffer (for record-then-transcribe)
ipcMain.handle('transcribe-audio-buffer', async (event, audioBuffer, options = {}) => {
  try {
    // Convert audio buffer to WAV file for Whisper
    const os = require('os');
    const tempDir = os.tmpdir();
    const tempWavPath = path.join(tempDir, `temp_recording_${Date.now()}.wav`);
    const tempWebmPath = path.join(tempDir, `temp_recording_${Date.now()}.webm`);
    
    try {
      // Write WebM audio to temp file
      fs.writeFileSync(tempWebmPath, Buffer.from(audioBuffer));
      
      // Convert WebM to WAV using ffmpeg
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      console.log('Converting WebM to WAV for transcription...');
      await execAsync(`ffmpeg -i "${tempWebmPath}" -ar 16000 -ac 1 -f wav "${tempWavPath}" -y`);
      
      // Ensure model is loaded
      if (!whisperService.currentModelSize && options.modelSize) {
        await whisperService.loadModel(options.modelSize);
      }
      
      // Transcribe the WAV file
      const result = await whisperService.transcribe(tempWavPath, {
        language: options.language || 'auto'
      });
      
      console.log('Transcription result type:', typeof result);
      console.log('Result properties:', Object.keys(result));
      
      // Clean up temp files
      if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
      if (fs.existsSync(tempWavPath)) fs.unlinkSync(tempWavPath);
      
      // Ensure text is a string
      let textResult = result.text;
      if (Array.isArray(textResult)) {
        textResult = textResult.map(segment => 
          typeof segment === 'string' ? segment : segment.text || ''
        ).join(' ').trim();
      }
      
      return {
        success: true,
        text: textResult || '',
        segments: result.segments || [],
        language: result.language || options.language
      };
    } catch (error) {
      // Clean up temp files on error
      if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
      if (fs.existsSync(tempWavPath)) fs.unlinkSync(tempWavPath);
      throw error;
    }
  } catch (error) {
    console.error('Audio buffer transcription error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle permission requests
app.on('web-contents-created', (event, contents) => {
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow microphone access
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });
});

// App event handlers
app.whenReady().then(async () => {
  await initializeWhisper();
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let server;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icon.icns'),
    title: 'Network Scanner'
  });

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Load URL after short delay (server is already ready)
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001');
  }, 500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    try {
      // Import and start the Express server in-process
      const serverModule = require('./server.js');
      server = serverModule.startServer();

      // Wait for server to be listening
      server.on('listening', () => {
        console.log('Server started successfully');
        resolve();
      });

      server.on('error', (error) => {
        console.error('Server error:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error starting server:', error);
      reject(error);
    }
  });
}

app.on('ready', async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start Network Scanner:\n\n${error.message}\n\nThe application will now quit.`
    );
    app.quit();
  }
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

app.on('before-quit', () => {
  if (server && server.listening) {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed successfully');
    });
  }
});

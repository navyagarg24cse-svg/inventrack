const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { URL } = require('url');

// ── Determine if we are running in dev (Vite dev server) or prod (built files) ──
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference so the window is not garbage-collected
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'InvenTrack — Inventory Management',
    // Use a plain icon if you add one later; remove the line if no icon file exists yet
    // icon: path.join(__dirname, 'public', 'favicon.svg'),
    webPreferences: {
      // Context isolation ON — keeps renderer sandboxed
      contextIsolation: true,
      // Node integration OFF — renderer cannot access Node APIs directly
      nodeIntegration: false,
      // Allow localStorage to persist across sessions
      partition: 'persist:inventrack',
      // Disable the default spell-checker (not needed for a business app)
      spellcheck: false,
    },
    // Start with a clean, frameless-looking window on Windows
    backgroundColor: '#f1f5f9', // matches Tailwind slate-100
    show: false, // show only after content is ready (avoids white flash)
  });

  // ── Load the app ──────────────────────────────────────────────────────
  if (isDev) {
    // Dev: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Prod: load the built index.html
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window once the page has finished loading (no white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // ── Security: open external links in the system browser, not Electron ──
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow devtools:// in dev mode
    if (isDev && url.startsWith('devtools://')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // ── Remove the default application menu (File / Edit / View …) ───────
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

# Network Scanner

A beautiful web-based GUI for scanning and viewing devices on your local network, designed for macOS.

## Features

- 🚀 Quick scan using ARP table
- 🔍 Full network scan with ping sweep
- 💻 Clean, modern UI with React
- 📊 Real-time device discovery
- 🎨 Beautiful gradient design
- 📱 Responsive layout

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

## Running the App

### Development Mode
```bash
npm start
```

Then open your browser to: http://localhost:3001

### Quick Start
The app will automatically:
- Detect your local IP address
- Start a web server on port 3001
- Serve the GUI interface

## Usage

### Quick Scan (Recommended)
- Click "Quick Scan (ARP)" to instantly see devices already in your ARP cache
- This is fast and shows devices you've recently communicated with

### Full Scan
- Click "Full Scan" to ping all IPs in your subnet (192.168.x.0/24)
- This takes longer but discovers all active devices
- The scan will ping 254 addresses and update the ARP table

## Creating a macOS App Bundle

To package this as a standalone macOS application, you can use Electron or create a simple app bundle:

### Option 1: Using Electron (Recommended)

Install Electron packager:
```bash
npm install --save-dev electron electron-packager
```

Create an Electron wrapper (see `electron-main.js` below).

Package for macOS:
```bash
npm run package
```

### Option 2: Simple App Bundle

Run the included script to create a basic .app bundle:
```bash
chmod +x create-app.sh
./create-app.sh
```

This creates `Network Scanner.app` in the `dist` folder.

## How It Works

1. **Backend (Node.js/Express)**
   - Scans the local network using system commands
   - Reads the ARP table for MAC addresses
   - Performs ping sweeps for full network discovery
   - Provides REST API endpoints

2. **Frontend (React)**
   - Clean, modern interface
   - Real-time updates
   - Responsive grid layout
   - Shows IP, MAC, and hostname for each device

## Security Notes

- This app requires network access permissions
- On macOS, you may need to grant Terminal or the app network privileges
- The app only scans your local subnet (192.168.x.x or similar)
- No data is sent outside your local network

## Troubleshooting

**Port already in use:**
- Change the PORT in `server.js` (default: 3001)

**Permission errors:**
- Some network scanning features may require elevated privileges
- Run with `sudo` if needed (not recommended for production)

**Can't find devices:**
- Make sure you're on the same network
- Try the Full Scan option
- Check your firewall settings

## Technical Stack

- **Backend**: Node.js, Express
- **Frontend**: React 18, Vanilla CSS
- **Network Tools**: ARP, Ping, system commands
- **Packaging**: Electron (optional)

## License

MIT

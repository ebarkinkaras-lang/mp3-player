# Futuristic MP3 Player 🎵

A beautifully designed, cyberpunk/futuristic themed local MP3 player built with Web Technologies and packaged with Electron.

## ✨ Features

- **Futuristic UI:** Stunning dark theme with neon glowing elements, glassmorphism panels, and smooth micro-animations.
- **Dynamic Visualizers:** Features 3 real-time interactive Web Audio API spectrum visualizers:
  - Bar Spectrum
  - Waveform
  - Circular Visualization
- **8 Color Themes:** Instantly switch between Cyber Blue, Crimson Red, Matrix Green, Neon Purple, Amber Orange, Hot Pink, Gold, and Teal.
- **Advanced Equalizer:** 10-band audio equalizer with 7 built-in presets (Flat, Rock, Pop, Jazz, Classical, Bass Boost, Treble Boost).
- **Folder & File Support:** Import single MP3 files, or import an entire folder of music with a single click. Drag and drop is also supported.
- **Standalone Desktop App:** Packaged as a portable `.exe` file for Windows.

## 🚀 How to Run

### Development Mode
1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   ```bash
   npm start
   ```

## 📦 Building the Portable EXE

To compile the application into a standalone Windows executable:

```bash
npm run build
```
The resulting portable `.exe` will be generated in the `dist/` directory.

## 🛠 Technology Stack
- **Frontend Core:** HTML5, CSS3, Vanilla JavaScript
- **Audio Engine:** Web Audio API (MediaElementSource, Analyser, BiquadFilter)
- **Desktop Packaging:** Electron, electron-builder

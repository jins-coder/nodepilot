<div align="center">

# 🚀 NodePilot

**A high-performance, modern desktop GUI for managing Node.js versions on Windows.**  
*Powered by Tauri 2, React 18, TypeScript, Tailwind CSS, and Rust.*

[![Version](https://img.shields.io/badge/version-1.0.1-6366f1.svg?style=flat-square)](https://github.com/jins-coder/nodepilot/releases/tag/v1.0.1)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](https://github.com/jins-coder/nodepilot/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue.svg?style=flat-square)](https://github.com/jins-coder/nodepilot)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-orange.svg?style=flat-square)](https://tauri.app/)

<br />

<img src="./screenshots/dashboard.png" alt="NodePilot Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.25);" />

</div>

---

## ✨ Features

- ⚡ **Instant Runtime Switching** — Switch between installed Node.js versions with 1 click (via native `nvm-windows` symlink management).
- 📦 **One-Click Release Downloader** — Browse official releases from nodejs.org with LTS, Current, and Installed pill badges.
- 🛑 **Midway Cancel Protection** — Cancel active downloads or installations safely at any moment with automatic process cleanup.
- 💾 **Drive C: Overflow Safeguard** — Automatic temp path fallback preventing "Disk Full" extraction failures on constrained system drives.
- 🎨 **Adaptive Theme Engine** — High-contrast Dark, Light, and System modes with animated View Transitions.
- 📊 **Activity & Telemetry Log** — Detailed execution history with exit codes, timestamps, and full stdout/stderr capture.
- 🖥️ **Integrated Terminal Drawer** — Real-time command streaming and diagnostics console.
- 🔒 **Enterprise-Grade Security** — Command injection mitigation, strict SemVer validation, and direct process execution without shell string interpolation.

---

## 📥 Download & Installation

### Option 1: Install via Windows Package Manager (`winget`)
```powershell
winget install NodePilot
```

### Option 2: Download Direct Installers (GitHub Releases)
Head over to the [**Releases Page**](https://github.com/jins-coder/nodepilot/releases/latest) to download:
- **`NodePilot_1.0.1_x64-setup.exe`** — Standard Windows Setup Wizard (Signed NSIS Installer)
- **`NodePilot_1.0.1_x64_en-US.msi`** — Enterprise Windows MSI Package
- **`nodepilot.exe`** — Standalone Portable Binary (No installation required)

---

## 🛠️ Requirements

- **Operating System**: Windows 10 or Windows 11 (64-bit)
- **nvm-windows**: Version 1.1.x or newer ([Download nvm-windows](https://github.com/coreybutler/nvm-windows/releases))
- **Administrator Privileges**: Required to switch active Node.js versions (creates system symlinks)

---

## 💻 Development & Build Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Rust & Cargo](https://www.rust-lang.org/) (v1.77+ with MSVC toolchain)
- Visual Studio C++ Build Tools

### 2. Clone & Install Dependencies
```powershell
git clone https://github.com/jins-coder/nodepilot.git
cd nodepilot
npm install
```

### 3. Run in Development Mode
```powershell
.\run.ps1
# or
npm run tauri dev
```

### 4. Build Production Installers Locally
```powershell
$env:TEMP = "e:\Envision\.tmp"
$env:TMP = "e:\Envision\.tmp"
npm run tauri build
```
Production packages will be generated inside:
`src-tauri/target/release/bundle/`

### 5. Sign Binaries (Authenticode)
```powershell
powershell -ExecutionPolicy Bypass -File .\sign-installers.ps1
```

### 📖 Full Publishing & Winget Guide
For complete instructions on publishing to GitHub Releases and Microsoft Winget, see the [**Release & Winget Guide**](docs/RELEASE_AND_WINGET_GUIDE.md).

---

## 🏗️ Architecture

```
nodepilot/
├── src/                          # React 18 Frontend
│   ├── components/               # Layout, Navigation, Modals, Terminal, Badges
│   ├── hooks/                    # useNvm, useInstall (state orchestration)
│   ├── pages/                    # Dashboard, Versions, Install, Activity, Settings
│   ├── services/                 # Tauri IPC Bridge and API layers
│   ├── stores/                   # Zustand global state
│   └── utils/                    # Version parsing, sorting, theme engine
│
├── src-tauri/                    # Rust Backend (Tauri 2)
│   ├── src/commands/             # #[tauri::command] IPC endpoints
│   ├── src/platform/windows/     # nvm-windows detection, symlink resolution
│   ├── src/utils/                # Process runner with PID tracking & signal kill
│   └── Cargo.toml                # Rust dependencies & metadata
│
├── screenshots/                  # Preview captures for documentation
└── winget/                       # Official Windows Package Manager manifests
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/jins-coder/nodepilot/issues).

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

# 🚀 NodePilot Release & Winget Publishing Guide

This guide explains how to attach download installers to **GitHub Releases** and submit NodePilot to **Windows Package Manager (`winget`)**.

---

## 📌 Part 1: GitHub Release Setup (Upload Installers)

Because you have already pushed the tag `v1.0.2`, follow these steps to make the installers downloadable to everyone:

### Step 1: Open the GitHub Release Page
👉 Go to: **[https://github.com/jins-coder/nodepilot/releases/tag/v1.0.2](https://github.com/jins-coder/nodepilot/releases/tag/v1.0.2)**

### Step 2: Edit the Release
- Click the **"Edit Release"** or **"Draft a new release"** button on the top-right.
- Title the release: `NodePilot v1.0.2`

### Step 3: Attach the Built Installers
Drag and drop these files from your computer into the **"Attach binaries by dropping them here"** section:

1. **NSIS Setup Wizard (`.exe`)**:
   ```
   E:\Envision\nvmgui\src-tauri\target\release\bundle\nsis\NodePilot_1.0.2_x64-setup.exe
   ```
2. **MSI Enterprise Package (`.msi`)**:
   ```
   E:\Envision\nvmgui\src-tauri\target\release\bundle\msi\NodePilot_1.0.2_x64_en-US.msi
   ```

### Step 4: Click "Publish Release"
Once uploaded, anyone around the world can download and install NodePilot!

---

## 📦 Part 2: Publishing to Windows Package Manager (`winget`)

Publishing to `winget` allows any Windows user to install NodePilot by typing:
```powershell
winget install NodePilot
```

The manifest files have already been prepared in your repo under `winget/manifests/j/jins-coder/NodePilot/1.0.2/`.

### Step 1: Install `wingetcreate`
Run PowerShell as Administrator:
```powershell
winget install Microsoft.WingetCreate
```
*(Restart your PowerShell window after installing)*

### Step 2: Get a GitHub Personal Access Token (PAT)
1. Go to: [GitHub Settings → Developer Settings → Personal Access Tokens (Classic)](https://github.com/settings/tokens/new)
2. Note: `Winget Submission`
3. Expiration: `30 days`
4. Check the scope: **`public_repo`** (required for `wingetcreate` to open a PR on `microsoft/winget-pkgs`)
5. Click **Generate Token** and copy it.

### Step 3: Submit the Manifest to Microsoft
In your PowerShell inside `e:\Envision\nvmgui`, run:
```powershell
wingetcreate submit winget\manifests\j\jins-coder\NodePilot\1.0.2 --token YOUR_GITHUB_TOKEN
```

### What Happens Next?
1. `wingetcreate` automatically forks `microsoft/winget-pkgs` and submits a Pull Request on your behalf.
2. Microsoft's automated Azure Pipelines bot will validate the installer, run security scans, and test installation in a clean Windows Sandbox.
3. Once the bot marks it as passed, the PR is automatically merged within a few hours.
4. **NodePilot** becomes available worldwide via `winget install NodePilot`!

---

## 🔄 Releasing Future Versions (e.g. v1.0.2)

For future releases:
1. Bump the version in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
2. Run:
   ```powershell
   $env:TEMP = "e:\Envision\.tmp"; $env:TMP = "e:\Envision\.tmp"
   npm run tauri build
   powershell -ExecutionPolicy Bypass -File .\sign-installers.ps1
   ```
3. Tag and push to GitHub:
   ```powershell
   git add .
   git commit -m "chore(release): bump version to v1.0.2"
   git tag v1.0.2
   git push origin main
   git push origin v1.0.2
   ```
4. Upload the new `.exe` and `.msi` to GitHub Releases, update the winget manifests, and submit with `wingetcreate`!

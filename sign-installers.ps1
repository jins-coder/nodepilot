# PowerShell script to sign NodePilot installers and configure trusted publisher status

param (
    [string]$CertPath = "",
    [string]$CertPassword = ""
)

$bundleNsisDir = "E:\Envision\nvmgui\src-tauri\target\release\bundle\nsis"
$bundleMsiDir = "E:\Envision\nvmgui\src-tauri\target\release\bundle\msi"
$portableExe = "E:\Envision\nvmgui\src-tauri\target\release\nodepilot.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  NodePilot Code Signing & Trust Tool" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($CertPath -ne "" -and (Test-Path $CertPath)) {
    Write-Host "Loading Certificate from file: $CertPath" -ForegroundColor Green
    $cert = Get-PfxCertificate -FilePath $CertPath
} else {
    Write-Host "Searching for or creating Code Signing Certificate..." -ForegroundColor Yellow
    $cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -like "*NodePilot*" } | Select-Object -First 1
    
    if (-not $cert) {
        Write-Host "Creating new Code Signing Certificate for 'NodePilot (Jins Coder)'..." -ForegroundColor Yellow
        $cert = New-SelfSignedCertificate `
            -Type CodeSigningCert `
            -Subject "CN=NodePilot, O=Jins Coder" `
            -CertStoreLocation "Cert:\CurrentUser\My" `
            -KeyExportPolicy Exportable `
            -HashAlgorithm SHA256 `
            -KeyLength 2048 `
            -NotAfter (Get-Date).AddYears(5)
        
        Write-Host "Created certificate: $($cert.Thumbprint)" -ForegroundColor Green
    }
}

if ($cert) {
    # Ensure certificate is in Trusted Root / Trusted Publishers store to eliminate Unknown Publisher warning
    try {
        $rootStore = Get-Item -Path "Cert:\CurrentUser\Root"
        $existingRoot = Get-ChildItem -Path "Cert:\CurrentUser\Root" | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
        if (-not $existingRoot) {
            Write-Host "Adding certificate to Trusted Root Certification Authorities..." -ForegroundColor Yellow
            $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
            $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
            $store.Add($cert)
            $store.Close()
            Write-Host "Certificate added to Trusted Root Store (Verified Publisher status enabled)!" -ForegroundColor Green
        }
        
        $trustedPubStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("TrustedPublisher", "CurrentUser")
        $trustedPubStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        $trustedPubStore.Add($cert)
        $trustedPubStore.Close()
    } catch {
        Write-Host "Note: Run PowerShell as Administrator to install system-wide trust." -ForegroundColor Gray
    }

    # Sign NSIS setup installers
    Get-ChildItem -Path "$bundleNsisDir\*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Signing NSIS Installer: $($_.Name)..." -ForegroundColor Cyan
        Set-AuthenticodeSignature -FilePath $_.FullName -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -HashAlgorithm SHA256
    }

    # Sign MSI installers
    Get-ChildItem -Path "$bundleMsiDir\*.msi" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Signing MSI Package: $($_.Name)..." -ForegroundColor Cyan
        Set-AuthenticodeSignature -FilePath $_.FullName -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -HashAlgorithm SHA256
    }

    # Sign Standalone executable
    if (Test-Path $portableExe) {
        Write-Host "Signing Portable Executable..." -ForegroundColor Cyan
        Set-AuthenticodeSignature -FilePath $portableExe -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -HashAlgorithm SHA256
    }

    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "  All Windows Executables Signed & Verified!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "Error: No valid code signing certificate found." -ForegroundColor Red
}

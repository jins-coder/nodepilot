# PowerShell script to sign NodePilot installers

param (
    [string]$CertPath = "",
    [string]$CertPassword = ""
)

$exePath = "E:\Envision\nvmgui\src-tauri\target\release\bundle\nsis\NodePilot_1.0.0_x64-setup.exe"
$msiPath = "E:\Envision\nvmgui\src-tauri\target\release\bundle\msi\NodePilot_1.0.0_x64_en-US.msi"
$portableExe = "E:\Envision\nvmgui\src-tauri\target\release\nodepilot.exe"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  NodePilot v1.0.0 Code Signing Tool" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($CertPath -ne "" -and (Test-Path $CertPath)) {
    Write-Host "Loading Certificate from file: $CertPath" -ForegroundColor Green
    $secPass = ConvertTo-SecureString $CertPassword -AsPlainText -Force
    $cert = Get-PfxCertificate -FilePath $CertPath
} else {
    Write-Host "Searching for or creating Self-Signed Code Signing Certificate..." -ForegroundColor Yellow
    $cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert | Select-Object -First 1
    
    if (-not $cert) {
        Write-Host "Creating new Self-Signed Certificate for 'NodePilot'..." -ForegroundColor Yellow
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
    Write-Host "`nSigning NSIS Setup Executable..." -ForegroundColor Cyan
    Set-AuthenticodeSignature -FilePath $exePath -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -HashAlgorithm SHA256

    Write-Host "`nSigning Standalone Portable Executable..." -ForegroundColor Cyan
    Set-AuthenticodeSignature -FilePath $portableExe -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -HashAlgorithm SHA256

    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "  All Windows Executables Signed Successfully!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "Error: No valid code signing certificate found." -ForegroundColor Red
}

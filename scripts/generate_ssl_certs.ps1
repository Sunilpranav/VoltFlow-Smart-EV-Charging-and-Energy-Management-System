<#
.SYNOPSIS
    Generates self-signed TLS certificates for VoltFlow local testing on Windows.
#>
param (
    [string]$Domain = "localhost",
    [string]$CertDir = ".\certs"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir -Force | Out-Null
}

$keyPath = Join-Path $CertDir "server.key"
$crtPath = Join-Path $CertDir "server.crt"

Write-Host "[INFO] Generating self-signed TLS certificates for domain: $Domain..." -ForegroundColor Cyan

# Check if OpenSSL is available
$openSsl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openSsl) {
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
      -keyout $keyPath `
      -out $crtPath `
      -subj "/C=US/ST=California/L=San Francisco/O=VoltFlow/CN=$Domain" `
      -addext "subjectAltName=DNS:$Domain,DNS:*.$Domain,IP:127.0.0.1"
    Write-Host "[SUCCESS] OpenSSL certificates created in $CertDir" -ForegroundColor Green
} else {
    Write-Host "[INFO] OpenSSL CLI not found. Generating self-signed certificate using PowerShell New-SelfSignedCertificate..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate -DnsName $Domain, "localhost", "127.0.0.1" -CertStoreLocation "Cert:\CurrentUser\My"
    
    # Export cert and key
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    [System.IO.File]::WriteAllBytes($crtPath, $certBytes)
    
    Write-Host "[SUCCESS] Self-signed certificate exported to $crtPath. For production, supply official CA certs." -ForegroundColor Green
}

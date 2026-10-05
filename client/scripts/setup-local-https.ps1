$ErrorActionPreference = 'Stop'

$clientRoot = Split-Path -Parent $PSScriptRoot
$certificateDirectory = Join-Path $clientRoot '.cert'
$keyPath = Join-Path $certificateDirectory 'lan-key.pem'
$certificatePath = Join-Path $certificateDirectory 'lan-cert.pem'
$derCertificatePath = Join-Path $certificateDirectory 'lan-cert.cer'

if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
  throw 'OpenSSL is required. Install OpenSSL or Git for Windows, then run this script again.'
}

$lanAddresses = @(
  Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred |
    Where-Object {
      $_.IPAddress -ne '127.0.0.1' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Docker|WSL'
    } |
    Select-Object -ExpandProperty IPAddress -Unique
)

if ($lanAddresses.Count -eq 0) {
  throw 'No LAN IPv4 address was found. Connect to the network and try again.'
}

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null
$subjectAlternativeNames = (@('DNS:localhost', 'IP:127.0.0.1') + ($lanAddresses | ForEach-Object { "IP:$_" })) -join ','

& openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 365 `
  -keyout $keyPath `
  -out $certificatePath `
  -subj '/CN=localhost' `
  -addext "subjectAltName=$subjectAlternativeNames"
if ($LASTEXITCODE -ne 0) {
  throw 'OpenSSL could not create the HTTPS certificate.'
}

& openssl x509 -in $certificatePath -outform DER -out $derCertificatePath
if ($LASTEXITCODE -ne 0) {
  throw 'OpenSSL could not export the certificate for Windows trust.'
}

Import-Certificate -FilePath $derCertificatePath -CertStoreLocation 'Cert:\CurrentUser\Root' | Out-Null

Write-Output "Trusted a local development certificate for: $($lanAddresses -join ', ')"
Write-Output 'Restart the client dev server and open https://<LAN-IP>:5173.'
Write-Output "To use another device, install this certificate there: $derCertificatePath"

# Start CardBeamz backend (uses Maven under %USERPROFILE%\tools)
$ErrorActionPreference = 'Stop'
$maven = Join-Path $env:USERPROFILE 'tools\apache-maven-3.9.6\bin\mvn.cmd'
if (-not (Test-Path $maven)) {
  Write-Error "Maven not found: $maven"
}
Set-Location $PSScriptRoot

# Optional: cloudinary.local.ps1 sets CLOUDINARY_API_KEY / SECRET
$localEnv = Join-Path $PSScriptRoot 'cloudinary.local.ps1'
if (Test-Path $localEnv) {
  . $localEnv
  Write-Host 'Loaded cloudinary.local.ps1'
}

# If application-local.yml exists, enable Spring profile "local"
$localYml = Join-Path $PSScriptRoot 'src\main\resources\application-local.yml'
$runArgs = @()
if (Test-Path $localYml) {
  $runArgs += '-Dspring-boot.run.profiles=local'
  Write-Host 'Using Spring profile: local (application-local.yml)'
} else {
  Write-Host 'Hint: create application-local.yml for Cloudinary Admin API keys.'
  Write-Host '  copy src\main\resources\application-local.yml.example src\main\resources\application-local.yml'
}

& $maven spring-boot:run @runArgs @args

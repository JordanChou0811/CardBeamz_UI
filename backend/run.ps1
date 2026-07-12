# 啟動 CardBeamz 後端（不依賴系統 PATH 的 mvn / mvnw）
$ErrorActionPreference = "Stop"
$maven = Join-Path $env:USERPROFILE "tools\apache-maven-3.9.6\bin\mvn.cmd"
if (-not (Test-Path $maven)) {
  Write-Error "找不到 Maven：$maven`n請確認已安裝到 %USERPROFILE%\tools\apache-maven-3.9.6"
}
Set-Location $PSScriptRoot
& $maven spring-boot:run @args

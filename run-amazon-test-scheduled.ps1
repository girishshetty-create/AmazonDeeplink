$ErrorActionPreference = 'Continue'
$repo = 'D:\QA-Initiatives\Amazon-Deeplink'
Set-Location $repo

$logDir = Join-Path $repo 'logs'
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logDir "run-$timestamp.log"

& npx playwright test tests/amazoninks.spec.ts --reporter=list *> $logFile

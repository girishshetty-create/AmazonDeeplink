$ErrorActionPreference = 'Continue'
$repo = 'D:\QA-Initiatives\Amazon-Deeplink'
Set-Location $repo

$logDir = Join-Path $repo 'logs'
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logDir "run-$timestamp.log"

$testResultsDir = Join-Path $repo 'test-results'
if (Test-Path $testResultsDir) {
    Remove-Item -Recurse -Force $testResultsDir -ErrorAction SilentlyContinue
}

& npx playwright test tests/amazoninks.spec.ts --reporter=list *>&1 | Out-File -FilePath $logFile -Encoding utf8
$testExitCode = $LASTEXITCODE

$credFile = Join-Path $repo 'mail-credentials.local.ps1'
if (Test-Path $credFile) {
    . $credFile   # defines $MailFrom and $MailAppPassword

    $status = if ($testExitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $subject = "Amazon Deeplink Test - $status"
    $body = @"
Scheduled Amazon Deeplink test (local Windows Task Scheduler) finished with status: $status
Time: $timestamp
Log file: $logFile
"@

    try {
        $secPassword = ConvertTo-SecureString $MailAppPassword -AsPlainText -Force
        $mailCred = New-Object System.Management.Automation.PSCredential($MailFrom, $secPassword)
        Send-MailMessage -From $MailFrom -To 'girish.shetty@miko.ai', 'qa@miko.ai' -Subject $subject -Body $body `
            -SmtpServer 'smtp.gmail.com' -Port 587 -UseSsl -Credential $mailCred
    } catch {
        Add-Content -Path $logFile -Value "`nFailed to send status email: $_"
    }
} else {
    Add-Content -Path $logFile -Value "`nmail-credentials.local.ps1 not found - skipping email report. Copy mail-credentials.local.ps1.example and fill in your Gmail app password."
}

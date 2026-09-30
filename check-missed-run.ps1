$repo = 'D:\QA-Initiatives\Amazon-Deeplink'
$logDir = Join-Path $repo 'logs'

$now = Get-Date
$dow = $now.DayOfWeek

if ($dow -eq 'Tuesday' -or $dow -eq 'Thursday') {
    $scheduledTime = Get-Date -Hour 12 -Minute 30 -Second 0

    if ($now -ge $scheduledTime) {
        $todayPattern = "run-$($now.ToString('yyyyMMdd'))-*.log"
        $existing = $null
        if (Test-Path $logDir) {
            $existing = Get-ChildItem -Path $logDir -Filter $todayPattern -ErrorAction SilentlyContinue
        }

        if (-not $existing) {
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show(
                "The scheduled Amazon Deeplink test (12:30 PM, $dow) has not run yet today - you likely weren't logged in at the scheduled time.`n`nRun it manually: run-amazon-test.bat in the project folder.",
                "Amazon Deeplink Test - Missed Run",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Warning
            ) | Out-Null
        }
    }
}

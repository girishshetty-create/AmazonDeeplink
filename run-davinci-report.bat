@echo off
cd /d "%~dp0"
echo Generating Davinci deeplink report...
call npx playwright test tests/davinci-deeplink-report.spec.ts --project=chromium --reporter=list
echo.
echo Opening latest report from the reports folder...
for /f "delims=" %%f in ('dir /b /o-d "reports\davinci-deeplink-report-*.html"') do (
  start "" "reports\%%f"
  goto :done
)
:done
pause

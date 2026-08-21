@echo off
title Amazon Links Test
echo Running Amazon product link checks...
echo.

npx playwright test tests/amazoninks.spec.ts --headed

echo.
echo Done. Opening the report...
npx playwright show-report

pause

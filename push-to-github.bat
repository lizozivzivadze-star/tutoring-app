@echo off
REM ეს ფაილი უნდა ჩაანაცვლოთ პროექტის root საქაღალდეში
REM (იმავე ადგილას, სადაც არის .git საქაღალდე)

cd /d "%~dp0"

echo === ცვლილებების დამატება ===
git add -A

set /p msg="Commit-ის შეტყობინება (Enter-ს დააჭირეთ default-ისთვის): "
if "%msg%"=="" set msg=Update %date% %time%

echo === Commit-ის შექმნა ===
git commit -m "%msg%"

echo === Push GitHub-ზე ===
git push

echo.
echo === დასრულდა ===
pause

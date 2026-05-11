Write-Host "=== Tracked log files (should be empty) ===" -ForegroundColor Yellow
git ls-files | Select-String -Pattern 'build.+\.(log|txt)$'

Write-Host "`n=== Untracked log files NOT ignored ===" -ForegroundColor Yellow
git ls-files --others --exclude-standard | Select-String -Pattern '\.(log|txt)$'

Write-Host "`n=== Ignored build files ===" -ForegroundColor Yellow
git ls-files --others --ignored --exclude-standard | Select-String -Pattern 'build'
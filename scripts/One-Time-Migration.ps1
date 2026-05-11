# one-time-cleanup.ps1

Write-Host "=== Step 1: Updating .gitignore ===" -ForegroundColor Cyan
$patterns = @('build*.log', 'build*.txt', 'build-*.log', 'build-*.txt', '*.log')
$content = Get-Content .gitignore -ErrorAction SilentlyContinue
foreach ($p in $patterns) {
    if ($content -notcontains $p) {
        Add-Content .gitignore $p
        Write-Host "  Added: $p"
    }
}

Write-Host "=== Step 2: Removing tracked log files ===" -ForegroundColor Cyan
$tracked = git ls-files | Select-String -Pattern 'build.+\.(log|txt)$'
foreach ($file in $tracked) {
    Write-Host "  Untracking: $file"
    git rm --cached $file.Line
}

Write-Host "=== Step 3: Committing ===" -ForegroundColor Cyan
git add .gitignore
git commit -m "chore: untrack build logs and strengthen .gitignore"

Write-Host "=== Done. Run: git push ===" -ForegroundColor Green
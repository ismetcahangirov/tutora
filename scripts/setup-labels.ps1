# setup-labels.ps1 — Create or update all Tutora GitHub labels from .github/labels.json
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated:  gh auth login
#   - No extra tools needed — PowerShell's built-in ConvertFrom-Json is used.
#
# Usage (run from the repo root):
#   .\scripts\setup-labels.ps1
#
# The --force flag means existing labels are updated rather than erroring out.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent $PSScriptRoot
$labelsFile = Join-Path $repoRoot '.github\labels.json'

if (-not (Test-Path $labelsFile)) {
    Write-Error "Labels file not found at: $labelsFile"
    exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is not installed or not in PATH.`nInstall it from https://cli.github.com/ and run 'gh auth login'."
    exit 1
}

$labels = Get-Content $labelsFile -Raw | ConvertFrom-Json
$total  = $labels.Count
$count  = 0

Write-Host "Setting up $total labels from $labelsFile ..."
Write-Host ""

foreach ($label in $labels) {
    $count++
    $name        = $label.name
    $color       = $label.color
    $description = $label.description

    Write-Host "  [$count/$total] $name"

    gh label create $name `
        --color $color `
        --description $description `
        --force
}

Write-Host ""
Write-Host "Done. All labels created / updated."

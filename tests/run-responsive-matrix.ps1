param(
  [int[]]$Widths = @(1440, 1280, 1080, 1024, 840, 620)
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$shellSmoke = Join-Path $scriptRoot "run-shell-smoke.ps1"
$workspaces = @("projects", "regions", "translate")
$summaries = @()

foreach ($width in $Widths) {
  $height = if ($width -le 1024) { 900 } else { 1000 }
  Write-Host "Checking Map and Properties at ${width}px..."
  $previewResult = & $shellSmoke -Workspace preview -LoadSample -Width $width -Height $height -StrictDiagnostics -SkipScreenshot | ConvertFrom-Json
  $summaries += [ordered]@{
    width = $width
    surface = "preview-properties"
    checks = $previewResult.checks.Count
    status = $previewResult.status
  }
  foreach ($workspace in $workspaces) {
    Write-Host "Checking $workspace table at ${width}px..."
    $result = & $shellSmoke -Workspace $workspace -LoadSample -TableLayoutOnly -Width $width -Height $height -StrictDiagnostics -SkipScreenshot | ConvertFrom-Json
    $summaries += [ordered]@{
      width = $width
      surface = $workspace
      checks = $result.checks.Count
      status = $result.status
    }
  }
}

[ordered]@{
  status = "ok"
  scenarios = $summaries.Count
  summaries = $summaries
} | ConvertTo-Json -Depth 5

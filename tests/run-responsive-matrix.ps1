param(
  [int[]]$Widths = @(1440, 1280, 1024),
  [ValidateSet("left", "right")]
  [string[]]$PropertiesSides = @("left", "right")
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$shellSmoke = Join-Path $scriptRoot "run-shell-smoke.ps1"
$workspaces = @("projects", "regions", "translate")
$summaries = @()

foreach ($width in $Widths) {
  $height = if ($width -le 1024) { 900 } else { 1000 }
  foreach ($side in $PropertiesSides) {
    foreach ($workspace in $workspaces) {
      Write-Host "Checking $workspace at ${width}px with $side Properties..."
      $result = & $shellSmoke -Workspace $workspace -LoadSample -TableLayoutOnly -Width $width -Height $height -PropertiesSide $side -StrictDiagnostics -SkipScreenshot | ConvertFrom-Json
      $summaries += [ordered]@{
        width = $width
        side = $side
        workspace = $workspace
        checks = $result.checks.Count
        status = $result.status
      }
    }
  }
}

[ordered]@{
  status = "ok"
  scenarios = $summaries.Count
  summaries = $summaries
} | ConvertTo-Json -Depth 5

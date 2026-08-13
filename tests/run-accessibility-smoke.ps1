param(
  [switch]$ReportOnly
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$shellSmoke = Join-Path $scriptRoot "run-shell-smoke.ps1"
$outputRoot = Join-Path $scriptRoot "smoke-output\accessibility"
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$scenarios = @(
  @{ Name = "preview"; Parameters = @{ Workspace = "preview"; LoadSample = $true; VisualCapture = $true } },
  @{ Name = "projects"; Parameters = @{ Workspace = "projects"; LoadSample = $true; VisualCapture = $true } },
  @{ Name = "regions"; Parameters = @{ Workspace = "regions"; LoadSample = $true; VisualCapture = $true } },
  @{ Name = "translate"; Parameters = @{ Workspace = "translate"; LoadSample = $true; VisualCapture = $true } },
  @{ Name = "quality"; Parameters = @{ Workspace = "quality"; LoadSample = $true; VisualCapture = $true } },
  @{ Name = "feedback"; Parameters = @{ Dialog = "feedback" } },
  @{ Name = "map-details"; Parameters = @{ Dialog = "map-details" } },
  @{ Name = "csv-map"; Parameters = @{ Dialog = "csv-map" } },
  @{ Name = "point-catalog"; Parameters = @{ Dialog = "point-catalog"; CatalogOrigin = "projects" } },
  @{ Name = "shortcuts"; Parameters = @{ Dialog = "shortcuts" } },
  @{ Name = "export-menu"; Parameters = @{ Dialog = "export-menu" } },
  @{ Name = "project-load-error"; Parameters = @{ Dialog = "project-load-error" } }
)

$summaries = foreach ($scenario in $scenarios) {
  Write-Host "Auditing $($scenario.Name)..."
  $parameters = @{} + $scenario.Parameters
  $parameters.SkipScreenshot = $true
  $parameters.StrictDiagnostics = $true
  if ($ReportOnly) { $parameters.AccessibilityAudit = $true }
  else { $parameters.EnforceAccessibility = $true }
  $parameters.AccessibilityReportPath = Join-Path $outputRoot "$($scenario.Name).json"
  & $shellSmoke @parameters | ConvertFrom-Json
}

[ordered]@{
  status = "ok"
  scenarios = $summaries.Count
  violations = ($summaries | ForEach-Object { $_.runner.accessibility.violations } | Measure-Object -Sum).Sum
  incomplete = ($summaries | ForEach-Object { $_.runner.accessibility.incomplete } | Measure-Object -Sum).Sum
  reports = $summaries.accessibilityReport
} | ConvertTo-Json -Depth 5

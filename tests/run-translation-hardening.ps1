param(
  [switch]$SkipScreenshot
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$shellSmoke = Join-Path $scriptRoot "run-shell-smoke.ps1"

$scenarios = @(
  @{ Name = "workspace-preview-empty"; Parameters = @{ Workspace = "preview" } },
  @{ Name = "workspace-preview-sample"; Parameters = @{ Workspace = "preview"; LoadSample = $true } },
  @{ Name = "workspace-projects"; Parameters = @{ Workspace = "projects"; LoadSample = $true } },
  @{ Name = "workspace-regions"; Parameters = @{ Workspace = "regions"; LoadSample = $true } },
  @{ Name = "workspace-translate"; Parameters = @{ Workspace = "translate"; LoadSample = $true } },
  @{ Name = "workspace-quality"; Parameters = @{ Workspace = "quality"; LoadSample = $true } },
  @{ Name = "dialog-startup"; Parameters = @{ Dialog = "startup" } },
  @{ Name = "dialog-feedback"; Parameters = @{ Dialog = "feedback" } },
  @{ Name = "dialog-map-details"; Parameters = @{ Dialog = "map-details" } },
  @{ Name = "dialog-csv-map"; Parameters = @{ Dialog = "csv-map" } },
  @{ Name = "dialog-point-catalog"; Parameters = @{ Dialog = "point-catalog" } },
  @{ Name = "dialog-confirmation"; Parameters = @{ Dialog = "confirmation" } },
  @{ Name = "dialog-shortcuts"; Parameters = @{ Dialog = "shortcuts" } },
  @{ Name = "dialog-export-menu"; Parameters = @{ Dialog = "export-menu" } },
  @{ Name = "menu-add-data"; Parameters = @{ Dialog = "add-data-menu" } },
  @{ Name = "dialog-project-load-error"; Parameters = @{ Dialog = "project-load-error" } }
)

$results = foreach ($scenario in $scenarios) {
  Write-Host "Running $($scenario.Name)..."
  $parameters = @{} + $scenario.Parameters
  if ($SkipScreenshot) { $parameters.SkipScreenshot = $true }
  & $shellSmoke @parameters | ConvertFrom-Json
}

$summary = [ordered]@{
  status = "ok"
  scenarios = $results.Count
  failures = ($results | Where-Object { $_.status -ne "ok" }).Count
  results = $results | ForEach-Object {
    [ordered]@{
      url = $_.url
      status = $_.status
      failures = $_.failures
      dom = $_.dom
      screenshot = $_.screenshot
    }
  }
}

if ($summary.failures -gt 0) {
  $summary.status = "failed"
}

$summary | ConvertTo-Json -Depth 5

if ($summary.status -ne "ok") {
  throw "Translation hardening failed in $($summary.failures) scenario(s)."
}

param(
  [switch]$UpdateBaselines,
  [switch]$CompareOnly,
  [switch]$ReportOnly,
  [switch]$FullMatrix,
  [string[]]$Case = @(),
  [ValidateSet("preview", "projects", "categories", "regions", "translate", "quality")]
  [string[]]$Workspace = @(),
  [double]$MaxChangedPercent = 1.5,
  [double]$MaxMeanChannelDelta = 1.5,
  [int]$PixelDeltaThreshold = 24,
  [ValidateRange(1, 16)]
  [int]$SampleStep = 4,
  [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$shellRunner = Join-Path $repoRoot "tests\run-shell-smoke.ps1"
$baselineRoot = Join-Path $repoRoot "tests\visual-baselines"
$outputRoot = Join-Path $repoRoot "tests\visual-output"

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $baselineRoot, $outputRoot | Out-Null
if (-not $ReportPath) { $ReportPath = Join-Path $outputRoot "visual-regression-report.json" }

$viewports = @(
  @{ Width = 1440; Height = 1000; Workspaces = @("preview", "projects", "categories", "regions", "translate", "quality") },
  @{ Width = 1280; Height = 900; Workspaces = if ($FullMatrix) { @("preview", "projects", "categories", "regions", "translate", "quality") } else { @("preview", "projects") } },
  @{ Width = 1024; Height = 900; Workspaces = if ($FullMatrix) { @("preview", "projects", "categories", "regions", "translate", "quality") } else { @("preview", "projects") } }
)

function Compare-VisualImage {
  param(
    [string]$BaselinePath,
    [string]$ActualPath,
    [string]$DiffPath
  )

  $baseline = [System.Drawing.Bitmap]::new($BaselinePath)
  $actual = [System.Drawing.Bitmap]::new($ActualPath)
  try {
    if ($baseline.Width -ne $actual.Width -or $baseline.Height -ne $actual.Height) {
      return [pscustomobject]@{ Passed = $false; ChangedPercent = 100; MeanChannelDelta = 255; Detail = "Image dimensions differ." }
    }

    [long]$samples = 0
    [long]$changed = 0
    [double]$channelDelta = 0
    for ($y = 0; $y -lt $actual.Height; $y += $SampleStep) {
      for ($x = 0; $x -lt $actual.Width; $x += $SampleStep) {
        $expected = $baseline.GetPixel($x, $y)
        $observed = $actual.GetPixel($x, $y)
        $dr = [Math]::Abs([int]$expected.R - [int]$observed.R)
        $dg = [Math]::Abs([int]$expected.G - [int]$observed.G)
        $db = [Math]::Abs([int]$expected.B - [int]$observed.B)
        $channelDelta += $dr + $dg + $db
        if ([Math]::Max($dr, [Math]::Max($dg, $db)) -gt $PixelDeltaThreshold) { $changed += 1 }
        $samples += 1
      }
    }

    $changedPercent = if ($samples) { 100 * $changed / $samples } else { 0 }
    $meanChannelDelta = if ($samples) { $channelDelta / (3 * $samples) } else { 0 }
    $passed = $changedPercent -le $MaxChangedPercent -and $meanChannelDelta -le $MaxMeanChannelDelta

    if (-not $passed) {
      $diff = [System.Drawing.Bitmap]::new($actual)
      $graphics = [System.Drawing.Graphics]::FromImage($diff)
      $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(150, 210, 45, 45))
      try {
        for ($y = 0; $y -lt $actual.Height; $y += $SampleStep) {
          for ($x = 0; $x -lt $actual.Width; $x += $SampleStep) {
            $expected = $baseline.GetPixel($x, $y)
            $observed = $actual.GetPixel($x, $y)
            $maxDelta = [Math]::Max(
              [Math]::Abs([int]$expected.R - [int]$observed.R),
              [Math]::Max(
                [Math]::Abs([int]$expected.G - [int]$observed.G),
                [Math]::Abs([int]$expected.B - [int]$observed.B)
              )
            )
            if ($maxDelta -gt $PixelDeltaThreshold) { $graphics.FillRectangle($brush, $x, $y, $SampleStep, $SampleStep) }
          }
        }
        $diff.Save($DiffPath, [System.Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $brush.Dispose()
        $graphics.Dispose()
        $diff.Dispose()
      }
    } elseif (Test-Path $DiffPath) {
      Remove-Item -LiteralPath $DiffPath -Force
    }

    return [pscustomobject]@{
      Passed = $passed
      ChangedPercent = [Math]::Round($changedPercent, 3)
      MeanChannelDelta = [Math]::Round($meanChannelDelta, 3)
      Detail = if ($passed) { "Within tolerance." } else { "See $DiffPath" }
    }
  } finally {
    $actual.Dispose()
    $baseline.Dispose()
  }
}

$results = @()
$details = @()
foreach ($viewport in $viewports) {
  foreach ($workspaceName in $viewport.Workspaces) {
    $caseName = "$workspaceName-$($viewport.Width)x$($viewport.Height)"
    if ($Case.Count -and $caseName -notin $Case) { continue }
    if ($Workspace.Count -and $workspaceName -notin $Workspace) { continue }
    $actualPath = Join-Path $outputRoot "$caseName.png"
    $baselinePath = Join-Path $baselineRoot "$caseName.png"
    $diffPath = Join-Path $outputRoot "$caseName-diff.png"

    if (-not $CompareOnly) {
      & $shellRunner -Workspace $workspaceName -Width $viewport.Width -Height $viewport.Height -LoadSample -VisualCapture -ScreenshotCopyPath $actualPath | Out-Null
    }
    if (-not (Test-Path $actualPath)) { throw "Visual capture is missing: $actualPath" }

    if ($UpdateBaselines) {
      Copy-Item -LiteralPath $actualPath -Destination $baselinePath -Force
      $results += [pscustomobject]@{ Case = $caseName; Result = "UPDATED"; Changed = "-"; MeanDelta = "-" }
      $details += [pscustomobject]@{
        Case = $caseName
        Workspace = $workspaceName
        Width = $viewport.Width
        Height = $viewport.Height
        Result = "UPDATED"
        ChangedPercent = $null
        MeanChannelDelta = $null
        Baseline = $baselinePath
        Actual = $actualPath
        Diff = $null
        BaselineLastWriteTime = (Get-Item -LiteralPath $baselinePath).LastWriteTime.ToString("o")
        ActualLastWriteTime = (Get-Item -LiteralPath $actualPath).LastWriteTime.ToString("o")
        Detail = "Baseline updated."
      }
      continue
    }
    if (-not (Test-Path $baselinePath)) {
      throw "Visual baseline is missing: $baselinePath. Review the capture, then run with -UpdateBaselines."
    }

    $comparison = Compare-VisualImage -BaselinePath $baselinePath -ActualPath $actualPath -DiffPath $diffPath
    $baselineItem = Get-Item -LiteralPath $baselinePath
    $actualItem = Get-Item -LiteralPath $actualPath
    $results += [pscustomobject]@{
      Case = $caseName
      Result = if ($comparison.Passed) { "PASS" } else { "FAIL" }
      Changed = "$($comparison.ChangedPercent)%"
      MeanDelta = $comparison.MeanChannelDelta
    }
    $details += [pscustomobject]@{
      Case = $caseName
      Workspace = $workspaceName
      Width = $viewport.Width
      Height = $viewport.Height
      Result = if ($comparison.Passed) { "PASS" } else { "FAIL" }
      ChangedPercent = $comparison.ChangedPercent
      MeanChannelDelta = $comparison.MeanChannelDelta
      Baseline = $baselinePath
      Actual = $actualPath
      Diff = if ($comparison.Passed) { $null } else { $diffPath }
      BaselineLastWriteTime = $baselineItem.LastWriteTime.ToString("o")
      ActualLastWriteTime = $actualItem.LastWriteTime.ToString("o")
      Detail = $comparison.Detail
    }
  }
}

if (-not $results.Count) {
  throw "No visual regression cases matched the requested -Case or -Workspace filters."
}

$results | Format-Table -AutoSize
$summary = [pscustomobject]@{
  GeneratedAt = (Get-Date).ToString("o")
  Mode = if ($UpdateBaselines) { "UpdateBaselines" } elseif ($CompareOnly) { "CompareOnly" } else { "CaptureAndCompare" }
  ReportOnly = [bool]$ReportOnly
  Thresholds = [pscustomobject]@{
    MaxChangedPercent = $MaxChangedPercent
    MaxMeanChannelDelta = $MaxMeanChannelDelta
    PixelDeltaThreshold = $PixelDeltaThreshold
    SampleStep = $SampleStep
  }
  Totals = [pscustomobject]@{
    Cases = $details.Count
    Passed = @($details | Where-Object { $_.Result -eq "PASS" }).Count
    Failed = @($details | Where-Object { $_.Result -eq "FAIL" }).Count
    Updated = @($details | Where-Object { $_.Result -eq "UPDATED" }).Count
  }
  Cases = $details
}
$reportDirectory = Split-Path -Parent $ReportPath
if ($reportDirectory) { New-Item -ItemType Directory -Force -Path $reportDirectory | Out-Null }
$summary | ConvertTo-Json -Depth 8 | Set-Content -Path $ReportPath -Encoding UTF8
Write-Host "Visual regression report: $ReportPath"
if (-not $UpdateBaselines -and ($results.Result -contains "FAIL")) {
  if ($ReportOnly) {
    Write-Warning "Visual regression differences were found. Report-only mode did not fail the command."
  } else {
    throw "Visual regression failed. Review tests\visual-output\*-diff.png and $ReportPath before updating baselines. Use -Workspace or -Case to narrow the run, or -ReportOnly for design audits that should not fail the shell."
  }
}

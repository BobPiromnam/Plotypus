param(
  [int]$VirtualTimeBudgetMs = 6000,
  [int]$MapScale = 50,
  [int]$LabelSize = 12,
  [int]$LabelChars = 24,
  [ValidateSet("", "letter", "compact")]
  [string]$BookSize = "",
  [ValidateSet("", "full", "two-thirds", "half", "third", "quarter")]
  [string]$ImageSize = "",
  [switch]$SkipScreenshot,
  [int]$MaxLabelOverlaps = 0,
  [int]$MaxFurnitureOverlaps = 0,
  [int]$MaxMapLabelOverlaps = 0,
  [int]$MaxLeaderCrossings = 0,
  [int]$MaxLeaderLabelCrossings = 0,
  [int]$MaxWrongSideLabels = 0,
  [int]$MinLabelFontSize = 5
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputRoot = Join-Path $repoRoot "tests\smoke-output"
$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $outputRoot $runId
$profileDir = Join-Path $runDir "browser-profile"
$domPath = Join-Path $runDir "smoke-labels-dom.html"
$errPath = Join-Path $runDir "smoke-labels-dom.err"
$screenshotPath = Join-Path $runDir "smoke-labels.png"
$queryParts = @("scale=$MapScale", "labelSize=$LabelSize", "labelChars=$LabelChars")
if ($BookSize) { $queryParts += "bookSize=$([Uri]::EscapeDataString($BookSize))" }
if ($ImageSize) { $queryParts += "imageSize=$([Uri]::EscapeDataString($ImageSize))" }
$smokeUrl = "file:///$($repoRoot.Replace('\', '/'))/tests/smoke-labels.html?$($queryParts -join '&')"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$browserCandidates = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

$browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
  throw "Could not find Chrome or Edge in the standard Windows install locations."
}

$commonArgs = @(
  "--headless=new",
  # The Windows GPU sandbox crashes in some managed environments. This smoke
  # run loads only the local test fixture and uses Chromium's software renderer.
  "--no-sandbox",
  "--disable-gpu-sandbox",
  "--use-gl=swiftshader",
  "--use-angle=swiftshader",
  "--disable-features=Vulkan",
  "--allow-file-access-from-files",
  "--user-data-dir=$profileDir",
  "--virtual-time-budget=$VirtualTimeBudgetMs"
)

$dumpArgs = $commonArgs + @("--dump-dom", $smokeUrl)
$dumpProcess = Start-Process -FilePath $browser -ArgumentList $dumpArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $domPath -RedirectStandardError $errPath
if ($dumpProcess.ExitCode -ne 0) {
  throw "Browser DOM smoke run failed with exit code $($dumpProcess.ExitCode). See $errPath"
}

if (-not $SkipScreenshot) {
  $shotArgs = $commonArgs + @("--window-size=1200,1000", "--screenshot=$screenshotPath", $smokeUrl)
  $shotProcess = Start-Process -FilePath $browser -ArgumentList $shotArgs -NoNewWindow -Wait -PassThru
  if ($shotProcess.ExitCode -ne 0) {
    throw "Browser screenshot smoke run failed with exit code $($shotProcess.ExitCode)."
  }
}

$dom = Get-Content -Raw -Path $domPath
$match = [regex]::Match($dom, '<pre id="result">(?<json>.*?)</pre>', 'Singleline')
if (-not $match.Success) {
  throw "Smoke result JSON was not found in $domPath"
}

$jsonText = [System.Net.WebUtility]::HtmlDecode($match.Groups["json"].Value)
$result = $jsonText | ConvertFrom-Json

$summary = [ordered]@{
  browser = $browser
  status = $result.status
  requestedMapScale = $MapScale
  requestedLabelSize = $LabelSize
  requestedLabelChars = $LabelChars
  requestedBookSize = if ($BookSize) { $BookSize } else { $null }
  requestedImageSize = if ($ImageSize) { $ImageSize } else { $null }
  bookSize = $result.bookSize
  imageSize = $result.imageSize
  mapScale = $result.mapScale
  renderedMapPreview = $result.renderedMapPreview
  previewActive = $result.previewActive
  labels = $result.labels
  minLabelFontSize = $result.minLabelFontSize
  labelOverlaps = $result.labelOverlaps
  furnitureOverlaps = $result.furnitureOverlaps
  mapLabelOverlaps = $result.mapLabelOverlaps
  mapFillLabelOverlaps = $result.mapFillLabelOverlaps
  mapFillSamplingSupported = $result.mapFillSamplingSupported
  mapFillOccupiedSampleCount = $result.mapFillOccupiedSampleCount
  mapBoundsLabelOverlaps = $result.mapBoundsLabelOverlaps
  leaderCrossings = $result.leaderCrossings
  leaderLabelCrossings = $result.leaderLabelCrossings
  wrongSideLabels = $result.wrongSideLabelCount
  mapBBoxWidthRatio = $result.mapBBoxMetrics.widthRatio
  mapBBoxHeightRatio = $result.mapBBoxMetrics.heightRatio
  mapBBoxAreaRatio = $result.mapBBoxMetrics.areaRatio
  mapCenterXRatio = $result.mapBBoxMetrics.centerXRatio
  mapCenterYRatio = $result.mapBBoxMetrics.centerYRatio
  mapTransformPersisted = $result.mapTransformPersisted
  mapTransformDelta = $result.mapTransformDelta
  maxLeaderLength = $result.maxLeaderLength
  averageLeaderLength = $result.averageLeaderLength
  leaderLengthLimit = $result.leaderLengthLimit
  overlongLeaderCount = $result.overlongLeaderCount
  longestLeader = $result.longestLeader
  minLabelGap = $result.minLabelGap
  labelsNearCanvasEdge = $result.labelsNearCanvasEdgeCount
  renderPerformance = $result.renderPerformance
  autoFitDiagnostics = $result.autoFitDiagnostics
  screenshot = if ($SkipScreenshot) { $null } else { $screenshotPath }
  dom = $domPath
}

$summary | ConvertTo-Json -Depth 6

if ($result.status -ne "ok") {
  throw "Smoke test status was '$($result.status)'."
}

if (-not $result.renderedMapPreview) {
  throw "Smoke test did not render the cloned map preview."
}

if (-not $result.mapTransformPersisted) {
  throw "Auto-fit map scale or translation did not survive the next ordinary render."
}

$thresholdFailures = @()
if ($BookSize -and $result.bookSize -ne $BookSize) {
  $thresholdFailures += "bookSize=$($result.bookSize) != $BookSize"
}
if ($ImageSize -and $result.imageSize -ne $ImageSize) {
  $thresholdFailures += "imageSize=$($result.imageSize) != $ImageSize"
}
if ($result.labelOverlaps -gt $MaxLabelOverlaps) {
  $thresholdFailures += "labelOverlaps=$($result.labelOverlaps) > $MaxLabelOverlaps"
}
if ($result.furnitureOverlaps -gt $MaxFurnitureOverlaps) {
  $thresholdFailures += "furnitureOverlaps=$($result.furnitureOverlaps) > $MaxFurnitureOverlaps"
}
if (-not $result.mapFillSamplingSupported) {
  $thresholdFailures += "mapFillSamplingSupported=false"
}
if ($result.mapLabelOverlaps -gt $MaxMapLabelOverlaps) {
  $thresholdFailures += "mapLabelOverlaps=$($result.mapLabelOverlaps) > $MaxMapLabelOverlaps"
}
if ($result.leaderCrossings -gt $MaxLeaderCrossings) {
  $thresholdFailures += "leaderCrossings=$($result.leaderCrossings) > $MaxLeaderCrossings"
}
if ($result.leaderLabelCrossings -gt $MaxLeaderLabelCrossings) {
  $thresholdFailures += "leaderLabelCrossings=$($result.leaderLabelCrossings) > $MaxLeaderLabelCrossings"
}
if ($result.wrongSideLabelCount -gt $MaxWrongSideLabels) {
  $thresholdFailures += "wrongSideLabels=$($result.wrongSideLabelCount) > $MaxWrongSideLabels"
}
if ($result.minLabelFontSize -lt $MinLabelFontSize) {
  $thresholdFailures += "minLabelFontSize=$($result.minLabelFontSize) < $MinLabelFontSize"
}
if ($thresholdFailures.Count) {
  throw "Smoke quality thresholds failed: $($thresholdFailures -join ', '). Screenshot: $screenshotPath"
}

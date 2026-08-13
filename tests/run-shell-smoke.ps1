param(
  [int]$Width = 1440,
  [int]$Height = 1000,
  [int]$VirtualTimeBudgetMs = 0,
  [int]$ScreenshotDelayMs = 12000,
  [int]$BrowserTimeoutMs = 0,
  [ValidateSet("", "preview", "projects", "regions", "translate", "quality")]
  [string]$Workspace = "",
  [ValidateSet("", "startup", "feedback", "map-details", "csv-map", "point-catalog", "point-selection", "confirmation", "shortcuts", "export-menu", "add-data-menu", "project-load-error")]
  [string]$Dialog = "",
  [ValidateSet("projects", "regions")]
  [string]$CatalogOrigin = "projects",
  [switch]$LoadSample,
  [switch]$TableLayoutOnly,
  [switch]$MeasurePerformance,
  [switch]$SkipScreenshot,
  [switch]$VisualCapture,
  [string]$ScreenshotCopyPath = ""
)

$ErrorActionPreference = "Stop"

if ($MeasurePerformance -and -not $LoadSample) {
  throw "-MeasurePerformance requires -LoadSample so the render paths have representative data."
}

if ($TableLayoutOnly -and -not $LoadSample) {
  throw "-TableLayoutOnly requires -LoadSample so every table has representative bilingual data."
}

if ($TableLayoutOnly -and $Workspace -notin @("projects", "regions", "translate")) {
  throw "-TableLayoutOnly requires -Workspace projects, regions, or translate."
}

if ($BrowserTimeoutMs -lt 0) {
  throw "-BrowserTimeoutMs must be zero (automatic) or a positive number of milliseconds."
}

if ($VirtualTimeBudgetMs -lt 0) {
  throw "-VirtualTimeBudgetMs must be zero or a positive number of milliseconds."
}

if ($PSBoundParameters.ContainsKey("VirtualTimeBudgetMs")) {
  Write-Warning "-VirtualTimeBudgetMs is retained for compatibility but is no longer used. The runner now waits for the page's explicit smoke completion signal."
}

if ($PSBoundParameters.ContainsKey("ScreenshotDelayMs")) {
  Write-Warning "-ScreenshotDelayMs is retained for compatibility but is no longer used. Screenshots are captured as soon as the smoke result is ready."
}

$resolvedBrowserTimeoutMs = if ($BrowserTimeoutMs -gt 0) {
  $BrowserTimeoutMs
} elseif ($MeasurePerformance) {
  180000
} elseif ($LoadSample -and -not $Dialog) {
  120000
} else {
  30000
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputRoot = Join-Path $repoRoot "tests\smoke-output"
$headlessRunner = Join-Path $repoRoot "tests\headless-smoke-runner.cjs"
$runLabel = if ($TableLayoutOnly) { "table-layout-$Workspace" } elseif ($Dialog) { "dialog-$Dialog" } elseif ($Workspace) { "workspace-$Workspace" } else { "shell" }
$runId = "$runLabel-$($Width)x$($Height)-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
$runDir = Join-Path $outputRoot $runId
$profileDir = Join-Path $runDir "browser-profile"
$domPath = Join-Path $runDir "shell-dom.html"
$errPath = Join-Path $runDir "shell-dom.err"
$screenshotPath = Join-Path $runDir "shell-$($Width)x$($Height).png"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { throw "Python is required to run the local Plotypus smoke server." }
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw "Node.js 22 or newer is required to run the event-driven headless browser harness." }

$serverOut = Join-Path $runDir "server.out"
$serverErr = Join-Path $runDir "server.err"
$serverArgs = @("-m", "http.server", $port, "--bind", "127.0.0.1", "--directory", $repoRoot)
$server = Start-Process -FilePath $python.Source -ArgumentList $serverArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr

try {
  $query = @()
  if ($Workspace) { $query += "workspace=$Workspace" }
  if ($Dialog) { $query += "dialog=$Dialog" }
  if ($Dialog -eq "point-catalog") { $query += "origin=$CatalogOrigin" }
  if ($LoadSample) { $query += "sample=1" }
  if ($TableLayoutOnly) { $query += "tableLayout=1" }
  if ($MeasurePerformance) { $query += "performance=1" }
  if ($VisualCapture) { $query += "visual=1" }
  $queryString = if ($query.Count) { "?" + ($query -join "&") } else { "" }
  $smokeUrl = "http://127.0.0.1:$port/tests/shell-interactions.html$queryString"
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -Uri $smokeUrl -UseBasicParsing -TimeoutSec 1
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {
      Start-Sleep -Milliseconds 100
    }
  }
  if (-not $ready) { throw "The local Plotypus smoke server did not become ready." }

  $browserCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  )
  $browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $browser) { throw "Could not find Chrome or Edge in the standard Windows install locations." }

  $dumpStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  $runnerArgs = @(
    $headlessRunner,
    "--browser", $browser,
    "--url", $smokeUrl,
    "--profile", $profileDir,
    "--dom", $domPath,
    "--error-output", $errPath,
    "--width", $Width,
    "--height", $Height,
    "--timeout", $resolvedBrowserTimeoutMs
  )
  if (-not $SkipScreenshot) { $runnerArgs += @("--screenshot", $screenshotPath) }
  $runnerOutput = & $node.Source @runnerArgs
  $runnerExitCode = $LASTEXITCODE
  $dumpStopwatch.Stop()
  if ($runnerExitCode -ne 0) {
    throw "Browser shell smoke failed with exit code $runnerExitCode after $($dumpStopwatch.ElapsedMilliseconds) ms (limit $resolvedBrowserTimeoutMs ms; sample=$([bool]$LoadSample); performance=$([bool]$MeasurePerformance); workspace='$Workspace'; dialog='$Dialog'). See $errPath and $domPath"
  }

  if (-not $SkipScreenshot) {
    if (-not (Test-Path -LiteralPath $screenshotPath)) { throw "Browser shell screenshot was not created: $screenshotPath" }
    if ($ScreenshotCopyPath) {
      $copyPath = if ([System.IO.Path]::IsPathRooted($ScreenshotCopyPath)) { $ScreenshotCopyPath } else { Join-Path $repoRoot $ScreenshotCopyPath }
      $copyDirectory = Split-Path -Parent $copyPath
      if ($copyDirectory) { New-Item -ItemType Directory -Force -Path $copyDirectory | Out-Null }
      Copy-Item -LiteralPath $screenshotPath -Destination $copyPath -Force
    }
  }

  $dom = Get-Content -Raw -Path $domPath
  $match = [regex]::Match($dom, '<pre\b[^>]*\bid="result"[^>]*>(?<json>.*?)</pre>', 'Singleline')
  if (-not $match.Success) { throw "Shell smoke result JSON was not found in $domPath" }
  $jsonText = [System.Net.WebUtility]::HtmlDecode($match.Groups["json"].Value)
  $result = $jsonText | ConvertFrom-Json
  $summary = [ordered]@{
    browser = $browser
    url = $smokeUrl
    status = $result.status
    message = $result.message
    failures = $result.failures
    checks = $result.checks
    frameErrors = $result.frameErrors
    performance = $result.performance
    runner = if ($runnerOutput) { $runnerOutput | ConvertFrom-Json } else { $null }
    browserElapsedMs = $dumpStopwatch.ElapsedMilliseconds
    browserTimeoutMs = $resolvedBrowserTimeoutMs
    screenshot = if ($SkipScreenshot) { $null } elseif ($ScreenshotCopyPath) { $copyPath } else { $screenshotPath }
    dom = $domPath
  }
  $summary | ConvertTo-Json -Depth 6
  if ($result.status -ne "ok") { throw "Shell interaction smoke status was '$($result.status)'. See $domPath" }
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}

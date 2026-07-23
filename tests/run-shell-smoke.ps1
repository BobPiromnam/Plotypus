param(
  [int]$Width = 1440,
  [int]$Height = 1000,
  [int]$VirtualTimeBudgetMs = 7000,
  [int]$ScreenshotDelayMs = 12000,
  [ValidateSet("", "preview", "projects", "categories", "regions", "translate", "quality")]
  [string]$Workspace = "",
  [ValidateSet("", "startup", "map-details", "csv-map", "point-catalog", "confirmation", "shortcuts", "export-menu", "add-data-menu", "project-load-error")]
  [string]$Dialog = "",
  [ValidateSet("projects", "regions")]
  [string]$CatalogOrigin = "projects",
  [switch]$LoadSample,
  [switch]$MeasurePerformance,
  [switch]$SkipScreenshot,
  [switch]$VisualCapture,
  [string]$ScreenshotCopyPath = ""
)

$ErrorActionPreference = "Stop"

if ($MeasurePerformance -and -not $LoadSample) {
  throw "-MeasurePerformance requires -LoadSample so the render paths have representative data."
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputRoot = Join-Path $repoRoot "tests\smoke-output"
$runLabel = if ($Dialog) { "dialog-$Dialog" } elseif ($Workspace) { "workspace-$Workspace" } else { "shell" }
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

  $commonArgs = @(
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-extensions",
    "--no-first-run",
    "--use-gl=swiftshader",
    "--allow-file-access-from-files",
    "--user-data-dir=$profileDir",
    "--virtual-time-budget=$VirtualTimeBudgetMs"
  )
  $dumpArgs = $commonArgs + @("--window-size=$Width,$Height", "--dump-dom", $smokeUrl)
  $dumpProcess = Start-Process -FilePath $browser -ArgumentList $dumpArgs -NoNewWindow -PassThru -RedirectStandardOutput $domPath -RedirectStandardError $errPath
  if (-not $dumpProcess.WaitForExit(30000)) {
    Stop-Process -Id $dumpProcess.Id -Force -ErrorAction SilentlyContinue
    throw "Browser shell DOM smoke timed out. See $errPath"
  }
  $dumpProcess.WaitForExit()
  if ($null -ne $dumpProcess.ExitCode -and $dumpProcess.ExitCode -ne 0) { throw "Browser shell smoke failed with exit code $($dumpProcess.ExitCode). See $errPath" }

  if (-not $SkipScreenshot) {
    $shotProfileDir = Join-Path $runDir "screenshot-profile"
    $shotArgs = @(
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu-sandbox",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-extensions",
      "--no-first-run",
      "--use-gl=swiftshader",
      "--user-data-dir=$shotProfileDir",
      "--virtual-time-budget=$ScreenshotDelayMs",
      "--timeout=$ScreenshotDelayMs",
      "--window-size=$Width,$Height",
      "--screenshot=$screenshotPath",
      $smokeUrl
    )
    $shotProcess = Start-Process -FilePath $browser -ArgumentList $shotArgs -NoNewWindow -PassThru
    if (-not $shotProcess.WaitForExit(30000)) {
      Stop-Process -Id $shotProcess.Id -Force -ErrorAction SilentlyContinue
      throw "Browser shell screenshot timed out."
    }
    $shotProcess.WaitForExit()
    if ($null -ne $shotProcess.ExitCode -and $shotProcess.ExitCode -ne 0) { throw "Browser shell screenshot failed with exit code $($shotProcess.ExitCode)." }
    if ($ScreenshotCopyPath) {
      $copyPath = if ([System.IO.Path]::IsPathRooted($ScreenshotCopyPath)) { $ScreenshotCopyPath } else { Join-Path $repoRoot $ScreenshotCopyPath }
      $copyDirectory = Split-Path -Parent $copyPath
      if ($copyDirectory) { New-Item -ItemType Directory -Force -Path $copyDirectory | Out-Null }
      Copy-Item -LiteralPath $screenshotPath -Destination $copyPath -Force
    }
  }

  $dom = Get-Content -Raw -Path $domPath
  $match = [regex]::Match($dom, '<pre id="result">(?<json>.*?)</pre>', 'Singleline')
  if (-not $match.Success) { throw "Shell smoke result JSON was not found in $domPath" }
  $jsonText = [System.Net.WebUtility]::HtmlDecode($match.Groups["json"].Value)
  $result = $jsonText | ConvertFrom-Json
  $summary = [ordered]@{
    browser = $browser
    url = $smokeUrl
    status = $result.status
    failures = $result.failures
    checks = $result.checks
    screenshot = if ($SkipScreenshot) { $null } elseif ($ScreenshotCopyPath) { $copyPath } else { $screenshotPath }
    dom = $domPath
  }
  $summary | ConvertTo-Json -Depth 6
  if ($result.status -ne "ok") { throw "Shell interaction smoke status was '$($result.status)'. See $domPath" }
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}

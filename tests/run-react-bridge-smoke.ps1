param(
  [int]$Width = 1440,
  [int]$Height = 1000
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputRoot = Join-Path $repoRoot "tests\smoke-output"
$runId = "react-bridge-$($Width)x$($Height)-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
$runDir = Join-Path $outputRoot $runId
$profileDir = Join-Path $runDir "browser-profile"
$resultPath = Join-Path $runDir "react-bridge-result.json"
$browserErrPath = Join-Path $runDir "browser.err"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$distEntry = Join-Path $repoRoot "dist\react\react-vanilla-bridge.html"
if (-not (Test-Path $distEntry)) {
  throw "React bridge build output was not found at $distEntry. Run npm run build first."
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { throw "Python is required to run the local Plotypus smoke server." }
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw "Node is required to run the React bridge smoke harness." }

$serverOut = Join-Path $runDir "server.out"
$serverErr = Join-Path $runDir "server.err"
$serverArgs = @("-m", "http.server", $port, "--bind", "127.0.0.1", "--directory", $repoRoot)
$server = Start-Process -FilePath $python.Source -ArgumentList $serverArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr

try {
  $smokeUrl = "http://127.0.0.1:$port/tests/react-bridge-smoke.html"
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

  $browserArgs = @(
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-extensions",
    "--no-first-run",
    "--use-gl=swiftshader",
    "--user-data-dir=$profileDir",
    "--remote-debugging-port=0",
    "--window-size=$Width,$Height",
    $smokeUrl
  )
  $browserProcess = Start-Process -FilePath $browser -ArgumentList $browserArgs -WindowStyle Hidden -PassThru -RedirectStandardError $browserErrPath
  $runnerPath = Join-Path $repoRoot "tests\react-bridge-smoke-runner.cjs"
  $runnerArgs = @($runnerPath, "--url", $smokeUrl, "--profile", $profileDir, "--result", $resultPath)
  $runnerProcess = Start-Process -FilePath $node.Source -ArgumentList $runnerArgs -NoNewWindow -Wait -PassThru
  if ($null -ne $runnerProcess.ExitCode -and $runnerProcess.ExitCode -ne 0) {
    throw "React bridge smoke runner failed with exit code $($runnerProcess.ExitCode). See $resultPath"
  }

  $result = Get-Content -Raw -Path $resultPath | ConvertFrom-Json
  $summary = [ordered]@{
    browser = $browser
    url = $smokeUrl
    status = $result.status
    failures = $result.failures
    checks = $result.checks
    result = $resultPath
  }
  $summary | ConvertTo-Json -Depth 6
  if ($result.status -ne "ok") { throw "React bridge smoke status was '$($result.status)'. See $resultPath" }
} finally {
  if ($browserProcess -and -not $browserProcess.HasExited) { Stop-Process -Id $browserProcess.Id -Force }
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}

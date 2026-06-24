param(
  [int]$Port = 8000,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-PortAvailable {
  param([int]$CandidatePort)

  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $CandidatePort)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) {
      $listener.Stop()
    }
  }
}

function Resolve-Port {
  param([int]$PreferredPort)

  for ($candidate = $PreferredPort; $candidate -lt ($PreferredPort + 50); $candidate++) {
    if (Test-PortAvailable -CandidatePort $candidate) {
      return $candidate
    }
  }

  throw "Could not find an available local port from $PreferredPort to $($PreferredPort + 49)."
}

function Resolve-PythonCommand {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) {
    return @{
      FilePath = $python.Source
      Arguments = @("-m", "http.server")
    }
  }

  $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
  if ($pyLauncher) {
    return @{
      FilePath = $pyLauncher.Source
      Arguments = @("-3", "-m", "http.server")
    }
  }

  throw "Python was not found. Install Python or open index.html directly for non-JSON use."
}

$serverPort = Resolve-Port -PreferredPort $Port
$pythonCommand = Resolve-PythonCommand
$serverArgs = $pythonCommand.Arguments + @($serverPort.ToString(), "--bind", "127.0.0.1")
$url = "http://127.0.0.1:$serverPort/"

Write-Host "Starting Plotypus from $repoRoot"
Write-Host "Serving $url"

$server = Start-Process `
  -FilePath $pythonCommand.FilePath `
  -ArgumentList $serverArgs `
  -WorkingDirectory $repoRoot `
  -PassThru `
  -WindowStyle Hidden

try {
  Start-Sleep -Milliseconds 500
  if (-not $NoBrowser) {
    Start-Process $url
  }

  Write-Host ""
  Write-Host "Plotypus is running at $url"
  Write-Host "Press Enter in this window to stop the local server."
  [void][System.Console]::ReadLine()
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
    Write-Host "Stopped Plotypus local server."
  }
}

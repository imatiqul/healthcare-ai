<#
.SYNOPSIS
    Toggle Azure resources on/off to save costs when not in use.

.DESCRIPTION
    Stops or starts all billable resources in the healthq-copilot-rg resource group.
    - Container Apps: deactivate / activate latest revision
    - PostgreSQL Flexible Server: stop / start
    - APIM consumption tier / Azure OpenAI: no idle cost, left alone

.PARAMETER Start
    When specified, starts all resources. Without it, stops everything.

.PARAMETER ResourceGroup
    Target resource group. Defaults to healthq-copilot-rg.

.PARAMETER PgServer
    PostgreSQL Flexible Server name. Defaults to healthq-copilot-pg.

.EXAMPLE
    .\Toggle-Resources.ps1              # Stop all resources (save money)
    .\Toggle-Resources.ps1 -Start       # Start all resources
#>

param(
    [switch]$Start,
    [string]$ResourceGroup = "healthq-copilot-rg",
    [string]$PgServer = "healthq-copilot-pg"
)

# Helper: run az CLI, suppress stderr noise, check exit code
function Invoke-Az {
    param([string[]]$Arguments)
    $output = $null
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & az @Arguments 2>&1 | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] }
        if ($LASTEXITCODE -ne 0) { return $null }
    } finally {
        $ErrorActionPreference = $prevPref
    }
    return $output
}

function Stop-AllResources {
    Write-Host "`n=== Stopping resources in '$ResourceGroup' ===" -ForegroundColor Yellow

    # 1. Container Apps → deactivate revisions (0 replicas, $0 cost)
    Write-Host "`n[Container Apps] Deactivating revisions..." -ForegroundColor Cyan
    $appsJson = Invoke-Az containerapp, list, -g, $ResourceGroup, --query, "[].{name:name, rev:properties.latestRevisionName}", -o, json
    if ($appsJson) {
        $apps = $appsJson | ConvertFrom-Json
        foreach ($app in $apps) {
            Write-Host "  Deactivating $($app.name) [$($app.rev)]..." -NoNewline
            Invoke-Az containerapp, revision, deactivate, -n, $app.name, -g, $ResourceGroup, --revision, $app.rev | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " Done" -ForegroundColor Green
            } else {
                Write-Host " Already inactive" -ForegroundColor DarkGray
            }
        }
    } else {
        Write-Host "  No Container Apps found." -ForegroundColor DarkGray
    }
    Write-Host "`n[PostgreSQL] Stopping $PgServer..." -ForegroundColor Cyan
    $pgState = Invoke-Az postgres, flexible-server, show, -g, $ResourceGroup, -n, $PgServer, --query, "state", -o, tsv
    if ($pgState -eq "Ready") {
        Invoke-Az postgres, flexible-server, stop, -g, $ResourceGroup, -n, $PgServer | Out-Null
        Write-Host "  Stopped (note: auto-restarts after 7 days)" -ForegroundColor Green
    } elseif ($pgState -eq "Stopped") {
        Write-Host "  Already stopped." -ForegroundColor DarkGray
    } else {
        Write-Host "  State: $pgState - skipping." -ForegroundColor DarkGray
    }

    Write-Host "`n=== All resources stopped ===" -ForegroundColor Green
    Write-Host "Run '.\Toggle-Resources.ps1 -Start' to restart.`n"
}

function Start-AllResources {
    Write-Host "`n=== Starting resources in '$ResourceGroup' ===" -ForegroundColor Yellow

    # 1. PostgreSQL first (services depend on it)
    Write-Host "`n[PostgreSQL] Starting $PgServer..." -ForegroundColor Cyan
    $pgState = Invoke-Az postgres, flexible-server, show, -g, $ResourceGroup, -n, $PgServer, --query, "state", -o, tsv
    if ($pgState -eq "Stopped") {
        Invoke-Az postgres, flexible-server, start, -g, $ResourceGroup, -n, $PgServer | Out-Null
        Write-Host "  Started (may take 1-2 min to accept connections)" -ForegroundColor Green
    } elseif ($pgState -eq "Ready") {
        Write-Host "  Already running." -ForegroundColor DarkGray
    } else {
        Write-Host "  State: $pgState - skipping." -ForegroundColor DarkGray
    }

    # 2. Container Apps → activate revisions
    Write-Host "`n[Container Apps] Activating revisions..." -ForegroundColor Cyan
    $appsJson = Invoke-Az containerapp, list, -g, $ResourceGroup, --query, "[].{name:name, rev:properties.latestRevisionName}", -o, json
    if ($appsJson) {
        $apps = $appsJson | ConvertFrom-Json
        foreach ($app in $apps) {
            Write-Host "  Activating $($app.name) [$($app.rev)]..." -NoNewline
            Invoke-Az containerapp, revision, activate, -n, $app.name, -g, $ResourceGroup, --revision, $app.rev | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " Done" -ForegroundColor Green
            } else {
                Write-Host " Already active" -ForegroundColor DarkGray
            }
        }
    } else {
        Write-Host "  No Container Apps found." -ForegroundColor DarkGray
    }

    Write-Host "`n=== All resources started ===" -ForegroundColor Green
    Write-Host "Services should be available within 2-3 minutes.`n"
}

# --- Main ---
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor White
$acct = Invoke-Az account, show, --query, "{Name:name, Id:id}", -o, table
if ($acct) {
    Write-Host "Azure Account:"
    $acct | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "ERROR: Not logged into Azure CLI. Run 'az login' first." -ForegroundColor Red
    exit 1
}

if ($Start) {
    Start-AllResources
} else {
    Stop-AllResources
}

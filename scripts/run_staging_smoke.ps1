param(
    [switch]$All,
    [switch]$Quote,
    [switch]$Cancel,
    [switch]$Verbose,
    [switch]$AllowNonStaging,
    [string]$BaseUrl = $env:AUTOHELP_API_URL
)

$ErrorActionPreference = "Stop"

$required = @(
    "AUTOHELP_TEST_CUSTOMER_PHONE",
    "AUTOHELP_TEST_CUSTOMER_PASSWORD",
    "AUTOHELP_TEST_MECHANIC_PHONE",
    "AUTOHELP_TEST_MECHANIC_PASSWORD"
)

$missing = @()
foreach ($name in $required) {
    $value = [Environment]::GetEnvironmentVariable($name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        $missing += $name
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Missing required environment variables:"
    foreach ($name in $missing) {
        Write-Host "  $name"
    }
    Write-Host "See docs/TESTING.md. Do not put credentials in this script."
    exit 2
}

$scriptPath = Join-Path $PSScriptRoot "staging_smoke_test.py"
$flags = @()
if ($All) { $flags += "--all" }
if ($Quote) { $flags += "--quote" }
if ($Cancel) { $flags += "--cancel" }
if ($Verbose) { $flags += "--verbose" }
if ($AllowNonStaging) { $flags += "--allow-non-staging" }
if (-not [string]::IsNullOrWhiteSpace($BaseUrl)) {
    $flags += "--base-url"
    $flags += $BaseUrl
}

python $scriptPath @flags
exit $LASTEXITCODE

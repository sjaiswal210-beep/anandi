# Builds a clean handoff zip of the project, excluding node_modules, build
# output, and render scratch. Secrets (.env files) are NOT excluded here — they
# are needed on the target machine — so treat the resulting zip as sensitive and
# move it securely (not via a corporate laptop to personal infra; see
# .kiro/steering/corporate-infosec.md).
#
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/make-handoff-zip.ps1
#
# Optional: pass -NoEnv to also exclude .env files (then recreate them from
# .env.example on the target machine).

param(
  [switch]$NoEnv,
  [string]$OutFile = "..\anandi-park-handoff.zip"
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $root

Write-Host "Project root: $root"

# Directories/files to always exclude (regex fragments matched against the
# path relative to the repo root, using forward slashes).
$excludePatterns = @(
  '(^|/)node_modules(/|$)',
  '(^|/)\.next(/|$)',
  '(^|/)dist(/|$)',
  '(^|/)\.turbo(/|$)',
  '(^|/)coverage(/|$)',
  '(^|/)\.git(/|$)',
  '(^|/)anandi-park-promo/renders(/|$)',
  '(^|/)anandi-park-promo/snapshots(/|$)',
  '(^|/)anandi-park-promo/\.media(/|$)',
  '(^|/)anandi-park-promo/\.hyperframes(/|$)',
  '(^|/)\.vscode(/|$)',
  'tsconfig\.tsbuildinfo$',
  '\.log$'
)

if ($NoEnv) {
  # Exclude real env files but NOT the .env.example template.
  $excludePatterns += '(^|/)\.env$'
  $excludePatterns += '(^|/)\.env\.local$'
  $excludePatterns += '(^|/)\.env\.(development|production|test)(\.local)?$'
  Write-Host "NoEnv set: real .env files excluded (.env.example kept)."
} else {
  Write-Host "Including .env files (sensitive - move the zip securely)."
}

Write-Host "Collecting files..."
$all = Get-ChildItem -Path $root -Recurse -File -Force
$staged = New-Object System.Collections.Generic.List[string]

foreach ($f in $all) {
  $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
  $skip = $false
  foreach ($pat in $excludePatterns) {
    if ($rel -match $pat) { $skip = $true; break }
  }
  if (-not $skip) { $staged.Add($f.FullName) }
}

Write-Host ("Files to include: {0}" -f $staged.Count)

$out = Join-Path $root $OutFile
if (Test-Path $out) { Remove-Item $out -Force }

# Build the zip preserving relative paths.
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$zip = [System.IO.Compression.ZipFile]::Open($out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($path in $staged) {
    $entryName = $path.Substring($root.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $path, $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    )
  }
} finally {
  $zip.Dispose()
}

$sizeMb = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Host ("Created {0} ({1} MB)" -f $out, $sizeMb)
Write-Host "Done. Remember: on the target machine run 'npm install' and 'npm run db:generate'."

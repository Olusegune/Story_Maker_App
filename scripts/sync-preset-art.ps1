$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root "assets\styles"
$sourceRoot = "C:\Users\eduni\Desktop\preset images for Storymaker"
$art = [ordered]@{
  "Anime Story Film.png" = "ChatGPT Image Jul 17, 2026, 03_57_50 PM.png"
  "Graphic Novel.png" = "ChatGPT Image Jul 17, 2026, 03_57_55 PM.png"
  "Stop Motion.png" = "ChatGPT Image Jul 17, 2026, 03_57_58 PM.png"
  "Kids Adventure.png" = "ChatGPT Image Jul 17, 2026, 03_58_02 PM.png"
  "Dark Fantasy.png" = "ChatGPT Image Jul 17, 2026, 03_58_05 PM.png"
  "Magical Realism.png" = "ChatGPT Image Jul 17, 2026, 03_58_09 PM.png"
  "Prestige Historical.png" = "ChatGPT Image Jul 17, 2026, 03_58_13 PM.png"
  "Sci-Fi Realism.png" = "ChatGPT Image Jul 17, 2026, 03_58_17 PM.png"
  "Luxury Beauty.png" = "ChatGPT Image Jul 17, 2026, 03_58_21 PM.png"
  "Product Macro.png" = "ChatGPT Image Jul 17, 2026, 03_58_25 PM.png"
  "Vertical Social.png" = "ChatGPT Image Jul 17, 2026, 03_58_31 PM.png"
  "Sports Anthem.png" = "ChatGPT Image Jul 17, 2026, 03_58_35 PM.png"
  "Fashion Editorial.png" = "ChatGPT Image Jul 17, 2026, 03_58_38 PM.png"
  "Music Video.png" = "ChatGPT Image Jul 17, 2026, 03_58_41 PM.png"
}

New-Item -ItemType Directory -Force -Path $destination | Out-Null
foreach ($entry in $art.GetEnumerator()) {
  $source = Join-Path $sourceRoot $entry.Value
  if (-not (Test-Path -LiteralPath $source)) { throw "Missing supplied preset art: $source" }
  Copy-Item -LiteralPath $source -Destination (Join-Path $destination $entry.Key) -Force
}

Write-Output "Synchronized $($art.Count) supplied preset-art boards."

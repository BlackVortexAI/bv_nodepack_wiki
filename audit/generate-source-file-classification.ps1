param(
  [string]$SourceRoot = 'X:\Stability Matrix\Data\Packages\ComfyUI 2026-06\custom_nodes\bv_nodepack',
  [string]$OutputPath = (Join-Path $PSScriptRoot 'source-file-classification.csv')
)

$ErrorActionPreference = 'Stop'
$SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
$head = git -C $SourceRoot rev-parse HEAD
$branch = git -C $SourceRoot branch --show-current
$tracked = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$untracked = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$modified = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

git -C $SourceRoot ls-files | ForEach-Object { [void]$tracked.Add($_.Replace('\','/')) }
git -C $SourceRoot ls-files --others --exclude-standard | ForEach-Object { [void]$untracked.Add($_.Replace('\','/')) }
git -C $SourceRoot status --porcelain=v1 -uno | ForEach-Object {
  if($_.Length -ge 4){ [void]$modified.Add($_.Substring(3).Trim('"').Replace('\','/')) }
}

function Classify([string]$path, [string]$gitState) {
  $p = $path.ToLowerInvariant()
  $name = [IO.Path]::GetFileName($path)
  $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()

  if($p -match '(^|/)(__pycache__|node_modules|dist|coverage|htmlcov|\.pytest_cache)(/|$)' -or $ext -eq '.pyc') {
    return @('Remove', 'Generated dependency, cache, coverage, or build artifact; reproducible and not documentation source. Remove only in an explicitly approved focused cleanup.')
  }
  if($p -match '(^|/)\.abacusai(/|$)' -or $p -eq '.codex-test' -or $p -match '(^|/)\.codex-disabled-[^/]+(/|$)') {
    return @('Remove', 'Local tool or configuration artifact. Inspect for secrets and ownership first; remove only after explicit focused-cleanup approval.')
  }
  if($ext -eq '.log' -or $name -match '^comfy-test(-error)?\.log$') {
    return @('Remove', 'Generated local test log; not a reusable documentation or production source. Removal remains separately approval-gated.')
  }
  if($gitState -eq 'Untracked' -and $p -match '^docs/publishing/civitai') {
    return @('Move/Archive', 'Untracked external-publishing artifact. Preserve separately, inspect provenance and embedded paths/secrets, and do not promote directly into canonical Pages content.')
  }
  if($gitState -eq 'Untracked' -and $p -match '^ui/prototypes/') {
    return @('Move/Archive', 'Untracked UI prototype or visual evidence. Preserve as research outside production source unless a later visual decision explicitly adopts it.')
  }
  if($p -match '^docs/research/') {
    return @('Review', 'Research or handoff evidence only. Revalidate every claim against the approved V3 baseline before rewriting any public documentation.')
  }
  if($p -eq 'docs/regional-editor-mvp.md') {
    return @('Move/Archive', 'Likely historical MVP document. Compare with current V3 behavior and archive if superseded; never publish as current guidance without verification.')
  }
  if($p -match '^docs/screenshots/' -or $p -match '^docs/assets/regional/') {
    return @('Review', 'Existing screenshot/media candidate. Verify V3 UI state, crop, naming, asset role, alt text, provenance, and reproducibility before reuse.')
  }
  if($p -match '^docs/assets/publishing/' -or $p -eq 'docs/assets/bv-nodepack-hero.svg') {
    return @('Review', 'Publishing or hero asset candidate. Confirm current brand direction, ownership, intended role, and optimization before migration.')
  }
  if($p -match '^docs/examples/') {
    return @('Review', 'Documentation example candidate. Validate schema, dependencies, public safety, stable workflow behavior, and any PNG/JSON equivalence before reuse.')
  }
  if($p -match '^docs/publishing/') {
    return @('Review', 'Tracked external-publishing source. Keep as provenance/reference material but rewrite rather than copying into canonical Pages content.')
  }
  if($p -match '^docs/adr/') {
    return @('Keep', 'Architectural decision evidence. Retain as an internal source and reconcile applicability with the evolving V3 contract.')
  }
  if($p -match '^docs/specs/') {
    return @('Keep', 'Versioned contract/specification evidence. Retain; mark historical versions clearly and validate current applicability before public use.')
  }
  if($p -match '^docs/assets/brand/' -or $p -match '^docs/assets/registry/') {
    return @('Keep', 'Canonical brand or Registry asset with recorded provenance. Retain; verify final Pages role and local-runtime delivery.')
  }
  if($p -match '^docs/') {
    return @('Review', 'Existing documentation source. Treat as secondary evidence and rewrite against V3 runtime, registrations, tests, and approved terminology.')
  }
  if($p -match '^examples/') {
    return @('Keep', 'Public example/workflow candidate. Retain, then reproduce against the eventual stable V3 release before documentation publication.')
  }
  if($p -match '^workflows/') {
    return @('Keep', 'Workflow asset candidate. Retain; verify embedded metadata, import behavior, extraction equivalence, dependencies, and stable execution.')
  }
  if($p -match '^tests/') {
    return @('Keep', 'Regression or contract test. Retain as evidence; a passing test alone does not establish complete interactive documentation behavior.')
  }
  if($p -match '^ui/') {
    return @('Keep', 'Production frontend/BV UI source or build metadata. Retain; documentation code must remain isolated from the ComfyUI entry point and bundle.')
  }
  if($p -match '^py/' -or $p -eq '__init__.py' -or $p -match '^js/') {
    return @('Keep', 'Production NodePack implementation or shipped bundle. Retain as primary contract evidence; source repository remains read-only for Wiki work.')
  }
  if($p -match '^schemas/' -or $p -match '^data/' -or $p -match '^scripts/') {
    return @('Keep', 'Runtime data, schema, or reproducibility tooling. Retain and validate applicability/provenance for the selected V3 baseline.')
  }
  if($p -match '^\.github/workflows/') {
    return @('Keep', 'Existing NodePack CI or Registry workflow. Retain and keep technically separate from future Pages validation/deployment.')
  }
  if($p -eq 'third_party_notices.md') {
    return @('Review', 'Required provenance surface. Retain, but resolve the Krea copyright placeholder and completion-dataset terms before publication.')
  }
  if($p -eq 'license' -or $p -eq '.gitignore' -or $p -eq 'node_list.json' -or $p -eq 'pyproject.toml') {
    return @('Keep', 'Core repository metadata, license, package configuration, or registered-node inventory. Retain and use as audit evidence.')
  }
  if($p -eq 'readme.md') {
    return @('Review', 'Large secondary documentation source. A marked draft copy exists in the Wiki workspace; final replacement waits for verified live Pages.')
  }
  if($p -eq 'context.md' -or $p -eq 'handoff.local.md') {
    return @('Review', 'Internal context or handoff material. Determine currency and rewrite verified facts; never publish directly.')
  }
  if($p -eq 'bv_docs_plan.local.md') {
    return @('Keep', 'Binding local documentation plan. Keep gitignored and local; it governs development and publication gates.')
  }
  if($gitState -eq 'Untracked' -or $gitState -eq 'Ignored') {
    return @('Review', 'Local or untracked artifact not covered by a more specific rule. Establish ownership, purpose, provenance, and retention before any action.')
  }
  return @('Review', 'Tracked repository file requiring item-level purpose and publication-suitability confirmation during the next audit cycle.')
}

$rows = foreach($file in Get-ChildItem -LiteralPath $SourceRoot -File -Recurse -Force -ErrorAction SilentlyContinue) {
  $relative = $file.FullName.Substring($SourceRoot.Length + 1).Replace('\','/')
  if($relative -match '^\.git(/|$)'){ continue }
  $gitState = if($modified.Contains($relative)){'Modified'} elseif($tracked.Contains($relative)){'Tracked'} elseif($untracked.Contains($relative)){'Untracked'} else {'Ignored'}
  $decision = Classify $relative $gitState
  [pscustomobject]@{
    path = $relative
    classification = $decision[0]
    git_state = $gitState
    comment = $decision[1]
    size_bytes = $file.Length
    last_write_utc = $file.LastWriteTimeUtc.ToString('yyyy-MM-ddTHH:mm:ssZ')
    snapshot_branch = $branch
    snapshot_commit = $head
    audit_date = '2026-08-24'
  }
}

$rows | Sort-Object path | Export-Csv -LiteralPath $OutputPath -NoTypeInformation -Encoding utf8NoBOM
$rows | Group-Object classification | Sort-Object Name | ForEach-Object { [pscustomobject]@{classification=$_.Name;count=$_.Count} }

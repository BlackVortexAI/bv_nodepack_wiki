# Source File Classification Register

Status: **Approved audit working register; no cleanup authorization**
Snapshot date: 2026-08-24
Source branch: `codex/regional-context-v3`
Source commit: `6a14adb57e00a8fb04c4b6af88b053c675e8ccfc`
Files listed: 4864 (all current files except `.git` internals)

This register is the per-file companion to [`AUDIT.md`](../AUDIT.md). Every row in
[`source-file-classification.csv`](source-file-classification.csv) records the current
classification and comment, Git state, size, timestamp, branch, commit, and audit date.
Comments describe why the classification was assigned at this snapshot so later V3 cycles
can review only changed or new rows.

## Counts

| Classification | Files |
| --- | ---: |
| `Keep` | 329 |
| `Move/Archive` | 36 |
| `Remove` | 4361 |
| `Review` | 138 |

## Maintenance

Regenerate after a meaningful V3 documentation-contract cycle:

```powershell
powershell -ExecutionPolicy Bypass -File .\audit\generate-source-file-classification.ps1
```

A regenerated classification is a new audit proposal. It never authorizes deletion,
movement, cleanup, staging, publication, push, or deployment. Review the CSV diff and obtain
focused approval before acting on `Move/Archive` or `Remove` rows.

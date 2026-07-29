# 07 — Branching Workflow

## Branch structure

- **`main`** — production-ready code only. Protected: requires a PR to merge, no direct pushes.
- **`dev`** — integration branch. Protected: requires a PR to merge, no direct pushes. Everyone branches off `dev`, not `main`.
- **`feature/*`** — one branch per issue, branched from `dev`. Naming: `feature/<area>-<short-description>`, e.g. `feature/ml-synthetic-data`.

## One-time setup (team lead)

Create `dev` from `main` if it doesn't exist yet:

```bash
git checkout main
git pull origin main
git checkout -b dev
git push origin dev
```

Or via GitHub UI: branch dropdown → type `dev` → "Create branch: dev from 'main'".

Then add branch protection on **both** `main` and `dev`:

Repo → Settings → Branches → Add branch protection rule → branch name pattern (`main`, then repeat for `dev`) → check "Require a pull request before merging" → Save.

## Day-to-day workflow (everyone)

```bash
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/<area>-<short-description>
```

Work, commit, push, open a PR **into `dev`** (not `main`).

## GitHub issue branch creation

When using the "Create a branch" button on a GitHub issue sidebar, **double-check the source branch dropdown is set to `dev`** — it sometimes defaults to `main`.

## Merging to `main`

`dev` merges to `main` only at agreed milestones (e.g. end of each week/sprint), via a reviewed PR — never a direct push.

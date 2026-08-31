# Branch & Release Model

## Branches
- **`main`**: Primary branch. Merges to `main` are automatically built and deployed.

## Tagged Releases (`vX.Y.Z`)
Releases are triggered automatically when a version tag (`v*`) is pushed to GitHub.

### Release Workflow
1. Update version across the project:
   - `package.json` (`"version": "1.x.y"`)
   - `src/app/api/version/route.ts`
   - `docs/CHANGELOG.md` (add entry under `## [1.x.y] - YYYY-MM-DD`)
2. Commit and push to `main`.
3. Create and push git tag:
   ```bash
   git tag -a v1.x.y -m "Release v1.x.y"
   git push origin v1.x.y
   ```
4. GitHub Actions (`.github/workflows/release.yml`) automatically extracts notes from `docs/CHANGELOG.md` and publishes the GitHub Release with changelog notes.

## Hotfix Flow
1. Branch from the tag (e.g. `git checkout -b hotfix-v1.1.1 v1.1.0`)
2. Commit fix, open PR to `main`.
3. After merging, create a new patch tag `v1.1.1` and push.

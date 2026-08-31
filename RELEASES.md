# Branch & Release Model
- **main**: Protected branch. Merges here trigger staging deployments.
- **tags (vX.Y.Z)**: Managed by Release Please. Triggers production deployments.

## Hotfix Flow
1. Branch from the tag (e.g., `git checkout -b hotfix-v1.0.1 v1.0.0`)
2. Commit fix, open PR to main.
3. Once merged, release-please handles the patch version bump.

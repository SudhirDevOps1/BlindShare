# Incident response

## Bucket-leak drill (presigned key or app key exposed)
1. **Contain** — rotate `B2_KEY_ID`/`B2_APPLICATION_KEY` (or R2 S3 token) in the provider console.
2. Redeploy with new secrets; old presigned URLs die with the key.
3. **Assess** — list objects touched (`/api/admin/sweeps` scan + provider access logs).
4. **Purge** — delete affected objects; owners re-upload (ciphertext, so exposure is limited).
5. **Notify** — template below; note that leaked bytes were ciphertext without keys.
6. **Record** — audit-log entry + CHANGELOG note + post-mortem in the repo.

## Notification template
> Subject: Security notice — object storage credential rotation
> On <date> we rotated storage credentials after detecting <event>. Documents stored by
> BlindShare are encrypted client-side with AES-GCM-256; the decryption keys are never
> transmitted to or stored by our servers, so exposed objects were unreadable ciphertext.
> Action needed: none / re-share affected links. Questions: <contact>.

## Other drills
- **Database compromise:** rotate `SESSION_SECRET` (logs everyone out), rotate DB password,
  restore from latest ciphertext+DB backup, review audit log.
- **Abuse spike:** enable `MAINTENANCE_MODE=true`, tighten `VIEWS_PER_HR_PER_LINK`.
- **Emergency kill-switch:** admin panel maintenance toggle blocks all viewer routes (reversible, audited).

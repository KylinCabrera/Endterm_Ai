# External steps to finish Week 4

Code and documentation are prepared locally. **Hosting, remote CI measurements, live label accuracy, and rollback are not certified complete.** Keep a dated evidence record with URLs, commit SHAs, test results, and screenshots. Do not include secret values or session tokens.

## 1. Configure accounts and environments before merging

- [ ] Choose the release candidate commit after reviewing and committing these changes. Do not tag uncommitted work.
- [ ] In MongoDB, use a dedicated application database/user with read/write and index-creation permissions. Permit the backend host to reach it. Startup creates the `ai_usage.expires_at` TTL index; check that startup succeeds. Do not clear production allowance counters to bypass limits.
- [ ] In Render, configure backend environment variables from the [setup table](../README.md#setup): database, Clerk issuer, explicit frontend origins, Gemini key/model, usage limits, `ENV=production`, optional Sentry DSN. Confirm your Gemini project can use the configured model; do not assume access from its name.
- [ ] Set external Gemini project quotas/billing alerts or enforceable budget controls where available. Default code allowances are 5 scans/user/minute, 50/user/day, 500/app/day. Choose conservative limits for your account's actual quota and budget. Attempts can have different token costs; a request count is not a currency cap.
- [ ] Render start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`; build command: `pip install -r requirements.txt`. Render supplies `RENDER_GIT_COMMIT`; on other hosts set `APP_REVISION` to the full deployed SHA.
- [ ] In Vercel, set project root to `frontend`, install `npm ci`, build `npm run build`, output `dist`. Set `VITE_API_URL` to your real backend HTTPS origin and `VITE_CLERK_PUBLISHABLE_KEY` to your Clerk browser key. Rebuild after changes to these variables.
- [ ] Configure Clerk for the real frontend domain and redirects. Backend issuer and browser key must identify the same Clerk app. `FRONTEND_URL` must match the browser token's `azp` origin. Use a separate staging Clerk app/database if testing destructive failures.
- [ ] Confirm the hosting plan is currently free in **your accounts**, record the public URLs and plan evidence, and check sleep/resource limits. Hosting configuration alone does not prove free-tier deployment.

## 2. Configure GitHub and run the pipeline

- [ ] Repository Actions secret: `RENDER_DEPLOY_HOOK_URL` (keep the URL private).
- [ ] Repository Actions variable: `BACKEND_HEALTH_URL`, for example `https://your-backend.onrender.com/health`.
- [ ] Disable Render's independent automatic deploy-on-push if GitHub Actions is to gate deployment; otherwise Render could deploy before checks finish. Configure Vercel to require successful checks or promote a verified preview to production manually.
- [ ] Review/commit/push changes through your usual PR process. Backend, frontend, and secret-scan jobs need no production credentials. Do not add Gemini/MongoDB credentials to the test jobs.
- [ ] Confirm all jobs pass on GitHub's actual Python 3.11/Node 22 runners. The Docker-based secret scan was not executed locally. Review redacted findings privately; rotate any real exposed credential first, then coordinate history cleanup and rerun. Do not ignore a real leak merely to obtain green CI.
- [ ] Require backend/frontend/secrets checks in branch protection. Restrict deployment hooks and hosting account access to maintainers.
- [ ] On an approved push to `main`, CI requests Render deployment and polls `/health` for connected MongoDB **and the exact triggering SHA**. If verification times out, inspect Render logs and actual health; do not assume the old healthy service is the new release. Concurrent newer deployments must not be mistaken for the tested SHA.

## 3. Demonstrate the live release candidate

- [ ] Open frontend HTTPS URL and direct `/dashboard` and `/profile` links after refresh. Verify sign-in, sign-out, protected routes, and no console errors.
- [ ] Upload a clear label → scan → review → save → refresh → change quantity → rename → delete. Check persisted values against the label.
- [ ] Use a second account: confirm it cannot see or edit the first account's cart/profile, including direct API calls using the other account's item ID.
- [ ] Verify loading states, empty cart, readable errors, keyboard navigation, mobile layout, and desktop/mobile camera flows listed in the [frontend guide](../frontend/README.md).
- [ ] In a separate staging environment with reduced limits, confirm quota exhaustion returns 429 plus `Retry-After`, no provider call occurs after exhaustion, and restart does not reset counters. Restore the intended limits afterwards.
- [ ] In staging, exercise invalid/missing uploads, malformed JSON, expired sessions, provider quota/unavailability, slow/offline connections, and MongoDB outage. Verify no false success. Do not trigger outages against real users.
- [ ] After an ambiguous save timeout, refresh and inspect the cart before retrying. Confirm the UI can recover without automatically repeating the write.
- [ ] If Sentry is configured, verify a controlled staging error arrives without credentials or label bytes being exposed.
- [ ] Complete the [real-label evaluation](../evaluations/README.md) and retain every result, including failures. Resolve release-blocking failures or document explicit limitations.

## 4. Measure pipeline gains

- [ ] Follow the [measurement procedure](PIPELINE_MEASUREMENTS.md): same-ref uncached runs, cache warm-up, cached runs, medians, cache hit evidence, run URLs, and the real before/after table. Do not fill pending cells with estimates.

## 5. Rehearse rollback before release

Use staging first. A previous commit must be compatible with the current database and required environment variables. These changes add an `ai_usage` collection/index but do not require deleting or rewriting cart/profile data. Rolling back to an older backend may remove the new rate guards; restrict staging access and check provider quotas during the exercise.

1. Record known-good backend and frontend deployment IDs, full Git SHAs, environment settings, candidate IDs, and start time. Use synthetic test accounts/data. Never copy private credentials into the record.
2. Deploy the candidate to staging and run scan/save/refresh and health checks. Preserve a test cart/profile as persistence evidence.
3. Use the hosting provider's rollback/redeploy controls to deploy the recorded known-good backend and frontend versions. Do not push a force-reset or delete the database.
4. Check the old backend's `/health`, frontend login, cart/profile persistence, and a representative scan. If that older version predates the health revision field, verify its SHA through the host's deployment record instead.
5. Record expected and actual versions, recovery start/end times, observed errors, data consistency, and whether recovery met your agreed target. A Git revert alone is not the rehearsal.
6. Restore the candidate, verify its exact SHA and DB health with the command below, and rerun the same browser flow. Confirm scan guards still work.

```powershell
python scripts/check_deployment.py --url https://YOUR-BACKEND/health --revision FULL_CANDIDATE_SHA
```

- [ ] Attach actual rollback and restored-candidate evidence. Record a failed rehearsal honestly and fix it before marking rollback complete.

## 6. Tag and publish the approved release

Only after all release-blocking checks pass:

1. Finish [CHANGELOG.md](../CHANGELOG.md): move Unreleased notes under the chosen version and real release date; include limitations and evidence links. Commit those notes.
2. Ensure the intended release commit is pushed, tested, and deployed; record its full SHA. Choose an unused version (for example `v1.0.0` if it is still available remotely).
3. Tag that exact commit and push the tag:

```powershell
git tag -a v1.0.0 FULL_APPROVED_SHA -m "NutriGo AI v1.0.0"
git push origin v1.0.0
```

4. Create a GitHub Release from that tag with changelog, public URLs, test/CI links, evaluation results, measured pipeline gains, rollback evidence, known limitations, and the full commit SHA. Tag pushes do not deploy in this workflow.

- [ ] Record the release URL. Do not claim Week 4 complete while deployment, measurements, or rollback evidence is still pending.

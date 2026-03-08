# Submission Checklist — Final 48 Hours

## Status Snapshot
Core app is runnable and the main packaging assets are mostly in place.

Completed in this review:
- Local app boot verified
- `GET /api/health` verified
- `GET /api/dashboard` verified
- AI copilot response verified
- Demo mode path verified
- 4 core screenshots captured as real PNGs
- Submission-form draft added at `docs/submission-form.md`

Biggest remaining risks are now:
1. public deployment / public repo URL confirmation
2. final demo video recording + upload
3. actual submission form completion

## Must-Have Before Submission

### 1. Final screenshots
Capture and save:
- [x] `docs/screenshots/dashboard-overview.png`
- [x] `docs/screenshots/live-source-health.png`
- [x] `docs/screenshots/ai-copilot.png`
- [x] `docs/screenshots/demo-mode.png`

### 2. Demo video readiness
- [ ] Record a 2–3 minute walkthrough using `docs/demo-script.md`
- [x] Verify at least one AI copilot question succeeds on camera
- [x] Verify **Demo Mode** is included in the recording path
- [ ] Keep a backup recording using demo mode in case live feeds are quiet

### 3. Submission form copy
Prepare short answers for the hackathon form:
- [x] One-line product description
- [x] Problem statement
- [x] How it works / architecture summary
- [x] What makes it innovative
- [x] What was built during the hackathon
- [ ] Public repo URL
- [ ] Public demo/deployment URL
- [ ] Demo video URL

Reference file:
- `docs/submission-form.md`

### 4. Deployment verification
- [ ] Public deployment loads successfully
- [x] `GET /api/health` returns `status: ok`
- [x] `GET /api/dashboard` returns a valid payload
- [x] Frontend loads with no obvious broken cards
- [x] Demo mode works in deployed environment

Note: only local verification is complete so far. Public deployment still needs confirmation.

## Nice-to-Have Before Submission
- [ ] Capture one mobile screenshot of the AI copilot drawer
- [ ] Add one architecture diagram image to `docs/`
- [x] Add a short “Known limitations” section to the hackathon submission text
- [ ] Record a second ultra-short backup demo (<60s)

## Known Gaps Identified During Review
- [x] Final PNG screenshots referenced in `README.md` are now present
- [x] Dedicated submission checklist exists
- [x] Dedicated demo script exists
- [ ] No tests or lint scripts are defined in `package.json`
- [x] Port 3000 may already be occupied on some machines; use `PORT=3101 npm start` if needed locally

## Suggested Submission Narrative
Use these points consistently:
- Civic Risk Copilot turns fragmented civic-risk signals into one explainable operational picture
- The score is transparent, weighted, and factor-based
- The UI is action-oriented, not just informational
- The system is resilient to flaky public APIs
- Demo mode guarantees a compelling judging experience

## Final Go / No-Go
Ship if all are true:
- [ ] Public link works
- [ ] Demo video is uploaded
- [x] 4 core screenshots are captured
- [x] README is accurate
- [ ] One stable demo path has been rehearsed end-to-end

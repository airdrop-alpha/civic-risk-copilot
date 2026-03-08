# Submission Checklist — Final 48 Hours

## Status Snapshot
Core app is present and runnable. Biggest remaining risk is **submission packaging**, not core functionality.

## Must-Have Before Submission

### 1. Final screenshots
Capture and save:
- [ ] `docs/screenshots/dashboard-overview.png`
- [ ] `docs/screenshots/live-source-health.png`
- [ ] `docs/screenshots/ai-copilot.png`
- [ ] `docs/screenshots/demo-mode.png`

### 2. Demo video readiness
- [ ] Record a 2–3 minute walkthrough using `docs/demo-script.md`
- [ ] Verify at least one AI copilot question succeeds on camera
- [ ] Verify **Demo Mode** is included in the recording
- [ ] Keep a backup recording using demo mode in case live feeds are quiet

### 3. Submission form copy
Prepare short answers for the hackathon form:
- [ ] One-line product description
- [ ] Problem statement
- [ ] How it works / architecture summary
- [ ] What makes it innovative
- [ ] What was built during the hackathon
- [ ] Public repo URL
- [ ] Public demo/deployment URL
- [ ] Demo video URL

### 4. Deployment verification
- [ ] Public deployment loads successfully
- [ ] `GET /api/health` returns `status: ok`
- [ ] `GET /api/dashboard` returns a valid payload
- [ ] Frontend loads with no obvious broken cards
- [ ] Demo mode works in deployed environment

## Nice-to-Have Before Submission
- [ ] Capture one mobile screenshot of the AI copilot drawer
- [ ] Add one architecture diagram image to `docs/`
- [ ] Add a short “Known limitations” section to the hackathon submission text
- [ ] Record a second ultra-short backup demo (<60s)

## Known Gaps Identified During Review
- [ ] Final PNG screenshots referenced in `README.md` are not present yet
- [ ] No dedicated submission checklist existed before this file
- [ ] No dedicated demo script existed before this file
- [ ] No tests or lint scripts are defined in `package.json`
- [ ] Port 3000 may already be occupied on some machines; use `PORT=3101 npm start` if needed locally

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
- [ ] 4 core screenshots are captured
- [ ] README is accurate
- [ ] One stable demo path has been rehearsed end-to-end

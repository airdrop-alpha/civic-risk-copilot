# Demo Script — World Wide Vibes Submission

Target length: **2–3 minutes**

## Goal
Show that Civic Risk Copilot turns fragmented public-risk signals into one explainable, actionable briefing for Montgomery, Alabama — and still works when live sources are imperfect.

## 30-Second Framing
> During severe weather or civic disruption, residents and responders should not have to open eight dashboards to understand what is happening right now. Civic Risk Copilot aggregates official alerts, flood gauges, air quality, local incidents, city notices, and local risk news into one explainable 0–100 civic risk score with an AI briefing assistant.

## Recommended Live Flow

### 1. Open the homepage
Say:
> This is the live Montgomery civic risk dashboard. The system continuously aggregates public signals and turns them into a single operational picture.

Point to:
- overall risk gauge
- top hero stats
- last updated timestamp

### 2. Explain the score
Say:
> The score is not a black box. Each factor has a visible weight, severity, and contribution, so users can understand why risk is rising.

Point to:
- risk factor cards
- weighted contributions
- 7-day trend chart

### 3. Show actionability
Say:
> Instead of just reporting conditions, the dashboard generates an action brief — what to do now and what to keep watching.

Point to:
- Action Brief
- Watch List
- Source Reliability

### 4. Show the AI Copilot
Prompt suggestion:
- `What is the biggest risk in Montgomery right now?`
- `Should residents avoid outdoor activity today?`
- `What actions should city responders prioritize?`

Say:
> The copilot is grounded in the current dashboard context, so it answers from the live operational picture instead of generic weather knowledge.

### 5. Show graceful degradation
Say:
> Real-world public APIs fail. This system keeps running by marking sources live, stale, unavailable, or demo, instead of crashing or hiding uncertainty.

Point to:
- Source Reliability card
- app status banner if degraded

### 6. End with demo mode
Click:
- **Load Demo Mode**

Say:
> For hackathon judging, demo mode provides a controlled high-risk scenario so we can show the full experience even if live conditions are quiet.

Point to:
- severe banner
- higher score
- dramatic factor shifts

## Strong Closing
> Civic Risk Copilot makes public-risk information faster to understand, easier to trust, and more useful to act on — especially when time and clarity matter most.

## Backup Notes
If live data is calm or partially unavailable:
- Use **Demo Mode** early.
- Call out that calm live conditions are a success case for the city, not a product failure.
- Emphasize resilience: stale fallback, safe payloads, AI fallback, and visible source health.

## Pre-Demo Checklist
- App running locally or on deployed URL
- Browser tab already open
- Demo mode tested once before recording
- One AI prompt copied and ready to paste
- Screenshot assets captured after final UI pass

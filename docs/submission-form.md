# Submission Form Copy — World Wide Vibes

## One-line product description
Civic Risk Copilot turns fragmented public-risk signals in Montgomery, Alabama into one explainable live risk score, action brief, and AI-powered situational briefing.

## Problem statement
During severe weather or civic disruption, residents and responders should not need to check multiple dashboards, alerts, river gauges, city notices, and local news sources just to understand what is happening now. The information exists, but it is fragmented, noisy, and hard to act on quickly.

## How it works / architecture summary
The app aggregates live public data from weather, official alerts, air quality, flood gauges, earthquakes, local incidents, city-service notices, and local risk news. It normalizes those signals into a weighted 0–100 civic risk score, exposes factor-level contributions for transparency, and generates an action-oriented briefing. An AI copilot answers questions using the current dashboard context, with a deterministic fallback if model APIs are unavailable. The system also marks sources as live, stale, unavailable, or demo so the UX stays honest under partial outages.

## What makes it innovative
- Explainable civic-risk scoring instead of a black-box severity label
- Action-oriented dashboard, not just passive monitoring
- AI copilot grounded in current operational context
- Graceful degradation across flaky public APIs
- Demo mode that guarantees a compelling judging experience even when live conditions are quiet

## What was built during the hackathon
We built the full MVP: live multi-source aggregation, weighted civic-risk engine, factor breakdown UI, action brief, source reliability panel, risk trend view, AI copilot chat, server-sent live updates, demo mode, shareable risk summary, and graceful fallback handling for upstream API failures.

## Repo URL
Add the public GitHub repository URL here.

## Public demo / deployment URL
Add the deployed app URL here.

## Demo video URL
Add the uploaded demo video URL here.

## Short judging pitch
Civic Risk Copilot makes public-risk information faster to understand, easier to trust, and more useful to act on when time and clarity matter most.

## Known limitations
- Some public data sources are inconsistent and may be temporarily unavailable.
- Incident coverage depends on discoverable public datasets.
- AI responses fall back to deterministic summaries when model credentials are missing.
- Demo mode is intentionally separate from live mode so rehearsals do not contaminate live context.

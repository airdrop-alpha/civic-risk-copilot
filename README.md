# Civic Risk Copilot

**Civic Risk Copilot** is a real-time civic risk dashboard and AI briefing assistant for **Montgomery, Alabama**.
It pulls together weather, alerts, air quality, flood gauges, community incidents, city notices, and local risk news into a single operational picture that judges can understand in seconds.

## Pitch

During severe weather or civic disruption, residents and responders should not have to check eight different websites, feeds, and dashboards to answer one question:

**"What is happening in Montgomery right now, how bad is it, and what should I do next?"**

Civic Risk Copilot answers that question with:
- A **live 0–100 civic risk index**
- An **explainable factor breakdown**
- **Action-oriented recommendations** for residents and operators
- An **AI copilot chat** grounded in the current dashboard context
- **Graceful degradation** when external APIs fail

This makes the project demo-friendly, practical, and easy to trust.

## What Judges Will Notice

- **Visually polished command-center UI** with a live risk gauge, trend chart, source health, action brief, and rich incident cards
- **Explainable scoring model** instead of a black-box severity label
- **Resilient architecture** with stale-data fallback, unavailable-source handling, and demo mode for presentations
- **AI layer with safe fallback** so chat still answers even if model credentials or APIs are unavailable
- **Shareable risk summary** for quick handoff during a live demo

## Core Features

- **Real-time dashboard** for Montgomery, AL
- **Weighted civic risk engine** with factor-level contributions
- **Action Brief** with recommended next steps and watch items
- **Source Reliability** view with data confidence summary
- **Live SSE refresh** for dashboard updates
- **Demo mode** for a consistent hackathon presentation scenario
- **AI chat copilot** for questions like:
  - “What is the biggest risk right now?”
  - “Should residents avoid outdoor activity today?”
  - “What actions should city responders prioritize?”
- **Graceful degradation** across weather, AQI, flood, incidents, news, and city-service feeds
- **Share Risk Report** button for quick judge-friendly summaries

## How It Works

```text
Browser Dashboard + AI Copilot
          |
          v
      Express Server
          |
          +--> /api/dashboard      Aggregated live dashboard
          +--> /api/chat           Context-grounded AI response
          +--> /api/stream         Live server-sent updates
          +--> /api/history        Snapshot history
          +--> /api/health         Runtime health metadata
          |
          v
   Data Aggregation Layer
          |
          +--> Open-Meteo weather + air quality
          +--> NOAA / NWS active alerts
          +--> USGS flood gauges
          +--> USGS earthquake feed
          +--> Montgomery open data incidents
          +--> Local news scraping
          +--> City service announcement scraping
          |
          v
   In-memory cache + stale snapshot fallback
```

## Risk Model

The risk score is normalized to **0–100** and mapped to:
- **0–24:** Low
- **25–49:** Moderate
- **50–74:** High
- **75–100:** Severe

Current weighted factors:
- **Official alerts:** 24%
- **Flood risk:** 22%
- **Heat stress:** 20%
- **Air quality:** 16%
- **Earthquake activity:** 10%
- **Community incidents:** 8%

The UI exposes each factor’s:
- raw score
- severity
- weight
- weighted contribution
- textual summary

## Data Sources

- **Open-Meteo Forecast API**
- **Open-Meteo Air Quality API**
- **NOAA / NWS Alerts API**
- **USGS Water Services API**
- **USGS Earthquake API**
- **Montgomery Open Data / Socrata**
- **Montgomery city website**
- **Local risk news sources** such as WSFA and Montgomery Advertiser

## Resilience & Graceful Degradation

This project is built for messy real-world APIs.

When a source fails, the app now:
- returns a safe structured payload instead of crashing the route
- reuses the last successful snapshot when available
- labels sources as **live**, **stale**, **unavailable**, or **demo**
- computes a **data confidence summary** for the dashboard
- keeps AI chat working via a deterministic fallback response

This means the demo remains stable even when one or more upstream feeds are unreliable.

## Demo Flow

Recommended hackathon demo sequence:

1. Open the dashboard homepage
2. Point out the **risk gauge**, **top factors**, and **hero stats**
3. Show the **Action Brief** and **Source Reliability** cards
4. Ask the copilot: `What is the biggest risk in Montgomery right now?`
5. Click **Share Risk Report** to show the handoff summary
6. Click **Load Demo Mode** for a dramatic high-risk scenario
7. Highlight that live mode and demo mode are intentionally separated so demo data does not contaminate live chat context

## Screenshots

Place final demo screenshots here before submission:
- `docs/screenshots/dashboard-overview.png` — Full dashboard with gauge, factor grid, and action brief
- `docs/screenshots/live-source-health.png` — Source reliability + graceful degradation view
- `docs/screenshots/ai-copilot.png` — AI chat answering a Montgomery-specific question
- `docs/screenshots/demo-mode.png` — Demo mode high-risk scenario for judges

Additional notes live in `docs/screenshots/README.md`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` with:

```bash
PORT=3000
GEMINI_API_KEY=your_gemini_key
# optional
OPENROUTER_API_KEY=your_openrouter_key
BRIGHT_DATA_API_KEY=your_brightdata_key
```

Notes:
- If no AI key is configured, the chat endpoint still works with a built-in fallback response.
- If Bright Data is not configured, scraping falls back to direct fetch attempts.

### 3. Start the app

```bash
npm start
```

Open `http://localhost:3000`

## API Endpoints

- `GET /api/dashboard`
- `GET /api/dashboard?mode=demo`
- `GET /api/stream`
- `GET /api/history`
- `GET /api/health`
- `GET /api/weather`
- `GET /api/alerts`
- `GET /api/air-quality`
- `GET /api/flood`
- `GET /api/earthquakes`
- `GET /api/incidents`
- `GET /api/news`
- `GET /api/city-services`
- `POST /api/chat` with `{ "message": "..." }`

## Tech Stack

- **Node.js**
- **Express**
- **Axios**
- **Vanilla HTML/CSS/JS**
- **Chart.js**
- **Gemini / OpenRouter** for AI responses

## Project Structure

- `src/server.js` — Express server, routes, SSE, startup behavior
- `src/data/dashboard.js` — aggregation, risk scoring, action brief, source confidence
- `src/data/*.js` — source adapters and graceful fallback payloads
- `src/ai/copilot.js` — AI orchestration and fallback answers
- `public/index.html` — polished dashboard frontend
- `docs/screenshots/README.md` — screenshot placeholder notes

## Demo Notes for Judges

- Best experienced with live internet access, but the app is designed to **degrade gracefully**.
- **Demo mode** gives a reliable “wow moment” if live feeds are quiet.
- The product purpose stays focused on **Montgomery civic risk awareness + AI chat**, not generic weather.
- The architecture favors **clarity, trust, and resilience** over flashy but brittle complexity.

## Team

Built for the **World Wide Vibes Hackathon**.

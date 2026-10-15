# Project Prompts & Conversation History

This document collates all the prompts provided during the development of the Singapore Bus Arrival & Real-Time Proximity Tracker application.

---

### Prompt 1: Initial Application Build (Frontend)
```text
build a singapore based bus arrival time application that tracks real time location data and notifies users when their specific bus is approaching.
build just the front end for now, i will include the back end connection later
```

**Outcome:**
- Built full Singapore-based transit web application (`SG BusPulse`).
- Integrated authentic 5-digit bus stop codes (`08057` Dhoby Ghaut, `04168` Clarke Quay, `05013` Chinatown, etc.) and LTA standard categories (`SEA` Seats Available, `SDA` Standing Available, `LSD` Limited Standing, `SD` Single Deck, `DD` Double Deck, `WAB` Wheelchair Accessible).
- Created interactive Leaflet GPS map with real-time bus vehicle movement, headings, and speed telemetry.
- Implemented approaching bus proximity notification system with Web Audio transit chime, Web Notifications API, device vibration, and in-app banner.
- Added live simulation testing lab with 1-click test triggers.

---

### Prompt 2: GitHub Repository Push
```text
git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/derrickloi/LTA-bus-arrival---vibe-coding-SMU.git
```

**Outcome:**
- Initialized local Git repository on `main` branch.
- Committed initial application codebase.
- Configured remote origin and pushed to GitHub repository `derrickloi/LTA-bus-arrival---vibe-coding-SMU`.
- Sanitized credentials from local git remote configuration.

---

### Prompt 3: Serverless Backend Connection (LTA DataMall v3 API)
```text
add a serverless connection that pulls live data from LTA Datamall using the following endpoints:

- store this in /api folder (project root level) not the src folder
- include /health.ts and /busarrivals.ts within that subfolder
- do not hardcode any key, i will include them later

GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

**Outcome:**
- Created `/api/health.ts` for service health checking and API key configuration verification.
- Created `/api/busarrivals.ts` connecting to LTA DataMall v3 `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival` with query parameters (`BusStopCode`, `ServiceNo`), dynamic `AccountKey` retrieval from `process.env.LTA_ACCOUNT_KEY`, CORS headers, and graceful error handling.
- Created `server.ts` mounting Vite in dev and routing `/api/*` endpoints.
- Documented `LTA_ACCOUNT_KEY` in `.env.example`.
- Added Bus Stop `83139` (Parkway Parade / Marine Parade Rd) to the transit dataset.
- Committed and pushed changes to GitHub (`2b5897f`).

---

### Prompt 4: Collate Prompts
```text
collate all the prompts thus far and save into prompt.md
```

**Outcome:**
- Collated all previous user prompts and outcomes into `/prompt.md`.

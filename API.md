# API overview

All routes are protected by the configured `APP_PASSWORD` gate when it is set.

- `GET /api/google/connect` – begin Google OAuth
- `GET /api/google/callback` – OAuth callback
- `GET /api/google/status` – connection state
- `GET /api/google/gmail` – latest inbox messages
- `POST /api/google/draft` – create Gmail draft `{ "to": "...", "subject": "...", "body": "..." }`
- `POST /api/google/send` – send existing draft `{ "draftId": "...", "confirm": true }`
- `GET /api/google/calendar` – upcoming calendar events
- `POST /api/google/calendar` – create event `{ "summary": "...", "start": "2026-12-01T10:00:00+01:00", "end": "2026-12-01T10:30:00+01:00", "description": "...", "confirm": true }`

The send and create-event endpoints reject requests without `confirm: true`.

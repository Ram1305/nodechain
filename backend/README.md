# Chatter Backend (Express + MongoDB + Cloudinary)

API server matching the Flutter app endpoints in `lib/utilities/web_service.dart`.

## Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- Cloudinary account (for images/videos)

## Setup

```bash
cd backend
cp .env.example .env
# Fill CLOUDINARY_* (and optional AGORA_*) in .env
npm install
npm run seed
npm run dev
```

Server listens on `http://0.0.0.0:3000` by default.

## `.env`

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `MONGODB_URI` | Mongo connection string |
| `API_KEY` | Must match Flutter header `apikey` (default `123`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_FOLDER` | Upload folder prefix (default `chatter`) |
| `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` | Optional; for `generateAgoraToken` |

## Flutter wiring

In `lib/utilities/const.dart`:

- Android emulator: `baseURL = "http://10.0.2.2:3000/";`
- iOS simulator: `baseURL = "http://127.0.0.1:3000/";`
- Physical device: use your PC LAN IP, e.g. `http://192.168.1.10:3000/`
- Keep `itemBaseURL = ""` so Cloudinary absolute URLs work as-is

All client calls are `POST /api/{endpoint}` with header `apikey: 123`.

## Key update endpoints

- `POST /api/editProfile` — multipart; updates profile fields; uploads `profile` / `background_image` to Cloudinary
- `POST /api/editRoom` — multipart; updates room; optional `photo` via Cloudinary
- `POST /api/uploadFile`, `addPost`, `createStory`, `uploadReel`, `profileVerification` — media via Cloudinary

## Response shape

```json
{ "status": true, "message": "Success", "data": {} }
```

Numeric `id` fields and snake_case keys match Flutter models.

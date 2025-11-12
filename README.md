# Food Log Frontend

Food Log is a React + Vite single-page app that lets users capture meal photos, submit them to an ML-powered backend for nutrition analysis, and browse historical predictions. The UI is built on Material Tailwind, supports live camera capture on mobile, and visualises calorie trends with ApexCharts.

## Features

- **Meal capture dialog** with camera/gallery pickers, client-side image downscaling, and date/time metadata controls.
- **Prediction workflow** that streams the meal photo to `/predict`, shows a processing state, normalises the response (macros, ingredients, metadata), and displays a detailed result card.
- **History dashboard** with calorie trend charts, summary tiles, and a tabular list of previous predictions loaded from `/history`.
- **Auth landing** with login/sign-up flows backed by `/auth/login` and `/auth/signup`, persistent JWT handling, and automatic session refresh.
- **API resilience** via Axios interceptors, custom error codes (low-confidence responses), and user-friendly fallbacks when the backend cannot analyse a picture.

## Tech Stack

- [React 18](https://react.dev)
- [Vite 4](https://vitejs.dev)
- [Material Tailwind React](https://www.material-tailwind.com/)
- [Tailwind CSS 3](https://tailwindcss.com)
- [Axios](https://axios-http.com)
- [React Router 6](https://reactrouter.com)
- [ApexCharts](https://apexcharts.com)

## Getting Started

### Prerequisites

- Node.js 18+ (16 works but 18 is recommended)
- npm 9+ (or compatible alternative such as pnpm / yarn)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` (or `.env.local`) file at the project root and set any overrides you need:

```bash
VITE_API_BASE_URL=https://foodlog-frgo.onrender.com
```

If `VITE_API_BASE_URL` is omitted, the app defaults to `https://foodlog-frgo.onrender.com`. You can point to a local backend (`http://localhost:5000`) while developing.

### Development Server

```bash
npm run dev
```

Vite hosts the app at `http://localhost:5173` by default with hot-module reloading.

### Production Build

```bash
npm run build
npm run preview   # optional: serve the build locally
```

The static assets land in `dist/`, ready to deploy behind any static host or CDN. Use `npm run preview` to sanity-check the bundle locally.

## Project Structure

```
├── public/                     # Static assets (icons, manifest, fallbacks)
├── src/
│   ├── api.js                  # Axios client, auth helpers, predict/history requests
│   ├── components/
│   │   └── meal-capture/       # Capture dialog + image optimization utilities
│   ├── context/meal.jsx        # Meal context (capture + analysis + history state)
│   ├── pages/                  # Auth landing, dashboard, processing, result, etc.
│   ├── utils/                  # Date formatting, image helpers, auth utilities
│   ├── App.jsx / main.jsx      # Route definitions and Tailwind provider setup
│   └── routes.jsx              # Sidebar + router configuration
├── openapi.yaml                # Backend contract for /predict, auth, history, health
├── tailwind.config.cjs         # Tailwind design tokens + Material Tailwind plugin
└── vite.config.js              # Vite & PWA plugin config
```

## Prediction Flow Overview

1. **Capture** – users launch the `MealCaptureDialog`, choose a photo, and optionally adjust meal date/time. Images are resized client-side for faster uploads.
2. **Processing** – `/predict` is called with `photo`, optional `meal_date`, and JWT Bearer auth. The UI displays a spinner and surfaces structured errors (including low-confidence responses).
3. **Result** – successful predictions show ingredients, macro estimates, and the annotated photo. Failures show “Sorry! Unfortunately, we cannot analyze your picture!” in place of ingredients.
4. **History** – saved meals are fetched via `/history` and rendered on the dashboard chart + table.

For endpoint specifics, consult `openapi.yaml` or generate docs via your preferred Swagger tooling.

## Authentication

Auth tokens are stored via helpers in `src/utils/auth.js` and automatically attached to requests through Axios interceptors. The `MealProvider` listens for auth changes (storage events + custom `AUTH_EVENT`) to refresh history when a session updates. To rotate backend JWT secrets, simply log out/in; no frontend code changes are required.

## Customisation Tips

- Update colors/fonts through `tailwind.config.cjs` and `src/styles/tailwind.css`.
- Override API hosts using `.env` files per environment (dev/staging/prod).
- The prediction result cards (in `src/pages/Result.jsx`) are intentionally modular—add new sections (e.g., micronutrients) by extending the normalized payload in `Processing.jsx`.
- Disable the PWA plugin or tweak manifest settings inside `vite.config.js` if you don’t need installable support.

## Troubleshooting

- **Pointing to the wrong backend?** Console-log `API_BASE_URL` or inspect Network requests in DevTools; they should hit the domain configured via `VITE_API_BASE_URL` (defaults to `https://foodlog-frgo.onrender.com`).
- **Getting “Sorry! Unfortunately, we cannot analyze your picture!” immediately?** The backend either failed or returned a low-confidence 422. Check the server logs and ensure `/predict` accepts the uploaded mime types.
- **No meals in history after login?** Confirm the JWT is valid (inspect localStorage) and ensure your backend’s `/history` returns `{ items: [...] }` as documented.

## License

This project inherits the licensing of the upstream Material Tailwind Dashboard React template. Review `LICENSE` (if provided by your distribution) or consult Creative Tim’s terms before redistribution.

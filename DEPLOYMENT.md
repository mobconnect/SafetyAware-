# Deployment recommendations

SafetyAware- has a Vite frontend and an Express server build (`npm run build` produces `dist/server.cjs`).

## Recommended option

Deploy as one Node service on **Google Cloud Run** for secure autoscaling:

```bash
npm install
npm run build
npm start
```

Set `GEMINI_API_KEY` and other secrets in the hosting provider's secret manager. **Render** is the easiest alternative; **Railway** and **Fly.io** are also suitable. Use serverless functions only if the API can remain stateless and within request-duration limits.

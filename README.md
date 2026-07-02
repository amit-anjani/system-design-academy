# System Design Academy

A Duolingo-style app for learning system design concepts \u2014 onboarding quiz, streaks, quizzes, and audio playback.

## Before you deploy \u2014 one important difference from the Claude preview

Inside Claude.ai, this app saved data using Claude's own artifact storage. That API doesn't exist outside claude.ai, so this version uses your browser's `localStorage` instead (see `src/storage.js`). Practically, that means:

- Each visitor's accounts and progress live **only in their own browser**, on their own device.
- Nobody's data is synced anywhere or visible to you or anyone else \u2014 there's no backend, no database, nothing to manage.
- If a friend clears their browser data or opens the site in a private/incognito window, their progress resets.

That's the right tradeoff for "share a link and get feedback" \u2014 zero cost, zero setup, nothing to maintain.

## 1. Try it locally (optional but recommended)

```bash
npm install
npm run dev
```

Open the printed `localhost` URL and click through the app once before publishing.

## 2. Push it to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new **empty** repository on GitHub (no README/license, so it doesn't conflict), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

## 3. Turn on GitHub Pages

In your repo on GitHub: **Settings \u2192 Pages \u2192 Build and deployment \u2192 Source**, choose **GitHub Actions**.

That's it \u2014 a workflow is already included at `.github/workflows/deploy.yml`. It builds and deploys automatically on every push to `main`. Check the **Actions** tab to watch it run (takes about a minute).

Your site will be live at:

```
https://<your-username>.github.io/<your-repo>/
```

## 4. Share it

Send friends that URL. Each person gets their own private login and progress in their own browser \u2014 nothing they do affects anyone else's data.

## Updating later

Any time you want to change something, edit the files and:

```bash
git add .
git commit -m "Describe your change"
git push
```

The site redeploys automatically.

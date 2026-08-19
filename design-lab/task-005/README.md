# TASK-005 visual comparison lab

Open `index.html` through a local web server. The page renders three directions,
each with onboarding, Home, and result at a fixed 390×844 viewport.

## Run

```powershell
npx vite --host 127.0.0.1 --port 4176
```

Then open:

- labeled: `http://127.0.0.1:4176/design-lab/task-005/`
- title-blind: `http://127.0.0.1:4176/design-lab/task-005/?blind=1`

## Verify the static contract

```powershell
node design-lab/task-005/verify.mjs
```

All scenario content comes from `fixture.js`, so a direction cannot receive
easier copy or different data. Direction variables are disposable exploration
values and must not be copied into production before TASK-006 and TASK-007.

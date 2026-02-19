## 1. Update SKILL.md Templates

- [x] 1.1 Replace `http://localhost:3000` with `http://127.0.0.1:3000` in the playwright.config.ts template (Section 4)
- [x] 1.2 Replace any other `localhost` references in SKILL.md baseURL examples
- [x] 1.3 Add inline comment in the config template explaining why 127.0.0.1 is preferred (headless Chromium DNS resolution)

## 2. Verification

- [x] 2.1 Grep SKILL.md for remaining `localhost` references and confirm none are in config templates/examples

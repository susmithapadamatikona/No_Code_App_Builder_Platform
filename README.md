# AppFlow — No-Code App Builder Platform

**Build. Customize. Launch. No Code Required.**

A premium, fully responsive, multi-page SaaS template for a no-code application builder platform — built with **pure HTML5, CSS3, and Vanilla JavaScript**. No frameworks, no build step, no backend. Open `index.html` and everything works.

## Quick start

1. Open `index.html` in any modern browser (or serve the folder with any static server).
2. Demo accounts (LocalStorage-based auth):
   - **User:** `demo@appflow.io` / `demo1234`
   - **Admin:** `admin@appflow.io` / `admin1234`
3. All demo data (projects, templates, favorites, settings, builder layouts) persists in LocalStorage. Reset it any time from **Admin → Settings → Reset demo data**.

## What's inside

| Area | Pages |
|---|---|
| Public site | Home, Features, How It Works, Templates, Template Details, Pricing, Solutions, Integrations, Resources, Blog, Blog Details, Documentation, FAQ, Contact, About, Careers, 404 |
| Auth | Login, Register, Forgot Password (validation, password strength, demo login) |
| User dashboard | Overview, My Projects, Project Details, Analytics, Integrations, Profile, Settings, Billing |
| App Builder | Visual drag & drop editor with component library, properties panel, undo/redo, device preview, save/publish |
| Admin | Dashboard, Users, Projects, Templates, Categories, Subscriptions, Payments, Analytics, Settings |

## Architecture

```
appflow/
├── *.html                     # 37 pages
├── assets/css/                # variables → style → navbar → hero → components
│                              # → forms → animations → page css → utilities → responsive
├── assets/js/
│   ├── darkmode.js            # theme switcher (loads first, in <head>)
│   ├── icons.js               # inline SVG icon registry (no icon fonts)
│   ├── storage.js             # LocalStorage data layer + demo auth (AppStore)
│   ├── toast.js / modal.js    # notification + dialog systems
│   ├── navbar.js              # shared header/footer renderer
│   ├── animations.js          # scroll reveal, counters, parallax
│   ├── charts.js              # SVG chart engine (line, bars, donut, spark)
│   ├── validation.js          # form validation + password tooling
│   ├── main.js                # loader, tabs, accordions, newsletter, back-to-top
│   ├── wishlist.js            # favorites + shared template card renderer
│   ├── search.js / filter.js / templates.js   # marketplace
│   ├── auth.js / pricing.js   # page controllers
│   ├── dashboard.js / analytics.js            # user dashboard shell + pages
│   ├── builder.js / components.js / preview.js # app builder
│   └── admin.js               # admin shell + controllers
└── CONVENTIONS.md             # design-system + API contract used to build pages
```

- **Design system:** all colors, gradients, spacing, radii, and shadows are CSS custom properties in `assets/css/variables.css`; dark mode is a `[data-theme="dark"]` token override.
- **Icons:** stroke-based inline SVGs injected from `icons.js` (`<i data-icon="rocket"></i>`), no external requests.
- **Charts:** hand-rolled SVG renderer, theme-aware, animated.
- **Fonts:** Google Fonts (Inter, Plus Jakarta Sans, Outfit, Poppins) — the only external dependency.

## Notes

- This is a front-end demo: authentication, payments, publishing, and integrations are simulated with LocalStorage/SessionStorage.
- Fully responsive (desktop / laptop / tablet / mobile) and accessible (semantic HTML, ARIA, keyboard navigation, focus states).

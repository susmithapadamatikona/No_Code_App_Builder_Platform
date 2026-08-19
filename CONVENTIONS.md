# APPFLOW — Build Conventions (read before creating any page)

Premium no-code SaaS platform. HTML5 + CSS3 + Vanilla JS only. No frameworks, no CDN libraries, no external images (use CSS gradients + inline SVG via the Icons registry).

## Standard page skeleton (public/marketing pages)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title — AppFlow | No-Code App Builder</title>
  <meta name="description" content="...unique 150-char description...">
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:type" content="website">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%236366F1'/%3E%3Cstop offset='1' stop-color='%238B5CF6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='24' height='24' rx='6' fill='url(%23g)'/%3E%3Cpath d='M13 5 6.5 13H11l-.8 6L17 11h-4.5L13 5z' fill='%23fff'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Outfit:wght@600;700;800&family=Poppins:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/variables.css">
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/navbar.css">
  <link rel="stylesheet" href="assets/css/hero.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/forms.css">
  <link rel="stylesheet" href="assets/css/animations.css">
  <!-- page-specific css here, e.g. templates.css / dashboard.css / pricing.css / admin.css / builder.css -->
  <link rel="stylesheet" href="assets/css/utilities.css">
  <link rel="stylesheet" href="assets/css/responsive.css">  <!-- ALWAYS LAST -->
  <script src="assets/js/darkmode.js"></script>  <!-- head, NO defer (prevents theme flash) -->
</head>
<body data-page="features">   <!-- slug used for active nav highlighting -->
  <div id="header-root"></div>

  <main id="main">
    <!-- page content -->
  </main>

  <div id="footer-root"></div>

  <script src="assets/js/icons.js"></script>
  <script src="assets/js/storage.js"></script>
  <script src="assets/js/toast.js"></script>
  <script src="assets/js/modal.js"></script>
  <script src="assets/js/navbar.js"></script>
  <script src="assets/js/animations.js"></script>
  <script src="assets/js/main.js"></script>
  <!-- page-specific js after this line -->
</body>
</html>
```

Script order matters: icons → storage → toast → modal → navbar → animations → main → page js. Use `charts.js` after main.js when a page has charts. Use `validation.js` before page js on pages with forms. `auth.js` on login/register/forgot pages.

`data-page` slugs that highlight nav: `home, templates, pricing, contact, features, app-builder, how-it-works, integrations, solutions, resources, blog, documentation, faq, careers, about`.

Dashboard/admin/builder pages do NOT use `#header-root`/`#footer-root` — they render their own shell (sidebar + topbar) but still load darkmode.js/icons.js/storage.js/toast.js/modal.js and guard with `AppStore.auth.requireAuth()` (admin pages also check `AppStore.auth.isAdmin()`).

## Global JS APIs (already built — DO NOT reimplement)

- `Icons.get('name')` → svg string; `<i data-icon="name"></i>` markup is auto-injected by main.js (`Icons.inject()` for dynamic content). Available names: logo, rocket, zap, layers, grid, users, user, chart, chart-pie, trend-up, trend-down, cart, heart, book, home, food, calendar, ticket, check, check-circle, briefcase, megaphone, edit, trash, copy, eye, eye-off, share, globe, settings, search, bell, mail, phone, lock, unlock, shield, star, star-o, arrow-right/left/up, chevron-down/up/left/right, plus, minus, x, menu, external, download, upload, save, undo, redo, play, monitor, tablet, smartphone, type, image, video, button-el, card, form-el, table, columns, container, navbar, footer, input, dropdown, checkbox-el, heading, palette, moon, sun, chat, code, database, workflow, cloud, clock, filter, log-out, credit-card, dollar, gift, move, maximize, info, alert-triangle, alert-circle, help-circle, twitter, linkedin, github, dribbble, youtube, google.
- `Toast.success|error|warning|info(msg, title?)`
- `Modal.open('#id')`, `Modal.close()`, `Modal.confirm({title, message, okText, danger, onConfirm})`, `Modal.custom({title, bodyHTML, footHTML, size:'sm'|'lg'})`. Declarative: `data-modal-open="#id"`, `data-modal-close`.
- `AppStore` (storage.js): `getTemplates() / getTemplate(id)`, `getProjects()/getProject/addProject/updateProject/deleteProject/duplicateProject`, `getFavorites()/toggleFavorite(id)/isFavorite(id)`, `getActivity()/logActivity({type,text,icon})`, `getNotifications()/saveNotifications`, `getIntegrations()/setIntegration(id, bool)`, `getUsers()/saveUsers`, `read(key, fallback)/write(key, val)`, `uid(prefix)`, `auth.login(email,pwd,remember)/register(data)/logout()/current()/isLoggedIn()/isAdmin()/requireAuth(url?)`. Demo accounts: demo@appflow.io / demo1234 (user), admin@appflow.io / admin1234 (admin).
- Template object shape: `{id, name, category, industry, tier:'free'|'premium', price, rating, reviews, uses, gradient:[c1,c2], icon, desc, pages[], components[], tags[]}`. Project: `{id, name, template, templateId, status:'published'|'draft', gradient, views, visitors, conversions, pages, components, created, modified, domain}`.
- `Charts.line(el, {labels, series:[{name,data,color}], height?, area?})`, `Charts.bars(el, {labels, data, color?, color2?})`, `Charts.donut(el, {segments:[{label,value,color}], centerLabel?, centerSub?, thickness?})`, `Charts.spark(el, {data, color})`. Theme-aware; re-render on themechange automatically.
- `Validate.form(formEl)`, `Validate.bindLive(formEl)`, `Validate.passwordStrength(v)`; inputs use `data-validate="required|email"` etc. (rules: required, email, phone, minlen:N, password, checked, match:otherId, url). Error span: `<span class="form-error" data-error-for="inputId"></span>`. Password toggle: `<button data-password-toggle="inputId" class="password-toggle"><span class="icon-eye">…eye svg…</span><span class="icon-eye-off">…eye-off svg…</span></button>`.
- `AppAnimations.refreshReveal()` after injecting dynamic content with reveal attributes.
- `ThemeMode.current()/set(t)`; toggle via `[data-theme-toggle]`. Dark theme = `[data-theme="dark"]` on `<html>`; always use CSS tokens (surface-card, text-primary, border…) so dark mode works.
- Newsletter: `<form data-newsletter>` handled globally. Tabs: `[data-tabs]` wrapper + `.tab-btn[data-tab-target="#panel"]` + sibling `.tab-panel` (+`.is-active`). Accordion markup: `.accordion > .accordion-item > .accordion-trigger[aria-expanded] + .accordion-panel > div > .accordion-body` (auto-wired).

## CSS classes cheat sheet

Layout: `.container`, `.container-wide`, `.section`, `.section-sm`, `.section-alt`, `.section-dark`, `.section-head` (+`.section-tag`, `.section-title`, `.section-sub`), `.grid .grid-2/3/4`, `.text-gradient`.
Page header (inner pages): `.page-header > .container > .breadcrumbs + h1 + p`. Breadcrumb: `<nav class="breadcrumbs"><a href="index.html">Home</a><span class="crumb-sep">/</span><span aria-current="page">Name</span></nav>`.
Buttons: `.btn` + `.btn-primary/secondary/ghost/white/glass/danger/success/outline-white` + `.btn-sm/lg/block/icon`; `.is-loading` state.
Cards: `.card`, `.card-hover`, `.card-glass`, `.card-head`, `.feature-icon`, `.stat-card` (+`.stat-icon .tint-purple/blue/green/orange/red`, `.stat-value`, `.stat-label`, `.stat-trend.is-up/.is-down`).
Badges: `.badge` + `-primary/success/warning/danger/info/neutral/gradient/dark`, `.badge-dot`.
Misc: `.tabs`/`.tabs-underline`+`.tab-btn`, `.accordion`, `.modal-backdrop>.modal`, `.table-wrap>.table` (+`.cell-strong`, `.table-actions`), `.pagination>.page-btn`, `.progress>.progress-bar[data-value]`, `.skeleton`, `.empty-state`, `.switch`(input+`.switch-track`+`.switch-label`), `.checkbox`(input+`.checkbox-box`), `.radio`(input+`.radio-dot`), `.avatar`(+`-sm/lg/xl`, `.tone-2..5`, `.avatar-stack`), `.stars`, `.search-bar`, `.divider`, `[data-tooltip="..."]`.
Landing: `.hero`, `.stats-band>.stat-item`, `.steps-grid>.step-card>.step-num`, `.testimonial-card`, `.cta-band`, `.newsletter-box/form`, `.integration-chip`, `.logo-strip>.logo-item`, `.trusted`.
Forms: `.form-group>.form-label+.form-control+.form-hint/.form-error`, `.form-row`, `.input-icon-wrap`, `.password-wrap`, `.strength-meter[data-level]>.strength-bars(i×4)+.strength-label`. Auth layout: `.auth-page>.auth-side+.auth-main>.auth-card` (see forms.css).
Reveal: `data-reveal="up|down|left|right|zoom"`, `data-reveal-stagger` on grids. Counters: `<span data-counter="12500" data-suffix="+"></span>`.

## Visual rules

- Template/project thumbnails: CSS gradient blocks using the item's `gradient` array + subtle inline-SVG UI skeleton overlay — never `<img>` from network.
- Consistent radii (12–24px), soft shadows via tokens, glassmorphism on dark surfaces only.
- Every interactive element needs hover + focus-visible states (mostly free via components.css).
- All pages must look correct in BOTH light and dark theme (use tokens, test-mentally against `[data-theme="dark"]`).
- Realistic SaaS copy everywhere. No lorem ipsum. No dead ends: every link must point to a real page in the sitemap.
- Semantic HTML + aria labels; heading hierarchy h1→h2→h3.

## Sitemap (all links must resolve to these)

index, about, features, how-it-works, templates, template-details, pricing, solutions, integrations, resources, blog, blog-details, documentation, faq, contact, careers, login, register, forgot-password, 404, dashboard, projects, project-details, analytics, integrations-dashboard, profile, settings, billing, app-builder, admin-dashboard, admin-users, admin-projects, admin-templates, admin-categories, admin-subscriptions, admin-payments, admin-analytics, admin-settings (.html each).
`template-details.html?id=tpl-xxx`, `project-details.html?id=prj-xxx`, `app-builder.html?project=prj-xxx` accept query params.

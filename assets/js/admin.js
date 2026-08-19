/* ==========================================================================
   STACKLY — Admin Suite
   Shared shell (sidebar + topbar) + per-page controllers keyed by
   document.body.dataset.admin. Loaded last on every admin-*.html page.
   Admin-only demo data is seeded once under the 'admin_seed_v1' flag.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     GUARD — admin pages require an authenticated admin session
     ------------------------------------------------------------------ */
  if (!window.AppStore || !AppStore.auth.requireAuth('login.html')) return;
  if (!AppStore.auth.isAdmin()) { window.location.replace('login.html'); return; }

  var slug = document.body.dataset.admin || 'dashboard';
  var TODAY = '2026-08-18';

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function icon(name) { return window.Icons.get(name); }
  function money(n, dec) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dec == null ? 2 : dec, maximumFractionDigits: dec == null ? 2 : dec });
  }
  function shortNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    if (p.length < 3) return iso;
    return MONTH_NAMES[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }
  function tone(str) {
    var h = 0;
    for (var i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
    var t = h % 5;
    return t === 0 ? '' : ' tone-' + (t + 1);
  }
  function avatar(name, size) {
    return '<span class="avatar' + (size ? ' avatar-' + size : '') + tone(name) + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  }
  function badge(cls, label, dot) {
    return '<span class="badge badge-' + cls + '">' + (dot ? '<span class="badge-dot"></span>' : '') + esc(label) + '</span>';
  }
  function planBadge(plan) {
    var map = { Free: 'neutral', Pro: 'primary', Business: 'info' };
    return badge(map[plan] || 'neutral', plan);
  }
  function statusBadge(status) {
    var map = {
      active: ['success', 'Active', true], suspended: ['danger', 'Suspended', true],
      published: ['success', 'Published', true], draft: ['warning', 'Draft', true],
      paid: ['success', 'Paid', false], pending: ['warning', 'Pending', false],
      refunded: ['info', 'Refunded', false], past_due: ['warning', 'Past due', true],
      canceled: ['neutral', 'Canceled', false]
    };
    var m = map[status] || ['neutral', status, false];
    return badge(m[0], m[1], m[2]);
  }
  function iconBtn(action, id, name, label, extra) {
    return '<button type="button" class="btn-icon' + (extra ? ' ' + extra : '') + '" data-act="' + action + '" data-id="' + esc(id) + '" aria-label="' + esc(label) + '" data-tooltip="' + esc(label) + '">' + icon(name) + '</button>';
  }
  function gradCss(g) { return 'background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')'; }
  function thumbSkeleton() {
    return '<svg class="tpl-skeleton" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect x="12" y="10" width="40" height="7" rx="3.5" fill="rgba(255,255,255,0.55)"/>' +
      '<rect x="130" y="10" width="58" height="7" rx="3.5" fill="rgba(255,255,255,0.3)"/>' +
      '<rect x="12" y="30" width="80" height="9" rx="4" fill="rgba(255,255,255,0.4)"/>' +
      '<rect x="12" y="46" width="56" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>' +
      '<rect x="12" y="66" width="52" height="24" rx="5" fill="rgba(255,255,255,0.22)"/>' +
      '<rect x="74" y="66" width="52" height="24" rx="5" fill="rgba(255,255,255,0.16)"/>' +
      '<rect x="136" y="66" width="52" height="24" rx="5" fill="rgba(255,255,255,0.22)"/></svg>';
  }
  var GRADIENTS = [['#7928AB', '#9A289C'], ['#5595E4', '#47C1D1'], ['#22C55E', '#47C1D1'], ['#F59E0B', '#EF4444'], ['#EC4899', '#9A289C'], ['#47C1D1', '#22C55E'], ['#32287D', '#7928AB'], ['#F59E0B', '#EC4899']];
  function pickGradient(seedStr) {
    var h = 0;
    for (var i = 0; i < String(seedStr).length; i++) h = (h * 33 + String(seedStr).charCodeAt(i)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
  }
  function injectAll(scope) { window.Icons.inject(scope || document); }
  function selOpts(list, current) {
    return list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === current ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
  }

  /* Generic pagination renderer */
  function renderPagination(host, total, page, per, onPage) {
    if (!host) return;
    var pages = Math.max(1, Math.ceil(total / per));
    if (pages <= 1) { host.innerHTML = ''; return; }
    var html = '<button type="button" class="page-btn" data-pg="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="Previous page">' + icon('chevron-left') + '</button>';
    for (var i = 1; i <= pages; i++) {
      html += '<button type="button" class="page-btn' + (i === page ? ' is-active' : '') + '" data-pg="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="page-btn" data-pg="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + ' aria-label="Next page">' + icon('chevron-right') + '</button>';
    host.innerHTML = html;
    $$('.page-btn', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = parseInt(b.dataset.pg, 10);
        if (p >= 1 && p <= pages && p !== page) onPage(p);
      });
    });
  }

  /* ------------------------------------------------------------------
     Admin-only seed data (written once — key 'admin_seed_v1')
     ------------------------------------------------------------------ */
  var CATEGORY_ICONS = {
    'CRM': 'users', 'E-Commerce': 'cart', 'Healthcare': 'heart', 'Education': 'book',
    'Finance': 'dollar', 'Real Estate': 'home', 'Restaurant': 'food', 'Booking': 'calendar',
    'Events': 'ticket', 'Portfolio': 'layers', 'Productivity': 'check', 'HR': 'briefcase',
    'Marketing': 'megaphone', 'SaaS': 'rocket', 'Dashboard': 'chart', 'Business': 'briefcase'
  };

  function seedAdmin() {
    if (AppStore.read('admin_seed_v1', false)) return;

    AppStore.write('admin_users', [
      { id: 'au-01', name: 'Sofia Ramirez', email: 'sofia.ramirez@brightlabs.co', plan: 'Pro', role: 'user', status: 'active', projects: 7, joined: '2026-01-14', country: 'Spain' },
      { id: 'au-02', name: 'Liam O’Connor', email: 'liam.oconnor@fintory.io', plan: 'Business', role: 'user', status: 'active', projects: 12, joined: '2025-09-03', country: 'Ireland' },
      { id: 'au-03', name: 'Priya Nair', email: 'priya.nair@zenlytics.com', plan: 'Pro', role: 'user', status: 'active', projects: 9, joined: '2025-11-22', country: 'India' },
      { id: 'au-04', name: 'Daniel Park', email: 'daniel.park@novafolks.dev', plan: 'Free', role: 'user', status: 'active', projects: 2, joined: '2026-03-08', country: 'South Korea' },
      { id: 'au-05', name: 'Amelia Hart', email: 'amelia@hartstudio.co.uk', plan: 'Pro', role: 'user', status: 'active', projects: 6, joined: '2026-02-17', country: 'United Kingdom' },
      { id: 'au-06', name: 'Mateus Silva', email: 'mateus.silva@lojaviva.com.br', plan: 'Business', role: 'user', status: 'active', projects: 15, joined: '2025-08-29', country: 'Brazil' },
      { id: 'au-07', name: 'Chloe Dubois', email: 'chloe.dubois@atelier9.fr', plan: 'Free', role: 'user', status: 'suspended', projects: 1, joined: '2026-04-02', country: 'France' },
      { id: 'au-08', name: 'Omar Farouk', email: 'omar.farouk@suqmarket.ae', plan: 'Pro', role: 'user', status: 'active', projects: 8, joined: '2025-12-11', country: 'UAE' },
      { id: 'au-09', name: 'Hana Kobayashi', email: 'hana.k@sakuralabs.jp', plan: 'Pro', role: 'user', status: 'active', projects: 5, joined: '2026-01-30', country: 'Japan' },
      { id: 'au-10', name: 'Lucas Meyer', email: 'lucas.meyer@alpinetech.ch', plan: 'Business', role: 'user', status: 'active', projects: 11, joined: '2025-10-07', country: 'Switzerland' },
      { id: 'au-11', name: 'Isabella Rossi', email: 'isabella.rossi@modamia.it', plan: 'Free', role: 'user', status: 'active', projects: 3, joined: '2026-05-19', country: 'Italy' },
      { id: 'au-12', name: 'Noah Bennett', email: 'noah.bennett@launchpath.io', plan: 'Pro', role: 'user', status: 'suspended', projects: 4, joined: '2026-02-25', country: 'United States' },
      { id: 'au-13', name: 'Zara Ahmed', email: 'zara.ahmed@medinahealth.pk', plan: 'Business', role: 'user', status: 'active', projects: 9, joined: '2025-11-04', country: 'Pakistan' },
      { id: 'au-14', name: 'Erik Lindqvist', email: 'erik@nordform.se', plan: 'Free', role: 'user', status: 'active', projects: 2, joined: '2026-06-12', country: 'Sweden' },
      { id: 'au-15', name: 'Maya Cohen', email: 'maya.cohen@urbanest.co.il', plan: 'Pro', role: 'user', status: 'active', projects: 7, joined: '2026-03-21', country: 'Israel' },
      { id: 'au-16', name: 'Tomás Herrera', email: 'tomas.herrera@vivenda.mx', plan: 'Free', role: 'user', status: 'active', projects: 1, joined: '2026-07-08', country: 'Mexico' },
      { id: 'au-17', name: 'Grace Wanjiru', email: 'grace.w@safarilink.ke', plan: 'Pro', role: 'user', status: 'active', projects: 6, joined: '2026-04-15', country: 'Kenya' },
      { id: 'au-18', name: 'Ethan Walsh', email: 'ethan.walsh@quokkaworks.au', plan: 'Free', role: 'user', status: 'suspended', projects: 0, joined: '2026-08-02', country: 'Australia' }
    ]);

    AppStore.write('admin_payments', [
      { id: 'INV-2026-041', user: 'Mateus Silva', plan: 'Business', amount: 99, method: 'card', status: 'paid', date: '2026-08-16' },
      { id: 'INV-2026-040', user: 'Lucas Meyer', plan: 'Business', amount: 99, method: 'card', status: 'paid', date: '2026-08-14' },
      { id: 'INV-2026-039', user: 'Priya Nair', plan: 'Pro', amount: 29, method: 'paypal', status: 'paid', date: '2026-08-12' },
      { id: 'INV-2026-038', user: 'Sofia Ramirez', plan: 'Pro', amount: 29, method: 'card', status: 'paid', date: '2026-08-11' },
      { id: 'INV-2026-037', user: 'Omar Farouk', plan: 'Pro', amount: 29, method: 'card', status: 'pending', date: '2026-08-10' },
      { id: 'INV-2026-036', user: 'Zara Ahmed', plan: 'Business', amount: 99, method: 'paypal', status: 'paid', date: '2026-08-08' },
      { id: 'INV-2026-035', user: 'Amelia Hart', plan: 'Pro', amount: 29, method: 'card', status: 'paid', date: '2026-08-06' },
      { id: 'INV-2026-034', user: 'Noah Bennett', plan: 'Pro', amount: 29, method: 'paypal', status: 'refunded', date: '2026-08-04' },
      { id: 'INV-2026-033', user: 'Hana Kobayashi', plan: 'Pro', amount: 29, method: 'card', status: 'paid', date: '2026-08-02' },
      { id: 'INV-2026-032', user: 'Maya Cohen', plan: 'Pro', amount: 29, method: 'card', status: 'pending', date: '2026-07-30' },
      { id: 'INV-2026-031', user: 'Grace Wanjiru', plan: 'Pro', amount: 29, method: 'paypal', status: 'paid', date: '2026-07-28' },
      { id: 'INV-2026-030', user: 'Liam O’Connor', plan: 'Business', amount: 99, method: 'card', status: 'paid', date: '2026-07-25' }
    ]);

    AppStore.write('admin_testimonials', [
      { id: 'tst-1', name: 'Sarah Kim', role: 'Product Lead, Northwind Studio', text: 'We shipped our customer portal in nine days instead of nine weeks. Stackly paid for itself before the first sprint review.', approved: true },
      { id: 'tst-2', name: 'David Osei', role: 'Founder, Lumo Health', text: 'The template marketplace is the best starting point I have found in any no-code tool. Our booking app went live in a weekend.', approved: true },
      { id: 'tst-3', name: 'Elena Petrova', role: 'Ops Manager, Cartlane', text: 'Non-technical teammates now maintain three internal tools themselves. Support tickets to engineering dropped by 60%.', approved: true },
      { id: 'tst-4', name: 'James Whitfield', role: 'CTO, Brightpath Academy', text: 'I was skeptical about no-code at our scale, but the export quality and integrations won our engineering team over.', approved: false }
    ]);

    AppStore.write('admin_messages', [
      { id: 'msg-1', name: 'Rachel Adams', email: 'rachel.adams@getmodo.io', subject: 'Enterprise plan questions', snippet: 'Hi team — we are a 40-person agency evaluating Stackly for client work. Could you share details on seats, SSO, and volume pricing for the Business tier?', date: '2026-08-17', unread: true },
      { id: 'msg-2', name: 'Kenji Tanaka', email: 'kenji@studiokaze.jp', subject: 'Custom domain SSL issue', snippet: 'After connecting our custom domain yesterday, the SSL certificate still shows as pending. The app is live at the appflow.site subdomain — is there a manual re-issue step?', date: '2026-08-16', unread: true },
      { id: 'msg-3', name: 'Fatima Al-Sayed', email: 'fatima@dunetech.ae', subject: 'Partnership opportunity', snippet: 'We run a developer community of 12k members across the Gulf region and would love to discuss a template partnership and co-marketing for Stackly.', date: '2026-08-15', unread: true },
      { id: 'msg-4', name: 'Marco Bianchi', email: 'marco.bianchi@velaros.it', subject: 'Template refund request', snippet: 'I purchased NovaCRM Pro by mistake — I meant to buy the SaaSbase Starter. Could you refund the first purchase or transfer the license?', date: '2026-08-13', unread: false },
      { id: 'msg-5', name: 'Anna Kowalski', email: 'anna.k@printika.pl', subject: 'Feature request: multi-language', snippet: 'Loving the builder so far. Any plans for built-in multi-language support? We publish apps for Polish and German audiences and duplicate everything today.', date: '2026-08-11', unread: false }
    ]);

    var cats = [];
    var seen = {};
    AppStore.getTemplates().forEach(function (t) {
      if (seen[t.category]) return;
      seen[t.category] = true;
      cats.push({ id: 'cat-' + t.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: t.category, icon: CATEGORY_ICONS[t.category] || 'grid', active: true, order: cats.length });
    });
    AppStore.write('admin_categories', cats);

    AppStore.write('admin_projects_extra', [
      { id: 'aprj-1', name: 'Skyline Realty', owner: 'Omar Farouk', template: 'RealNest Estates', status: 'published', views: 8340, created: '2026-06-21', gradient: ['#9A289C', '#EC4899'], featured: true, flagged: false },
      { id: 'aprj-2', name: 'Café Verde', owner: 'Isabella Rossi', template: 'Tasteria Restaurant', status: 'published', views: 5210, created: '2026-05-30', gradient: ['#EF4444', '#F59E0B'], featured: false, flagged: false },
      { id: 'aprj-3', name: 'PulseFit Coaching', owner: 'Sofia Ramirez', template: 'Bookly Appointments', status: 'published', views: 6890, created: '2026-04-11', gradient: ['#47C1D1', '#22C55E'], featured: true, flagged: false },
      { id: 'aprj-4', name: 'Ledgerly Books', owner: 'Lucas Meyer', template: 'FinFlow Banking', status: 'draft', views: 0, created: '2026-07-26', gradient: ['#0F172A', '#7928AB'], featured: false, flagged: false },
      { id: 'aprj-5', name: 'Craftly Market', owner: 'Mateus Silva', template: 'ShopKit Commerce', status: 'published', views: 11430, created: '2026-03-17', gradient: ['#5595E4', '#47C1D1'], featured: false, flagged: true },
      { id: 'aprj-6', name: 'Brightpath Academy', owner: 'Priya Nair', template: 'EduLearn LMS', status: 'published', views: 9160, created: '2026-02-08', gradient: ['#F59E0B', '#EF4444'], featured: true, flagged: false },
      { id: 'aprj-7', name: 'Nomad Journal', owner: 'Erik Lindqvist', template: 'FolioX Portfolio', status: 'draft', views: 0, created: '2026-08-09', gradient: ['#111827', '#9A289C'], featured: false, flagged: true },
      { id: 'aprj-8', name: 'MediBook Clinic', owner: 'Zara Ahmed', template: 'MediCare Portal', status: 'published', views: 7480, created: '2026-01-27', gradient: ['#22C55E', '#47C1D1'], featured: false, flagged: true }
    ]);

    AppStore.write('admin_seed_v1', true);
  }

  /* Settings store */
  var SETTINGS_DEFAULTS = {
    siteName: 'Stackly', tagline: 'Build powerful apps without writing code', supportEmail: 'support@appflow.io',
    flags: { newBuilder: true, aiAssist: true, marketplaceReviews: true, maintenance: false },
    notify: { weeklyDigest: true, paymentAlerts: true, newSignups: false, productUpdates: true },
    payment: { currency: 'USD', taxRate: 8.5, stripeKey: 'sk_live_51N8xK2Lm7Q4vTzXbY9c' }
  };
  function getSettings() {
    var s = AppStore.read('admin_settings', null);
    if (!s) return JSON.parse(JSON.stringify(SETTINGS_DEFAULTS));
    /* merge to survive shape changes */
    var out = JSON.parse(JSON.stringify(SETTINGS_DEFAULTS));
    ['siteName', 'tagline', 'supportEmail'].forEach(function (k) { if (s[k] != null) out[k] = s[k]; });
    ['flags', 'notify', 'payment'].forEach(function (k) { if (s[k]) Object.keys(out[k]).forEach(function (kk) { if (s[k][kk] != null) out[k][kk] = s[k][kk]; }); });
    return out;
  }
  function saveSettings(s) { AppStore.write('admin_settings', s); }

  /* ==================================================================
     SHELL — sidebar, topbar, banner, dropdowns
     ================================================================== */
  var NAV = [
    { label: 'Overview', items: [
      { slug: 'dashboard', name: 'Dashboard', ico: 'grid', href: 'admin-dashboard.html' },
      { slug: 'analytics', name: 'Analytics', ico: 'chart', href: 'admin-analytics.html' }
    ] },
    { label: 'Management', items: [
      { slug: 'users', name: 'Users', ico: 'users', href: 'admin-users.html' },
      { slug: 'projects', name: 'Projects', ico: 'layers', href: 'admin-projects.html' },
      { slug: 'templates', name: 'Templates', ico: 'grid', href: 'admin-templates.html' },
      { slug: 'categories', name: 'Categories', ico: 'filter', href: 'admin-categories.html' }
    ] },
    { label: 'Revenue', items: [
      { slug: 'subscriptions', name: 'Subscriptions', ico: 'rocket', href: 'admin-subscriptions.html' },
      { slug: 'payments', name: 'Payments', ico: 'credit-card', href: 'admin-payments.html' }
    ] },
    { label: 'System', items: [
      { slug: 'settings', name: 'Settings', ico: 'settings', href: 'admin-settings.html' }
    ] }
  ];
  var PAGE_META = {
    dashboard: 'Dashboard', analytics: 'Analytics', users: 'Users', projects: 'Projects',
    templates: 'Templates', categories: 'Categories', subscriptions: 'Subscriptions',
    payments: 'Payments', settings: 'Settings'
  };

  function renderSidebar() {
    var sb = $('#admin-sidebar');
    if (!sb) return;
    sb.classList.add('admin-sidebar');
    var me = AppStore.auth.current();
    var html =
      '<div class="as-head">' +
        '<a class="as-brand" href="admin-dashboard.html"><img class="brand-logo" src="assets/images/logo-stackly.webp" alt="Stackly" style="height:30px;filter:none"></a>' +
        '<span class="as-admin-badge">Admin</span>' +
        '<button type="button" class="as-collapse" data-collapse aria-label="Collapse sidebar">' + icon('chevron-left') + '</button>' +
      '</div>' +
      '<nav class="as-nav" aria-label="Admin sections">';
    NAV.forEach(function (group) {
      html += '<div class="as-section-label">' + group.label + '</div>';
      group.items.forEach(function (it) {
        html += '<a class="as-link' + (it.slug === slug ? ' is-active' : '') + '" href="' + it.href + '"' + (it.slug === slug ? ' aria-current="page"' : '') + '>' + icon(it.ico) + '<span>' + it.name + '</span></a>';
      });
    });
    html += '</nav>' +
      '<div class="as-foot">' +
        '<a class="as-view-site" href="index.html">' + icon('external') + '<span>View site</span></a>' +
        '<div class="as-user">' + avatar(me.name, 'sm') +
          '<div class="as-user-meta"><div class="as-user-name">' + esc(me.name) + '</div><div class="as-user-role">Administrator</div></div>' +
          '<button type="button" class="as-logout" data-logout aria-label="Log out" data-tooltip="Log out">' + icon('log-out') + '</button>' +
        '</div>' +
      '</div>';
    sb.innerHTML = html;
  }

  function renderTopbar() {
    var tb = $('#admin-topbar');
    if (!tb) return;
    tb.classList.add('admin-topbar');
    var me = AppStore.auth.current();
    var title = PAGE_META[slug] || 'Admin';
    var unread = (AppStore.getNotifications() || []).some(function (n) { return !n.read; });
    tb.innerHTML =
      '<button type="button" class="at-btn at-burger" data-burger aria-label="Open navigation">' + icon('menu') + '</button>' +
      '<div class="at-titles">' +
        '<nav class="at-crumbs" aria-label="Breadcrumb"><a href="admin-dashboard.html">Admin</a><span class="crumb-sep">/</span><span aria-current="page">' + esc(title) + '</span></nav>' +
        '<h1 class="at-title">' + esc(title) + '</h1>' +
      '</div>' +
      '<form class="at-search" data-admin-search role="search"><div class="search-bar">' + icon('search') + '<input type="search" placeholder="Search users, apps, invoices…" aria-label="Admin search"></div></form>' +
      '<div class="at-actions">' +
        '<div class="admin-drop" data-drop="bell">' +
          '<button type="button" class="at-btn" data-drop-toggle aria-haspopup="true" aria-label="Notifications">' + icon('bell') + (unread ? '<span class="at-dot"></span>' : '') + '</button>' +
          '<div class="admin-drop-menu" role="menu"><div class="drop-head">Notifications<button type="button" class="drop-head-action" data-mark-read>Mark all read</button></div><div class="drop-list" data-ntf-list></div></div>' +
        '</div>' +
        '<div class="admin-drop" data-drop="user">' +
          '<button type="button" class="at-avatar-btn" data-drop-toggle aria-haspopup="true" aria-label="Account menu">' + avatar(me.name) + '</button>' +
          '<div class="admin-drop-menu is-compact" role="menu">' +
            '<div class="drop-user-head">' + avatar(me.name, 'sm') + '<div><div class="ntf-title">' + esc(me.name) + '</div><div class="ntf-time">' + esc(me.email) + '</div></div></div>' +
            '<a class="drop-item" href="profile.html">' + icon('user') + 'My profile</a>' +
            '<a class="drop-item" href="admin-settings.html">' + icon('settings') + 'Admin settings</a>' +
            '<a class="drop-item" href="index.html">' + icon('external') + 'View site</a>' +
            '<div class="drop-divider"></div>' +
            '<button type="button" class="drop-item is-danger" data-logout>' + icon('log-out') + 'Log out</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    renderNotifList();
  }

  function renderNotifList() {
    var host = $('[data-ntf-list]');
    if (!host) return;
    var list = AppStore.getNotifications() || [];
    if (!list.length) {
      host.innerHTML = '<div class="empty-state" style="padding:28px 16px"><p>No notifications yet.</p></div>';
      return;
    }
    var tints = { success: 'tint-green', info: 'tint-blue', warning: 'tint-orange', error: 'tint-red' };
    var icons = { success: 'check-circle', info: 'info', warning: 'alert-triangle', error: 'alert-circle' };
    host.innerHTML = list.map(function (n) {
      return '<div class="ntf-item' + (n.read ? '' : ' is-unread') + '">' +
        '<span class="ntf-icon ' + (tints[n.type] || 'tint-blue') + '">' + icon(icons[n.type] || 'info') + '</span>' +
        '<div><div class="ntf-title">' + esc(n.title) + '</div><div class="ntf-msg">' + esc(n.msg) + '</div><div class="ntf-time">' + esc(n.time) + '</div></div>' +
      '</div>';
    }).join('');
  }

  function renderBanner() {
    var existing = $('#admin-banner');
    if (existing) existing.remove();
    if (!getSettings().flags.maintenance) return;
    var topbar = $('#admin-topbar');
    if (!topbar) return;
    var banner = document.createElement('div');
    banner.id = 'admin-banner';
    banner.className = 'admin-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = icon('alert-triangle') + '<span>Maintenance mode is enabled — the public site is showing a holding page to visitors.</span><a href="admin-settings.html">Manage</a>';
    topbar.insertAdjacentElement('afterend', banner);
  }

  function wireShell() {
    var layout = $('.admin-layout');
    var sidebar = $('#admin-sidebar');

    /* collapse (persisted) */
    if (AppStore.read('admin_sidebar_collapsed', false)) layout.classList.add('is-collapsed');
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-collapse]')) {
        var collapsed = layout.classList.toggle('is-collapsed');
        AppStore.write('admin_sidebar_collapsed', collapsed);
      }
    });

    /* mobile drawer */
    var overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    document.body.appendChild(overlay);
    function closeDrawer() { sidebar.classList.remove('is-mobile-open'); overlay.classList.remove('is-visible'); }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-burger]')) {
        sidebar.classList.add('is-mobile-open');
        overlay.classList.add('is-visible');
      }
    });
    overlay.addEventListener('click', closeDrawer);
    sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });

    /* dropdowns */
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('[data-drop-toggle]');
      if (toggle) {
        var drop = toggle.closest('.admin-drop');
        var wasOpen = drop.classList.contains('is-open');
        $$('.admin-drop.is-open').forEach(function (d) { d.classList.remove('is-open'); });
        if (!wasOpen) drop.classList.add('is-open');
        return;
      }
      if (!e.target.closest('.admin-drop-menu')) {
        $$('.admin-drop.is-open').forEach(function (d) { d.classList.remove('is-open'); });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { $$('.admin-drop.is-open').forEach(function (d) { d.classList.remove('is-open'); }); closeDrawer(); }
    });

    /* mark notifications read */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-mark-read]')) return;
      var list = (AppStore.getNotifications() || []).map(function (n) { return Object.assign({}, n, { read: true }); });
      AppStore.saveNotifications(list);
      renderNotifList();
      var dot = $('[data-drop="bell"] .at-dot');
      if (dot) dot.remove();
      injectAll($('[data-ntf-list]'));
      Toast.success('All notifications marked as read.');
    });

    /* logout */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-logout]')) return;
      AppStore.auth.logout();
      window.location.href = 'index.html';
    });

    /* topbar search (demo) */
    document.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-admin-search]');
      if (!form) return;
      e.preventDefault();
      var q = form.querySelector('input').value.trim();
      Toast.info(q ? 'Global admin search for "' + q + '" is a demo interaction.' : 'Type a query to search across the admin.', 'Search');
    });
  }

  /* ==================================================================
     PAGE — DASHBOARD
     ================================================================== */
  function initDashboard() {
    var templates = AppStore.getTemplates();
    var premium = templates.filter(function (t) { return t.tier === 'premium'; });

    var stats = [
      { label: 'Total Users', value: '2,847', trend: '+12%', up: true, ico: 'users', tint: 'tint-purple', spark: [12, 14, 13, 16, 18, 17, 20, 23, 22, 26, 28, 31], color: '#7928AB' },
      { label: 'Total Projects', value: '6,120', trend: '+9%', up: true, ico: 'layers', tint: 'tint-blue', spark: [8, 9, 11, 10, 13, 14, 16, 15, 18, 19, 21, 24], color: '#47C1D1' },
      { label: 'Published Apps', value: '4,860', trend: '+7%', up: true, ico: 'rocket', tint: 'tint-green', spark: [6, 7, 8, 8, 10, 11, 12, 14, 13, 15, 17, 18], color: '#22C55E' },
      { label: 'Templates', value: String(templates.length), trend: '+2 new', up: true, ico: 'grid', tint: 'tint-orange', spark: [10, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, templates.length], color: '#F59E0B' },
      { label: 'Premium Templates', value: String(premium.length), trend: '+1 new', up: true, ico: 'star', tint: 'tint-purple', spark: [5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, premium.length], color: '#9A289C' },
      { label: 'Revenue', value: '$128.4k', trend: '+18%', up: true, ico: 'dollar', tint: 'tint-green', spark: [62, 68, 74, 81, 86, 92, 98, 104, 112, 119, 126, 134], color: '#22C55E' },
      { label: 'Subscriptions', value: '1,932', trend: '+6%', up: true, ico: 'credit-card', tint: 'tint-blue', spark: [14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 19.3], color: '#5595E4' },
      { label: 'Active Users', value: '1,204', trend: '-2%', up: false, ico: 'zap', tint: 'tint-orange', spark: [13, 14, 13, 14, 13, 12.6, 13, 12.8, 12.4, 12.6, 12.2, 12], color: '#F59E0B' }
    ];
    var host = $('#dash-stats');
    host.innerHTML = stats.map(function (s, i) {
      return '<article class="a-stat">' +
        '<div class="a-stat-top"><span class="stat-icon ' + s.tint + '">' + icon(s.ico) + '</span>' +
        '<span class="stat-trend ' + (s.up ? 'is-up' : 'is-down') + '">' + icon(s.up ? 'trend-up' : 'trend-down') + s.trend + '</span></div>' +
        '<div><div class="stat-value">' + s.value + '</div><div class="stat-label">' + s.label + '</div></div>' +
        '<div class="a-stat-spark" id="spark-' + i + '"></div>' +
      '</article>';
    }).join('');
    stats.forEach(function (s, i) { Charts.spark('#spark-' + i, { data: s.spark, color: s.color }); });

    /* Charts */
    var mo = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    Charts.line('#chart-revenue', {
      labels: mo,
      series: [{ name: 'Revenue', data: [6200, 6800, 7400, 8100, 8600, 9250, 9800, 10450, 11200, 11900, 12600, 13400], color: '#7928AB' }],
      height: 250, ariaLabel: 'Monthly revenue, last 12 months'
    });
    Charts.bars('#chart-newusers', {
      labels: mo,
      data: [142, 158, 171, 164, 189, 204, 221, 236, 248, 262, 275, 291],
      color: '#9A289C', color2: '#7928AB', height: 250, ariaLabel: 'New users per month'
    });

    /* Recent signups */
    var users = AppStore.read('admin_users', []).slice().sort(function (a, b) { return a.joined < b.joined ? 1 : -1; }).slice(0, 5);
    $('#dash-signups').innerHTML =
      '<table class="table"><thead><tr><th>User</th><th>Plan</th><th>Joined</th></tr></thead><tbody>' +
      users.map(function (u) {
        return '<tr><td><div class="u-cell">' + avatar(u.name, 'sm') + '<div><div class="u-name">' + esc(u.name) + '</div><div class="u-mail">' + esc(u.email) + '</div></div></div></td>' +
          '<td>' + planBadge(u.plan) + '</td><td>' + fmtDate(u.joined) + '</td></tr>';
      }).join('') + '</tbody></table>';

    /* Recent payments */
    var pays = AppStore.read('admin_payments', []).slice(0, 5);
    $('#dash-payments').innerHTML =
      '<table class="table"><thead><tr><th>Invoice</th><th>User</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
      pays.map(function (p) {
        return '<tr><td class="cell-strong">' + esc(p.id) + '</td><td>' + esc(p.user) + '</td><td class="cell-strong">' + money(p.amount, 0) + '</td><td>' + statusBadge(p.status) + '</td></tr>';
      }).join('') + '</tbody></table>';

    /* Messages */
    function renderMessages() {
      var msgs = AppStore.read('admin_messages', []);
      var box = $('#dash-messages');
      if (!msgs.length) {
        box.innerHTML = '<div class="empty-state"><span class="empty-icon">' + icon('mail') + '</span><h3>Inbox zero</h3><p>No contact messages right now.</p></div>';
        return;
      }
      box.innerHTML = msgs.map(function (m) {
        return '<button type="button" class="msg-item' + (m.unread ? ' is-unread' : '') + '" data-msg="' + m.id + '">' +
          '<span class="msg-dot"></span>' +
          '<div class="msg-meta"><div class="msg-from"><span>' + esc(m.name) + '</span><span class="msg-date">' + fmtDate(m.date) + '</span></div>' +
          '<div class="msg-subj">' + esc(m.subject) + '</div><div class="msg-snippet">' + esc(m.snippet) + '</div></div>' +
        '</button>';
      }).join('');
      var unreadCount = msgs.filter(function (m) { return m.unread; }).length;
      var badgeEl = $('#dash-msg-count');
      if (badgeEl) badgeEl.textContent = unreadCount + ' unread';
    }
    renderMessages();
    $('#dash-messages').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-msg]');
      if (!btn) return;
      var msgs = AppStore.read('admin_messages', []);
      var m = msgs.find(function (x) { return x.id === btn.dataset.msg; });
      if (m && m.unread) {
        m.unread = false;
        AppStore.write('admin_messages', msgs);
        renderMessages();
        Toast.info('Message from ' + m.name + ' marked as read.', 'Inbox');
      }
    });

    injectAll();
  }

  /* ==================================================================
     PAGE — USERS
     ================================================================== */
  function initUsers() {
    var state = { q: '', plan: 'all', status: 'all', page: 1 };
    var PER = 8;
    function all() { return AppStore.read('admin_users', []); }
    function save(list) { AppStore.write('admin_users', list); }

    function filtered() {
      return all().filter(function (u) {
        if (state.plan !== 'all' && u.plan !== state.plan) return false;
        if (state.status !== 'all' && u.status !== state.status) return false;
        if (state.q) {
          var q = state.q.toLowerCase();
          if (u.name.toLowerCase().indexOf(q) === -1 && u.email.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function render() {
      var list = filtered();
      var users = all();
      /* tab counts */
      $('#count-all').textContent = users.length;
      $('#count-active').textContent = users.filter(function (u) { return u.status === 'active'; }).length;
      $('#count-suspended').textContent = users.filter(function (u) { return u.status === 'suspended'; }).length;

      var pages = Math.max(1, Math.ceil(list.length / PER));
      if (state.page > pages) state.page = pages;
      var rows = list.slice((state.page - 1) * PER, state.page * PER);

      var host = $('#users-table');
      if (!rows.length) {
        host.innerHTML = '<div class="empty-state"><span class="empty-icon">' + icon('users') + '</span><h3>No users found</h3><p>Try a different search or clear the filters.</p></div>';
      } else {
        host.innerHTML = '<table class="table"><thead><tr><th>User</th><th>Plan</th><th>Role</th><th>Projects</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
          rows.map(function (u) {
            return '<tr><td><div class="u-cell">' + avatar(u.name, 'sm') + '<div><div class="u-name">' + esc(u.name) + '</div><div class="u-mail">' + esc(u.email) + '</div></div></div></td>' +
              '<td>' + planBadge(u.plan) + '</td>' +
              '<td>' + badge(u.role === 'admin' ? 'dark' : 'neutral', u.role === 'admin' ? 'Admin' : 'Member') + '</td>' +
              '<td class="cell-strong">' + u.projects + '</td>' +
              '<td>' + fmtDate(u.joined) + '</td>' +
              '<td>' + statusBadge(u.status) + '</td>' +
              '<td><div class="table-actions">' +
                iconBtn('view', u.id, 'eye', 'View profile') +
                iconBtn('edit', u.id, 'edit', 'Edit user') +
                iconBtn('toggle', u.id, u.status === 'active' ? 'lock' : 'unlock', u.status === 'active' ? 'Suspend' : 'Activate') +
                iconBtn('delete', u.id, 'trash', 'Delete user', 'is-danger') +
              '</div></td></tr>';
          }).join('') + '</tbody></table>';
      }
      $('#users-info').textContent = list.length ? 'Showing ' + (rows.length ? ((state.page - 1) * PER + 1) : 0) + '–' + ((state.page - 1) * PER + rows.length) + ' of ' + list.length + ' users' : 'No users match the current filters';
      renderPagination($('#users-pagination'), list.length, state.page, PER, function (p) { state.page = p; render(); });
      injectAll(host);
    }

    /* toolbar */
    $('#user-search').addEventListener('input', function () { state.q = this.value.trim(); state.page = 1; render(); });
    $('#user-plan').addEventListener('change', function () { state.plan = this.value; state.page = 1; render(); });
    $$('#user-status-tabs .tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#user-status-tabs .tab-btn').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        state.status = b.dataset.status;
        state.page = 1;
        render();
      });
    });

    function userForm(u) {
      u = u || {};
      return '<form id="user-form" novalidate>' +
        '<div class="form-group"><label class="form-label" for="uf-name">Full name</label>' +
        '<input class="form-control" id="uf-name" data-validate="required" value="' + esc(u.name || '') + '" placeholder="Jane Cooper"><span class="form-error" data-error-for="uf-name"></span></div>' +
        '<div class="form-group"><label class="form-label" for="uf-email">Email address</label>' +
        '<input class="form-control" id="uf-email" type="email" data-validate="required|email" value="' + esc(u.email || '') + '" placeholder="jane@company.com"><span class="form-error" data-error-for="uf-email"></span></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label class="form-label" for="uf-plan">Plan</label><select class="form-control" id="uf-plan">' + selOpts(['Free', 'Pro', 'Business'], u.plan || 'Free') + '</select></div>' +
        '<div class="form-group"><label class="form-label" for="uf-country">Country</label><input class="form-control" id="uf-country" value="' + esc(u.country || '') + '" placeholder="United States"></div>' +
        '</div></form>';
    }

    $('#user-add').addEventListener('click', function () {
      var bd = Modal.custom({
        title: 'Add user',
        bodyHTML: userForm(),
        footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="user-form" class="btn btn-primary">' + icon('plus') + 'Create user</button>'
      });
      var form = bd.querySelector('#user-form');
      Validate.bindLive(form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!Validate.form(form)) return;
        var list = all();
        list.unshift({
          id: AppStore.uid('au'), name: $('#uf-name', bd).value.trim(), email: $('#uf-email', bd).value.trim(),
          plan: $('#uf-plan', bd).value, role: 'user', status: 'active', projects: 0,
          joined: TODAY, country: $('#uf-country', bd).value.trim() || '—'
        });
        save(list);
        Modal.close(bd);
        state.page = 1;
        render();
        Toast.success('User "' + $('#uf-name', bd).value.trim() + '" was created.', 'User added');
      });
      injectAll(bd);
    });

    /* row actions */
    $('#users-table').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var list = all();
      var u = list.find(function (x) { return x.id === btn.dataset.id; });
      if (!u) return;

      if (btn.dataset.act === 'view') {
        var bd = Modal.custom({
          title: 'User profile',
          bodyHTML:
            '<div class="profile-summary">' + avatar(u.name, 'lg') +
            '<div class="profile-summary-meta"><h4>' + esc(u.name) + '</h4><p>' + esc(u.email) + '</p></div></div>' +
            '<div class="profile-stats">' +
              '<div class="profile-stat"><b>' + u.projects + '</b><span>Projects</span></div>' +
              '<div class="profile-stat"><b>' + esc(u.plan) + '</b><span>Plan</span></div>' +
              '<div class="profile-stat"><b>' + (u.status === 'active' ? 'Active' : 'Suspended') + '</b><span>Status</span></div>' +
            '</div>' +
            '<dl class="kv-list">' +
              '<div class="kv-row"><dt>Member since</dt><dd>' + fmtDate(u.joined) + '</dd></div>' +
              '<div class="kv-row"><dt>Country</dt><dd>' + esc(u.country) + '</dd></div>' +
              '<div class="kv-row"><dt>Role</dt><dd>' + (u.role === 'admin' ? 'Administrator' : 'Member') + '</dd></div>' +
              '<div class="kv-row"><dt>User ID</dt><dd>' + esc(u.id) + '</dd></div>' +
            '</dl>',
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Close</button>'
        });
        injectAll(bd);
      }

      if (btn.dataset.act === 'edit') {
        var bd2 = Modal.custom({
          title: 'Edit user',
          bodyHTML: userForm(u),
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="user-form" class="btn btn-primary">' + icon('save') + 'Save changes</button>'
        });
        var form = bd2.querySelector('#user-form');
        Validate.bindLive(form);
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          if (!Validate.form(form)) return;
          u.name = $('#uf-name', bd2).value.trim();
          u.email = $('#uf-email', bd2).value.trim();
          u.plan = $('#uf-plan', bd2).value;
          u.country = $('#uf-country', bd2).value.trim() || '—';
          save(list);
          Modal.close(bd2);
          render();
          Toast.success('Changes to "' + u.name + '" were saved.', 'User updated');
        });
        injectAll(bd2);
      }

      if (btn.dataset.act === 'toggle') {
        u.status = u.status === 'active' ? 'suspended' : 'active';
        save(list);
        render();
        if (u.status === 'suspended') Toast.warning(u.name + ' has been suspended and can no longer sign in.', 'User suspended');
        else Toast.success(u.name + ' has been re-activated.', 'User activated');
      }

      if (btn.dataset.act === 'delete') {
        Modal.confirm({
          title: 'Delete user?',
          message: 'This permanently removes ' + u.name + ' and unassigns their ' + u.projects + ' project' + (u.projects === 1 ? '' : 's') + '. This cannot be undone.',
          okText: 'Delete user', danger: true,
          onConfirm: function () {
            save(all().filter(function (x) { return x.id !== u.id; }));
            render();
            Toast.success(u.name + ' was deleted.', 'User removed');
          }
        });
      }
    });

    render();
  }

  /* ==================================================================
     PAGE — PROJECTS
     ================================================================== */
  function initProjects() {
    var state = { q: '', status: 'all', page: 1 };
    var PER = 8;

    function merged() {
      var own = AppStore.getProjects().map(function (p) {
        return { id: p.id, source: 'store', name: p.name, owner: 'Alex Morgan', template: p.template, status: p.status, views: p.views, created: p.created, gradient: p.gradient, featured: !!p.featured, flagged: false };
      });
      return own.concat(AppStore.read('admin_projects_extra', []).map(function (p) { return Object.assign({ source: 'extra' }, p); }));
    }
    function saveExtra(list) { AppStore.write('admin_projects_extra', list); }

    function filtered() {
      return merged().filter(function (p) {
        if (state.status === 'flagged' && !p.flagged) return false;
        if ((state.status === 'published' || state.status === 'draft') && p.status !== state.status) return false;
        if (state.q) {
          var q = state.q.toLowerCase();
          if (p.name.toLowerCase().indexOf(q) === -1 && p.owner.toLowerCase().indexOf(q) === -1 && p.template.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function renderStats() {
      var list = merged();
      var mini = [
        { label: 'Total projects', value: list.length, ico: 'layers', tint: 'tint-purple' },
        { label: 'Published', value: list.filter(function (p) { return p.status === 'published'; }).length, ico: 'rocket', tint: 'tint-green' },
        { label: 'Drafts', value: list.filter(function (p) { return p.status === 'draft'; }).length, ico: 'edit', tint: 'tint-orange' },
        { label: 'Flagged for review', value: list.filter(function (p) { return p.flagged; }).length, ico: 'alert-triangle', tint: 'tint-red' }
      ];
      $('#proj-stats').innerHTML = mini.map(function (s) {
        return '<article class="a-stat"><div class="a-stat-top"><span class="stat-icon ' + s.tint + '">' + icon(s.ico) + '</span></div>' +
          '<div><div class="stat-value">' + s.value + '</div><div class="stat-label">' + s.label + '</div></div></article>';
      }).join('');
    }

    function render() {
      renderStats();
      var list = filtered();
      var pages = Math.max(1, Math.ceil(list.length / PER));
      if (state.page > pages) state.page = pages;
      var rows = list.slice((state.page - 1) * PER, state.page * PER);
      var host = $('#projects-table');

      if (!rows.length) {
        host.innerHTML = '<div class="empty-state"><span class="empty-icon">' + icon('layers') + '</span><h3>No projects found</h3><p>Try a different search or clear the status filter.</p></div>';
      } else {
        host.innerHTML = '<table class="table"><thead><tr><th>App</th><th>Owner</th><th>Template</th><th>Status</th><th>Views</th><th>Created</th><th>Actions</th></tr></thead><tbody>' +
          rows.map(function (p) {
            return '<tr><td><div class="app-cell"><span class="app-dot" style="' + gradCss(p.gradient) + '">' + icon('layers') + '</span>' +
              '<div><div class="u-name">' + esc(p.name) + (p.flagged ? ' <span class="badge badge-danger" style="margin-left:6px">Flagged</span>' : '') + '</div>' +
              (p.featured ? '<div class="u-mail">' + '★ Featured</div>' : '') + '</div></div></td>' +
              '<td>' + esc(p.owner) + '</td><td>' + esc(p.template) + '</td>' +
              '<td>' + statusBadge(p.status) + '</td>' +
              '<td class="cell-strong">' + p.views.toLocaleString('en-US') + '</td>' +
              '<td>' + fmtDate(p.created) + '</td>' +
              '<td><div class="table-actions">' +
                iconBtn('view', p.id, 'eye', 'View details') +
                iconBtn('feature', p.id, p.featured ? 'star' : 'star-o', p.featured ? 'Remove from featured' : 'Feature on marketplace', p.featured ? 'is-starred' : '') +
                iconBtn('publish', p.id, p.status === 'published' ? 'eye-off' : 'upload', p.status === 'published' ? 'Unpublish' : 'Publish') +
                iconBtn('delete', p.id, 'trash', 'Delete project', 'is-danger') +
              '</div></td></tr>';
          }).join('') + '</tbody></table>';
      }
      $('#projects-info').textContent = list.length ? 'Showing ' + (rows.length ? ((state.page - 1) * PER + 1) : 0) + '–' + ((state.page - 1) * PER + rows.length) + ' of ' + list.length + ' projects' : 'No projects match the current filters';
      renderPagination($('#projects-pagination'), list.length, state.page, PER, function (p) { state.page = p; render(); });
      injectAll(host);
    }

    $('#proj-search').addEventListener('input', function () { state.q = this.value.trim(); state.page = 1; render(); });
    $('#proj-status').addEventListener('change', function () { state.status = this.value; state.page = 1; render(); });

    function patch(id, fn) {
      var extras = AppStore.read('admin_projects_extra', []);
      var ex = extras.find(function (p) { return p.id === id; });
      if (ex) { fn(ex); saveExtra(extras); return ex; }
      var sp = AppStore.getProject(id);
      if (sp) {
        var patchObj = {};
        fn(patchObj);
        AppStore.updateProject(id, patchObj);
        return AppStore.getProject(id);
      }
      return null;
    }

    $('#projects-table').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var p = merged().find(function (x) { return x.id === btn.dataset.id; });
      if (!p) return;

      if (btn.dataset.act === 'view') {
        var bd = Modal.custom({
          title: 'Project details',
          bodyHTML:
            '<div class="profile-summary"><span class="app-dot" style="width:52px;height:52px;border-radius:14px;' + gradCss(p.gradient) + '">' + icon('layers') + '</span>' +
            '<div class="profile-summary-meta"><h4>' + esc(p.name) + '</h4><p>Built from ' + esc(p.template) + '</p></div></div>' +
            '<dl class="kv-list">' +
              '<div class="kv-row"><dt>Owner</dt><dd>' + esc(p.owner) + '</dd></div>' +
              '<div class="kv-row"><dt>Status</dt><dd>' + statusBadge(p.status) + '</dd></div>' +
              '<div class="kv-row"><dt>Total views</dt><dd>' + p.views.toLocaleString('en-US') + '</dd></div>' +
              '<div class="kv-row"><dt>Created</dt><dd>' + fmtDate(p.created) + '</dd></div>' +
              '<div class="kv-row"><dt>Featured</dt><dd>' + (p.featured ? 'Yes' : 'No') + '</dd></div>' +
              '<div class="kv-row"><dt>Moderation</dt><dd>' + (p.flagged ? 'Flagged for review' : 'Clear') + '</dd></div>' +
            '</dl>',
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Close</button>'
        });
        injectAll(bd);
      }

      if (btn.dataset.act === 'feature') {
        var next = !p.featured;
        patch(p.id, function (o) { o.featured = next; });
        render();
        Toast.success('"' + p.name + '" ' + (next ? 'is now featured on the marketplace.' : 'was removed from featured.'), next ? 'Featured' : 'Unfeatured');
      }

      if (btn.dataset.act === 'publish') {
        var ns = p.status === 'published' ? 'draft' : 'published';
        patch(p.id, function (o) { o.status = ns; });
        render();
        if (ns === 'published') Toast.success('"' + p.name + '" is now live.', 'Published');
        else Toast.warning('"' + p.name + '" was unpublished and is no longer public.', 'Unpublished');
      }

      if (btn.dataset.act === 'delete') {
        Modal.confirm({
          title: 'Delete project?',
          message: 'This permanently deletes "' + p.name + '" and all of its pages. The owner will be notified. This cannot be undone.',
          okText: 'Delete project', danger: true,
          onConfirm: function () {
            if (p.source === 'store') AppStore.deleteProject(p.id);
            else saveExtra(AppStore.read('admin_projects_extra', []).filter(function (x) { return x.id !== p.id; }));
            render();
            Toast.success('"' + p.name + '" was deleted.', 'Project removed');
          }
        });
      }
    });

    render();
  }

  /* ==================================================================
     PAGE — TEMPLATES  (mutates the REAL 'templates' store)
     ================================================================== */
  function initTemplates() {
    var state = { q: '', cat: 'all', tier: 'all' };
    function all() { return AppStore.getTemplates(); }
    function save(list) { AppStore.write('templates', list); }
    function catNames() {
      return AppStore.read('admin_categories', []).slice().sort(function (a, b) { return a.order - b.order; }).map(function (c) { return c.name; });
    }

    /* category filter options */
    var catSel = $('#tpl-cat');
    catSel.innerHTML = '<option value="all">All categories</option>' + catNames().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');

    function filtered() {
      return all().filter(function (t) {
        if (state.cat !== 'all' && t.category !== state.cat) return false;
        if (state.tier !== 'all' && t.tier !== state.tier) return false;
        if (state.q && t.name.toLowerCase().indexOf(state.q.toLowerCase()) === -1) return false;
        return true;
      });
    }

    function render() {
      var list = filtered();
      var counts = all();
      $('#tcount-all').textContent = counts.length;
      $('#tcount-free').textContent = counts.filter(function (t) { return t.tier === 'free'; }).length;
      $('#tcount-premium').textContent = counts.filter(function (t) { return t.tier === 'premium'; }).length;

      var host = $('#templates-grid');
      if (!list.length) {
        host.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">' + icon('grid') + '</span><h3>No templates found</h3><p>Try a different search or add a new template.</p></div>';
        return;
      }
      host.innerHTML = list.map(function (t) {
        var active = t.active !== false;
        return '<article class="a-card tpl-admin-card' + (active ? '' : ' is-inactive') + '">' +
          '<div class="tpl-admin-thumb" style="' + gradCss(t.gradient) + '">' +
            (window.Artwork ? window.Artwork.forCategory(t.category, t.gradient) : thumbSkeleton()) +
            '<span class="tpl-ico-holder">' + icon(t.icon) + '</span>' +
            '<span class="tpl-tier-badge">' + (t.tier === 'premium' ? badge('gradient', money(t.price, 0)) : badge('success', 'Free')) + '</span>' +
          '</div>' +
          '<div class="tpl-admin-body">' +
            '<div class="tpl-admin-name">' + esc(t.name) + '</div>' +
            '<div class="tpl-admin-meta">' +
              '<span class="m-item">' + icon('filter') + esc(t.category) + '</span>' +
              '<span class="m-item is-rating">' + icon('star') + t.rating.toFixed(1) + '</span>' +
              '<span class="m-item">' + icon('download') + shortNum(t.uses) + ' uses</span>' +
            '</div>' +
          '</div>' +
          '<div class="tpl-admin-foot">' +
            '<label class="switch"><input type="checkbox" data-act="active" data-id="' + esc(t.id) + '"' + (active ? ' checked' : '') + '><span class="switch-track"></span><span class="switch-label">' + (active ? 'Active' : 'Hidden') + '</span></label>' +
            '<div class="table-actions">' +
              iconBtn('edit', t.id, 'edit', 'Edit template') +
              iconBtn('delete', t.id, 'trash', 'Delete template', 'is-danger') +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');
      injectAll(host);
    }

    $('#tpl-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });
    catSel.addEventListener('change', function () { state.cat = this.value; render(); });
    $$('#tpl-tier-tabs .tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#tpl-tier-tabs .tab-btn').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        state.tier = b.dataset.tier;
        render();
      });
    });

    function tplForm(t) {
      t = t || {};
      var tier = t.tier || 'free';
      return '<form id="tpl-form" novalidate>' +
        '<div class="form-group"><label class="form-label" for="tf-name">Template name</label>' +
        '<input class="form-control" id="tf-name" data-validate="required" value="' + esc(t.name || '') + '" placeholder="Atlas Travel Planner"><span class="form-error" data-error-for="tf-name"></span></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label" for="tf-cat">Category</label><select class="form-control" id="tf-cat">' + selOpts(catNames(), t.category || catNames()[0]) + '</select></div>' +
          '<div class="form-group"><label class="form-label" for="tf-price">Price (USD)</label><input class="form-control" id="tf-price" type="number" min="0" step="1" value="' + (t.price != null ? t.price : 0) + '"></div>' +
        '</div>' +
        '<div class="form-group"><span class="form-label">Tier</span><div style="display:flex;gap:20px;padding-top:4px">' +
          '<label class="radio"><input type="radio" name="tf-tier" value="free"' + (tier === 'free' ? ' checked' : '') + '><span class="radio-dot"></span> Free</label>' +
          '<label class="radio"><input type="radio" name="tf-tier" value="premium"' + (tier === 'premium' ? ' checked' : '') + '><span class="radio-dot"></span> Premium</label>' +
        '</div></div>' +
        '<div class="form-group"><label class="form-label" for="tf-desc">Description</label>' +
        '<textarea class="form-control" id="tf-desc" rows="3" data-validate="required" placeholder="What does this template ship with?">' + esc(t.desc || '') + '</textarea><span class="form-error" data-error-for="tf-desc"></span></div>' +
      '</form>';
    }
    function readTierAndPrice(bd) {
      var tier = (bd.querySelector('[name="tf-tier"]:checked') || {}).value || 'free';
      var price = Math.max(0, parseInt($('#tf-price', bd).value, 10) || 0);
      if (tier === 'free') price = 0;
      if (tier === 'premium' && price === 0) price = 29;
      return { tier: tier, price: price };
    }

    $('#tpl-add').addEventListener('click', function () {
      var bd = Modal.custom({
        title: 'Add template',
        bodyHTML: tplForm(),
        footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="tpl-form" class="btn btn-primary">' + icon('plus') + 'Publish template</button>'
      });
      var form = bd.querySelector('#tpl-form');
      Validate.bindLive(form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!Validate.form(form)) return;
        var name = $('#tf-name', bd).value.trim();
        var category = $('#tf-cat', bd).value;
        var tp = readTierAndPrice(bd);
        var list = all();
        list.unshift({
          id: AppStore.uid('tpl'), name: name, category: category, industry: category,
          tier: tp.tier, price: tp.price, rating: 4.5, reviews: 0, uses: 0,
          gradient: pickGradient(name), icon: CATEGORY_ICONS[category] || 'grid',
          desc: $('#tf-desc', bd).value.trim(),
          pages: ['Home', 'Overview', 'Details', 'Contact'],
          components: ['Hero', 'Cards', 'Forms', 'Tables'],
          tags: [category.toLowerCase(), tp.tier], active: true
        });
        save(list);
        Modal.close(bd);
        render();
        Toast.success('"' + name + '" is now live on the marketplace.', 'Template added');
      });
      injectAll(bd);
    });

    $('#templates-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var list = all();
      var t = list.find(function (x) { return x.id === btn.dataset.id; });
      if (!t) return;

      if (btn.dataset.act === 'edit') {
        var bd = Modal.custom({
          title: 'Edit template',
          bodyHTML: tplForm(t),
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="tpl-form" class="btn btn-primary">' + icon('save') + 'Save changes</button>'
        });
        var form = bd.querySelector('#tpl-form');
        Validate.bindLive(form);
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          if (!Validate.form(form)) return;
          var tp = readTierAndPrice(bd);
          t.name = $('#tf-name', bd).value.trim();
          t.category = $('#tf-cat', bd).value;
          t.industry = t.industry || t.category;
          t.tier = tp.tier;
          t.price = tp.price;
          t.desc = $('#tf-desc', bd).value.trim();
          save(list);
          Modal.close(bd);
          render();
          Toast.success('"' + t.name + '" was updated. Changes are live on the marketplace.', 'Template saved');
        });
        injectAll(bd);
      }

      if (btn.dataset.act === 'delete') {
        Modal.confirm({
          title: 'Delete template?',
          message: 'This removes "' + t.name + '" from the marketplace for all users. Existing projects built from it are not affected.',
          okText: 'Delete template', danger: true,
          onConfirm: function () {
            save(all().filter(function (x) { return x.id !== t.id; }));
            render();
            Toast.success('"' + t.name + '" was removed from the marketplace.', 'Template deleted');
          }
        });
      }
    });

    /* active switch */
    $('#templates-grid').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-act="active"]');
      if (!input) return;
      var list = all();
      var t = list.find(function (x) { return x.id === input.dataset.id; });
      if (!t) return;
      t.active = input.checked;
      save(list);
      render();
      if (input.checked) Toast.success('"' + t.name + '" is visible on the marketplace again.', 'Template active');
      else Toast.warning('"' + t.name + '" is now hidden from the marketplace.', 'Template hidden');
    });

    render();
  }

  /* ==================================================================
     PAGE — CATEGORIES
     ================================================================== */
  function initCategories() {
    var ICON_CHOICES = ['grid', 'users', 'cart', 'heart', 'book', 'dollar', 'home', 'food', 'calendar', 'ticket', 'layers', 'check', 'briefcase', 'megaphone', 'rocket', 'chart', 'globe', 'zap'];
    function all() { return AppStore.read('admin_categories', []).slice().sort(function (a, b) { return a.order - b.order; }); }
    function save(list) { AppStore.write('admin_categories', list); }
    function countFor(name) {
      return AppStore.getTemplates().filter(function (t) { return t.category === name; }).length;
    }

    function render() {
      var list = all();
      var host = $('#categories-grid');
      $('#cat-total').textContent = list.length + ' categories · ' + AppStore.getTemplates().length + ' templates';
      if (!list.length) {
        host.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">' + icon('filter') + '</span><h3>No categories</h3><p>Add your first marketplace category.</p></div>';
        return;
      }
      host.innerHTML = list.map(function (c, i) {
        var n = countFor(c.name);
        return '<article class="a-card cat-card' + (c.active ? '' : ' is-inactive') + '">' +
          '<span class="cat-icon">' + icon(c.icon) + '</span>' +
          '<div class="cat-meta">' +
            '<div class="cat-name">' + esc(c.name) + '</div>' +
            '<div class="cat-count">' + n + ' template' + (n === 1 ? '' : 's') + '</div>' +
            '<div class="cat-controls">' +
              '<button type="button" class="btn-icon" data-act="up" data-id="' + esc(c.id) + '" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + icon('arrow-up') + '</button>' +
              '<button type="button" class="btn-icon" data-act="down" data-id="' + esc(c.id) + '" aria-label="Move down"' + (i === list.length - 1 ? ' disabled' : '') + '>' + icon('chevron-down') + '</button>' +
              iconBtn('edit', c.id, 'edit', 'Edit category') +
              iconBtn('delete', c.id, 'trash', 'Delete category', 'is-danger') +
            '</div>' +
          '</div>' +
          '<label class="switch cat-switch" data-tooltip="' + (c.active ? 'Visible in filters' : 'Hidden from filters') + '"><input type="checkbox" data-act="active" data-id="' + esc(c.id) + '"' + (c.active ? ' checked' : '') + ' aria-label="Category active"><span class="switch-track"></span></label>' +
        '</article>';
      }).join('');
      injectAll(host);
    }

    function catForm(c) {
      c = c || {};
      return '<form id="cat-form" novalidate>' +
        '<div class="form-group"><label class="form-label" for="cf-name">Category name</label>' +
        '<input class="form-control" id="cf-name" data-validate="required" value="' + esc(c.name || '') + '" placeholder="Travel"><span class="form-error" data-error-for="cf-name"></span></div>' +
        '<div class="form-group"><label class="form-label" for="cf-icon">Icon</label><select class="form-control" id="cf-icon">' + selOpts(ICON_CHOICES, c.icon || 'grid') + '</select></div>' +
      '</form>';
    }

    $('#cat-add').addEventListener('click', function () {
      var bd = Modal.custom({
        title: 'Add category',
        size: 'sm',
        bodyHTML: catForm(),
        footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="cat-form" class="btn btn-primary">' + icon('plus') + 'Add category</button>'
      });
      var form = bd.querySelector('#cat-form');
      Validate.bindLive(form);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!Validate.form(form)) return;
        var name = $('#cf-name', bd).value.trim();
        var list = all();
        if (list.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); })) {
          Toast.error('A category named "' + name + '" already exists.');
          return;
        }
        list.push({ id: AppStore.uid('cat'), name: name, icon: $('#cf-icon', bd).value, active: true, order: list.length });
        save(list);
        Modal.close(bd);
        render();
        Toast.success('Category "' + name + '" was added.', 'Category added');
      });
      injectAll(bd);
    });

    $('#categories-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var list = all();
      var idx = list.findIndex(function (x) { return x.id === btn.dataset.id; });
      if (idx === -1) return;
      var c = list[idx];

      if (btn.dataset.act === 'up' || btn.dataset.act === 'down') {
        var swap = btn.dataset.act === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= list.length) return;
        var tmp = list[idx].order;
        list[idx].order = list[swap].order;
        list[swap].order = tmp;
        save(list);
        render();
      }

      if (btn.dataset.act === 'edit') {
        var bd = Modal.custom({
          title: 'Edit category',
          size: 'sm',
          bodyHTML: catForm(c),
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="cat-form" class="btn btn-primary">' + icon('save') + 'Save</button>'
        });
        var form = bd.querySelector('#cat-form');
        Validate.bindLive(form);
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          if (!Validate.form(form)) return;
          c.name = $('#cf-name', bd).value.trim();
          c.icon = $('#cf-icon', bd).value;
          save(list);
          Modal.close(bd);
          render();
          Toast.success('Category updated.', 'Saved');
        });
        injectAll(bd);
      }

      if (btn.dataset.act === 'delete') {
        var n = countFor(c.name);
        Modal.confirm({
          title: 'Delete category?',
          message: 'Delete "' + c.name + '"? ' + (n ? n + ' template' + (n === 1 ? '' : 's') + ' will keep the label but stop appearing in this filter.' : 'No templates currently use it.'),
          okText: 'Delete category', danger: true,
          onConfirm: function () {
            save(all().filter(function (x) { return x.id !== c.id; }));
            render();
            Toast.success('Category "' + c.name + '" was deleted.', 'Category removed');
          }
        });
      }
    });

    $('#categories-grid').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-act="active"]');
      if (!input) return;
      var list = all();
      var c = list.find(function (x) { return x.id === input.dataset.id; });
      if (!c) return;
      c.active = input.checked;
      save(list);
      render();
      Toast[input.checked ? 'success' : 'warning']('"' + c.name + '" is now ' + (input.checked ? 'visible in' : 'hidden from') + ' marketplace filters.', 'Category ' + (input.checked ? 'active' : 'hidden'));
    });

    render();
  }

  /* ==================================================================
     PAGE — SUBSCRIPTIONS
     ================================================================== */
  function initSubscriptions() {
    var state = { q: '', status: 'all' };
    var PLAN_PRICE = { Pro: 29, Business: 99 };

    function overrides() { return AppStore.read('admin_subs_overrides', {}); }
    function saveOverrides(o) { AppStore.write('admin_subs_overrides', o); }
    var PAST_DUE = { 'au-08': true, 'au-15': true }; /* users with pending invoices */

    function subs() {
      var ov = overrides();
      return AppStore.read('admin_users', [])
        .filter(function (u) { return u.plan === 'Pro' || u.plan === 'Business'; })
        .map(function (u) {
          var o = ov[u.id] || {};
          var day = Math.min(28, parseInt(u.joined.split('-')[2], 10) || 1);
          return {
            id: u.id, name: u.name, email: u.email, plan: u.plan,
            amount: PLAN_PRICE[u.plan],
            renewal: '2026-09-' + (day < 10 ? '0' + day : day),
            status: o.status || (PAST_DUE[u.id] ? 'past_due' : 'active')
          };
        });
    }

    function filtered() {
      return subs().filter(function (s) {
        if (state.status !== 'all' && s.status !== state.status) return false;
        if (state.q) {
          var q = state.q.toLowerCase();
          if (s.name.toLowerCase().indexOf(q) === -1 && s.email.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function renderStats() {
      var list = subs();
      var active = list.filter(function (s) { return s.status !== 'canceled'; });
      var stats = [
        { label: 'Monthly recurring revenue', value: '$24.6k', ico: 'dollar', tint: 'tint-green', trend: '+11%', up: true },
        { label: 'Active subscriptions', value: String(active.length * 138), ico: 'rocket', tint: 'tint-purple', trend: '+6%', up: true },
        { label: 'Trials in progress', value: '84', ico: 'clock', tint: 'tint-blue', trend: '+14%', up: true },
        { label: 'Monthly churn', value: '2.1%', ico: 'trend-down', tint: 'tint-orange', trend: '-0.4pt', up: true }
      ];
      $('#subs-stats').innerHTML = stats.map(function (s) {
        return '<article class="a-stat"><div class="a-stat-top"><span class="stat-icon ' + s.tint + '">' + icon(s.ico) + '</span>' +
          '<span class="stat-trend ' + (s.up ? 'is-up' : 'is-down') + '">' + icon(s.up ? 'trend-up' : 'trend-down') + s.trend + '</span></div>' +
          '<div><div class="stat-value">' + s.value + '</div><div class="stat-label">' + s.label + '</div></div></article>';
      }).join('');
    }

    function renderCharts() {
      var users = AppStore.read('admin_users', []);
      var free = users.filter(function (u) { return u.plan === 'Free'; }).length;
      var pro = users.filter(function (u) { return u.plan === 'Pro'; }).length;
      var biz = users.filter(function (u) { return u.plan === 'Business'; }).length;
      Charts.donut('#chart-plans', {
        segments: [
          { label: 'Free', value: free * 158, color: '#94A3B8' },
          { label: 'Pro', value: pro * 138, color: '#7928AB' },
          { label: 'Business', value: biz * 121, color: '#9A289C' }
        ],
        centerLabel: shortNum(free * 158 + pro * 138 + biz * 121),
        centerSub: 'accounts', size: 210, thickness: 28, ariaLabel: 'Subscription plan distribution'
      });
      Charts.line('#chart-mrr', {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        series: [{ name: 'MRR', data: [11800, 12900, 13800, 15200, 16100, 17400, 18600, 19900, 21200, 22400, 23500, 24600], color: '#22C55E' }],
        height: 252, ariaLabel: 'MRR growth over 12 months'
      });
    }

    function render() {
      renderStats();
      var list = filtered();
      var host = $('#subs-table');
      if (!list.length) {
        host.innerHTML = '<div class="empty-state"><span class="empty-icon">' + icon('rocket') + '</span><h3>No subscriptions found</h3><p>Try a different search or status filter.</p></div>';
      } else {
        host.innerHTML = '<table class="table"><thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>Next renewal</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
          list.map(function (s) {
            return '<tr><td><div class="u-cell">' + avatar(s.name, 'sm') + '<div><div class="u-name">' + esc(s.name) + '</div><div class="u-mail">' + esc(s.email) + '</div></div></div></td>' +
              '<td>' + planBadge(s.plan) + '</td>' +
              '<td class="cell-strong">' + money(s.amount, 0) + '/mo</td>' +
              '<td>' + (s.status === 'canceled' ? '—' : fmtDate(s.renewal)) + '</td>' +
              '<td>' + statusBadge(s.status) + '</td>' +
              '<td><div class="table-actions">' +
                iconBtn('plan', s.id, 'edit', 'Change plan') +
                (s.status !== 'canceled' ? iconBtn('cancel', s.id, 'x', 'Cancel subscription', 'is-danger') : '') +
              '</div></td></tr>';
          }).join('') + '</tbody></table>';
      }
      injectAll(host);
    }

    $('#subs-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });
    $('#subs-status').addEventListener('change', function () { state.status = this.value; render(); });

    $('#subs-table').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var s = subs().find(function (x) { return x.id === btn.dataset.id; });
      if (!s) return;

      if (btn.dataset.act === 'plan') {
        var bd = Modal.custom({
          title: 'Change plan',
          size: 'sm',
          bodyHTML:
            '<p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:14px">Move <strong>' + esc(s.name) + '</strong> to a different plan. Billing is prorated from the next cycle.</p>' +
            '<form id="plan-form"><div class="form-group"><label class="form-label" for="pf-plan">Plan</label>' +
            '<select class="form-control" id="pf-plan">' + selOpts(['Pro', 'Business'], s.plan) + '</select></div></form>',
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="plan-form" class="btn btn-primary">' + icon('save') + 'Update plan</button>'
        });
        bd.querySelector('#plan-form').addEventListener('submit', function (ev) {
          ev.preventDefault();
          var plan = $('#pf-plan', bd).value;
          var users = AppStore.read('admin_users', []);
          var u = users.find(function (x) { return x.id === s.id; });
          if (u) { u.plan = plan; AppStore.write('admin_users', users); }
          Modal.close(bd);
          render();
          Toast.success(s.name + ' is now on the ' + plan + ' plan (' + money(PLAN_PRICE[plan], 0) + '/mo).', 'Plan updated');
        });
        injectAll(bd);
      }

      if (btn.dataset.act === 'cancel') {
        Modal.confirm({
          title: 'Cancel subscription?',
          message: 'Cancel ' + s.name + '’s ' + s.plan + ' subscription? They keep access until ' + fmtDate(s.renewal) + ', then drop to the Free plan.',
          okText: 'Cancel subscription', danger: true,
          onConfirm: function () {
            var ov = overrides();
            ov[s.id] = { status: 'canceled' };
            saveOverrides(ov);
            render();
            Toast.warning(s.name + '’s subscription was canceled.', 'Subscription canceled');
          }
        });
      }
    });

    renderCharts();
    render();
  }

  /* ==================================================================
     PAGE — PAYMENTS
     ================================================================== */
  function initPayments() {
    var state = { q: '', status: 'all', desc: true };
    function all() { return AppStore.read('admin_payments', []); }
    function save(list) { AppStore.write('admin_payments', list); }

    function filtered() {
      var list = all().filter(function (p) {
        if (state.status !== 'all' && p.status !== state.status) return false;
        if (state.q) {
          var q = state.q.toLowerCase();
          if (p.id.toLowerCase().indexOf(q) === -1 && p.user.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
      });
      list.sort(function (a, b) { return state.desc ? (a.date < b.date ? 1 : -1) : (a.date > b.date ? 1 : -1); });
      return list;
    }

    function renderStats() {
      var list = all();
      var paidThisMonth = list.filter(function (p) { return p.status === 'paid' && p.date.indexOf('2026-08') === 0; });
      var revMonth = paidThisMonth.reduce(function (a, p) { return a + p.amount; }, 0);
      var pending = list.filter(function (p) { return p.status === 'pending'; });
      var refunded = list.filter(function (p) { return p.status === 'refunded'; });
      var paid = list.filter(function (p) { return p.status === 'paid'; });
      var avg = paid.length ? paid.reduce(function (a, p) { return a + p.amount; }, 0) / paid.length : 0;
      var stats = [
        { label: 'Revenue this month', value: money(revMonth, 0), ico: 'dollar', tint: 'tint-green', trend: '+18%', up: true },
        { label: 'Pending payments', value: pending.length + ' · ' + money(pending.reduce(function (a, p) { return a + p.amount; }, 0), 0), ico: 'clock', tint: 'tint-orange' },
        { label: 'Refunded', value: money(refunded.reduce(function (a, p) { return a + p.amount; }, 0), 0), ico: 'undo', tint: 'tint-red' },
        { label: 'Average order', value: money(avg, 2), ico: 'chart', tint: 'tint-blue', trend: '+4%', up: true }
      ];
      $('#pay-stats').innerHTML = stats.map(function (s) {
        return '<article class="a-stat"><div class="a-stat-top"><span class="stat-icon ' + s.tint + '">' + icon(s.ico) + '</span>' +
          (s.trend ? '<span class="stat-trend ' + (s.up ? 'is-up' : 'is-down') + '">' + icon(s.up ? 'trend-up' : 'trend-down') + s.trend + '</span>' : '') +
          '</div><div><div class="stat-value">' + s.value + '</div><div class="stat-label">' + s.label + '</div></div></article>';
      }).join('');
    }

    function render() {
      renderStats();
      var list = filtered();
      var host = $('#payments-table');
      if (!list.length) {
        host.innerHTML = '<div class="empty-state"><span class="empty-icon">' + icon('credit-card') + '</span><h3>No payments found</h3><p>Try a different search or status filter.</p></div>';
      } else {
        host.innerHTML = '<table class="table"><thead><tr><th>Invoice</th><th>Customer</th><th>Plan</th><th>Method</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
          list.map(function (p) {
            return '<tr><td class="cell-strong">' + esc(p.id) + '</td>' +
              '<td>' + esc(p.user) + '</td>' +
              '<td>' + planBadge(p.plan) + '</td>' +
              '<td><span class="method-cell">' + icon(p.method === 'card' ? 'credit-card' : 'globe') + esc(p.method) + '</span></td>' +
              '<td class="cell-strong">' + money(p.amount, 2) + '</td>' +
              '<td>' + fmtDate(p.date) + '</td>' +
              '<td>' + statusBadge(p.status) + '</td>' +
              '<td><div class="table-actions">' +
                iconBtn('invoice', p.id, 'eye', 'View invoice') +
                (p.status === 'pending' ? iconBtn('markpaid', p.id, 'check-circle', 'Mark as paid') : '') +
                (p.status === 'paid' ? iconBtn('refund', p.id, 'undo', 'Refund payment', 'is-danger') : '') +
              '</div></td></tr>';
          }).join('') + '</tbody></table>';
      }
      $('#pay-info').textContent = list.length + ' invoice' + (list.length === 1 ? '' : 's') + ' · sorted ' + (state.desc ? 'newest first' : 'oldest first');
      injectAll(host);
    }

    $('#pay-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });
    $('#pay-status').addEventListener('change', function () { state.status = this.value; render(); });
    $('#pay-sort').addEventListener('click', function () {
      state.desc = !state.desc;
      this.querySelector('span').textContent = state.desc ? 'Newest first' : 'Oldest first';
      render();
    });

    /* CSV export of the current filtered rows */
    $('#pay-export').addEventListener('click', function () {
      var rows = filtered();
      var lines = [['Invoice', 'Customer', 'Plan', 'Method', 'Amount (USD)', 'Date', 'Status']];
      rows.forEach(function (p) {
        lines.push([p.id, p.user, p.plan, p.method, p.amount.toFixed(2), p.date, p.status]);
      });
      var csv = lines.map(function (row) {
        return row.map(function (cell) {
          var v = String(cell);
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        }).join(',');
      }).join('\r\n');
      var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'appflow-payments-' + TODAY + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 800);
      Toast.success(rows.length + ' invoice' + (rows.length === 1 ? '' : 's') + ' exported to CSV.', 'Export complete');
    });

    $('#payments-table').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var list = all();
      var p = list.find(function (x) { return x.id === btn.dataset.id; });
      if (!p) return;

      if (btn.dataset.act === 'invoice') {
        var tax = Math.round(p.amount * 0.085 * 100) / 100;
        var bd = Modal.custom({
          title: 'Invoice ' + p.id,
          bodyHTML:
            '<div class="invoice">' +
              '<div class="invoice-head">' +
                '<div class="invoice-brand"><span class="as-logo">' + icon('logo') + '</span>Stackly, Inc.</div>' +
                '<div class="invoice-id"><strong>' + esc(p.id) + '</strong><span>Issued ' + fmtDate(p.date) + '</span><div style="margin-top:6px">' + statusBadge(p.status) + '</div></div>' +
              '</div>' +
              '<div class="invoice-parties">' +
                '<div><h4>From</h4><p>Stackly, Inc.<br>548 Market Street, Suite 92<br>San Francisco, CA 94104</p></div>' +
                '<div><h4>Billed to</h4><p>' + esc(p.user) + '<br>' + esc(p.plan) + ' plan · monthly<br>Paid via ' + esc(p.method === 'card' ? 'credit card' : 'PayPal') + '</p></div>' +
              '</div>' +
              '<table class="invoice-lines"><thead><tr><th>Description</th><th>Qty</th><th>Amount</th></tr></thead><tbody>' +
                '<tr><td>Stackly ' + esc(p.plan) + ' — monthly subscription</td><td>1</td><td>' + money(p.amount - tax, 2) + '</td></tr>' +
                '<tr><td>Sales tax (8.5%)</td><td>—</td><td>' + money(tax, 2) + '</td></tr>' +
              '</tbody></table>' +
              '<div class="invoice-total"><span>Total</span><span class="grand">' + money(p.amount, 2) + '</span></div>' +
            '</div>',
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Close</button><button type="button" class="btn btn-primary" data-demo-toast="Invoice PDF download is a demo interaction.">' + icon('download') + 'Download PDF</button>'
        });
        injectAll(bd);
      }

      if (btn.dataset.act === 'markpaid') {
        p.status = 'paid';
        save(list);
        render();
        Toast.success(p.id + ' was marked as paid. ' + money(p.amount, 2) + ' added to revenue.', 'Payment received');
      }

      if (btn.dataset.act === 'refund') {
        Modal.confirm({
          title: 'Refund payment?',
          message: 'Refund ' + money(p.amount, 2) + ' to ' + p.user + ' for invoice ' + p.id + '? The amount returns to the original payment method within 5–10 business days.',
          okText: 'Issue refund', danger: true,
          onConfirm: function () {
            p.status = 'refunded';
            save(list);
            render();
            Toast.warning(money(p.amount, 2) + ' was refunded to ' + p.user + '.', 'Refund issued');
          }
        });
      }
    });

    render();
  }

  /* ==================================================================
     PAGE — ANALYTICS
     ================================================================== */
  function initAnalytics() {
    var PERIODS = {
      '30d': { labels: ['Jul 20', 'Jul 23', 'Jul 26', 'Jul 29', 'Aug 1', 'Aug 4', 'Aug 7', 'Aug 10', 'Aug 13', 'Aug 16'], scale: 0.12 },
      '90d': { labels: ['May 24', 'Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29', 'Jul 6', 'Jul 13', 'Jul 20', 'Jul 27', 'Aug 3', 'Aug 10'], scale: 0.38 },
      '12mo': { labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], scale: 1 }
    };
    function series(base, growth, wobble, n, scale) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var v = base + growth * i + Math.sin(i * 1.7) * wobble + Math.cos(i * 0.9) * wobble * 0.6;
        out.push(Math.max(1, Math.round(v * scale)));
      }
      return out;
    }

    function renderCharts(period) {
      var P = PERIODS[period];
      var n = P.labels.length;
      Charts.line('#an-users', {
        labels: P.labels,
        series: [
          { name: 'Total users', data: series(2100, 68, 40, n, 1) },
          { name: 'Active users', data: series(880, 32, 34, n, 1), color: '#47C1D1' }
        ],
        height: 250, ariaLabel: 'Monthly users, total versus active'
      });
      Charts.bars('#an-projects', { labels: P.labels, data: series(310, 22, 30, n, P.scale), color: '#7928AB', color2: '#9A289C', height: 250, ariaLabel: 'Projects created' });
      Charts.bars('#an-published', { labels: P.labels, data: series(190, 16, 22, n, P.scale), color: '#22C55E', color2: '#47C1D1', height: 250, ariaLabel: 'Apps published' });
      Charts.line('#an-revenue', {
        labels: P.labels,
        series: [{ name: 'Revenue', data: series(8200, 470, 260, n, P.scale), color: '#22C55E' }],
        height: 250, ariaLabel: 'Revenue'
      });
      var users = AppStore.read('admin_users', []);
      var planSegs = [
        { label: 'Free', value: users.filter(function (u) { return u.plan === 'Free'; }).length * 158, color: '#94A3B8' },
        { label: 'Pro', value: users.filter(function (u) { return u.plan === 'Pro'; }).length * 138, color: '#7928AB' },
        { label: 'Business', value: users.filter(function (u) { return u.plan === 'Business'; }).length * 121, color: '#9A289C' }
      ];
      Charts.donut('#an-plans', {
        segments: planSegs,
        size: 200, thickness: 26,
        centerLabel: planSegs.reduce(function (a, s) { return a + s.value; }, 0).toLocaleString('en-US'),
        centerSub: 'accounts', ariaLabel: 'Subscription split'
      });
      /* Template usage by top-5 real categories */
      var byCat = {};
      AppStore.getTemplates().forEach(function (t) { byCat[t.category] = (byCat[t.category] || 0) + t.uses; });
      var top5 = Object.keys(byCat).map(function (k) { return { label: k, value: byCat[k] }; })
        .sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
      var palette = ['#7928AB', '#9A289C', '#47C1D1', '#22C55E', '#F59E0B'];
      Charts.donut('#an-categories', {
        segments: top5.map(function (s, i) { return { label: s.label, value: s.value, color: palette[i] }; }),
        size: 200, thickness: 26, centerLabel: shortNum(top5.reduce(function (a, s) { return a + s.value; }, 0)), centerSub: 'template uses',
        ariaLabel: 'Template usage by category'
      });
      Charts.line('#an-growth', {
        labels: P.labels,
        series: [{ name: 'Customers', data: series(1350, 52, 28, n, 1), color: '#EC4899' }],
        height: 250, ariaLabel: 'Customer growth'
      });
    }

    /* period tabs */
    $$('#an-period .tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#an-period .tab-btn').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        renderCharts(b.dataset.period);
        Toast.info('Analytics recalculated for the last ' + b.textContent.trim() + '.', 'Period changed');
      });
    });

    /* conversion progress */
    var bar = $('#conv-bar');
    if (bar) requestAnimationFrame(function () { setTimeout(function () { bar.style.width = '38%'; }, 150); });

    /* Top templates table (real data) */
    var top = AppStore.getTemplates().slice().sort(function (a, b) { return b.uses - a.uses; }).slice(0, 8);
    $('#an-top-templates').innerHTML =
      '<table class="table"><thead><tr><th>Template</th><th>Category</th><th>Tier</th><th>Rating</th><th>Uses</th><th>Est. revenue</th></tr></thead><tbody>' +
      top.map(function (t) {
        var rev = t.tier === 'premium' ? t.uses * t.price * 0.031 : 0;
        return '<tr><td><div class="app-cell"><span class="app-dot" style="' + gradCss(t.gradient) + '">' + icon(t.icon) + '</span><span class="u-name">' + esc(t.name) + '</span></div></td>' +
          '<td>' + esc(t.category) + '</td>' +
          '<td>' + (t.tier === 'premium' ? badge('gradient', 'Premium') : badge('success', 'Free')) + '</td>' +
          '<td><span class="method-cell" style="color:var(--warning);font-weight:700">' + icon('star') + t.rating.toFixed(1) + '</span></td>' +
          '<td class="cell-strong">' + t.uses.toLocaleString('en-US') + '</td>' +
          '<td class="cell-strong">' + (rev ? money(rev, 0) : '—') + '</td></tr>';
      }).join('') + '</tbody></table>';

    renderCharts('12mo');
    injectAll();
  }

  /* ==================================================================
     PAGE — SETTINGS
     ================================================================== */
  function initSettings() {
    var s = getSettings();

    /* --- General --- */
    $('#set-site-name').value = s.siteName;
    $('#set-tagline').value = s.tagline;
    $('#set-support-email').value = s.supportEmail;
    $('#form-general').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!Validate.form(this)) return;
      var cur = getSettings();
      cur.siteName = $('#set-site-name').value.trim();
      cur.tagline = $('#set-tagline').value.trim();
      cur.supportEmail = $('#set-support-email').value.trim();
      saveSettings(cur);
      Toast.success('General settings were saved.', 'Settings saved');
    });

    /* --- Feature flags --- */
    var FLAGS = [
      { key: 'newBuilder', name: 'New builder experience', desc: 'Roll out the redesigned drag-and-drop canvas to all workspaces.' },
      { key: 'aiAssist', name: 'AI assist', desc: 'Enable AI-generated layouts, copy suggestions, and smart components.' },
      { key: 'marketplaceReviews', name: 'Marketplace reviews', desc: 'Let customers rate and review templates on the marketplace.' },
      { key: 'maintenance', name: 'Maintenance mode', desc: 'Show a holding page on the public site while you deploy changes.' }
    ];
    function renderFlags() {
      var cur = getSettings();
      $('#flags-list').innerHTML = FLAGS.map(function (f) {
        return '<div class="flag-row"><div><div class="flag-name">' + f.name + '</div><div class="flag-desc">' + f.desc + '</div></div>' +
          '<label class="switch"><input type="checkbox" data-flag="' + f.key + '"' + (cur.flags[f.key] ? ' checked' : '') + ' aria-label="' + f.name + '"><span class="switch-track"></span></label></div>';
      }).join('');
    }
    renderFlags();
    $('#flags-list').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-flag]');
      if (!input) return;
      var cur = getSettings();
      cur.flags[input.dataset.flag] = input.checked;
      saveSettings(cur);
      if (input.dataset.flag === 'maintenance') {
        renderBanner();
        injectAll($('#admin-banner') || document.body);
        Toast[input.checked ? 'warning' : 'success'](input.checked ? 'Maintenance mode enabled — visitors now see the holding page.' : 'Maintenance mode disabled — the site is back online.', 'Maintenance mode');
      } else {
        Toast.success('Feature flag updated.', 'Flags saved');
      }
    });

    /* --- Email & notifications --- */
    var NOTIFY = [
      { key: 'weeklyDigest', name: 'Weekly digest', desc: 'Send admins a Monday summary of signups, revenue, and churn.' },
      { key: 'paymentAlerts', name: 'Payment alerts', desc: 'Email on failed charges, disputes, and refunds.' },
      { key: 'newSignups', name: 'New signup alerts', desc: 'Real-time email for every new workspace created.' },
      { key: 'productUpdates', name: 'Product update emails', desc: 'Send customers release notes and template drops.' }
    ];
    $('#notify-list').innerHTML = NOTIFY.map(function (f) {
      return '<div class="flag-row"><div><div class="flag-name">' + f.name + '</div><div class="flag-desc">' + f.desc + '</div></div>' +
        '<label class="switch"><input type="checkbox" data-notify="' + f.key + '"' + (s.notify[f.key] ? ' checked' : '') + ' aria-label="' + f.name + '"><span class="switch-track"></span></label></div>';
    }).join('');
    $('#notify-list').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-notify]');
      if (!input) return;
      var cur = getSettings();
      cur.notify[input.dataset.notify] = input.checked;
      saveSettings(cur);
      Toast.success('Notification preferences saved.', 'Settings saved');
    });

    /* --- Payment config --- */
    $('#set-currency').value = s.payment.currency;
    $('#set-tax').value = s.payment.taxRate;
    var keyInput = $('#set-stripe-key');
    keyInput.value = s.payment.stripeKey;
    $('#key-reveal').addEventListener('click', function () {
      var revealed = keyInput.type === 'text';
      keyInput.type = revealed ? 'password' : 'text';
      this.innerHTML = icon(revealed ? 'eye' : 'eye-off');
      this.setAttribute('aria-label', revealed ? 'Reveal key' : 'Hide key');
    });
    $('#form-payment').addEventListener('submit', function (e) {
      e.preventDefault();
      var cur = getSettings();
      cur.payment.currency = $('#set-currency').value;
      cur.payment.taxRate = parseFloat($('#set-tax').value) || 0;
      cur.payment.stripeKey = keyInput.value.trim();
      saveSettings(cur);
      Toast.success('Payment configuration was saved.', 'Settings saved');
    });

    /* --- Testimonials manager --- */
    function renderTestimonials() {
      var list = AppStore.read('admin_testimonials', []);
      var host = $('#testi-list');
      if (!list.length) {
        host.innerHTML = '<div class="empty-state" style="padding:30px 10px"><p>No testimonials yet.</p></div>';
        return;
      }
      host.innerHTML = list.map(function (t) {
        return '<div class="testi-row' + (t.approved ? '' : ' is-hidden') + '">' + avatar(t.name, 'sm') +
          '<div class="testi-meta"><div class="testi-name">' + esc(t.name) + '</div><div class="testi-role">' + esc(t.role) + '</div>' +
          '<p class="testi-quote">“' + esc(t.text) + '”</p></div>' +
          '<div class="testi-controls">' +
            '<label class="switch" data-tooltip="' + (t.approved ? 'Shown on site' : 'Hidden from site') + '"><input type="checkbox" data-testi-approve="' + t.id + '"' + (t.approved ? ' checked' : '') + ' aria-label="Approve testimonial"><span class="switch-track"></span></label>' +
            '<button type="button" class="btn-icon is-danger" data-testi-del="' + t.id + '" aria-label="Delete testimonial" style="width:30px;height:30px;border-radius:8px;color:var(--text-muted)">' + icon('trash') + '</button>' +
          '</div></div>';
      }).join('');
      injectAll(host);
    }
    renderTestimonials();
    $('#testi-list').addEventListener('change', function (e) {
      var input = e.target.closest('input[data-testi-approve]');
      if (!input) return;
      var list = AppStore.read('admin_testimonials', []);
      var t = list.find(function (x) { return x.id === input.dataset.testiApprove; });
      if (!t) return;
      t.approved = input.checked;
      AppStore.write('admin_testimonials', list);
      renderTestimonials();
      Toast[input.checked ? 'success' : 'warning'](t.name + '’s testimonial is now ' + (input.checked ? 'visible on the site.' : 'hidden.'), 'Testimonials');
    });
    $('#testi-list').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-testi-del]');
      if (!btn) return;
      var list = AppStore.read('admin_testimonials', []);
      var t = list.find(function (x) { return x.id === btn.dataset.testiDel; });
      if (!t) return;
      Modal.confirm({
        title: 'Delete testimonial?',
        message: 'Remove ' + t.name + '’s testimonial permanently?',
        okText: 'Delete', danger: true,
        onConfirm: function () {
          AppStore.write('admin_testimonials', list.filter(function (x) { return x.id !== t.id; }));
          renderTestimonials();
          Toast.success('Testimonial deleted.', 'Testimonials');
        }
      });
    });

    /* --- Contact inbox --- */
    function renderInbox() {
      var msgs = AppStore.read('admin_messages', []);
      var host = $('#inbox-list');
      var badgeEl = $('#inbox-count');
      if (badgeEl) badgeEl.textContent = msgs.filter(function (m) { return m.unread; }).length + ' unread';
      if (!msgs.length) {
        host.innerHTML = '<div class="empty-state"><span class="empty-icon">' + icon('mail') + '</span><h3>Inbox zero</h3><p>No contact messages right now.</p></div>';
        return;
      }
      host.innerHTML = msgs.map(function (m) {
        return '<div class="inbox-item" data-inbox="' + m.id + '">' +
          '<button type="button" class="inbox-head" aria-expanded="false">' +
            '<span class="msg-dot" style="opacity:' + (m.unread ? 1 : 0) + '"></span>' + avatar(m.name, 'sm') +
            '<span class="msg-meta"><span class="msg-from"><span>' + esc(m.name) + '</span><span class="msg-date">' + fmtDate(m.date) + '</span></span>' +
            '<span class="msg-subj" style="display:block">' + esc(m.subject) + '</span></span>' +
            '<span class="chev">' + icon('chevron-down') + '</span>' +
          '</button>' +
          '<div class="inbox-body"><p>' + esc(m.snippet) + '</p><p style="margin-top:6px;font-size:12px;color:var(--text-muted)">' + esc(m.email) + '</p>' +
            '<div class="inbox-body-actions">' +
              '<button type="button" class="btn btn-primary btn-sm" data-reply="' + m.id + '">' + icon('mail') + 'Reply</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-msg-del="' + m.id + '">' + icon('trash') + 'Delete</button>' +
            '</div></div>' +
        '</div>';
      }).join('');
      injectAll(host);
    }
    renderInbox();
    $('#inbox-list').addEventListener('click', function (e) {
      var reply = e.target.closest('[data-reply]');
      var del = e.target.closest('[data-msg-del]');
      var head = e.target.closest('.inbox-head');

      if (reply) {
        var msgs0 = AppStore.read('admin_messages', []);
        var m0 = msgs0.find(function (x) { return x.id === reply.dataset.reply; });
        if (!m0) return;
        var bd = Modal.custom({
          title: 'Reply to ' + m0.name,
          bodyHTML:
            '<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px">Re: ' + esc(m0.subject) + ' · ' + esc(m0.email) + '</p>' +
            '<form id="reply-form" novalidate><div class="form-group"><label class="form-label" for="rf-body">Message</label>' +
            '<textarea class="form-control" id="rf-body" rows="5" data-validate="required" placeholder="Hi ' + esc(m0.name.split(' ')[0]) + ', thanks for reaching out…"></textarea>' +
            '<span class="form-error" data-error-for="rf-body"></span></div></form>',
          footHTML: '<button type="button" class="btn btn-secondary" data-modal-close>Cancel</button><button type="submit" form="reply-form" class="btn btn-primary">' + icon('mail') + 'Send reply</button>'
        });
        var form = bd.querySelector('#reply-form');
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          if (!Validate.form(form)) return;
          Modal.close(bd);
          Toast.success('Your reply to ' + m0.name + ' was sent.', 'Reply sent');
        });
        injectAll(bd);
        return;
      }

      if (del) {
        var msgs1 = AppStore.read('admin_messages', []);
        var m1 = msgs1.find(function (x) { return x.id === del.dataset.msgDel; });
        if (!m1) return;
        Modal.confirm({
          title: 'Delete message?',
          message: 'Delete the message from ' + m1.name + '? This cannot be undone.',
          okText: 'Delete', danger: true,
          onConfirm: function () {
            AppStore.write('admin_messages', msgs1.filter(function (x) { return x.id !== m1.id; }));
            renderInbox();
            Toast.success('Message deleted.', 'Inbox');
          }
        });
        return;
      }

      if (head) {
        var item = head.closest('.inbox-item');
        var isOpen = item.classList.toggle('is-open');
        head.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
          var msgs = AppStore.read('admin_messages', []);
          var m = msgs.find(function (x) { return x.id === item.dataset.inbox; });
          if (m && m.unread) {
            m.unread = false;
            AppStore.write('admin_messages', msgs);
            head.querySelector('.msg-dot').style.opacity = 0;
            var badgeEl = $('#inbox-count');
            if (badgeEl) badgeEl.textContent = msgs.filter(function (x) { return x.unread; }).length + ' unread';
          }
        }
      }
    });

    /* --- Danger zone --- */
    $('#danger-reset').addEventListener('click', function () {
      Modal.confirm({
        title: 'Reset all demo data?',
        message: 'This wipes every Stackly demo record — users, projects, templates, payments, settings — and re-seeds the workspace from scratch. Your theme preference is kept. This cannot be undone.',
        okText: 'Reset everything', danger: true,
        onConfirm: function () {
          var keys = [];
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf('appflow_') === 0 && k !== 'appflow_theme') keys.push(k);
          }
          keys.forEach(function (k) { localStorage.removeItem(k); });
          window.location.reload();
        }
      });
    });
  }

  /* ==================================================================
     BOOT
     ================================================================== */
  var CONTROLLERS = {
    dashboard: initDashboard,
    users: initUsers,
    projects: initProjects,
    templates: initTemplates,
    categories: initCategories,
    subscriptions: initSubscriptions,
    payments: initPayments,
    analytics: initAnalytics,
    settings: initSettings
  };

  function boot() {
    seedAdmin();
    renderSidebar();
    renderTopbar();
    renderBanner();
    wireShell();
    if (CONTROLLERS[slug]) CONTROLLERS[slug]();
    injectAll();
    if (window.AppAnimations && AppAnimations.refreshReveal) AppAnimations.refreshReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

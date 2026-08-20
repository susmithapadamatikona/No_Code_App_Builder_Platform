/* ==========================================================================
   STACKLY — Dashboard Shell + Dashboard Page
   Renders the sidebar + topbar shell into #dash-sidebar / #dash-topbar on
   every dashboard page (active item = document.body.dataset.dash) and owns
   the dashboard.html page logic. Exposes window.DashShell helpers used by
   the other dashboard pages' scripts.
   ========================================================================== */

(function () {
  'use strict';

  /* Auth guard FIRST — before anything renders */
  if (!window.AppStore || !AppStore.auth.requireAuth('login.html')) return;

  var NAV = [
    { section: 'Main' },
    { slug: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'grid' },
    { slug: 'projects', label: 'My Projects', href: 'projects.html', icon: 'layers' },
    { slug: 'analytics', label: 'Analytics', href: 'analytics.html', icon: 'chart' },
    { slug: 'integrations', label: 'Integrations', href: 'integrations-dashboard.html', icon: 'cloud' },
    { section: 'Account' },
    { slug: 'profile', label: 'Profile', href: 'profile.html', icon: 'user' },
    { slug: 'settings', label: 'Settings', href: 'settings.html', icon: 'settings' },
    { slug: 'billing', label: 'Billing', href: 'billing.html', icon: 'credit-card' }
  ];

  var TITLES = {
    dashboard: 'Dashboard', projects: 'My Projects', analytics: 'Analytics',
    integrations: 'Integrations', profile: 'Profile', settings: 'Settings', billing: 'Billing'
  };

  /* ------------------------------------------------------------------
     Small helpers (shared with page scripts via DashShell)
     ------------------------------------------------------------------ */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).slice(0, 2);
    return parts.map(function (p) { return p.charAt(0).toUpperCase(); }).join('') || 'U';
  }

  function fmtNum(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n));
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function tone() { return AppStore.read('avatar_tone', ''); }

  function statusBadge(status) {
    return status === 'published'
      ? '<span class="badge badge-success"><span class="badge-dot"></span>Published</span>'
      : '<span class="badge badge-warning"><span class="badge-dot"></span>Draft</span>';
  }

  function gradientCSS(g) {
    g = g && g.length === 2 ? g : ['#7928AB', '#9A289C'];
    return 'background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
  }

  /* Rich screenshot artwork for larger project thumbs (Artwork engine) */
  function artFor(project) {
    if (window.Artwork) {
      var tpl = project && project.templateId ? AppStore.getTemplate(project.templateId) : null;
      return window.Artwork.forCategory(tpl ? tpl.category : 'Dashboard', (project && project.gradient) || null);
    }
    return thumbSVG();
  }

  /* Mini UI-skeleton SVG used inside small gradient project thumbs */
  function thumbSVG() {
    return '<svg viewBox="0 0 44 40" fill="none" aria-hidden="true">' +
      '<rect x="5" y="6" width="20" height="4.5" rx="2.2" fill="rgba(255,255,255,0.9)"/>' +
      '<rect x="29" y="6" width="10" height="4.5" rx="2.2" fill="rgba(255,255,255,0.55)"/>' +
      '<rect x="5" y="15" width="16" height="11" rx="2.5" fill="rgba(255,255,255,0.5)"/>' +
      '<rect x="24" y="15" width="15" height="11" rx="2.5" fill="rgba(255,255,255,0.35)"/>' +
      '<rect x="5" y="30" width="34" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>' +
      '</svg>';
  }

  /* Deterministic pseudo-random series (seeded) for demo charts */
  function seededRand(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function series(seed, n, base, spread) {
    var rnd = seededRand(seed);
    var out = [];
    for (var i = 0; i < n; i++) {
      var trend = 1 + (i / n) * 0.45;
      out.push(Math.round((base + (rnd() - 0.35) * spread) * trend));
    }
    return out;
  }

  /* Animate injected .progress-bar[data-value] + counters */
  function animateBars(scope) {
    (scope || document).querySelectorAll('.progress-bar[data-value]').forEach(function (bar) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.width = Math.min(100, parseFloat(bar.dataset.value || '0')) + '%';
        });
      });
    });
  }

  function user() { return AppStore.auth.current() || { name: 'Builder', email: '', plan: 'Free' }; }

  /* ------------------------------------------------------------------
     Sidebar
     ------------------------------------------------------------------ */

  function renderSidebar(active) {
    var host = document.getElementById('dash-sidebar');
    if (!host) return;
    host.classList.add('dash-sidebar');
    var u = user();

    var nav = NAV.map(function (item) {
      if (item.section) return '<div class="dash-nav-title dash-label-keep">' + item.section + '</div>';
      var isActive = item.slug === active;
      return '<a class="dash-nav-link' + (isActive ? ' is-active' : '') + '" href="' + item.href + '"' +
        (isActive ? ' aria-current="page"' : '') + '>' +
        '<i data-icon="' + item.icon + '"></i><span class="dash-label">' + item.label + '</span></a>';
    }).join('');

    host.innerHTML =
      '<div class="dash-side-head">' +
        '<a class="dash-brand" href="index.html" aria-label="Stackly home">' +
          '<span class="brand-mark dash-brand-mini"><i data-icon="logo"></i></span>' +
          '<img class="dash-brand-name brand-logo" src="assets/images/logo-stackly.webp" alt="Stackly" style="height:32px">' +
        '</a>' +
        '<button class="dash-collapse" type="button" data-dash-collapse aria-label="Toggle sidebar width"><i data-icon="chevron-left"></i></button>' +
      '</div>' +
      '<nav class="dash-nav" aria-label="Dashboard">' + nav + '</nav>' +
      '<div class="dash-upgrade">' +
        '<div class="du-icon"><i data-icon="rocket"></i></div>' +
        '<h4>Upgrade to Business</h4>' +
        '<p>Unlimited storage, team seats, and custom domains for every app.</p>' +
        '<a class="btn btn-white btn-sm" href="billing.html">View plans <i data-icon="arrow-right"></i></a>' +
      '</div>' +
      '<div class="dash-user">' +
        '<span class="avatar js-avatar ' + esc(tone()) + '">' + esc(initials(u.name)) + '</span>' +
        '<div class="dash-user-meta"><b></b><span></span></div>' +
        '<button class="dash-user-logout" type="button" data-logout aria-label="Sign out" data-tooltip="Sign out"><i data-icon="log-out"></i></button>' +
      '</div>';

    host.querySelector('.dash-user-meta b').textContent = u.name;
    host.querySelector('.dash-user-meta span').textContent = u.email || ((u.plan || 'Free') + ' plan');
    host.querySelector('.dash-user-meta span').title = u.email || '';
  }

  /* ------------------------------------------------------------------
     Topbar
     ------------------------------------------------------------------ */

  function notifItem(n) {
    var meta = {
      success: { icon: 'check-circle', tint: 'tint-green' },
      warning: { icon: 'alert-triangle', tint: 'tint-orange' },
      danger: { icon: 'alert-circle', tint: 'tint-red' },
      info: { icon: 'info', tint: 'tint-blue' }
    }[n.type] || { icon: 'bell', tint: 'tint-purple' };
    return '<div class="ntf-item' + (n.read ? '' : ' is-unread') + '">' +
      '<span class="ntf-icon ' + meta.tint + '"><i data-icon="' + meta.icon + '"></i></span>' +
      '<div class="ntf-body"><b>' + esc(n.title) + '</b><p>' + esc(n.msg) + '</p></div>' +
      '<span class="ntf-time">' + esc(n.time) + '</span></div>';
  }

  function renderNotifications() {
    var list = AppStore.getNotifications();
    var unread = list.filter(function (n) { return !n.read; }).length;
    var badge = document.querySelector('[data-ntf-badge]');
    if (badge) {
      badge.textContent = unread;
      badge.classList.toggle('is-empty', unread === 0);
    }
    var host = document.querySelector('[data-ntf-list]');
    if (host) {
      host.innerHTML = list.length
        ? list.map(notifItem).join('')
        : '<div class="ntf-empty">You are all caught up. No notifications.</div>';
      window.Icons.inject(host);
    }
  }

  function renderTopbar(active) {
    var host = document.getElementById('dash-topbar');
    if (!host) return;
    host.classList.add('dash-topbar');
    var u = user();
    var title = document.body.dataset.dashTitle || TITLES[active] || 'Dashboard';
    document.title = title + ' — Stackly | No-Code App Builder';

    host.innerHTML =
      '<button class="dash-burger" type="button" data-dash-burger aria-label="Open navigation"><i data-icon="menu"></i></button>' +
      '<h1 class="dash-page-title"></h1>' +
      '<form class="dash-search" data-dash-search role="search">' +
        '<label class="search-bar"><i data-icon="search"></i>' +
        '<input type="search" placeholder="Search projects, templates, docs…" aria-label="Search Stackly"></label>' +
      '</form>' +
      '<div class="dash-top-actions">' +
        '<div class="dash-email-chip" title="Signed in as ' + esc(u.email || '') + '">' +
          '<i data-icon="mail"></i><span class="dash-email-text"></span>' +
        '</div>' +
      '</div>';

    host.querySelector('.dash-page-title').textContent = title;
    host.querySelector('.dash-email-text').textContent = u.email || u.name || '—';
    renderNotifications();
  }

  /* ------------------------------------------------------------------
     Shell behaviors
     ------------------------------------------------------------------ */

  function wireShell() {
    var layout = document.querySelector('.dash-layout');
    if (!layout) return;

    /* overlay for mobile drawer */
    var overlay = document.createElement('div');
    overlay.className = 'dash-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    layout.appendChild(overlay);

    /* collapsed state (desktop, persisted) */
    if (AppStore.read('dash_collapsed', false)) layout.classList.add('is-collapsed');

    document.addEventListener('click', function (e) {
      /* collapse toggle */
      if (e.target.closest('[data-dash-collapse]')) {
        layout.classList.toggle('is-collapsed');
        AppStore.write('dash_collapsed', layout.classList.contains('is-collapsed'));
        return;
      }
      /* mobile drawer */
      if (e.target.closest('[data-dash-burger]')) {
        layout.classList.add('menu-open');
        return;
      }
      if (e.target === overlay || (e.target.closest('.dash-nav-link') && window.innerWidth <= 1024)) {
        layout.classList.remove('menu-open');
      }
      /* popovers */
      var toggle = e.target.closest('[data-pop-toggle]');
      var insidePanel = e.target.closest('.dash-pop-panel');
      document.querySelectorAll('.dash-pop.is-open').forEach(function (p) {
        if (toggle && p.contains(toggle)) return;
        if (insidePanel && p.contains(insidePanel)) return;
        p.classList.remove('is-open');
      });
      if (toggle) toggle.closest('.dash-pop').classList.toggle('is-open');

      /* mark all notifications read */
      if (e.target.closest('[data-ntf-readall]')) {
        var list = AppStore.getNotifications().map(function (n) {
          return Object.assign({}, n, { read: true });
        });
        AppStore.saveNotifications(list);
        renderNotifications();
        window.Toast.success('All notifications marked as read.');
      }
      /* logout */
      if (e.target.closest('[data-logout]')) {
        AppStore.auth.logout();
        window.location.href = 'index.html';
      }
      /* new project (any page) */
      if (e.target.closest('[data-new-project]')) {
        e.preventDefault();
        newProjectModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        layout.classList.remove('menu-open');
        document.querySelectorAll('.dash-pop.is-open').forEach(function (p) { p.classList.remove('is-open'); });
      }
    });

    /* global search (demo) */
    document.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-dash-search]');
      if (!form) return;
      e.preventDefault();
      var q = form.querySelector('input').value.trim();
      window.Toast.info(q ? 'Global search is a demo — try the filters on My Projects for "' + q + '".' : 'Type something to search your workspace.', 'Search');
    });
  }

  /* ------------------------------------------------------------------
     New project modal (dashboard + projects pages)
     ------------------------------------------------------------------ */

  function newProjectModal() {
    var tpls = AppStore.getTemplates();
    var options = '<option value="">Blank canvas — start from scratch</option>' +
      tpls.map(function (t) {
        return '<option value="' + esc(t.id) + '">' + esc(t.name) + ' (' + esc(t.category) + ')</option>';
      }).join('');

    var backdrop = window.Modal.custom({
      title: 'Create a new app',
      bodyHTML:
        '<div class="form-group"><label class="form-label" for="np-name">App name <span class="req">*</span></label>' +
        '<input class="form-control" id="np-name" type="text" placeholder="e.g. Atlas Client Portal" maxlength="60">' +
        '<span class="form-error" data-error-for="np-name"></span></div>' +
        '<div class="form-group"><label class="form-label" for="np-template">Start from</label>' +
        '<select class="form-control" id="np-template">' + options + '</select>' +
        '<span class="form-hint">Templates include pages, components, and sample data.</span></div>',
      footHTML:
        '<button class="btn btn-secondary" type="button" data-modal-close>Cancel</button>' +
        '<button class="btn btn-primary" type="button" data-np-create><i data-icon="plus"></i> Create app</button>'
    });
    window.Icons.inject(backdrop);

    backdrop.querySelector('[data-np-create]').addEventListener('click', function () {
      var nameInput = backdrop.querySelector('#np-name');
      var name = nameInput.value.trim();
      if (!name) {
        nameInput.classList.add('is-invalid');
        var err = backdrop.querySelector('[data-error-for="np-name"]');
        err.textContent = 'Give your app a name to continue.';
        err.classList.add('is-visible');
        nameInput.focus();
        return;
      }
      var tplId = backdrop.querySelector('#np-template').value;
      var tpl = tplId ? AppStore.getTemplate(tplId) : null;
      var project = AppStore.addProject({
        name: name,
        template: tpl ? tpl.name : 'Blank Canvas',
        templateId: tpl ? tpl.id : null,
        gradient: tpl ? tpl.gradient : ['#7928AB', '#9A289C'],
        pages: tpl ? tpl.pages.length : 1,
        components: tpl ? tpl.components.length * 6 : 0
      });
      this.classList.add('is-loading');
      window.Toast.success('"' + name + '" was created. Opening the builder…', 'App created');
      setTimeout(function () {
        window.location.href = 'app-builder.html?project=' + project.id;
      }, 700);
    });
  }

  /* ------------------------------------------------------------------
     Dashboard page (data-dash="dashboard")
     ------------------------------------------------------------------ */

  function initDashboardPage() {
    var u = user();
    var projects = AppStore.getProjects();
    var published = projects.filter(function (p) { return p.status === 'published'; });
    var drafts = projects.filter(function (p) { return p.status !== 'published'; });
    var totalViews = projects.reduce(function (a, p) { return a + (p.views || 0); }, 0);

    /* Welcome banner */
    var hour = new Date().getHours();
    var timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    var greetEl = document.querySelector('[data-greeting]');
    if (greetEl) greetEl.textContent = 'Good ' + timeOfDay + ', ' + String(u.name || 'Builder').split(' ')[0] + '!';
    var subEl = document.querySelector('[data-greeting-sub]');
    if (subEl) {
      subEl.innerHTML = 'Signed in as <b>' + esc(u.email || '—') + '</b> · You have <b>' + projects.length + ' project' + (projects.length === 1 ? '' : 's') + '</b> in your workspace — <b>' +
        published.length + ' live</b> and <b>' + drafts.length + ' in draft</b>. Your apps collected <b>' + fmtNum(totalViews) + ' views</b> so far.';
    }
    var dateEl = document.querySelector('[data-hero-date]');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    /* Stat row */
    var stats = [
      { label: 'Total Projects', value: projects.length, icon: 'layers', tint: 'tint-purple', trend: '+2 this month', up: true, spark: series(11, 10, 6, 5), color: '#7928AB' },
      { label: 'Published Apps', value: published.length, icon: 'rocket', tint: 'tint-green', trend: '+1 this week', up: true, spark: series(22, 10, 4, 4), color: '#22C55E' },
      { label: 'Draft Apps', value: drafts.length, icon: 'edit', tint: 'tint-orange', trend: '2 in review', up: true, spark: series(33, 10, 3, 4), color: '#F59E0B' },
      { label: 'Total Views', value: fmtNum(totalViews), icon: 'eye', tint: 'tint-blue', trend: '+18.4%', up: true, spark: series(44, 10, 900, 700), color: '#47C1D1' }
    ];
    var statHost = document.getElementById('stat-row');
    if (statHost) {
      statHost.innerHTML = stats.map(function (s, i) {
        return '<article class="card dash-stat" data-aos="fade-up">' +
          '<div class="dash-stat-top"><span class="stat-icon ' + s.tint + '"><i data-icon="' + s.icon + '"></i></span>' +
          '<span class="stat-trend ' + (s.up ? 'is-up' : 'is-down') + '"><i data-icon="' + (s.up ? 'trend-up' : 'trend-down') + '"></i>' + s.trend + '</span></div>' +
          '<div class="stat-value">' + s.value + '</div>' +
          '<div class="stat-label">' + s.label + '</div>' +
          '<div class="dash-spark" id="dash-spark-' + i + '"></div></article>';
      }).join('');
      stats.forEach(function (s, i) {
        window.Charts.spark('#dash-spark-' + i, { data: s.spark, color: s.color });
      });
    }

    /* Recent projects */
    var rpHost = document.getElementById('recent-projects');
    if (rpHost) {
      var recent = projects.slice().sort(function (a, b) {
        return String(b.modified).localeCompare(String(a.modified));
      }).slice(0, 4);
      if (!recent.length) {
        rpHost.innerHTML =
          '<div class="empty-state"><div class="empty-icon"><i data-icon="layers"></i></div>' +
          '<h3>No projects yet</h3><p>Create your first app from a template or a blank canvas and it will show up here.</p>' +
          '<button class="btn btn-primary" type="button" data-new-project><i data-icon="plus"></i> Create New App</button></div>';
      } else {
        rpHost.innerHTML = '<div class="proj-rows">' + recent.map(function (p) {
          return '<div class="proj-row">' +
            '<span class="proj-thumb" style="' + gradientCSS(p.gradient) + '">' + artFor(p) + '</span>' +
            '<div class="proj-row-meta"><b>' + esc(p.name) + '</b><span>Updated ' + fmtDate(p.modified) + ' · ' + fmtNum(p.views) + ' views</span></div>' +
            statusBadge(p.status) +
            '<div class="proj-row-actions">' +
              '<a class="btn-icon btn" href="app-builder.html?project=' + esc(p.id) + '" aria-label="Edit ' + esc(p.name) + '" data-tooltip="Edit"><i data-icon="edit"></i></a>' +
              '<a class="btn-icon btn" href="project-details.html?id=' + esc(p.id) + '" aria-label="View ' + esc(p.name) + '" data-tooltip="Details"><i data-icon="eye"></i></a>' +
            '</div></div>';
        }).join('') + '</div>';
      }
    }

    /* Activity feed */
    var actHost = document.getElementById('activity-feed');
    if (actHost) {
      var tints = { publish: 'tint-green', edit: 'tint-purple', template: 'tint-blue', team: 'tint-orange', milestone: 'tint-green', create: 'tint-purple', delete: 'tint-red' };
      var activity = AppStore.getActivity().slice(0, 6);
      actHost.innerHTML = activity.length
        ? '<div class="feed">' + activity.map(function (a) {
            return '<div class="feed-item"><span class="feed-icon ' + (tints[a.type] || 'tint-purple') + '"><i data-icon="' + esc(a.icon || 'edit') + '"></i></span>' +
              '<div class="feed-body"><p>' + esc(a.text) + '</p><time>' + esc(a.time) + '</time></div></div>';
          }).join('') + '</div>'
        : '<div class="empty-state"><div class="empty-icon"><i data-icon="clock"></i></div><h3>No activity yet</h3><p>Actions like publishing and editing apps will appear here.</p></div>';
    }

    /* Views overview chart — last 8 months */
    var chartHost = document.getElementById('views-chart');
    if (chartHost) {
      window.Charts.line(chartHost, {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        series: [{ name: 'App views', data: [2140, 2860, 2620, 3480, 4120, 3980, 4760, 5420], color: '#7928AB' }],
        height: 250,
        ariaLabel: 'App views over the last 8 months'
      });
    }

    /* Import project demo */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-import-project]')) {
        window.Toast.info('Importing from JSON, Figma, and other workspaces is a demo feature on this plan.', 'Import project');
      }
    });

    animateBars(document);
    window.Icons.inject();
    if (window.AppAnimations) window.AppAnimations.refreshReveal();
  }

  /* ------------------------------------------------------------------
     Public API + boot
     ------------------------------------------------------------------ */

  function init(active) {
    renderSidebar(active);
    renderTopbar(active);
    wireShell();
    window.Icons.inject();
  }

  window.DashShell = {
    init: init,
    user: user,
    esc: esc,
    initials: initials,
    fmtNum: fmtNum,
    fmtDate: fmtDate,
    tone: tone,
    statusBadge: statusBadge,
    gradientCSS: gradientCSS,
    thumbSVG: thumbSVG,
    artFor: artFor,
    series: series,
    seededRand: seededRand,
    animateBars: animateBars,
    newProjectModal: newProjectModal,
    refreshNotifications: renderNotifications
  };

  document.addEventListener('DOMContentLoaded', function () {
    var slug = document.body.dataset.dash || 'dashboard';
    init(slug);
    if (slug === 'dashboard' && document.getElementById('stat-row')) initDashboardPage();
  });
})();

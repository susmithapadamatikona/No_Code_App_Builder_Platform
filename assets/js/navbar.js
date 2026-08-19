/* ==========================================================================
   STACKLY — Shared Header & Footer
   Pages include:
     <div id="header-root"></div>  ...  <div id="footer-root"></div>
   and set <body data-page="home">. Renders auth-aware chrome, sticky
   behavior, dropdowns, mega menu, and the mobile drawer.
   ========================================================================== */

(function () {
  'use strict';

  const I = function (name) { return window.Icons.get(name); };

  const RESOURCES_DROP = [
    { href: 'resources.html', icon: 'gift', title: 'Resources Hub' },
    { href: 'blog.html', icon: 'edit', title: 'Blog' },
    { href: 'documentation.html', icon: 'book', title: 'Documentation' },
    { href: 'faq.html', icon: 'help-circle', title: 'FAQ' },
    { href: 'careers.html', icon: 'users', title: 'Careers' },
    { href: 'about.html', icon: 'info', title: 'About Us' }
  ];

  function brandHTML() {
    return '<a class="brand" href="index.html" aria-label="Stackly home">' +
      '<img class="brand-logo" src="assets/images/logo-stackly.webp" alt="Stackly"></a>';
  }

  function renderHeader() {
    const root = document.getElementById('header-root');
    if (!root) return;
    const page = document.body.dataset.page || '';
    const user = window.AppStore.auth.current();

    const productOpen = ['features', 'app-builder', 'how-it-works', 'integrations', 'solutions'].indexOf(page) !== -1;
    const resourceOpen = ['resources', 'blog', 'documentation', 'faq', 'careers', 'about'].indexOf(page) !== -1;

    let userArea;
    if (user) {
      userArea =
        '<div class="nav-item nav-user">' +
          '<button class="nav-user-btn" type="button" aria-haspopup="true" aria-expanded="false">' +
            '<span class="nav-avatar">' + initials(user.name) + '</span>' +
            '<span class="nav-user-name">' + esc(firstName(user.name)) + '</span>' +
            '<span class="caret">' + I('chevron-down') + '</span>' +
          '</button>' +
          '<div class="nav-dropdown" role="menu">' +
            '<a href="dashboard.html">' + I('grid') + ' Dashboard</a>' +
            '<a href="projects.html">' + I('layers') + ' My Projects</a>' +
            '<a href="profile.html">' + I('user') + ' Profile</a>' +
            '<a href="billing.html">' + I('credit-card') + ' Billing</a>' +
            (user.role === 'admin' ? '<a href="admin-dashboard.html">' + I('shield') + ' Admin Panel</a>' : '') +
            '<div class="nav-dropdown-sep"></div>' +
            '<a href="#" class="is-danger" data-logout>' + I('log-out') + ' Sign Out</a>' +
          '</div>' +
        '</div>';
    } else {
      userArea =
        '<a class="btn btn-ghost btn-sm nav-login-link" href="login.html" style="color:#CBD5E1">Sign In</a>' +
        '<a class="btn btn-primary btn-sm" href="register.html">Start Free ' + I('arrow-right') + '</a>';
    }

    root.innerHTML =
      '<a class="skip-link" href="#main">Skip to main content</a>' +
      '<div class="scroll-progress" aria-hidden="true"></div>' +
      '<header class="site-header" id="site-header">' +
        '<div class="container container-wide navbar">' +
          brandHTML() +
          '<nav aria-label="Primary">' +
            '<ul class="nav-menu">' +
              '<li><a class="nav-link' + (page === 'home' ? ' is-active' : '') + '" href="index.html">Home</a></li>' +
              '<li><a class="nav-link' + (productOpen ? ' is-active' : '') + '" href="features.html">Product</a></li>' +
              '<li><a class="nav-link' + (page === 'templates' ? ' is-active' : '') + '" href="templates.html">Templates</a></li>' +
              '<li><a class="nav-link' + (page === 'pricing' ? ' is-active' : '') + '" href="pricing.html">Pricing</a></li>' +
              '<li class="nav-item">' +
                '<button class="nav-link' + (resourceOpen ? ' is-active' : '') + '" type="button" aria-haspopup="true" aria-expanded="false">Resources <span class="caret">' + I('chevron-down') + '</span></button>' +
                '<div class="nav-dropdown" role="menu">' +
                  RESOURCES_DROP.map(function (r) { return '<a href="' + r.href + '">' + I(r.icon) + ' ' + r.title + '</a>'; }).join('') +
                '</div>' +
              '</li>' +
              '<li><a class="nav-link' + (page === 'contact' ? ' is-active' : '') + '" href="contact.html">Contact</a></li>' +
            '</ul>' +
          '</nav>' +
          '<div class="nav-actions">' +
            userArea +
            '<button class="nav-burger" type="button" aria-label="Open navigation menu" aria-expanded="false"><span></span></button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      renderMobileNav(page, user) +
      '<div class="nav-overlay"></div>';

    bindHeader(root);
  }

  function renderMobileNav(page, user) {
    return '<aside class="mobile-nav" aria-label="Mobile navigation">' +
      '<div class="mobile-nav-head">' + brandHTML() +
        '<button class="mobile-nav-close" type="button" aria-label="Close menu">' + I('x') + '</button></div>' +
      '<ul class="mobile-nav-links">' +
        '<li><a href="index.html"' + (page === 'home' ? ' class="is-active"' : '') + '>Home</a></li>' +
        '<li><a href="features.html">Product</a></li>' +
        '<li><a href="templates.html"' + (page === 'templates' ? ' class="is-active"' : '') + '>Templates</a></li>' +
        '<li><a href="pricing.html"' + (page === 'pricing' ? ' class="is-active"' : '') + '>Pricing</a></li>' +
        '<li class="mobile-group"><button class="mobile-group-btn" type="button">Resources <span class="caret">' + I('chevron-down') + '</span></button>' +
          '<div class="mobile-group-panel"><div>' +
            RESOURCES_DROP.map(function (r) { return '<a href="' + r.href + '">' + r.title + '</a>'; }).join('') +
          '</div></div></li>' +
        '<li><a href="contact.html">Contact</a></li>' +
      '</ul>' +
      '<div class="mobile-nav-cta">' +
        (user
          ? '<a class="btn btn-primary btn-block" href="dashboard.html">Go to Dashboard</a>' +
            '<button class="btn btn-glass btn-block" type="button" data-logout>Sign Out</button>'
          : '<a class="btn btn-glass btn-block" href="login.html">Sign In</a>' +
            '<a class="btn btn-primary btn-block" href="register.html">Start Building Free</a>') +
      '</div>' +
    '</aside>';
  }

  function bindHeader(root) {
    const header = root.querySelector('#site-header');
    const burger = root.querySelector('.nav-burger');
    const drawer = root.querySelector('.mobile-nav');
    const overlay = root.querySelector('.nav-overlay');
    const progress = root.querySelector('.scroll-progress');

    /* Sticky + scroll progress */
    function onScroll() {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Desktop dropdowns / mega menu (click + hover intent) */
    root.querySelectorAll('.nav-item').forEach(function (item) {
      const trigger = item.querySelector('button.nav-link, .nav-user-btn');
      if (!trigger) return;
      let hoverTimer;
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        const wasOpen = item.classList.contains('is-open');
        closeAllDropdowns(root);
        if (!wasOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      item.addEventListener('mouseenter', function () {
        if (window.innerWidth < 1080) return;
        clearTimeout(hoverTimer);
        closeAllDropdowns(root);
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      });
      item.addEventListener('mouseleave', function () {
        if (window.innerWidth < 1080) return;
        hoverTimer = setTimeout(function () {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }, 180);
      });
    });
    document.addEventListener('click', function () { closeAllDropdowns(root); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeAllDropdowns(root); closeDrawer(); }
    });

    /* Mobile drawer */
    function openDrawer() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-visible');
      burger.classList.add('is-active');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('no-scroll');
    }
    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-visible');
      burger.classList.remove('is-active');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }
    burger.addEventListener('click', function () {
      drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });
    root.querySelector('.mobile-nav-close').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('.mobile-group-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.mobile-group').classList.toggle('is-open');
      });
    });

    /* Logout */
    root.querySelectorAll('[data-logout]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.AppStore.auth.logout();
        window.Toast.info('You have been signed out.', 'Signed out');
        setTimeout(function () { window.location.href = 'index.html'; }, 700);
      });
    });
  }

  function closeAllDropdowns(root) {
    root.querySelectorAll('.nav-item.is-open').forEach(function (i) {
      i.classList.remove('is-open');
      const t = i.querySelector('[aria-expanded]');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  /* ------------------------------------------------------------------
     Footer
     ------------------------------------------------------------------ */
  function renderFooter() {
    const root = document.getElementById('footer-root');
    if (!root) return;
    root.innerHTML =
      '<footer class="site-footer">' +
        '<div class="container">' +
          '<div class="footer-grid" data-aos-stagger>' +
            '<div class="footer-brand">' + brandHTML().replace('class="brand"', 'class="brand" style="color:#fff"') +
              '<p>Build, customize, and launch professional web applications with a powerful visual no-code platform. No code required.</p>' +
              '<div class="footer-social">' +
                '<a href="#" aria-label="Stackly on Twitter / X">' + I('twitter') + '</a>' +
                '<a href="#" aria-label="Stackly on LinkedIn">' + I('linkedin') + '</a>' +
                '<a href="#" aria-label="Stackly on GitHub">' + I('github') + '</a>' +
                '<a href="#" aria-label="Stackly on Dribbble">' + I('dribbble') + '</a>' +
                '<a href="#" aria-label="Stackly on YouTube">' + I('youtube') + '</a>' +
              '</div>' +
            '</div>' +
            col('Product', [
              ['Features', 'features.html'], ['App Builder', 'app-builder.html'],
              ['Templates', 'templates.html'], ['Integrations', 'integrations.html'],
              ['Pricing', 'pricing.html'], ['How It Works', 'how-it-works.html']
            ]) +
            col('Company', [
              ['About Us', 'about.html'], ['Careers', 'careers.html'],
              ['Blog', 'blog.html'], ['Contact', 'contact.html'], ['Solutions', 'solutions.html']
            ]) +
            col('Resources', [
              ['Resource Hub', 'resources.html'], ['Documentation', 'documentation.html'],
              ['FAQ', 'faq.html'], ['Community', 'resources.html'], ['Support', 'contact.html']
            ]) +
            col('Account', [
              ['Sign In', 'login.html'], ['Create Account', 'register.html'],
              ['Dashboard', 'dashboard.html'], ['My Projects', 'projects.html'], ['Billing', 'billing.html']
            ]) +
          '</div>' +
          '<div class="footer-bottom">' +
            '<p>© 2026 Stackly, Inc. All rights reserved. Build. Customize. Launch.</p>' +
            '<div class="footer-bottom-links">' +
              '<a href="faq.html">Privacy Policy</a><a href="faq.html">Terms of Service</a><a href="contact.html">Security</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  /* helpers */
  function col(title, links) {
    return '<div class="footer-col"><h4>' + title + '</h4><ul>' +
      links.map(function (l) { return '<li><a href="' + l[1] + '">' + l[0] + '</a></li>'; }).join('') +
      '</ul></div>';
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (n) { return n[0]; }).join('').toUpperCase();
  }
  function firstName(name) { return String(name || '').split(' ')[0]; }
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  window.AppChrome = { renderHeader: renderHeader, renderFooter: renderFooter, initials: initials };

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderFooter();
  });
})();

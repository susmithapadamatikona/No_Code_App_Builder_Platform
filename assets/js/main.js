/* ==========================================================================
   STACKLY — Global Behaviors
   Loader, back-to-top, icon injection, tabs, accordions, newsletter,
   generic delegated micro-interactions. Loaded on every page (defer).
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Page loader — Stackly logo splash, shown on EVERY page navigation
     ------------------------------------------------------------------ */
  function buildLoader() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML =
      '<div class="loader-inner">' +
        '<img src="assets/images/logo-stackly.webp" alt="Stackly" ' +
          'style="height:58px;width:auto;display:block;animation:loaderPulse 1.3s ease-in-out infinite;border-radius:0;box-shadow:none">' +
        '<div class="loader-bar"></div>' +
        '<div class="loader-text">Build &middot; Customize &middot; Launch</div>' +
      '</div>';
    return loader;
  }

  function initLoader() {
    if (document.querySelector('.page-loader')) return;
    const loader = buildLoader();
    document.body.appendChild(loader);
    const MIN_VISIBLE = 600; /* splash stays for at least 0.6s */
    const shownAt = performance.now();
    let hidden = false;
    const done = function () {
      if (hidden) return;
      hidden = true;
      const wait = Math.max(0, MIN_VISIBLE - (performance.now() - shownAt));
      setTimeout(function () {
        loader.classList.add('is-done');
        setTimeout(function () { loader.remove(); }, 550);
      }, wait);
    };
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done);
    /* Safety net — never trap the user behind the splash */
    setTimeout(done, 2500);
  }

  /* (Navigation splash intentionally shows only ONCE per page — on arrival.
     No outbound splash, so clicking a link never doubles it.) */

  /* ------------------------------------------------------------------
     Demo routing — the CTAs below intentionally lead to the 404 page.
     Runs in CAPTURE phase so it wins over modal/wishlist handlers.
     ------------------------------------------------------------------ */
  const DEMO_404_TEXTS = new Set([
    'start building free', 'explore templates', 'see the full process',
    'browse all templates', 'open the builder', 'for startups',
    'for ops teams', 'for agencies', 'get started', 'get started free',
    'start pro trial', 'contact sales', 'try the builder',
    'read the data docs', 'see connected apps', 'see conected apps',
    'see how it works', 'start from scratch', 'request a template',
    'choose business', 'talk to sales', 'start reading', 'browse the blog',
    'read the articles', 'open the docs', 'watch now', 'save a seat',
    'join the community', 'browse the templates', 'get answers',
    'explore the api', 'view all posts', 'read the story', 'apply',
    'apply now', 'about stackly', 'contact us', 'see open roles',
    'get in touch', 'browse the faq meanwhile', 'start a chat',
    'use', 'use template', 'forgot password?'
  ]);

  document.addEventListener('click', function (e) {
    /* template-card download counter counts as a demo link too */
    if (e.target.closest('.tpl-uses')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '404.html';
      return;
    }

    const el = e.target.closest('a, button');
    if (!el) return;

    const isSocial =
      el.closest('.footer-social') || el.closest('.team-social') ||
      el.closest('.share-row') || el.closest('.share-socials') ||
      el.classList.contains('social-icon-btn') || el.classList.contains('share-social');
    const isFooterLink =
      el.closest('.footer-col') || el.closest('.footer-bottom-links');

    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (isSocial || isFooterLink || DEMO_404_TEXTS.has(txt)) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '404.html';
    }
  }, true);

  /* ------------------------------------------------------------------
     Back to top
     ------------------------------------------------------------------ */
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = window.Icons.get('arrow-up');
    document.body.appendChild(btn);
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 480);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------------------
     Tabs — <div data-tabs> <button data-tab-target="#panelId">
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-tab-target]');
    if (!btn) return;
    const wrap = btn.closest('[data-tabs]') || document;
    const panel = document.querySelector(btn.getAttribute('data-tab-target'));
    wrap.querySelectorAll('[data-tab-target]').forEach(function (b) {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    if (panel) {
      const group = panel.parentElement;
      group.querySelectorAll(':scope > .tab-panel').forEach(function (p) {
        p.classList.toggle('is-active', p === panel);
      });
    }
  });

  /* ------------------------------------------------------------------
     Accordion — .accordion-item > .accordion-trigger
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('.accordion-trigger');
    if (!trigger) return;
    const item = trigger.closest('.accordion-item');
    const accordion = trigger.closest('.accordion');
    const isOpen = item.classList.contains('is-open');
    if (accordion && accordion.dataset.single !== 'false') {
      accordion.querySelectorAll('.accordion-item.is-open').forEach(function (i) {
        i.classList.remove('is-open');
        const t = i.querySelector('.accordion-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
    item.classList.toggle('is-open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });

  /* ------------------------------------------------------------------
     Newsletter — <form data-newsletter><input type="email"></form>
     ------------------------------------------------------------------ */
  document.addEventListener('submit', function (e) {
    const form = e.target.closest('[data-newsletter]');
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const email = input ? input.value.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      window.Toast.error('Please enter a valid email address.', 'Invalid email');
      if (input) input.focus();
      return;
    }
    const list = window.AppStore.read('newsletter', []);
    if (list.indexOf(email.toLowerCase()) !== -1) {
      window.Toast.info('You are already subscribed with this email.', 'Already subscribed');
      return;
    }
    list.push(email.toLowerCase());
    window.AppStore.write('newsletter', list);
    form.reset();
    window.Toast.success('Welcome aboard! Check your inbox for a confirmation.', 'Subscribed');
  });

  /* ------------------------------------------------------------------
     Generic demo actions — [data-demo-toast="message"]
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-demo-toast]');
    if (!el) return;
    e.preventDefault();
    window.Toast.info(el.getAttribute('data-demo-toast') || 'This is a demo interaction.', 'Demo');
  });

  /* ------------------------------------------------------------------
     Smooth-scroll for same-page anchors
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initBackToTop();
    window.Icons.inject();
  });
})();

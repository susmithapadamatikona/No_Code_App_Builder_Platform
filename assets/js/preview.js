/* ==========================================================================
   STACKLY — Builder Preview, Share & Publish (app-builder.html)
   window.BuilderPreview = { open, close, share, publish }
   Renders a clean (chrome-free) version of the current page, with device
   switching, staggered entrance animations, Esc-to-exit, and the share /
   publish flows used by both the toolbar and the preview bar.
   ========================================================================== */

(function () {
  'use strict';

  if (!window.AppStore) return;

  function core() { return window.BuilderCore; }
  function C() { return window.BuilderComponents; }

  function slug(name) {
    return String(name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function shareURL() {
    var p = core().state.project;
    return 'https://appflow.site/p/' + slug(p.name) + '-' + String(p.id).slice(-4);
  }

  /* ------------------------------------------------------------------
     Preview mode
     ------------------------------------------------------------------ */

  function renderPreviewPage() {
    var page = document.getElementById('preview-page');
    var list = core().components();
    var B = window.BuilderStyle;

    if (!list.length) {
      page.innerHTML = '<div style="display:grid;place-content:center;justify-items:center;gap:12px;min-height:600px;color:#94A3B8;text-align:center;padding:40px">' +
        window.Icons.get('layers') +
        '<strong style="color:#64748B;font-family:\'Plus Jakarta Sans\',sans-serif">Nothing to preview yet</strong>' +
        '<p style="font-size:0.85rem;max-width:280px">Add components to "' + C().escapeHtml(core().currentPage().name) + '" and they will show up here.</p></div>';
      return;
    }

    page.innerHTML = list.map(function (comp, i) {
      var cls = 'pv-el';
      if (comp.props.hideM) cls += ' hide-mobile';
      if (comp.props.hideT) cls += ' hide-tablet';
      var anim = comp.props.anim && comp.props.anim !== 'none' ? 'anim-' + comp.props.anim : '';
      var style = B.elStyle(comp.props) + (anim ? 'animation-delay:' + (i * 90) + 'ms;' : '');
      return '<div class="' + cls + ' ' + anim + '" style="' + style + '">' +
        '<div style="' + B.boxStyle(comp.props) + '">' + C().render(comp.type, comp.props) + '</div></div>';
    }).join('');
  }

  function open() {
    renderPreviewPage();
    document.getElementById('pv-url').textContent = shareURL().replace('https://', '');
    document.body.classList.add('is-previewing');
    document.querySelector('.preview-shell').setAttribute('aria-hidden', 'false');
  }

  function close() {
    document.body.classList.remove('is-previewing');
    document.querySelector('.preview-shell').setAttribute('aria-hidden', 'true');
  }

  function setPreviewDevice(device) {
    var frame = document.getElementById('preview-frame');
    frame.classList.remove('device-tablet', 'device-mobile');
    if (device === 'tablet') frame.classList.add('device-tablet');
    if (device === 'mobile') frame.classList.add('device-mobile');
    document.querySelectorAll('#pv-device-seg [data-pv-device]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.pvDevice === device);
    });
  }

  /* ------------------------------------------------------------------
     Share
     ------------------------------------------------------------------ */

  function share() {
    var p = core().state.project;
    var url = shareURL();
    var backdrop = window.Modal.custom({
      title: 'Share "' + p.name + '"',
      bodyHTML:
        '<p class="text-sm" style="margin-bottom:6px">Anyone with the link can view the ' +
          (p.status === 'published' ? 'live app' : 'latest preview') + '.</p>' +
        '<div class="share-url-row">' +
          '<input id="bs-url" readonly value="' + url + '" aria-label="Share link">' +
          '<button class="btn btn-secondary" type="button" data-bs-copy style="flex-shrink:0">' + window.Icons.get('copy') + ' Copy</button>' +
        '</div>' +
        '<p class="text-xs" style="color:var(--text-muted);margin-bottom:10px">Or share directly:</p>' +
        '<div class="share-socials">' +
          '<button class="share-social" type="button" data-bs-social="Twitter / X" aria-label="Share on Twitter">' + window.Icons.get('twitter') + '</button>' +
          '<button class="share-social" type="button" data-bs-social="LinkedIn" aria-label="Share on LinkedIn">' + window.Icons.get('linkedin') + '</button>' +
          '<button class="share-social" type="button" data-bs-social="Email" aria-label="Share by email">' + window.Icons.get('mail') + '</button>' +
        '</div>',
      footHTML: '<button class="btn btn-primary" type="button" data-modal-close>Done</button>'
    });

    backdrop.querySelector('[data-bs-copy]').addEventListener('click', function () {
      var input = backdrop.querySelector('#bs-url');
      input.select();
      var copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(input.value);
        copied = true;
      } else {
        try { copied = document.execCommand('copy'); } catch (e) { /* noop */ }
      }
      window.Toast[copied ? 'success' : 'info'](copied ? 'Share link copied to clipboard.' : 'Select the link and copy it manually.', 'Share');
    });
    backdrop.querySelectorAll('[data-bs-social]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.Toast.info('Sharing to ' + btn.dataset.bsSocial + ' is simulated in this demo.', 'Share');
      });
    });
  }

  /* ------------------------------------------------------------------
     Publish
     ------------------------------------------------------------------ */

  function publish(btn) {
    var p = core().state.project;
    if (btn) btn.classList.add('is-loading');
    core().persist(false);

    setTimeout(function () {
      if (btn) btn.classList.remove('is-loading');
      var domain = slug(p.name) + '.appflow.site';
      core().state.project = AppStore.updateProject(p.id, { status: 'published', domain: domain }) || p;
      core().setStatusBadge();
      AppStore.logActivity({ type: 'publish', text: 'Published "' + p.name + '" to ' + domain, icon: 'rocket' });
      window.Toast.success('"' + p.name + '" is live at ' + domain + ' (demo).', 'Published 🎉');
    }, 1200);
  }

  /* ------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', function () {
    var back = document.getElementById('pv-back');
    if (!back) return;
    back.addEventListener('click', close);
    document.getElementById('pv-publish').addEventListener('click', function () { publish(this); });
    document.querySelectorAll('#pv-device-seg [data-pv-device]').forEach(function (btn) {
      btn.addEventListener('click', function () { setPreviewDevice(btn.dataset.pvDevice); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('is-previewing')) close();
    });
  });

  window.BuilderPreview = { open: open, close: close, share: share, publish: publish };
})();

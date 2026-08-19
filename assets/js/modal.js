/* ==========================================================================
   STACKLY — Modal System
   1) Declarative: <button data-modal-open="#myModal">, markup on page:
      <div class="modal-backdrop" id="myModal"><div class="modal">...</div></div>
   2) Programmatic:
      Modal.open('#id') / Modal.close('#id' | element)
      Modal.confirm({title, message, okText, danger, onConfirm})
      Modal.custom({title, bodyHTML, footHTML, size})  -> returns backdrop el
   ========================================================================== */

(function () {
  'use strict';

  let lastFocus = null;

  function resolve(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    return target.closest ? (target.classList.contains('modal-backdrop') ? target : target.closest('.modal-backdrop')) : null;
  }

  function open(target) {
    const backdrop = resolve(target);
    if (!backdrop) return;
    lastFocus = document.activeElement;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const focusable = backdrop.querySelector('button, [href], input, select, textarea');
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
  }

  function close(target) {
    const backdrop = resolve(target) || document.querySelector('.modal-backdrop.is-open');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-backdrop.is-open')) {
      document.body.classList.remove('no-scroll');
    }
    if (backdrop.dataset.ephemeral === 'true') {
      setTimeout(function () { backdrop.remove(); }, 350);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function custom(opts) {
    opts = opts || {};
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.dataset.ephemeral = 'true';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.innerHTML =
      '<div class="modal ' + (opts.size === 'lg' ? 'modal-lg' : opts.size === 'sm' ? 'modal-sm' : '') + '">' +
        '<div class="modal-header">' +
          '<h3></h3>' +
          '<button class="modal-close" type="button" aria-label="Close dialog">' + window.Icons.get('x') + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (opts.bodyHTML || '') + '</div>' +
        (opts.footHTML ? '<div class="modal-footer">' + opts.footHTML + '</div>' : '') +
      '</div>';
    backdrop.querySelector('.modal-header h3').textContent = opts.title || '';
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () { open(backdrop); });
    return backdrop;
  }

  function confirm(opts) {
    opts = opts || {};
    const backdrop = custom({
      title: opts.title || 'Are you sure?',
      size: 'sm',
      bodyHTML: '<p class="confirm-msg"></p>',
      footHTML:
        '<button class="btn btn-secondary" type="button" data-modal-close>' + (opts.cancelText || 'Cancel') + '</button>' +
        '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-confirm-ok>' + (opts.okText || 'Confirm') + '</button>'
    });
    backdrop.querySelector('.confirm-msg').textContent = opts.message || 'This action cannot be undone.';
    backdrop.querySelector('[data-confirm-ok]').addEventListener('click', function () {
      close(backdrop);
      if (typeof opts.onConfirm === 'function') opts.onConfirm();
    });
    return backdrop;
  }

  /* Global delegation */
  document.addEventListener('click', function (e) {
    const opener = e.target.closest('[data-modal-open]');
    if (opener) {
      e.preventDefault();
      open(opener.getAttribute('data-modal-open'));
      return;
    }
    if (e.target.closest('[data-modal-close]') || e.target.closest('.modal-close')) {
      close(e.target.closest('.modal-backdrop'));
      return;
    }
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      close(e.target);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  window.Modal = { open: open, close: close, confirm: confirm, custom: custom };
})();

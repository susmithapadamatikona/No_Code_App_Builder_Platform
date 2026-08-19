/* ==========================================================================
   STACKLY — Toast Notifications
   Toast.show(message, type?, title?, duration?)
   Toast.success/error/warning/info(message, title?)
   ========================================================================== */

(function () {
  'use strict';

  const TYPE_META = {
    success: { icon: 'check-circle', title: 'Success' },
    error: { icon: 'alert-circle', title: 'Error' },
    warning: { icon: 'alert-triangle', title: 'Warning' },
    info: { icon: 'info', title: 'Heads up' }
  };

  function container() {
    let el = document.querySelector('.toast-container');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-container';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function show(message, type, title, duration) {
    type = TYPE_META[type] ? type : 'info';
    duration = duration || 4200;
    const meta = TYPE_META[type];

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<div class="toast-icon">' + window.Icons.get(meta.icon) + '</div>' +
      '<div class="toast-content">' +
        '<div class="toast-title"></div>' +
        '<div class="toast-msg"></div>' +
      '</div>' +
      '<button class="toast-dismiss" type="button" aria-label="Dismiss notification">' + window.Icons.get('x') + '</button>' +
      '<div class="toast-progress" style="animation-duration:' + duration + 'ms"></div>';

    toast.querySelector('.toast-title').textContent = title || meta.title;
    toast.querySelector('.toast-msg').textContent = message;

    container().appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    });

    let timer = setTimeout(dismiss, duration);
    function dismiss() {
      clearTimeout(timer);
      toast.classList.add('is-leaving');
      setTimeout(function () { toast.remove(); }, 350);
    }
    toast.querySelector('.toast-dismiss').addEventListener('click', dismiss);
    toast.addEventListener('mouseenter', function () { clearTimeout(timer); });
    toast.addEventListener('mouseleave', function () { timer = setTimeout(dismiss, 1800); });

    return { dismiss: dismiss };
  }

  window.Toast = {
    show: show,
    success(msg, title) { return show(msg, 'success', title); },
    error(msg, title) { return show(msg, 'error', title); },
    warning(msg, title) { return show(msg, 'warning', title); },
    info(msg, title) { return show(msg, 'info', title); }
  };
})();

/* ==========================================================================
   STACKLY — LiveSearch (tiny debounced search binder)
   Usage: LiveSearch.bind(inputEl, function (query) { ... }, 250);
   Fires the callback with the trimmed input value after the user stops
   typing, and immediately on Enter / clear. Reusable on any page.
   ========================================================================== */

(function () {
  'use strict';

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function bind(inputEl, callback, debounceMs) {
    if (!inputEl || typeof callback !== 'function') return null;
    const wait = typeof debounceMs === 'number' ? debounceMs : 250;
    const fire = function () { callback(inputEl.value.trim()); };
    const debounced = debounce(fire, wait);

    inputEl.addEventListener('input', debounced);
    /* Instant feedback on Enter and on the native "clear" of type=search */
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); fire(); }
    });
    inputEl.addEventListener('search', fire);

    return { fire: fire };
  }

  window.LiveSearch = { bind: bind, debounce: debounce };
})();

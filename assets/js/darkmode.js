/* ==========================================================================
   STACKLY — Theme (dark mode only)
   The site ships with a single dark theme. Loaded early (in <head>, no
   defer) so pages paint dark immediately. The old ThemeMode API surface is
   kept as a no-op so existing callers never break.
   ========================================================================== */

(function () {
  'use strict';

  document.documentElement.setAttribute('data-theme', 'dark');

  /* clear any previously stored light-mode preference */
  try { localStorage.setItem('appflow_theme', 'dark'); } catch (e) { /* ignore */ }

  window.ThemeMode = {
    current() { return 'dark'; },
    set() {
      /* dark-only build — always dark */
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };
})();

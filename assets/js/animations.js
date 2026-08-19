/* ==========================================================================
   STACKLY — AOS (Animate-On-Scroll) Engine + Counters, Bars, Parallax
   Native AOS implementation (no external library, works offline).

   Markup:
     data-aos="fade-up|fade-down|fade-left|fade-right|fade|fade-up-right|
               fade-up-left|zoom-in|zoom-in-up|zoom-out|slide-up|slide-left|
               slide-right|flip-up|flip-down|flip-left|flip-right"
     data-aos-delay="150"      (ms)
     data-aos-duration="900"   (ms)
     data-aos-once="false"     (re-animate every time it enters the viewport)
     data-aos-stagger          (parent: reveal children in sequence)

   Legacy attributes are auto-converted:
     data-reveal="up|down|left|right|zoom"  ->  data-aos equivalents
     data-aos-stagger                    ->  data-aos-stagger

   Also here: [data-counter] animated counters, .progress-bar[data-value]
   fills, and [data-parallax] drift.
   ========================================================================== */

(function () {
  'use strict';

  var LEGACY_MAP = {
    up: 'fade-up',
    down: 'fade-down',
    left: 'fade-right',   /* legacy "left" started offset to the left  */
    right: 'fade-left',   /* legacy "right" started offset to the right */
    zoom: 'zoom-in'
  };

  function convertLegacy(scope) {
    (scope || document).querySelectorAll('[data-reveal]').forEach(function (el) {
      if (!el.hasAttribute('data-aos')) {
        el.setAttribute('data-aos', LEGACY_MAP[el.getAttribute('data-reveal')] || 'fade-up');
      }
      el.removeAttribute('data-reveal');
    });
    (scope || document).querySelectorAll('[data-aos-stagger]').forEach(function (el) {
      el.setAttribute('data-aos-stagger', '');
      el.removeAttribute('data-aos-stagger');
    });
  }

  /* ------------------------------------------------------------------
     AOS core
     ------------------------------------------------------------------ */

  var io = null;

  function prep(el) {
    var delay = parseInt(el.getAttribute('data-aos-delay') || '0', 10);
    var duration = parseInt(el.getAttribute('data-aos-duration') || '0', 10);
    if (delay) el.style.setProperty('--aos-delay', (delay / 1000) + 's');
    if (duration) el.style.setProperty('--aos-duration', (duration / 1000) + 's');
  }

  function observer() {
    if (io) return io;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('aos-animate');
          if (el.getAttribute('data-aos-once') !== 'false') {
            io.unobserve(el);
            /* release the element once its entrance finishes so hover
               transforms / component transitions take over untouched */
            var delay = parseInt(el.getAttribute('data-aos-delay') || '0', 10);
            var duration = parseInt(el.getAttribute('data-aos-duration') || '800', 10);
            var total = el.hasAttribute('data-aos-stagger')
              ? 1750
              : delay + duration + 120;
            setTimeout(function () { el.classList.add('aos-done'); }, total);
          }
        } else if (el.getAttribute('data-aos-once') === 'false') {
          el.classList.remove('aos-animate');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    return io;
  }

  function initAOS(scope) {
    convertLegacy(scope);
    var targets = (scope || document).querySelectorAll('[data-aos]:not(.aos-animate), [data-aos-stagger]:not(.aos-animate)');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('aos-animate', 'aos-done'); });
      return;
    }
    var obs = observer();
    targets.forEach(function (t) {
      if (t.hasAttribute('data-aos')) prep(t);
      /* elements already in view on load animate immediately */
      obs.observe(t);
    });
  }

  /* ------------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------------ */

  function animateCounter(el) {
    var target = parseFloat(el.dataset.counter || '0');
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var decimals = (String(el.dataset.counter).split('.')[1] || '').length;
    var duration = parseInt(el.dataset.duration || '1800', 10);
    var start = performance.now();

    function frame(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + format(val, decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function format(n, decimals) {
    if (decimals > 0) return n.toFixed(decimals);
    return Math.round(n).toLocaleString('en-US');
  }

  function initCounters(scope) {
    var counters = (scope || document).querySelectorAll('[data-counter]:not([data-counted])');
    if (!counters.length) return;
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          entry.target.setAttribute('data-counted', '1');
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ------------------------------------------------------------------
     Progress bars
     ------------------------------------------------------------------ */

  function initProgressBars(scope) {
    var bars = (scope || document).querySelectorAll('.progress-bar[data-value]');
    if (!bars.length) return;
    var run = function (bar) {
      requestAnimationFrame(function () {
        bar.style.width = Math.min(100, parseFloat(bar.dataset.value || '0')) + '%';
      });
    };
    if (!('IntersectionObserver' in window)) {
      bars.forEach(run);
      return;
    }
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          pio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(function (b) { pio.observe(b); });
  }

  /* ------------------------------------------------------------------
     Parallax — [data-parallax="0.2"]
     ------------------------------------------------------------------ */

  function initParallax() {
    var els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      els.forEach(function (el) {
        var speed = parseFloat(el.dataset.parallax || '0.15');
        el.style.transform = 'translateY(' + (y * speed * -1) + 'px)';
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Public API (refreshReveal kept for existing callers)
     ------------------------------------------------------------------ */

  window.AppAnimations = {
    init: function () {
      initAOS();
      initCounters();
      initProgressBars();
      initParallax();
    },
    refresh: function (scope) {
      initAOS(scope);
      initCounters(scope);
      initProgressBars(scope);
    },
    refreshReveal: function (scope) { initAOS(scope); },
    counters: initCounters
  };

  /* AOS-compatible global, in case anything calls the library API */
  window.AOS = {
    init: function () { window.AppAnimations.init(); },
    refresh: function () { window.AppAnimations.refresh(); },
    refreshHard: function () { window.AppAnimations.refresh(); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.AppAnimations.init();
  });
})();

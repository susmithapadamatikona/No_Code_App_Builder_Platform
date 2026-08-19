/* ==========================================================================
   STACKLY — Template Marketplace controller (templates.html)
   Builds the filter sidebar from live data, wires LiveSearch + Filters,
   renders the grid via TemplateCards.render with client-side pagination.
   Reads ?category=X to preselect, persists state to sessionStorage.
   ========================================================================== */

(function () {
  'use strict';

  const PER_PAGE = 9;
  const STATE_KEY = 'appflow_market_state';

  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('market-grid');
    if (!grid || !window.AppStore || !window.Filters || !window.TemplateCards) return;

    const templates = window.AppStore.getTemplates();
    const catFacets = window.Filters.facets(templates, 'category');
    const indFacets = window.Filters.facets(templates, 'industry');

    const els = {
      grid: grid,
      pills: document.getElementById('market-pills'),
      cats: document.getElementById('filter-categories'),
      inds: document.getElementById('filter-industries'),
      favs: document.getElementById('filter-favs'),
      clear: document.getElementById('filter-clear'),
      search: document.getElementById('market-search'),
      sort: document.getElementById('market-sort'),
      count: document.getElementById('market-count'),
      pagination: document.getElementById('market-pagination'),
      headerCount: document.getElementById('market-header-count'),
      toolbar: document.getElementById('market-toolbar')
    };

    let state = loadState();

    /* ?category=X preselect (case-insensitive) wins over saved state */
    const urlCat = new URLSearchParams(window.location.search).get('category');
    if (urlCat) {
      const match = catFacets.find(function (f) {
        return f.value.toLowerCase() === urlCat.toLowerCase();
      });
      if (match) {
        state.categories = [match.value];
        state.page = 1;
      }
    }

    if (els.headerCount) els.headerCount.textContent = String(templates.length);

    buildSidebar();
    buildPills();
    restoreControls();
    wireEvents();

    /* Skeleton cards for 400ms on first load, then render */
    renderSkeleton();
    setTimeout(refresh, 400);

    /* ------------------------------------------------------------------
       State persistence
       ------------------------------------------------------------------ */
    function loadState() {
      const base = window.Filters.defaults();
      try {
        const raw = sessionStorage.getItem(STATE_KEY);
        if (raw) return Object.assign(base, JSON.parse(raw));
      } catch (e) { /* ignore corrupt state */ }
      return base;
    }

    function saveState() {
      try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    /* ------------------------------------------------------------------
       Sidebar + pills construction (from data)
       ------------------------------------------------------------------ */
    function checkboxRow(facet, attr) {
      return '<label class="checkbox">' +
        '<input type="checkbox" value="' + facet.value + '" ' + attr + '>' +
        '<span class="checkbox-box"><i data-icon="check"></i></span>' +
        '<span>' + facet.value + '</span>' +
        '<span class="filter-count">' + facet.count + '</span>' +
        '</label>';
    }

    function buildSidebar() {
      if (els.cats) {
        els.cats.innerHTML = catFacets.map(function (f) { return checkboxRow(f, 'data-filter-cat'); }).join('');
      }
      if (els.inds) {
        els.inds.innerHTML = indFacets.map(function (f) { return checkboxRow(f, 'data-filter-ind'); }).join('');
      }
      window.Icons.inject(els.cats);
      window.Icons.inject(els.inds);
    }

    function buildPills() {
      if (!els.pills) return;
      let html = '<button class="cat-pill" type="button" data-pill="">All templates</button>';
      html += catFacets.map(function (f) {
        return '<button class="cat-pill" type="button" data-pill="' + f.value + '">' + f.value + '</button>';
      }).join('');
      els.pills.innerHTML = html;
    }

    function syncPills() {
      if (!els.pills) return;
      const single = state.categories.length === 1 ? state.categories[0] : (state.categories.length === 0 ? '' : null);
      els.pills.querySelectorAll('[data-pill]').forEach(function (pill) {
        pill.classList.toggle('is-active', single !== null && pill.getAttribute('data-pill') === single);
      });
    }

    function syncCheckboxes() {
      document.querySelectorAll('[data-filter-cat]').forEach(function (cb) {
        cb.checked = state.categories.indexOf(cb.value) !== -1;
      });
      document.querySelectorAll('[data-filter-ind]').forEach(function (cb) {
        cb.checked = state.industries.indexOf(cb.value) !== -1;
      });
    }

    function restoreControls() {
      syncCheckboxes();
      syncPills();
      document.querySelectorAll('input[name="price-filter"]').forEach(function (r) {
        r.checked = r.value === state.price;
      });
      if (els.favs) els.favs.checked = !!state.favsOnly;
      if (els.search) els.search.value = state.query;
      if (els.sort) els.sort.value = state.sort;
    }

    /* ------------------------------------------------------------------
       Events
       ------------------------------------------------------------------ */
    function wireEvents() {
      if (els.search && window.LiveSearch) {
        window.LiveSearch.bind(els.search, function (q) {
          if (q === state.query) return;
          state.query = q;
          state.page = 1;
          refresh();
        }, 250);
      }

      if (els.sort) {
        els.sort.addEventListener('change', function () {
          state.sort = els.sort.value;
          state.page = 1;
          refresh();
        });
      }

      document.addEventListener('change', function (e) {
        if (e.target.matches('[data-filter-cat]')) {
          state.categories = values('[data-filter-cat]:checked');
          state.page = 1;
          syncPills();
          refresh();
        } else if (e.target.matches('[data-filter-ind]')) {
          state.industries = values('[data-filter-ind]:checked');
          state.page = 1;
          refresh();
        } else if (e.target.matches('input[name="price-filter"]')) {
          state.price = e.target.value;
          state.page = 1;
          refresh();
        } else if (e.target === els.favs) {
          state.favsOnly = els.favs.checked;
          state.page = 1;
          refresh();
        }
      });

      if (els.clear) els.clear.addEventListener('click', clearAll);

      /* Empty-state reset button (rendered dynamically) */
      els.grid.addEventListener('click', function (e) {
        if (e.target.closest('[data-reset-filters]')) clearAll();
      });

      if (els.pills) {
        els.pills.addEventListener('click', function (e) {
          const pill = e.target.closest('[data-pill]');
          if (!pill) return;
          const cat = pill.getAttribute('data-pill');
          state.categories = cat ? [cat] : [];
          state.page = 1;
          syncCheckboxes();
          syncPills();
          refresh();
        });
      }

      /* Keep the grid honest when hearts are toggled anywhere on the page */
      document.addEventListener('favoriteschange', function () {
        if (state.favsOnly) refresh();
      });
    }

    function values(selector) {
      return Array.prototype.map.call(document.querySelectorAll(selector), function (el) {
        return el.value;
      });
    }

    function clearAll() {
      const sort = state.sort; /* sorting is a view preference, keep it */
      state = window.Filters.defaults();
      state.sort = sort;
      restoreControls();
      refresh();
      if (window.Toast) window.Toast.info('All filters cleared.', 'Filters');
    }

    /* ------------------------------------------------------------------
       Rendering
       ------------------------------------------------------------------ */
    function renderSkeleton() {
      let html = '';
      for (let i = 0; i < PER_PAGE; i++) {
        html += '<div class="card" aria-hidden="true">' +
          '<div class="skeleton skeleton-thumb"></div>' +
          '<div class="skeleton skeleton-title"></div>' +
          '<div class="skeleton skeleton-text"></div>' +
          '<div class="skeleton skeleton-text" style="width:65%"></div>' +
          '</div>';
      }
      els.grid.innerHTML = html;
      if (els.count) els.count.innerHTML = 'Loading templates…';
    }

    function refresh(opts) {
      opts = opts || {};
      const filtered = window.Filters.apply(templates, state);
      const pg = window.Filters.paginate(filtered, state.page, PER_PAGE);
      state.page = pg.page;
      saveState();

      if (els.count) {
        els.count.innerHTML = 'Showing <b>' + pg.items.length + '</b> of <b>' +
          filtered.length + '</b> template' + (filtered.length === 1 ? '' : 's');
      }

      if (!filtered.length) {
        els.grid.innerHTML =
          '<div class="empty-state" style="grid-column:1/-1">' +
            '<span class="empty-icon"><i data-icon="search"></i></span>' +
            '<h3>No templates match your filters</h3>' +
            '<p>Try a different search term, or clear your filters to browse the full marketplace again.</p>' +
            '<button class="btn btn-primary" type="button" data-reset-filters><i data-icon="undo"></i> Reset all filters</button>' +
          '</div>';
        els.pagination.innerHTML = '';
        els.pagination.hidden = true;
      } else {
        els.grid.innerHTML = pg.items.map(window.TemplateCards.render).join('');
        renderPagination(pg);
      }

      window.Icons.inject(els.grid);
      window.Icons.inject(els.pagination);
      if (window.AppAnimations) window.AppAnimations.refreshReveal();

      if (opts.scroll && els.toolbar) {
        const top = els.toolbar.getBoundingClientRect().top + window.pageYOffset - 96;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }

    function renderPagination(pg) {
      els.pagination.hidden = pg.totalPages <= 1;
      if (pg.totalPages <= 1) { els.pagination.innerHTML = ''; return; }

      let html = '<button class="page-btn" type="button" data-page="' + (pg.page - 1) + '" ' +
        (pg.page === 1 ? 'disabled' : '') + ' aria-label="Previous page"><i data-icon="chevron-left"></i></button>';
      for (let p = 1; p <= pg.totalPages; p++) {
        html += '<button class="page-btn' + (p === pg.page ? ' is-active' : '') + '" type="button" data-page="' + p + '"' +
          (p === pg.page ? ' aria-current="page"' : '') + '>' + p + '</button>';
      }
      html += '<button class="page-btn" type="button" data-page="' + (pg.page + 1) + '" ' +
        (pg.page === pg.totalPages ? 'disabled' : '') + ' aria-label="Next page"><i data-icon="chevron-right"></i></button>';
      els.pagination.innerHTML = html;

      els.pagination.querySelectorAll('[data-page]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const target = parseInt(btn.getAttribute('data-page'), 10);
          if (btn.disabled || target === state.page) return;
          state.page = target;
          refresh({ scroll: true });
        });
      });
    }
  });
})();

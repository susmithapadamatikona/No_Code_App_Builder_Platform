/* ==========================================================================
   STACKLY — Filters (pure filter / sort / paginate helpers)
   State shape:
     { query:'', categories:[], industries:[], price:'all'|'free'|'premium',
       favsOnly:false, sort:'popular'|'rated'|'newest'|'price-asc'|'price-desc',
       page:1 }
   Filters.apply(templates, state)          -> filtered + sorted array
   Filters.paginate(list, page, perPage)    -> { items, page, totalPages, total }
   All functions are pure — no DOM, no side effects.
   ========================================================================== */

(function () {
  'use strict';

  function defaults() {
    return {
      query: '',
      categories: [],
      industries: [],
      price: 'all',
      favsOnly: false,
      sort: 'popular',
      page: 1
    };
  }

  function matchesQuery(tpl, q) {
    if (!q) return true;
    const hay = (tpl.name + ' ' + tpl.desc + ' ' + (tpl.tags || []).join(' ')).toLowerCase();
    return q.split(/\s+/).every(function (word) { return hay.indexOf(word) !== -1; });
  }

  const SORTERS = {
    popular: function (a, b) { return b.uses - a.uses; },
    rated: function (a, b) { return (b.rating - a.rating) || (b.reviews - a.reviews); },
    'price-asc': function (a, b) { return a.price - b.price; },
    'price-desc': function (a, b) { return b.price - a.price; }
    /* 'newest' keeps the seed order (templates are stored newest-first) */
  };

  function apply(templates, state) {
    state = Object.assign(defaults(), state || {});
    const q = String(state.query || '').trim().toLowerCase();
    const favs = state.favsOnly
      ? (Array.isArray(state.favorites) ? state.favorites
        : (window.AppStore ? window.AppStore.getFavorites() : []))
      : null;

    let list = (templates || []).filter(function (tpl) {
      if (!matchesQuery(tpl, q)) return false;
      if (state.categories.length && state.categories.indexOf(tpl.category) === -1) return false;
      if (state.industries.length && state.industries.indexOf(tpl.industry) === -1) return false;
      if (state.price !== 'all' && tpl.tier !== state.price) return false;
      if (favs && favs.indexOf(tpl.id) === -1) return false;
      return true;
    });

    const sorter = SORTERS[state.sort];
    if (sorter) list = list.slice().sort(sorter);
    return list;
  }

  function paginate(list, page, perPage) {
    list = list || [];
    perPage = perPage || 6;
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    const current = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
    const start = (current - 1) * perPage;
    return {
      items: list.slice(start, start + perPage),
      page: current,
      totalPages: totalPages,
      total: list.length
    };
  }

  /* Distinct values of a field with counts: [{value:'CRM', count:3}, …] */
  function facets(templates, field) {
    const map = {};
    (templates || []).forEach(function (tpl) {
      const v = tpl[field];
      if (v == null) return;
      map[v] = (map[v] || 0) + 1;
    });
    return Object.keys(map).sort().map(function (v) {
      return { value: v, count: map[v] };
    });
  }

  window.Filters = { defaults: defaults, apply: apply, paginate: paginate, facets: facets };
})();

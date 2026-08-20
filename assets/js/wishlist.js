/* ==========================================================================
   STACKLY — Wishlist / Favorites + Shared Template Card Renderer
   window.TemplateCards.render(tpl) -> card HTML (used on home, templates,
   template-details related section). Favorite toggling is delegated
   globally: any [data-fav="templateId"] button works on any page.
   ========================================================================== */

(function () {
  'use strict';

  /* Real HD photo per category, layered over illustrated-screenshot fallback */
  const CATEGORY_PHOTOS = {
    'CRM': 'photo-1552664730-d307ca884978',          /* sales team at whiteboard */
    'E-Commerce': 'photo-1441986300917-64674bd600d8', /* boutique storefront */
    'Healthcare': 'photo-1576091160399-112ba8d25d1d', /* doctor with tablet */
    'Education': 'photo-1523240795612-9a054b0db644',  /* students studying */
    'Finance': 'photo-1554224155-6726b3ff858f',       /* finance desk */
    'Real Estate': 'photo-1560518883-ce09059eeffa',   /* modern home */
    'Restaurant': 'photo-1517248135467-4c7edcad34c4', /* restaurant interior */
    'Booking': 'photo-1506784983877-45594efa4cbe',    /* planner & calendar */
    'Events': 'photo-1492684223066-81342ee5ff30',     /* live event crowd */
    'Portfolio': 'photo-1561070791-2526d30994b5',     /* designer workspace */
    'Productivity': 'photo-1484480974693-6ca0a78fb36b', /* organized desk */
    'HR': 'photo-1521737711867-e3b97375f902',         /* team celebration */
    'Marketing': 'photo-1557804506-669a67965ba0',     /* marketing review */
    'SaaS': 'photo-1498050108023-c5249f4df085',       /* laptop with code */
    'Dashboard': 'photo-1460925895917-afdab827c52f',  /* analytics laptop */
    'Business': 'photo-1486406146926-c627a92ad1ab'    /* corporate offices */
  };

  function thumbArt(tpl) {
    let html = '';
    if (window.Artwork) {
      html += '<span class="tpl-thumb-art" aria-hidden="true">' +
        window.Artwork.forCategory(tpl.category, tpl.gradient) + '</span>';
    }
    const photo = CATEGORY_PHOTOS[tpl.category];
    if (photo) {
      html += '<img class="pic-photo" src="assets/images/photos/' + photo +
        '-800x500.webp" alt="" loading="lazy" onerror="this.remove()">';
    }
    return html;
  }

  function starRow(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += '<i data-icon="' + (i <= Math.round(rating) ? 'star' : 'star-o') + '"' +
        (i > Math.round(rating) ? ' class="star-empty"' : '') + '></i>';
    }
    return html;
  }

  function formatUses(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  }

  function render(tpl) {
    const fav = window.AppStore.isFavorite(tpl.id);
    return '' +
    '<article class="tpl-card card card-hover" data-template-id="' + tpl.id + '">' +
      '<div class="tpl-thumb" style="background:linear-gradient(135deg,' + tpl.gradient[0] + ',' + tpl.gradient[1] + ')">' +
        thumbArt(tpl) +
        '<span class="badge ' + (tpl.tier === 'premium' ? 'badge-gradient' : 'badge-success') + ' tpl-tier">' +
          (tpl.tier === 'premium' ? 'Premium · $' + tpl.price : 'Free') + '</span>' +
        '<button class="tpl-fav' + (fav ? ' is-active' : '') + '" type="button" data-fav="' + tpl.id + '" ' +
          'aria-label="' + (fav ? 'Remove from' : 'Add to') + ' favorites" aria-pressed="' + fav + '">' +
          '<i data-icon="heart"></i></button>' +
        '<div class="tpl-thumb-actions">' +
          '<a class="btn btn-white btn-sm" href="template-details.html?id=' + tpl.id + '"><i data-icon="eye"></i> Preview</a>' +
          '<button class="btn btn-primary btn-sm" type="button" data-use-template="' + tpl.id + '"><i data-icon="zap"></i> Use Template</button>' +
        '</div>' +
      '</div>' +
      '<div class="tpl-body">' +
        '<div class="tpl-title-row">' +
          '<h3><a href="template-details.html?id=' + tpl.id + '">' + tpl.name + '</a></h3>' +
          '<span class="badge badge-neutral">' + tpl.category + '</span>' +
        '</div>' +
        '<p class="tpl-desc">' + tpl.desc + '</p>' +
        '<div class="tpl-meta">' +
          '<span class="stars" aria-label="Rated ' + tpl.rating + ' out of 5">' + starRow(tpl.rating) + '</span>' +
          '<span class="tpl-rating">' + tpl.rating.toFixed(1) + ' <span>(' + tpl.reviews + ')</span></span>' +
          '<span class="tpl-uses"><i data-icon="download"></i> ' + formatUses(tpl.uses) + ' uses</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* Favorite toggle — global delegation */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.getAttribute('data-fav');
    const nowFav = window.AppStore.toggleFavorite(id);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
      b.classList.toggle('is-active', nowFav);
      b.setAttribute('aria-pressed', String(nowFav));
    });
    const tpl = window.AppStore.getTemplate(id);
    const name = tpl ? tpl.name : 'Template';
    if (nowFav) window.Toast.success(name + ' added to your favorites.', 'Saved');
    else window.Toast.info(name + ' removed from favorites.', 'Removed');
    document.dispatchEvent(new CustomEvent('favoriteschange', { detail: { id: id, fav: nowFav } }));
  });

  /* "Use template" — creates a project (login required) */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-use-template]');
    if (!btn) return;
    e.preventDefault();
    const tpl = window.AppStore.getTemplate(btn.getAttribute('data-use-template'));
    if (!tpl) return;
    if (!window.AppStore.auth.isLoggedIn()) {
      window.Modal.confirm({
        title: 'Sign in to use this template',
        message: 'Create a free account (or sign in) to start building with "' + tpl.name + '". Your project will be waiting for you.',
        okText: 'Sign In',
        onConfirm: function () { window.location.href = 'login.html'; }
      });
      return;
    }
    const project = window.AppStore.addProject({
      name: tpl.name.replace(/ (Pro|Suite|Starter|Portal)$/, '') + ' App',
      template: tpl.name,
      templateId: tpl.id,
      gradient: tpl.gradient,
      pages: tpl.pages.length,
      components: 12 + Math.floor(tpl.pages.length * 4.5)
    });
    window.Toast.success('Project created from "' + tpl.name + '". Opening the builder…', 'Template applied');
    setTimeout(function () {
      window.location.href = 'app-builder.html?project=' + project.id;
    }, 900);
  });

  window.TemplateCards = {
    render: render,
    starRow: starRow,
    formatUses: formatUses,
    categoryPhoto: function (category) { return CATEGORY_PHOTOS[category] || null; }
  };
})();

/* ==========================================================================
   STACKLY — Builder Component Registry
   Definitions + default props + prop schemas + render functions for every
   canvas component. Consumed by builder.js (canvas + properties panel)
   and preview.js (clean preview render).

   window.BuilderComponents API:
     groups                       -> [{id, label, types:[...]}]
     get(type)                    -> definition object
     defaults(type)               -> fresh props object (deep clone)
     render(type, props)          -> inner HTML string for the component body
     label(type) / icon(type)
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function icon(name) { return window.Icons.get(name); }

  function splitList(str) {
    return String(str || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* Shared style defaults every component instance gets */
  var STYLE_BASE = {
    font: '', fsize: 0, weight: '', align: '',
    color: '', bg: '',
    pad: -1, mgn: 0,
    radius: -1, bw: 0, bcolor: '#E2E8F0',
    shadow: 'none',
    wpct: 100, minh: 0,
    anim: 'none', hideM: false, hideT: false
  };

  var GRADIENTS = {
    violet: ['#7928AB', '#9A289C'],
    ocean: ['#5595E4', '#47C1D1'],
    sunset: ['#F59E0B', '#EC4899'],
    forest: ['#22C55E', '#47C1D1'],
    slate: ['#334155', '#0F172A']
  };

  function grad(key) {
    var g = GRADIENTS[key] || GRADIENTS.violet;
    return 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
  }

  var TABLE_DATA = [
    ['Olivia Chen', 'Pro', 'active', '$79.00'],
    ['Marcus Webb', 'Starter', 'active', '$29.00'],
    ['Priya Nair', 'Business', 'trial', '$149.00'],
    ['Jonas Berg', 'Pro', 'active', '$79.00'],
    ['Amara Diallo', 'Starter', 'past due', '$29.00']
  ];

  var CHART_H = [62, 38, 78, 52, 92, 46, 70, 58];

  function chartSvg(bars, color) {
    var n = Math.max(3, Math.min(8, bars | 0 || 6));
    var labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Avg'];
    var W = 340, H = 150, padX = 10, base = 122;
    var slot = (W - padX * 2) / n, bw = Math.min(34, slot * 0.56);
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="c-chart-svg" role="img" aria-label="Bar chart">';
    /* gridlines */
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var y = base - 100 * f;
      out += '<line x1="' + padX + '" y1="' + y + '" x2="' + (W - padX) + '" y2="' + y + '" stroke="#E7EBF3" stroke-width="1"/>';
    });
    out += '<line x1="' + padX + '" y1="' + base + '" x2="' + (W - padX) + '" y2="' + base + '" stroke="#CBD5E1" stroke-width="1.5"/>';
    for (var i = 0; i < n; i++) {
      var h = CHART_H[i % CHART_H.length];
      var x = padX + slot * i + (slot - bw) / 2;
      out += '<rect x="' + x.toFixed(1) + '" y="' + (base - h) + '" width="' + bw.toFixed(1) + '" height="' + h + '" rx="5" fill="' + esc(color) + '" opacity="' + (0.75 + (i % 3) * 0.12).toFixed(2) + '"/>';
      out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base + 16) + '" text-anchor="middle" font-size="9.5" fill="#94A3B8" font-family="Inter,sans-serif">' + labels[i] + '</text>';
    }
    return out + '</svg>';
  }

  function skeletonLines(n, wide) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<span class="c-line" style="width:' + (wide[i % wide.length]) + '%"></span>';
    }
    return out;
  }

  /* ---------- definitions ---------- */

  var DEFS = {

    /* ============ BASIC ============ */

    heading: {
      label: 'Heading', icon: 'heading', group: 'basic', typo: true,
      defaults: { text: 'Build something people love', level: 'h2', fsize: 34, weight: 700, align: 'left', pad: 20 },
      fields: [
        { key: 'text', label: 'Text', type: 'textarea' },
        { key: 'level', label: 'Level', type: 'select', options: [['h1', 'H1 — Page title'], ['h2', 'H2 — Section'], ['h3', 'H3 — Subsection']] }
      ],
      render: function (p) {
        var tag = /^h[1-3]$/.test(p.level) ? p.level : 'h2';
        return '<' + tag + ' class="c-heading" data-edit="text">' + esc(p.text) + '</' + tag + '>';
      }
    },

    text: {
      label: 'Text', icon: 'type', group: 'basic', typo: true,
      defaults: { text: 'Stackly lets your whole team design, build, and ship production-ready apps without writing a single line of code. Drag components onto the canvas, style them visually, and publish in one click.', fsize: 16, weight: 400, pad: 16 },
      fields: [{ key: 'text', label: 'Text', type: 'textarea' }],
      render: function (p) {
        return '<p class="c-text" data-edit="text">' + esc(p.text) + '</p>';
      }
    },

    button: {
      label: 'Button', icon: 'button-el', group: 'basic', typo: true,
      defaults: { text: 'Get started free', link: '#', variant: 'primary', fsize: 15, weight: 600, pad: 16 },
      fields: [
        { key: 'text', label: 'Label', type: 'text' },
        { key: 'link', label: 'Link URL', type: 'text' },
        { key: 'variant', label: 'Variant', type: 'select', options: [['primary', 'Primary'], ['secondary', 'Secondary'], ['outline', 'Outline'], ['dark', 'Dark']] }
      ],
      render: function (p) {
        return '<span class="c-btn c-btn-' + esc(p.variant) + '" data-edit="text" title="' + esc(p.link) + '">' + esc(p.text) + '</span>';
      }
    },

    image: {
      label: 'Image', icon: 'image', group: 'basic', resizable: true,
      defaults: { caption: 'Product screenshot — dashboard view', gradient: 'violet', minh: 220, pad: 16, radius: 14 },
      fields: [
        { key: 'caption', label: 'Caption', type: 'text' },
        { key: 'gradient', label: 'Placeholder', type: 'select', options: [['violet', 'Violet gradient'], ['ocean', 'Ocean gradient'], ['sunset', 'Sunset gradient'], ['forest', 'Forest gradient'], ['slate', 'Slate gradient']] }
      ],
      render: function (p) {
        var g = GRADIENTS[p.gradient] || GRADIENTS.violet;
        /* illustrated landscape "photo" instead of a flat placeholder */
        var scene = '<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' +
          '<defs><linearGradient id="cimg' + Math.random().toString(36).slice(2, 7) + 'x" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + g[0] + '"/><stop offset="1" stop-color="' + g[1] + '"/></linearGradient></defs>' +
          '<rect width="400" height="220" fill="' + g[0] + '"/>' +
          '<rect width="400" height="220" fill="' + g[1] + '" opacity="0.45"/>' +
          '<circle cx="316" cy="58" r="30" fill="#FDE68A"/>' +
          '<circle cx="316" cy="58" r="40" fill="#FDE68A" opacity="0.35"/>' +
          '<path d="M-10 220 L92 96 L168 190 L212 140 L292 220 Z" fill="#0F172A" opacity="0.35"/>' +
          '<path d="M120 220 L232 88 L320 196 L360 158 L420 220 Z" fill="#0F172A" opacity="0.55"/>' +
          '<path d="M232 88 L258 120 L246 120 L268 148 L232 132 L214 148 L224 118 L212 118 Z" fill="#fff" opacity="0.85"/>' +
          '<ellipse cx="86" cy="52" rx="34" ry="11" fill="#fff" opacity="0.65"/>' +
          '<ellipse cx="130" cy="70" rx="24" ry="8" fill="#fff" opacity="0.45"/>' +
          '</svg>';
        return '<figure class="c-image">' +
          '<div class="c-image-ph" style="position:relative;overflow:hidden">' + scene +
            '<span class="c-image-ic" style="position:relative">' + icon('image') + '</span>' +
          '</div>' +
          (p.caption ? '<figcaption class="c-image-cap" data-edit="caption">' + esc(p.caption) + '</figcaption>' : '') +
        '</figure>';
      }
    },

    video: {
      label: 'Video', icon: 'video', group: 'basic', resizable: true,
      defaults: { title: 'Watch the 2-minute demo', duration: '2:14', minh: 240, pad: 16, radius: 14 },
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'duration', label: 'Duration', type: 'text' }
      ],
      render: function (p) {
        /* poster art behind the play button */
        var poster = '<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.9" aria-hidden="true">' +
          '<rect width="400" height="220" fill="#242044"/>' +
          '<circle cx="330" cy="40" r="90" fill="#7928AB" opacity="0.4"/>' +
          '<circle cx="40" cy="200" r="80" fill="#9A289C" opacity="0.35"/>' +
          '<rect x="70" y="52" width="260" height="130" rx="12" fill="#0F172A"/>' +
          '<rect x="70" y="52" width="260" height="26" rx="12" fill="#1E293B"/>' +
          '<circle cx="86" cy="65" r="4" fill="#F87171"/><circle cx="99" cy="65" r="4" fill="#FBBF24"/><circle cx="112" cy="65" r="4" fill="#34D399"/>' +
          '<rect x="86" y="92" width="90" height="9" rx="4.5" fill="#CF86C8"/>' +
          '<rect x="86" y="110" width="140" height="7" rx="3.5" fill="#475569"/>' +
          '<rect x="86" y="126" width="110" height="7" rx="3.5" fill="#475569"/>' +
          '<rect x="86" y="146" width="64" height="18" rx="9" fill="#7928AB"/>' +
          '<rect x="230" y="92" width="84" height="72" rx="9" fill="#32287D"/>' +
          '<path d="M252 140 l14 -22 12 14 10 -8 16 16 z" fill="#CF86C8"/>' +
          '<circle cx="290" cy="108" r="7" fill="#FDE68A"/>' +
          '</svg>';
        return '<div class="c-video" style="position:relative;overflow:hidden">' + poster +
          '<span class="c-video-play" style="position:relative;z-index:1">' + icon('play') + '</span>' +
          '<span class="c-video-title" data-edit="title" style="position:relative;z-index:1">' + esc(p.title) + '</span>' +
          '<span class="c-video-dur" style="z-index:1">' + esc(p.duration) + '</span>' +
        '</div>';
      }
    },

    /* ============ LAYOUT ============ */

    container: {
      label: 'Container', icon: 'container', group: 'layout', resizable: true, typo: true,
      defaults: { text: 'Section container — group related blocks inside this area', minh: 120, pad: 28, radius: 12 },
      fields: [{ key: 'text', label: 'Placeholder note', type: 'text' }],
      render: function (p) {
        return '<div class="c-container">' +
          '<span class="c-container-ic">' + icon('container') + '</span>' +
          '<span data-edit="text">' + esc(p.text) + '</span>' +
        '</div>';
      }
    },

    columns: {
      label: 'Columns', icon: 'columns', group: 'layout', resizable: true,
      defaults: { cols: '3', pad: 16, minh: 0 },
      fields: [{ key: 'cols', label: 'Columns', type: 'select', options: [['2', '2 columns'], ['3', '3 columns']] }],
      render: function (p) {
        var n = p.cols === '2' ? 2 : 3, cells = '';
        var titles = ['Design visually', 'Connect data', 'Publish anywhere'];
        var icons = ['palette', 'database', 'rocket'];
        for (var i = 0; i < n; i++) {
          cells += '<div class="c-col-cell">' +
            '<span class="c-col-ic">' + icon(icons[i % 3]) + '</span>' +
            '<strong>' + titles[i % 3] + '</strong>' +
            skeletonLines(2, [92, 70]) +
          '</div>';
        }
        return '<div class="c-columns c-columns-' + n + '">' + cells + '</div>';
      }
    },

    card: {
      label: 'Card', icon: 'card', group: 'layout', resizable: true, typo: true,
      defaults: { title: 'Realtime analytics', body: 'Track visitors, conversions, and revenue for every published app from one dashboard.', link: 'Learn more', pad: 16, minh: 0 },
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'textarea' },
        { key: 'link', label: 'Link label', type: 'text' }
      ],
      render: function (p) {
        return '<div class="c-card">' +
          '<span class="c-card-ic">' + icon('zap') + '</span>' +
          '<strong class="c-card-title" data-edit="title">' + esc(p.title) + '</strong>' +
          '<span class="c-card-body" data-edit="body">' + esc(p.body) + '</span>' +
          (p.link ? '<span class="c-card-link" data-edit="link">' + esc(p.link) + ' →</span>' : '') +
        '</div>';
      }
    },

    navbar: {
      label: 'Navbar', icon: 'navbar', group: 'layout', typo: true,
      defaults: { brand: 'Stackly', links: 'Home, Features, Pricing, Contact', cta: 'Sign up', pad: 18 },
      fields: [
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'links', label: 'Links (comma-sep)', type: 'text' },
        { key: 'cta', label: 'CTA label', type: 'text' }
      ],
      render: function (p) {
        var links = splitList(p.links).map(function (l, i) {
          return '<span class="c-nav-link' + (i === 0 ? ' is-active' : '') + '">' + esc(l) + '</span>';
        }).join('');
        return '<div class="c-navbar">' +
          '<span class="c-nav-brand"><span class="c-nav-logo">' + icon('logo') + '</span><span data-edit="brand">' + esc(p.brand) + '</span></span>' +
          '<span class="c-nav-links">' + links + '</span>' +
          '<span class="c-btn c-btn-primary c-btn-sm" data-edit="cta">' + esc(p.cta) + '</span>' +
        '</div>';
      }
    },

    footer: {
      label: 'Footer', icon: 'footer', group: 'layout', typo: true,
      defaults: { brand: 'Stackly', tagline: 'Build apps without code.', pad: 32 },
      fields: [
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'tagline', label: 'Tagline', type: 'text' }
      ],
      render: function (p) {
        function col(title, items) {
          return '<div class="c-footer-col"><strong>' + title + '</strong>' + items.map(function (i) {
            return '<span>' + i + '</span>';
          }).join('') + '</div>';
        }
        return '<div class="c-footer">' +
          '<div class="c-footer-grid">' +
            '<div class="c-footer-col c-footer-brand">' +
              '<span class="c-nav-brand"><span class="c-nav-logo">' + icon('logo') + '</span><span data-edit="brand">' + esc(p.brand) + '</span></span>' +
              '<span class="c-footer-tag" data-edit="tagline">' + esc(p.tagline) + '</span>' +
            '</div>' +
            col('Product', ['Features', 'Templates', 'Pricing']) +
            col('Company', ['About', 'Careers', 'Contact']) +
            col('Resources', ['Blog', 'Docs', 'Support']) +
          '</div>' +
          '<div class="c-footer-base">© 2026 ' + esc(p.brand) + '. All rights reserved.</div>' +
        '</div>';
      }
    },

    /* ============ FORMS ============ */

    form: {
      label: 'Form', icon: 'form-el', group: 'forms', typo: true,
      defaults: { title: 'Get in touch', submit: 'Send message', pad: 24, radius: 14 },
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'submit', label: 'Submit label', type: 'text' }
      ],
      render: function (p) {
        return '<div class="c-form">' +
          '<strong class="c-form-title" data-edit="title">' + esc(p.title) + '</strong>' +
          '<label class="c-field"><span>Full name</span><span class="c-input-ph">Jordan Smith</span></label>' +
          '<label class="c-field"><span>Email address</span><span class="c-input-ph">jordan@company.com</span></label>' +
          '<label class="c-field"><span>Message</span><span class="c-input-ph c-input-area">How can we help?</span></label>' +
          '<span class="c-btn c-btn-primary" data-edit="submit">' + esc(p.submit) + '</span>' +
        '</div>';
      }
    },

    input: {
      label: 'Input', icon: 'input', group: 'forms', typo: true,
      defaults: { label: 'Email address', placeholder: 'you@company.com', pad: 12 },
      fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' }
      ],
      render: function (p) {
        return '<label class="c-field"><span data-edit="label">' + esc(p.label) + '</span>' +
          '<span class="c-input-ph">' + esc(p.placeholder) + '</span></label>';
      }
    },

    dropdown: {
      label: 'Dropdown', icon: 'dropdown', group: 'forms', typo: true,
      defaults: { label: 'Country', options: 'United States, United Kingdom, India, Germany', pad: 12 },
      fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'options', label: 'Options (comma-sep)', type: 'textarea' }
      ],
      render: function (p) {
        var first = splitList(p.options)[0] || 'Select…';
        return '<label class="c-field"><span data-edit="label">' + esc(p.label) + '</span>' +
          '<span class="c-input-ph c-select-ph">' + esc(first) + icon('chevron-down') + '</span></label>';
      }
    },

    checkbox: {
      label: 'Checkbox', icon: 'checkbox-el', group: 'forms', typo: true,
      defaults: { label: 'Subscribe to product updates', checked: true, pad: 12 },
      fields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'checked', label: 'Checked', type: 'toggle' }
      ],
      render: function (p) {
        return '<span class="c-checkbox' + (p.checked ? ' is-checked' : '') + '">' +
          '<span class="c-checkbox-box">' + icon('check') + '</span>' +
          '<span data-edit="label">' + esc(p.label) + '</span>' +
        '</span>';
      }
    },

    /* ============ DATA ============ */

    table: {
      label: 'Table', icon: 'table', group: 'data',
      defaults: { rows: '3', pad: 16, radius: 12 },
      fields: [{ key: 'rows', label: 'Rows', type: 'select', options: [['3', '3 rows'], ['4', '4 rows'], ['5', '5 rows']] }],
      render: function (p) {
        var n = Math.max(3, Math.min(5, parseInt(p.rows, 10) || 3));
        var body = '';
        for (var i = 0; i < n; i++) {
          var r = TABLE_DATA[i];
          var tone = r[2] === 'active' ? 'ok' : r[2] === 'trial' ? 'info' : 'warn';
          body += '<tr><td class="is-strong">' + r[0] + '</td><td>' + r[1] + '</td>' +
            '<td><span class="c-pill c-pill-' + tone + '">' + r[2] + '</span></td><td>' + r[3] + '</td></tr>';
        }
        return '<div class="c-table-wrap"><table class="c-table">' +
          '<thead><tr><th>Customer</th><th>Plan</th><th>Status</th><th>MRR</th></tr></thead>' +
          '<tbody>' + body + '</tbody></table></div>';
      }
    },

    chart: {
      label: 'Chart', icon: 'chart', group: 'data',
      defaults: { title: 'Weekly signups', bars: '6', barColor: '#7928AB', pad: 20, radius: 14 },
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'bars', label: 'Bars', type: 'select', options: [['4', '4 bars'], ['5', '5 bars'], ['6', '6 bars'], ['7', '7 bars'], ['8', '8 bars']] },
        { key: 'barColor', label: 'Bar color', type: 'color' }
      ],
      render: function (p) {
        return '<div class="c-chart">' +
          '<div class="c-chart-head"><strong data-edit="title">' + esc(p.title) + '</strong>' +
          '<span class="c-pill c-pill-ok">' + icon('trend-up') + ' +12.4%</span></div>' +
          chartSvg(parseInt(p.bars, 10), p.barColor || '#7928AB') +
        '</div>';
      }
    },

    /* ============ MEDIA / MISC ============ */

    icon: {
      label: 'Icon', icon: 'star', group: 'media',
      defaults: { glyph: 'star', tone: 'violet', pad: 16 },
      fields: [
        { key: 'glyph', label: 'Icon', type: 'select', options: [['star', 'Star'], ['heart', 'Heart'], ['zap', 'Bolt'], ['check-circle', 'Check'], ['rocket', 'Rocket'], ['shield', 'Shield']] },
        { key: 'tone', label: 'Tile color', type: 'select', options: [['violet', 'Violet'], ['ocean', 'Blue'], ['forest', 'Green'], ['sunset', 'Orange'], ['slate', 'Slate']] }
      ],
      render: function (p) {
        return '<span class="c-icon-tile" style="background:' + grad(p.tone) + '">' + icon(p.glyph) + '</span>';
      }
    }
  };

  /* ---------- groups (left sidebar order) ---------- */

  var GROUPS = [
    { id: 'basic', label: 'Basic', types: ['text', 'heading', 'button', 'image', 'video'] },
    { id: 'layout', label: 'Layout', types: ['container', 'columns', 'card', 'navbar', 'footer'] },
    { id: 'forms', label: 'Forms', types: ['form', 'input', 'dropdown', 'checkbox'] },
    { id: 'data', label: 'Data', types: ['table', 'chart'] },
    { id: 'media', label: 'Media & Misc', types: ['icon'] }
  ];

  /* ---------- public API ---------- */

  window.BuilderComponents = {
    groups: GROUPS,
    escapeHtml: esc,

    get: function (type) { return DEFS[type] || null; },
    label: function (type) { return DEFS[type] ? DEFS[type].label : type; },
    icon: function (type) { return DEFS[type] ? DEFS[type].icon : 'help-circle'; },

    defaults: function (type) {
      var def = DEFS[type];
      if (!def) return JSON.parse(JSON.stringify(STYLE_BASE));
      return JSON.parse(JSON.stringify(Object.assign({}, STYLE_BASE, def.defaults)));
    },

    render: function (type, props) {
      var def = DEFS[type];
      if (!def) return '<div class="c-text">Unknown component</div>';
      return def.render(props || this.defaults(type));
    }
  };
})();

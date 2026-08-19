/* ==========================================================================
   STACKLY — Artwork Engine
   Generates rich, full-color inline-SVG "pictures": realistic app
   screenshots, editorial cover art, and illustrated people portraits.
   Replaces the old translucent skeleton-line placeholders everywhere.

   API:
     Artwork.appShot(kind, g1, g2)   -> SVG string (480x300, 16:10)
       kinds: dashboard | kanban | commerce | calendar | finance | list |
              portfolio | landing | people | chat
     Artwork.forCategory(category, gradient[]) -> appShot mapped by category
     Artwork.cover(theme, g1, g2)    -> SVG string (480x300)
       themes: launch | code | design | growth | team | device | idea
     Artwork.person(seed, opts)      -> SVG portrait string (square)
     Artwork.inject(scope)           -> replaces [data-artwork] placeholders
       <div data-artwork="appShot:dashboard" data-colors="#7928AB,#9A289C">
       <div data-artwork="cover:launch"  data-colors="...">
       <div data-artwork="person:SarahKim">
   ========================================================================== */

(function () {
  'use strict';

  var FONT = "font-family='Inter,system-ui,sans-serif'";

  function hash(str) {
    var h = 2166136261;
    str = String(str || 'x');
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }
  function rng(seed) {
    var s = hash(seed);
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function gid() { return 'aw' + Math.random().toString(36).slice(2, 9); }

  function open(g1, g2, id) {
    return '<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" style="width:100%;height:100%;display:block">' +
      '<defs>' +
        '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + g1 + '"/><stop offset="1" stop-color="' + g2 + '"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + id + 'ac" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="' + g1 + '"/><stop offset="1" stop-color="' + g2 + '"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="480" height="300" fill="url(#' + id + 'bg)"/>' +
      '<circle cx="440" cy="-20" r="120" fill="#fff" opacity="0.08"/>' +
      '<circle cx="20" cy="310" r="100" fill="#fff" opacity="0.07"/>';
  }

  /* white app window with topbar */
  function windowFrame(id, x, y, w, h, title) {
    return '<g>' +
      '<rect x="' + (x + 4) + '" y="' + (y + 7) + '" width="' + w + '" height="' + h + '" rx="12" fill="#0F172A" opacity="0.22"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="#FFFFFF"/>' +
      '<circle cx="' + (x + 16) + '" cy="' + (y + 15) + '" r="4" fill="#F87171"/>' +
      '<circle cx="' + (x + 29) + '" cy="' + (y + 15) + '" r="4" fill="#FBBF24"/>' +
      '<circle cx="' + (x + 42) + '" cy="' + (y + 15) + '" r="4" fill="#34D399"/>' +
      (title ? '<text x="' + (x + w / 2) + '" y="' + (y + 19) + '" text-anchor="middle" font-size="9" fill="#94A3B8" ' + FONT + ' font-weight="600">' + title + '</text>' : '') +
      '<line x1="' + x + '" y1="' + (y + 28) + '" x2="' + (x + w) + '" y2="' + (y + 28) + '" stroke="#E2E8F0" stroke-width="1"/>' +
    '</g>';
  }

  function avatarDot(x, y, r, color, initial) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '"/>' +
      (initial ? '<text x="' + x + '" y="' + (y + r * 0.38) + '" text-anchor="middle" font-size="' + (r * 1.05) + '" fill="#fff" ' + FONT + ' font-weight="700">' + initial + '</text>' : '');
  }

  var HUES = ['#7928AB', '#47C1D1', '#22C55E', '#F59E0B', '#EC4899', '#9A289C', '#14B8A6', '#F97316'];

  /* ------------------------------------------------------------------
     App screenshot layouts
     ------------------------------------------------------------------ */

  var SHOTS = {

    dashboard: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'app.appflow.io/dashboard');
      /* sidebar */
      s += '<rect x="36" y="62" width="86" height="232" fill="#0F172A" opacity="0.04"/>';
      var items = ['#7928AB', '#CBD5E1', '#CBD5E1', '#CBD5E1', '#CBD5E1'];
      for (var i = 0; i < 5; i++) {
        s += '<rect x="48" y="' + (76 + i * 26) + '" width="12" height="12" rx="4" fill="' + items[i] + '"/>' +
             '<rect x="66" y="' + (79 + i * 26) + '" width="' + (38 - i * 3) + '" height="6" rx="3" fill="' + (i === 0 ? '#7928AB' : '#CBD5E1') + '"/>';
      }
      /* KPI cards */
      var kpis = [['Revenue', '$24.8k', '#22C55E', '+18%'], ['Users', '3,420', '#47C1D1', '+9%'], ['Orders', '1,284', '#F59E0B', '+6%']];
      kpis.forEach(function (k, j) {
        var x = 134 + j * 102;
        s += '<rect x="' + x + '" y="74" width="94" height="52" rx="9" fill="#F8FAFC" stroke="#E2E8F0"/>' +
          '<circle cx="' + (x + 16) + '" cy="90" r="8" fill="' + k[2] + '" opacity="0.18"/>' +
          '<circle cx="' + (x + 16) + '" cy="90" r="3.5" fill="' + k[2] + '"/>' +
          '<text x="' + (x + 30) + '" y="93" font-size="8" fill="#64748B" ' + FONT + '>' + k[0] + '</text>' +
          '<text x="' + (x + 12) + '" y="114" font-size="13" fill="#0F172A" ' + FONT + ' font-weight="800">' + k[1] + '</text>' +
          '<text x="' + (x + 62) + '" y="114" font-size="8" fill="' + k[2] + '" ' + FONT + ' font-weight="700">' + k[3] + '</text>';
      });
      /* bar chart */
      s += '<rect x="134" y="138" width="188" height="140" rx="9" fill="#F8FAFC" stroke="#E2E8F0"/>' +
        '<text x="148" y="158" font-size="9" fill="#0F172A" ' + FONT + ' font-weight="700">Monthly growth</text>';
      var bars = [42, 66, 52, 84, 70, 102, 88];
      bars.forEach(function (h, j) {
        s += '<rect x="' + (150 + j * 23) + '" y="' + (264 - h) + '" width="13" height="' + h + '" rx="4" fill="url(#' + id + 'ac)"' + (j % 2 ? ' opacity="0.55"' : '') + '/>';
      });
      /* donut */
      s += '<rect x="332" y="138" width="98" height="140" rx="9" fill="#F8FAFC" stroke="#E2E8F0"/>' +
        '<text x="348" y="158" font-size="9" fill="#0F172A" ' + FONT + ' font-weight="700">Traffic</text>' +
        '<circle cx="381" cy="204" r="26" fill="none" stroke="#E2E8F0" stroke-width="10"/>' +
        '<circle cx="381" cy="204" r="26" fill="none" stroke="' + acc + '" stroke-width="10" stroke-dasharray="98 165" stroke-linecap="round" transform="rotate(-90 381 204)"/>' +
        '<circle cx="381" cy="204" r="26" fill="none" stroke="#47C1D1" stroke-width="10" stroke-dasharray="42 165" stroke-dashoffset="-104" transform="rotate(-90 381 204)"/>' +
        '<text x="381" y="208" text-anchor="middle" font-size="11" fill="#0F172A" ' + FONT + ' font-weight="800">62%</text>' +
        '<circle cx="356" cy="252" r="4" fill="' + acc + '"/><text x="365" y="255" font-size="7.5" fill="#64748B" ' + FONT + '>Direct</text>' +
        '<circle cx="398" cy="252" r="4" fill="#47C1D1"/><text x="407" y="255" font-size="7.5" fill="#64748B" ' + FONT + '>Social</text>';
      return s;
    },

    kanban: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'pipeline — deals board');
      var cols = [
        ['Leads', '#47C1D1', 3, ['Acme Corp', 'Globex', 'Initech']],
        ['In progress', '#F59E0B', 2, ['Umbrella', 'Stark Ind.']],
        ['Won 🎉', '#22C55E', 2, ['Wayne Ent.', 'Hooli']]
      ];
      cols.forEach(function (c, j) {
        var x = 52 + j * 130;
        s += '<rect x="' + x + '" y="74" width="118" height="206" rx="10" fill="#F1F5F9"/>' +
          '<circle cx="' + (x + 14) + '" cy="90" r="4" fill="' + c[1] + '"/>' +
          '<text x="' + (x + 24) + '" y="93" font-size="9" fill="#0F172A" ' + FONT + ' font-weight="700">' + c[0] + '</text>' +
          '<rect x="' + (x + 92) + '" y="83" width="16" height="13" rx="6" fill="' + c[1] + '" opacity="0.2"/>' +
          '<text x="' + (x + 100) + '" y="93" text-anchor="middle" font-size="8" fill="' + c[1] + '" ' + FONT + ' font-weight="700">' + c[2] + '</text>';
        c[3].forEach(function (name, k) {
          var y = 104 + k * 56;
          s += '<rect x="' + (x + 8) + '" y="' + y + '" width="102" height="48" rx="8" fill="#fff" stroke="#E2E8F0"/>' +
            '<text x="' + (x + 16) + '" y="' + (y + 15) + '" font-size="8.5" fill="#0F172A" ' + FONT + ' font-weight="700">' + name + '</text>' +
            '<rect x="' + (x + 16) + '" y="' + (y + 21) + '" width="' + (44 + k * 9) + '" height="5" rx="2.5" fill="#E2E8F0"/>' +
            '<rect x="' + (x + 16) + '" y="' + (y + 32) + '" width="30" height="10" rx="5" fill="' + c[1] + '" opacity="0.16"/>' +
            '<text x="' + (x + 31) + '" y="' + (y + 39.5) + '" text-anchor="middle" font-size="6.8" fill="' + c[1] + '" ' + FONT + ' font-weight="700">$' + (12 + j * 9 + k * 4) + 'k</text>' +
            avatarDot(x + 98, y + 37, 7, HUES[(j * 3 + k) % HUES.length], '');
        });
      });
      return s;
    },

    commerce: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'bloom-store.appflow.site');
      s += '<text x="56" y="88" font-size="13" fill="#0F172A" ' + FONT + ' font-weight="800">New arrivals</text>' +
        '<rect x="352" y="72" width="76" height="22" rx="11" fill="url(#' + id + 'ac)"/>' +
        '<text x="390" y="87" text-anchor="middle" font-size="8.5" fill="#fff" ' + FONT + ' font-weight="700">Cart · 3</text>';
      var prods = [['Aura Lamp', '$49', '#FDE68A', '#F59E0B'], ['Klip Chair', '$129', '#BAE6FD', '#47C1D1'], ['Vasa Set', '$35', '#FBCFE8', '#EC4899'], ['Note Desk', '$249', '#BBF7D0', '#22C55E'], ['Halo Clock', '$59', '#DFD7F0', '#9A289C'], ['Miro Rug', '$89', '#FED7AA', '#F97316']];
      prods.forEach(function (p, j) {
        var x = 56 + (j % 3) * 126, y = 102 + Math.floor(j / 3) * 92;
        s += '<rect x="' + x + '" y="' + y + '" width="114" height="82" rx="9" fill="#fff" stroke="#E2E8F0"/>' +
          '<rect x="' + (x + 7) + '" y="' + (y + 7) + '" width="100" height="42" rx="6" fill="' + p[2] + '"/>' +
          '<circle cx="' + (x + 57) + '" cy="' + (y + 28) + '" r="13" fill="' + p[3] + '"/>' +
          '<circle cx="' + (x + 40) + '" cy="' + (y + 34) + '" r="7" fill="#fff" opacity="0.55"/>' +
          '<text x="' + (x + 8) + '" y="' + (y + 63) + '" font-size="8.5" fill="#0F172A" ' + FONT + ' font-weight="700">' + p[0] + '</text>' +
          '<text x="' + (x + 8) + '" y="' + (y + 75) + '" font-size="9" fill="' + acc + '" ' + FONT + ' font-weight="800">' + p[1] + '</text>' +
          '<rect x="' + (x + 76) + '" y="' + (y + 58) + '" width="30" height="16" rx="8" fill="' + acc + '" opacity="0.14"/>' +
          '<text x="' + (x + 91) + '" y="' + (y + 69) + '" text-anchor="middle" font-size="7" fill="' + acc + '" ' + FONT + ' font-weight="700">Add</text>';
      });
      return s;
    },

    calendar: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'bookings — August 2026');
      s += '<text x="56" y="90" font-size="12" fill="#0F172A" ' + FONT + ' font-weight="800">August 2026</text>' +
        '<rect x="330" y="74" width="98" height="22" rx="11" fill="url(#' + id + 'ac)"/>' +
        '<text x="379" y="89" text-anchor="middle" font-size="8.5" fill="#fff" ' + FONT + ' font-weight="700">+ New booking</text>';
      var days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      days.forEach(function (d, j) {
        s += '<text x="' + (76 + j * 40) + '" y="112" text-anchor="middle" font-size="8" fill="#94A3B8" ' + FONT + ' font-weight="700">' + d + '</text>';
      });
      var booked = { 4: '#47C1D1', 9: '#22C55E', 12: acc, 15: '#F59E0B', 18: '#EC4899', 23: '#47C1D1', 26: acc };
      for (var d2 = 0; d2 < 28; d2++) {
        var cx = 56 + (d2 % 7) * 40, cy = 122 + Math.floor(d2 / 7) * 40;
        var col = booked[d2];
        s += '<rect x="' + cx + '" y="' + cy + '" width="36" height="34" rx="7" fill="' + (col ? col : '#F8FAFC') + '"' + (col ? ' opacity="0.9"' : ' stroke="#EEF2F7"') + '/>' +
          '<text x="' + (cx + 7) + '" y="' + (cy + 13) + '" font-size="7.5" fill="' + (col ? '#fff' : '#94A3B8') + '" ' + FONT + ' font-weight="600">' + (d2 + 1) + '</text>' +
          (col ? '<rect x="' + (cx + 6) + '" y="' + (cy + 20) + '" width="24" height="5" rx="2.5" fill="#fff" opacity="0.7"/>' : '');
      }
      return s;
    },

    finance: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'finflow — accounts');
      /* balance card */
      s += '<rect x="56" y="74" width="170" height="96" rx="12" fill="url(#' + id + 'ac)"/>' +
        '<circle cx="206" cy="88" r="26" fill="#fff" opacity="0.12"/>' +
        '<text x="70" y="96" font-size="8" fill="#E9E5F5" ' + FONT + '>Total balance</text>' +
        '<text x="70" y="118" font-size="17" fill="#fff" ' + FONT + ' font-weight="800">$48,290.50</text>' +
        '<rect x="70" y="132" width="52" height="15" rx="7.5" fill="#fff" opacity="0.2"/>' +
        '<text x="96" y="143" text-anchor="middle" font-size="7.5" fill="#fff" ' + FONT + ' font-weight="700">•••• 4242</text>' +
        '<text x="188" y="143" font-size="8" fill="#CCC7E3" ' + FONT + ' font-weight="700">VISA</text>';
      /* sparkline card */
      s += '<rect x="238" y="74" width="190" height="96" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>' +
        '<text x="252" y="94" font-size="9" fill="#0F172A" ' + FONT + ' font-weight="700">Spending</text>' +
        '<text x="252" y="110" font-size="12" fill="#22C55E" ' + FONT + ' font-weight="800">▲ 12.4%</text>' +
        '<path d="M252 152 L272 140 L292 146 L312 128 L332 134 L352 116 L372 122 L392 104 L412 110" fill="none" stroke="' + acc + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M252 152 L272 140 L292 146 L312 128 L332 134 L352 116 L372 122 L392 104 L412 110 L412 162 L252 162 Z" fill="' + acc + '" opacity="0.12"/>';
      /* transactions */
      var txs = [['Spotify', '-$9.99', '#22C55E'], ['Payroll · Northwind', '+$4,200', '#47C1D1'], ['AWS Cloud', '-$182.40', '#F59E0B']];
      txs.forEach(function (t, j) {
        var y = 184 + j * 32;
        s += '<rect x="56" y="' + y + '" width="372" height="26" rx="8" fill="' + (j % 2 ? '#F8FAFC' : '#fff') + '" stroke="#EEF2F7"/>' +
          avatarDot(74, y + 13, 8, t[2], '') +
          '<text x="90" y="' + (y + 16.5) + '" font-size="8.5" fill="#0F172A" ' + FONT + ' font-weight="600">' + t[0] + '</text>' +
          '<text x="416" y="' + (y + 16.5) + '" text-anchor="end" font-size="8.5" fill="' + (t[1][0] === '+' ? '#16A34A' : '#0F172A') + '" ' + FONT + ' font-weight="700">' + t[1] + '</text>';
      });
      return s;
    },

    list: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'workspace — tasks');
      s += '<text x="56" y="90" font-size="12" fill="#0F172A" ' + FONT + ' font-weight="800">Sprint 24 · Tasks</text>' +
        '<rect x="352" y="74" width="76" height="22" rx="11" fill="url(#' + id + 'ac)"/>' +
        '<text x="390" y="89" text-anchor="middle" font-size="8.5" fill="#fff" ' + FONT + ' font-weight="700">+ Add task</text>';
      var tasks = [
        ['Design onboarding flow', true, '#22C55E', 'Done', 0],
        ['Connect Stripe webhooks', true, '#22C55E', 'Done', 1],
        ['Build analytics page', false, acc, 'In progress', 2],
        ['QA mobile breakpoints', false, '#F59E0B', 'Review', 3],
        ['Launch checklist', false, '#94A3B8', 'Backlog', 4]
      ];
      tasks.forEach(function (t, j) {
        var y = 104 + j * 36;
        s += '<rect x="56" y="' + y + '" width="372" height="30" rx="9" fill="#fff" stroke="#E2E8F0"/>' +
          '<rect x="68" y="' + (y + 8) + '" width="14" height="14" rx="5" fill="' + (t[1] ? '#22C55E' : '#fff') + '" stroke="' + (t[1] ? '#22C55E' : '#CBD5E1') + '"/>' +
          (t[1] ? '<path d="M71 ' + (y + 15) + ' l3 3 l5 -6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' : '') +
          '<text x="92" y="' + (y + 19) + '" font-size="9" fill="' + (t[1] ? '#94A3B8' : '#0F172A') + '" ' + FONT + ' font-weight="600"' + (t[1] ? ' text-decoration="line-through"' : '') + '>' + t[0] + '</text>' +
          '<rect x="308" y="' + (y + 7) + '" width="58" height="16" rx="8" fill="' + t[2] + '" opacity="0.15"/>' +
          '<text x="337" y="' + (y + 18) + '" text-anchor="middle" font-size="7" fill="' + t[2] + '" ' + FONT + ' font-weight="700">' + t[3] + '</text>' +
          avatarDot(408, y + 15, 8, HUES[t[4] % HUES.length], '');
      });
      return s;
    },

    portfolio: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'lumen.appflow.site');
      s += '<text x="240" y="94" text-anchor="middle" font-size="15" fill="#0F172A" ' + FONT + ' font-weight="800">Selected Work</text>' +
        '<rect x="212" y="102" width="56" height="4" rx="2" fill="url(#' + id + 'ac)"/>';
      var tiles = [
        [56, 118, 118, 74, '#FDE68A', '#F59E0B'], [186, 118, 108, 160, '#CCC7E3', acc],
        [306, 118, 122, 74, '#BAE6FD', '#47C1D1'], [56, 204, 118, 74, '#FBCFE8', '#EC4899'],
        [306, 204, 122, 74, '#BBF7D0', '#22C55E']
      ];
      tiles.forEach(function (t, j) {
        s += '<rect x="' + t[0] + '" y="' + t[1] + '" width="' + t[2] + '" height="' + t[3] + '" rx="10" fill="' + t[4] + '"/>' +
          '<circle cx="' + (t[0] + t[2] * 0.32) + '" cy="' + (t[1] + t[3] * 0.4) + '" r="' + Math.min(t[3] * 0.22, 18) + '" fill="' + t[5] + '"/>' +
          '<rect x="' + (t[0] + 10) + '" y="' + (t[1] + t[3] - 18) + '" width="' + (t[2] * 0.5) + '" height="7" rx="3.5" fill="#fff" opacity="0.85"/>';
      });
      return s;
    },

    landing: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'saasbase.appflow.site');
      /* nav */
      s += '<circle cx="64" cy="76" r="7" fill="url(#' + id + 'ac)"/>' +
        '<rect x="76" y="72" width="42" height="8" rx="4" fill="#334155"/>' +
        '<rect x="300" y="70" width="30" height="9" rx="4" fill="#CBD5E1"/>' +
        '<rect x="338" y="70" width="30" height="9" rx="4" fill="#CBD5E1"/>' +
        '<rect x="378" y="66" width="50" height="18" rx="9" fill="url(#' + id + 'ac)"/>';
      /* hero */
      s += '<text x="240" y="124" text-anchor="middle" font-size="18" fill="#0F172A" ' + FONT + ' font-weight="800">Ship your product faster</text>' +
        '<text x="240" y="142" text-anchor="middle" font-size="9" fill="#64748B" ' + FONT + '>Everything you need to launch, grow and scale your SaaS.</text>' +
        '<rect x="182" y="154" width="66" height="20" rx="10" fill="url(#' + id + 'ac)"/>' +
        '<text x="215" y="167.5" text-anchor="middle" font-size="8.5" fill="#fff" ' + FONT + ' font-weight="700">Start free</text>' +
        '<rect x="256" y="154" width="52" height="20" rx="10" fill="#fff" stroke="#CBD5E1"/>' +
        '<text x="282" y="167.5" text-anchor="middle" font-size="8.5" fill="#334155" ' + FONT + ' font-weight="700">Demo</text>';
      /* pricing cards */
      var plans = [['Starter', '$9', '#47C1D1'], ['Pro', '$29', acc], ['Scale', '$79', '#22C55E']];
      plans.forEach(function (p, j) {
        var x = 76 + j * 116;
        var featured = j === 1;
        s += '<rect x="' + x + '" y="' + (featured ? 186 : 194) + '" width="104" height="' + (featured ? 92 : 84) + '" rx="10" fill="#fff" stroke="' + (featured ? acc : '#E2E8F0') + '" stroke-width="' + (featured ? 2 : 1) + '"/>' +
          '<text x="' + (x + 12) + '" y="' + (featured ? 206 : 212) + '" font-size="8.5" fill="#64748B" ' + FONT + ' font-weight="600">' + p[0] + '</text>' +
          '<text x="' + (x + 12) + '" y="' + (featured ? 226 : 230) + '" font-size="15" fill="#0F172A" ' + FONT + ' font-weight="800">' + p[1] + '</text>' +
          '<rect x="' + (x + 12) + '" y="' + (featured ? 236 : 240) + '" width="60" height="5" rx="2.5" fill="#E2E8F0"/>' +
          '<rect x="' + (x + 12) + '" y="' + (featured ? 246 : 250) + '" width="44" height="5" rx="2.5" fill="#E2E8F0"/>' +
          '<rect x="' + (x + 12) + '" y="' + (featured ? 258 : 262) + '" width="80" height="14" rx="7" fill="' + p[2] + '"' + (featured ? '' : ' opacity="0.16"') + '/>';
      });
      return s;
    },

    people: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'hr central — directory');
      s += '<text x="56" y="90" font-size="12" fill="#0F172A" ' + FONT + ' font-weight="800">Team directory</text>' +
        '<rect x="336" y="74" width="92" height="22" rx="11" fill="url(#' + id + 'ac)"/>' +
        '<text x="382" y="89" text-anchor="middle" font-size="8.5" fill="#fff" ' + FONT + ' font-weight="700">+ Invite</text>';
      var ppl = [['Olivia Chen', 'Design', '#EC4899'], ['Marcus Webb', 'Engineering', '#47C1D1'], ['Priya Nair', 'Product', '#9A289C'], ['Jonas Berg', 'Sales', '#22C55E'], ['Amara Diallo', 'Marketing', '#F59E0B'], ['Leo Tanaka', 'Support', '#14B8A6']];
      ppl.forEach(function (p, j) {
        var x = 56 + (j % 3) * 126, y = 104 + Math.floor(j / 3) * 92;
        s += '<rect x="' + x + '" y="' + y + '" width="114" height="80" rx="10" fill="#fff" stroke="#E2E8F0"/>' +
          avatarDot(x + 57, y + 26, 15, p[2], p[0].split(' ').map(function (n) { return n[0]; }).join('')) +
          '<text x="' + (x + 57) + '" y="' + (y + 55) + '" text-anchor="middle" font-size="8.5" fill="#0F172A" ' + FONT + ' font-weight="700">' + p[0] + '</text>' +
          '<rect x="' + (x + 30) + '" y="' + (y + 61) + '" width="54" height="13" rx="6.5" fill="' + p[2] + '" opacity="0.14"/>' +
          '<text x="' + (x + 57) + '" y="' + (y + 70.5) + '" text-anchor="middle" font-size="7" fill="' + p[2] + '" ' + FONT + ' font-weight="700">' + p[1] + '</text>';
      });
      return s;
    },

    chat: function (id, acc) {
      var s = windowFrame(id, 36, 34, 408, 260, 'care portal — messages');
      var msgs = [
        [0, 'Hi! I need to reschedule my check-up.'],
        [1, 'Of course — Dr. Rao has Tuesday 10:30 free.'],
        [0, 'Perfect, book it please 🙏'],
        [1, 'Done! Confirmation sent to your email.']
      ];
      msgs.forEach(function (m, j) {
        var mine = m[0] === 1;
        var w = 26 + m[1].length * 4.1;
        var x = mine ? 428 - w : 56;
        var y = 84 + j * 42;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="28" rx="12" fill="' + (mine ? 'url(#' + id + 'ac)' : '#F1F5F9') + '"/>' +
          '<text x="' + (x + 13) + '" y="' + (y + 17.5) + '" font-size="8.2" fill="' + (mine ? '#fff' : '#334155') + '" ' + FONT + ' font-weight="500">' + m[1] + '</text>' +
          (!mine ? avatarDot(x - 12, y + 14, 9, '#14B8A6', 'A') : '');
      });
      s += '<rect x="56" y="254" width="330" height="26" rx="13" fill="#F1F5F9"/>' +
        '<text x="70" y="270" font-size="8.5" fill="#94A3B8" ' + FONT + '>Type a message…</text>' +
        '<circle cx="410" cy="267" r="14" fill="url(#' + id + 'ac)"/>' +
        '<path d="M405 267 l5 -4 v8 z M405 267 h-1" fill="#fff"/>';
      return s;
    }
  };

  var CATEGORY_MAP = {
    'CRM': 'kanban', 'Sales': 'kanban', 'Business': 'landing', 'E-Commerce': 'commerce',
    'Healthcare': 'chat', 'Education': 'list', 'Finance': 'finance', 'Real Estate': 'portfolio',
    'Restaurant': 'commerce', 'Booking': 'calendar', 'Events': 'calendar', 'Portfolio': 'portfolio',
    'Productivity': 'list', 'HR': 'people', 'Marketing': 'dashboard', 'SaaS': 'landing',
    'Dashboard': 'dashboard'
  };

  function appShot(kind, g1, g2) {
    var id = gid();
    var fn = SHOTS[kind] || SHOTS.dashboard;
    return open(g1 || '#7928AB', g2 || '#9A289C', id) + fn(id, g1 || '#7928AB') + '</svg>';
  }

  function forCategory(category, gradient) {
    var g = gradient && gradient.length === 2 ? gradient : ['#7928AB', '#9A289C'];
    return appShot(CATEGORY_MAP[category] || 'dashboard', g[0], g[1]);
  }

  /* ------------------------------------------------------------------
     Editorial cover art (blog / resources)
     ------------------------------------------------------------------ */

  var COVERS = {

    launch: function (id, acc) {
      return '<circle cx="240" cy="150" r="86" fill="#fff" opacity="0.1"/>' +
        '<circle cx="240" cy="150" r="60" fill="#fff" opacity="0.1"/>' +
        /* rocket */
        '<g transform="rotate(-38 240 150)">' +
          '<path d="M240 92 C258 112 262 150 254 182 L226 182 C218 150 222 112 240 92 Z" fill="#fff"/>' +
          '<circle cx="240" cy="136" r="11" fill="' + acc + '"/>' +
          '<circle cx="240" cy="136" r="6" fill="#BFDBFE"/>' +
          '<path d="M226 168 L206 190 L226 186 Z" fill="#FCA5A5"/>' +
          '<path d="M254 168 L274 190 L254 186 Z" fill="#FCA5A5"/>' +
          '<path d="M233 184 L240 214 L247 184 Z" fill="#FDBA74"/>' +
          '<path d="M236 184 L240 202 L244 184 Z" fill="#FDE68A"/>' +
        '</g>' +
        '<circle cx="120" cy="80" r="4" fill="#fff" opacity="0.7"/>' +
        '<circle cx="372" cy="72" r="3" fill="#fff" opacity="0.6"/>' +
        '<circle cx="392" cy="212" r="5" fill="#fff" opacity="0.5"/>' +
        '<circle cx="96" cy="216" r="3" fill="#fff" opacity="0.6"/>' +
        '<path d="M110 140 h22 M121 129 v22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.65"/>' +
        '<path d="M356 160 h16 M364 152 v16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>';
    },

    code: function (id, acc) {
      var s = windowFrame(id, 90, 62, 300, 176, 'builder.appflow.io');
      var lines = [[14, 56, '#C4B5FD'], [30, 88, '#93C5FD'], [46, 66, '#86EFAC'], [62, 100, '#FDE68A'], [78, 48, '#FDA4AF'], [94, 84, '#93C5FD'], [110, 70, '#C4B5FD'], [126, 58, '#86EFAC']];
      s = s.replace('fill="#FFFFFF"', 'fill="#0F172A"').replace('stroke="#E2E8F0"', 'stroke="#1E293B"');
      lines.forEach(function (l, j) {
        s += '<circle cx="108" cy="' + (100 + l[0]) + '" r="3" fill="' + l[2] + '" opacity="0.9"/>' +
          '<rect x="120" y="' + (96 + l[0]) + '" width="' + l[1] + '" height="8" rx="4" fill="' + l[2] + '" opacity="0.85"/>' +
          (j % 2 ? '<rect x="' + (128 + l[1]) + '" y="' + (96 + l[0]) + '" width="' + (l[1] * 0.5) + '" height="8" rx="4" fill="#334155"/>' : '');
      });
      s += '<rect x="258" y="120" width="112" height="96" rx="10" fill="#fff"/>' +
        '<circle cx="284" cy="146" r="12" fill="' + acc + '"/>' +
        '<rect x="270" y="166" width="88" height="7" rx="3.5" fill="#E2E8F0"/>' +
        '<rect x="270" y="180" width="64" height="7" rx="3.5" fill="#E2E8F0"/>' +
        '<rect x="270" y="196" width="52" height="12" rx="6" fill="' + acc + '"/>';
      return s;
    },

    design: function (id, acc) {
      return '<circle cx="150" cy="140" r="64" fill="#FDE68A"/>' +
        '<rect x="220" y="76" width="128" height="128" rx="18" fill="#fff" opacity="0.92" transform="rotate(8 284 140)"/>' +
        '<circle cx="284" cy="120" r="20" fill="' + acc + '" transform="rotate(8 284 140)"/>' +
        '<rect x="246" y="150" width="76" height="9" rx="4.5" fill="#CBD5E1" transform="rotate(8 284 140)"/>' +
        '<rect x="246" y="168" width="56" height="9" rx="4.5" fill="#E2E8F0" transform="rotate(8 284 140)"/>' +
        '<path d="M110 216 L134 168 L158 216 Z" fill="#EC4899"/>' +
        '<circle cx="352" cy="228" r="18" fill="#34D399"/>' +
        '<rect x="86" y="84" width="34" height="34" rx="9" fill="#93C5FD" transform="rotate(-12 103 101)"/>' +
        '<path d="M368 88 l10 22 22 4 -16 16 4 22 -20 -11 -20 11 4 -22 -16 -16 22 -4 Z" fill="#FBBF24" transform="scale(0.8) translate(96 6)"/>';
    },

    growth: function (id, acc) {
      var s = '<rect x="84" y="70" width="312" height="160" rx="14" fill="#fff" opacity="0.95"/>' +
        '<text x="104" y="98" font-size="11" fill="#0F172A" ' + FONT + ' font-weight="800">Monthly revenue</text>' +
        '<rect x="308" y="84" width="70" height="18" rx="9" fill="#DCFCE7"/>' +
        '<text x="343" y="97" text-anchor="middle" font-size="8.5" fill="#16A34A" ' + FONT + ' font-weight="800">▲ +64%</text>';
      var bars = [34, 52, 44, 68, 60, 88, 104];
      bars.forEach(function (h, j) {
        s += '<rect x="' + (108 + j * 38) + '" y="' + (212 - h) + '" width="22" height="' + h + '" rx="6" fill="' + (j === bars.length - 1 ? acc : '#CCC7E3') + '"/>';
      });
      s += '<path d="M116 176 L156 160 L192 168 L232 142 L268 150 L306 118 L344 100" fill="none" stroke="#22C55E" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle cx="344" cy="100" r="6" fill="#22C55E" stroke="#fff" stroke-width="2.5"/>' +
        '<circle cx="404" cy="70" r="22" fill="#FBBF24"/>' +
        '<text x="404" y="76" text-anchor="middle" font-size="14" ' + FONT + '>$</text>';
      return s;
    },

    team: function (id, acc) {
      var s = '';
      var ppl = [[150, 130, 34, 0], [240, 112, 42, 1], [330, 130, 34, 2]];
      ppl.forEach(function (p) {
        s += personGroup(p[0], p[1], p[2], p[3]);
      });
      s += '<rect x="140" y="196" width="200" height="44" rx="22" fill="#fff" opacity="0.94"/>' +
        '<circle cx="166" cy="218" r="12" fill="#22C55E"/>' +
        '<path d="M160 218 l4 4 l8 -8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<text x="188" y="222" font-size="10" fill="#0F172A" ' + FONT + ' font-weight="700">Working together, live</text>';
      return s;
    },

    device: function (id, acc) {
      var s = windowFrame(id, 74, 64, 240, 172, 'yourapp.appflow.site');
      s += '<rect x="94" y="106" width="120" height="12" rx="6" fill="#334155"/>' +
        '<rect x="94" y="128" width="86" height="8" rx="4" fill="#CBD5E1"/>' +
        '<rect x="94" y="150" width="60" height="18" rx="9" fill="' + acc + '"/>' +
        '<rect x="94" y="182" width="200" height="40" rx="8" fill="#F0EDFA"/>' +
        '<circle cx="114" cy="202" r="10" fill="' + acc + '"/>' +
        '<rect x="132" y="192" width="90" height="7" rx="3.5" fill="#CCC7E3"/>' +
        '<rect x="132" y="206" width="66" height="7" rx="3.5" fill="#DFD7F0"/>';
      /* phone */
      s += '<rect x="322" y="96" width="92" height="176" rx="18" fill="#0F172A"/>' +
        '<rect x="328" y="112" width="80" height="144" rx="10" fill="#fff"/>' +
        '<rect x="352" y="102" width="32" height="5" rx="2.5" fill="#334155"/>' +
        '<rect x="338" y="124" width="60" height="9" rx="4.5" fill="#334155"/>' +
        '<rect x="338" y="140" width="44" height="6" rx="3" fill="#CBD5E1"/>' +
        '<rect x="338" y="156" width="60" height="34" rx="7" fill="' + acc + '" opacity="0.85"/>' +
        '<rect x="338" y="198" width="28" height="24" rx="6" fill="#BAE6FD"/>' +
        '<rect x="371" y="198" width="27" height="24" rx="6" fill="#BBF7D0"/>' +
        '<rect x="338" y="230" width="60" height="14" rx="7" fill="' + acc + '"/>';
      return s;
    },

    idea: function (id, acc) {
      return '<circle cx="240" cy="136" r="70" fill="#fff" opacity="0.12"/>' +
        /* bulb */
        '<path d="M240 82 a44 44 0 0 1 24 81 l0 14 h-48 l0 -14 a44 44 0 0 1 24 -81 Z" fill="#FDE68A"/>' +
        '<path d="M228 130 l12 -18 12 18 h-9 v18 h-6 v-18 Z" fill="#F59E0B"/>' +
        '<rect x="222" y="182" width="36" height="8" rx="4" fill="#fff" opacity="0.9"/>' +
        '<rect x="226" y="194" width="28" height="8" rx="4" fill="#fff" opacity="0.7"/>' +
        '<path d="M156 96 l-14 -14 M164 132 h-22 M324 96 l14 -14 M316 132 h22" stroke="#FDE68A" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="130" cy="212" r="16" fill="#34D399"/>' +
        '<rect x="330" y="196" width="34" height="34" rx="9" fill="#93C5FD" transform="rotate(14 347 213)"/>' +
        '<path d="M356 70 l7 15 15 3 -11 11 3 15 -14 -8 -14 8 3 -15 -11 -11 15 -3 Z" fill="#F9A8D4"/>';
    }
  };

  function cover(theme, g1, g2) {
    var id = gid();
    var fn = COVERS[theme] || COVERS.launch;
    return open(g1 || '#32287D', g2 || '#7928AB', id) + fn(id, g1 || '#7928AB') + '</svg>';
  }

  /* ------------------------------------------------------------------
     People portraits (flat illustration style)
     ------------------------------------------------------------------ */

  var SKINS = ['#F9D5B4', '#F0C29A', '#E0A876', '#C68950', '#9C6B43', '#7C5236'];
  var HAIRS = ['#1E293B', '#3F2C22', '#6B3F1D', '#A16207', '#7F1D1D', '#475569', '#0F172A'];
  var SHIRT = ['#7928AB', '#47C1D1', '#22C55E', '#F59E0B', '#EC4899', '#9A289C', '#14B8A6', '#EF4444'];
  var BGS = ['#F0EDFA', '#E0F2FE', '#DCFCE7', '#FEF3C7', '#FCE7F3', '#F0EAF8', '#CCFBF1', '#FFE4E6'];

  /* hair paths drawn for a head centered at (0,0) with radius 17 */
  function hairPath(style, color) {
    switch (style) {
      case 0: /* short crop */
        return '<path d="M-17 -2 a17 17 0 0 1 34 0 l0 -3 a17 14 0 0 0 -34 0 Z" fill="' + color + '"/>' +
               '<path d="M-17 -2 C-17 -14 -8 -19 0 -19 C8 -19 17 -14 17 -2 L17 -6 C15 -16 8 -21 0 -21 C-8 -21 -15 -16 -17 -6 Z" fill="' + color + '"/>' +
               '<path d="M-17 -4 C-14 -15 14 -15 17 -4 C16 -12 9 -18 0 -18 C-9 -18 -16 -12 -17 -4 Z" fill="' + color + '"/>';
      case 1: /* long hair */
        return '<path d="M-19 14 C-21 -6 -14 -20 0 -20 C14 -20 21 -6 19 14 L12 14 C14 -2 12 -12 0 -13 C-12 -12 -14 -2 -12 14 Z" fill="' + color + '"/>';
      case 2: /* bun */
        return '<circle cx="0" cy="-19" r="6" fill="' + color + '"/>' +
               '<path d="M-17 -3 C-16 -13 -9 -18 0 -18 C9 -18 16 -13 17 -3 C12 -9 6 -11 0 -11 C-6 -11 -12 -9 -17 -3 Z" fill="' + color + '"/>';
      case 3: /* curly */
        return '<path d="M-18 -4 a6 6 0 0 1 5 -9 a7 7 0 0 1 6 -5 a8 8 0 0 1 14 0 a7 7 0 0 1 6 5 a6 6 0 0 1 5 9 C12 -12 -12 -12 -18 -4 Z" fill="' + color + '"/>';
      case 4: /* side part */
        return '<path d="M-17 -2 C-17 -14 -8 -19 2 -18 C12 -17 17 -10 17 -2 L10 -4 C4 -12 -6 -13 -12 -6 Z" fill="' + color + '"/>';
      default: /* bald + beard hint */
        return '<path d="M-11 8 C-7 13 7 13 11 8 L10 12 C6 16 -6 16 -10 12 Z" fill="' + color + '" opacity="0.8"/>';
    }
  }

  /* person drawn inside its own group at (cx, cy) with scale s */
  function personGroup(cx, cy, r, seedNum) {
    var rnd = rng('p' + seedNum);
    var skin = SKINS[Math.floor(rnd() * SKINS.length)];
    var hair = HAIRS[Math.floor(rnd() * HAIRS.length)];
    var shirt = SHIRT[Math.floor(rnd() * SHIRT.length)];
    var style = Math.floor(rnd() * 6);
    var glasses = rnd() > 0.72;
    var k = r / 30;
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k + ')">' +
      '<circle cx="0" cy="0" r="30" fill="#fff" opacity="0.95"/>' +
      '<clipPath id="pc' + seedNum + cx + '"><circle cx="0" cy="0" r="30"/></clipPath>' +
      '<g clip-path="url(#pc' + seedNum + cx + ')">' +
        '<path d="M-20 34 C-20 18 -10 12 0 12 C10 12 20 18 20 34 Z" fill="' + shirt + '"/>' +
        '<circle cx="0" cy="-4" r="14" fill="' + skin + '"/>' +
        '<g transform="translate(0 -4) scale(0.82)">' + hairPath(style, hair) + '</g>' +
        '<circle cx="-5" cy="-4" r="1.6" fill="#0F172A"/>' +
        '<circle cx="5" cy="-4" r="1.6" fill="#0F172A"/>' +
        '<path d="M-4 3 C-2 5.5 2 5.5 4 3" stroke="#0F172A" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
        (glasses ? '<g stroke="#334155" stroke-width="1.3" fill="none"><circle cx="-5" cy="-4" r="4.6"/><circle cx="5" cy="-4" r="4.6"/><path d="M-0.4 -4 h0.8"/></g>' : '') +
      '</g></g>';
  }

  function person(seed, opts) {
    opts = opts || {};
    var rnd = rng(seed);
    var n = hash(seed);
    var skin = SKINS[n % SKINS.length];
    var hair = HAIRS[Math.floor(rnd() * 100) % HAIRS.length];
    var shirt = opts.shirt || SHIRT[(n >> 3) % SHIRT.length];
    var bg = opts.bg || BGS[(n >> 5) % BGS.length];
    var style = (n >> 7) % 6;
    var glasses = ((n >> 9) % 10) > 6;
    var cid = 'pp' + (n % 100000) + gid();
    return '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="img" style="width:100%;height:100%;display:block">' +
      '<clipPath id="' + cid + '"><circle cx="40" cy="40" r="40"/></clipPath>' +
      '<g clip-path="url(#' + cid + ')">' +
        '<rect width="80" height="80" fill="' + bg + '"/>' +
        '<circle cx="66" cy="14" r="20" fill="#fff" opacity="0.5"/>' +
        '<path d="M14 88 C14 60 26 50 40 50 C54 50 66 60 66 88 Z" fill="' + shirt + '"/>' +
        '<path d="M33 44 h14 v12 a7 7 0 0 1 -14 0 Z" fill="' + skin + '"/>' +
        '<circle cx="40" cy="32" r="17" fill="' + skin + '"/>' +
        '<g transform="translate(40 32)">' + hairPath(style, hair) + '</g>' +
        '<circle cx="34" cy="32" r="1.9" fill="#0F172A"/>' +
        '<circle cx="46" cy="32" r="1.9" fill="#0F172A"/>' +
        '<path d="M36 40 C38 42.5 42 42.5 44 40" stroke="#0F172A" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M31 27 h6 M43 27 h6" stroke="' + hair + '" stroke-width="1.6" stroke-linecap="round"/>' +
        (glasses ? '<g stroke="#334155" stroke-width="1.5" fill="none"><circle cx="34" cy="32" r="5.4"/><circle cx="46" cy="32" r="5.4"/><path d="M39.4 32 h1.2"/></g>' : '') +
      '</g></svg>';
  }

  /* ------------------------------------------------------------------
     Declarative injection
     <div data-artwork="appShot:kanban" data-colors="#7928AB,#9A289C">
     <span data-artwork="person:SarahKim">
     ------------------------------------------------------------------ */

  function inject(scope) {
    (scope || document).querySelectorAll('[data-artwork]').forEach(function (el) {
      var spec = (el.getAttribute('data-artwork') || '').split(':');
      var fn = spec[0], arg = spec[1] || '';
      var colors = (el.getAttribute('data-colors') || '').split(',');
      var g1 = (colors[0] || '').trim() || '#7928AB';
      var g2 = (colors[1] || '').trim() || '#9A289C';
      var html = '';
      if (fn === 'appShot') html = appShot(arg, g1, g2);
      else if (fn === 'cover') html = cover(arg, g1, g2);
      else if (fn === 'person') html = person(arg);
      if (html) {
        el.innerHTML = html;
        el.removeAttribute('data-artwork');
        var svg = el.firstChild;
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.display = 'block';
      }
    });
  }

  window.Artwork = {
    appShot: appShot,
    forCategory: forCategory,
    cover: cover,
    person: person,
    inject: inject
  };

  document.addEventListener('DOMContentLoaded', function () { inject(); });
})();

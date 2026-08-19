/* ==========================================================================
   STACKLY — Builder Core (app-builder.html)
   State, canvas rendering, drag & drop, selection, inline editing,
   properties panel, layers, pages, undo/redo, autosave.
   Component definitions live in components.js (window.BuilderComponents).
   Preview / share / publish flows live in preview.js (window.BuilderPreview).
   ========================================================================== */

(function () {
  'use strict';

  if (!window.AppStore || !AppStore.auth.requireAuth('login.html')) return;

  var C = window.BuilderComponents;

  var FONTS = [['', 'Inherit'], ["'Inter', sans-serif", 'Inter'], ["'Poppins', sans-serif", 'Poppins'], ["'Outfit', sans-serif", 'Outfit'], ["'Plus Jakarta Sans', sans-serif", 'Plus Jakarta Sans']];
  var PALETTE = ['#0F172A', '#475569', '#FFFFFF', '#7928AB', '#9A289C', '#5595E4', '#22C55E', '#F59E0B'];
  var SHADOWS = { none: 'none', sm: '0 2px 8px rgba(36,32,68,0.08)', md: '0 8px 24px rgba(36,32,68,0.12)', lg: '0 18px 48px rgba(36,32,68,0.18)' };

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */

  var state = {
    project: null,
    pages: [],            /* [{id, name, components: [{id, type, props}]}] */
    currentPageId: null,
    selectedId: null,
    device: 'desktop',
    dirty: false
  };
  var history = [];
  var future = [];
  var saveTimer = null;
  var suppressNew = false;

  function currentPage() {
    return state.pages.find(function (p) { return p.id === state.currentPageId; }) || state.pages[0];
  }
  function components() { return currentPage() ? currentPage().components : []; }
  function findComp(id) {
    return components().find(function (c) { return c.id === id; }) || null;
  }
  function compIndex(id) {
    return components().findIndex(function (c) { return c.id === id; });
  }

  /* ------------------------------------------------------------------
     Load / persist
     ------------------------------------------------------------------ */

  function starterComponents() {
    return ['navbar', 'heading', 'text', 'columns', 'button', 'footer'].map(function (type) {
      var comp = { id: AppStore.uid('cmp'), type: type, props: C.defaults(type) };
      if (type === 'heading') comp.props.align = 'center';
      if (type === 'button') { comp.props.align = 'center'; comp.props.wpct = 100; }
      return comp;
    });
  }

  function loadProject() {
    var m = window.location.search.match(/[?&]project=([^&]+)/);
    var id = m ? decodeURIComponent(m[1]) : null;
    var project = id ? AppStore.getProject(id) : null;

    if (!project) {
      /* playground scratch project */
      var pgId = AppStore.read('playground_project_id', null);
      project = pgId ? AppStore.getProject(pgId) : null;
      if (!project) {
        project = AppStore.addProject({ name: 'Playground', template: 'Blank Canvas' });
        AppStore.write('playground_project_id', project.id);
      }
    }
    state.project = project;

    var saved = AppStore.read('builder_' + project.id, null);
    if (saved && saved.pages && saved.pages.length) {
      state.pages = saved.pages;
      state.currentPageId = saved.currentPageId && saved.pages.some(function (p) { return p.id === saved.currentPageId; })
        ? saved.currentPageId : saved.pages[0].id;
    } else {
      state.pages = [
        { id: AppStore.uid('pg'), name: 'Home', components: starterComponents() },
        { id: AppStore.uid('pg'), name: 'About', components: [] },
        { id: AppStore.uid('pg'), name: 'Contact', components: [] }
      ];
      state.currentPageId = state.pages[0].id;
    }
  }

  function setSaveState(text, saving) {
    var el = document.getElementById('bd-savestate');
    el.textContent = text;
    el.classList.toggle('is-saving', !!saving);
  }

  function persist(showToast) {
    AppStore.write('builder_' + state.project.id, { pages: state.pages, currentPageId: state.currentPageId });
    var total = state.pages.reduce(function (a, p) { return a + p.components.length; }, 0);
    state.project = AppStore.updateProject(state.project.id, { components: total, pages: state.pages.length }) || state.project;
    state.dirty = false;
    setSaveState('Saved · just now', false);
    if (showToast) window.Toast.success('All changes saved to your workspace.', 'Project saved');
  }

  function scheduleSave() {
    state.dirty = true;
    setSaveState('Saving…', true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { persist(false); }, 800);
  }

  /* ------------------------------------------------------------------
     History (undo / redo)
     ------------------------------------------------------------------ */

  function snapshot() {
    return JSON.stringify({ pages: state.pages, currentPageId: state.currentPageId });
  }
  function pushHistory() {
    history.push(snapshot());
    if (history.length > 50) history.shift();
    future = [];
    updateHistoryButtons();
  }
  function restore(json) {
    var data = JSON.parse(json);
    state.pages = data.pages;
    state.currentPageId = data.currentPageId;
    state.selectedId = null;
    renderAll();
    scheduleSave();
  }
  function undo() {
    if (!history.length) return;
    future.push(snapshot());
    restore(history.pop());
    updateHistoryButtons();
  }
  function redo() {
    if (!future.length) return;
    history.push(snapshot());
    restore(future.pop());
    updateHistoryButtons();
  }
  function updateHistoryButtons() {
    document.getElementById('bd-undo').disabled = !history.length;
    document.getElementById('bd-redo').disabled = !future.length;
  }
  /* call BEFORE a mutation */
  function mutate(fn) {
    pushHistory();
    fn();
    scheduleSave();
  }

  /* ------------------------------------------------------------------
     Style application
     ------------------------------------------------------------------ */

  function boxStyle(p) {
    var s = '';
    if (p.pad >= 0) s += 'padding:' + p.pad + 'px;';
    if (p.bg) s += 'background:' + p.bg + ';';
    if (p.color) s += 'color:' + p.color + ';';
    if (p.font) s += 'font-family:' + p.font + ';';
    if (p.fsize > 0) s += 'font-size:' + p.fsize + 'px;';
    if (p.weight) s += 'font-weight:' + p.weight + ';';
    if (p.align) s += 'text-align:' + p.align + ';';
    if (p.radius >= 0) s += 'border-radius:' + p.radius + 'px;';
    if (p.bw > 0) s += 'border:' + p.bw + 'px solid ' + (p.bcolor || '#E2E8F0') + ';';
    if (p.shadow && p.shadow !== 'none') s += 'box-shadow:' + SHADOWS[p.shadow] + ';';
    if (p.minh > 0) s += 'min-height:' + p.minh + 'px;';
    if (p.wpct > 0 && p.wpct < 100) s += 'width:' + p.wpct + '%;margin-inline:auto;';
    return s;
  }
  function elStyle(p) {
    return p.mgn ? 'margin-top:' + p.mgn + 'px;margin-bottom:' + p.mgn + 'px;' : '';
  }
  function elClasses(comp) {
    var cls = 'cv-el';
    if (comp.id === state.selectedId) cls += ' is-selected';
    if (comp.props.hideM) cls += ' hide-mobile';
    if (comp.props.hideT) cls += ' hide-tablet';
    if (comp.props.anim && comp.props.anim !== 'none') cls += ' anim-' + comp.props.anim;
    return cls;
  }

  window.BuilderStyle = { boxStyle: boxStyle, elStyle: elStyle, shadows: SHADOWS };

  /* ------------------------------------------------------------------
     Canvas rendering
     ------------------------------------------------------------------ */

  function elHTML(comp, idx, total) {
    var def = C.get(comp.type);
    return '<div class="' + elClasses(comp) + (suppressNew ? '' : '') + '" data-id="' + comp.id + '" style="' + elStyle(comp.props) + '">' +
      '<span class="cv-tag">' + C.label(comp.type) + '</span>' +
      '<div class="cv-tools">' +
        '<button type="button" data-cv-act="up" data-tooltip="Move up" aria-label="Move up"' + (idx === 0 ? ' disabled' : '') + '>' + window.Icons.get('chevron-up') + '</button>' +
        '<button type="button" data-cv-act="down" data-tooltip="Move down" aria-label="Move down"' + (idx === total - 1 ? ' disabled' : '') + '>' + window.Icons.get('chevron-down') + '</button>' +
        '<span class="cv-tools-sep"></span>' +
        '<button type="button" data-cv-act="duplicate" data-tooltip="Duplicate" aria-label="Duplicate">' + window.Icons.get('copy') + '</button>' +
        '<button class="is-danger" type="button" data-cv-act="delete" data-tooltip="Delete" aria-label="Delete">' + window.Icons.get('trash') + '</button>' +
      '</div>' +
      (def && def.resizable ? '<span class="cv-resize" data-resize aria-hidden="true"></span>' : '') +
      '<div class="cv-box" style="' + boxStyle(comp.props) + '">' + C.render(comp.type, comp.props) + '</div>' +
    '</div>';
  }

  function renderCanvas() {
    var page = document.getElementById('canvas-page');
    var list = components();
    if (!list.length) {
      page.innerHTML = '<div class="canvas-empty">' + window.Icons.get('layers') +
        '<strong>This page is empty</strong>' +
        '<p>Drag components from the left panel — or click one — to start building "' + C.escapeHtml(currentPage().name) + '".</p></div>';
    } else {
      page.innerHTML = list.map(function (c, i) { return elHTML(c, i, list.length); }).join('');
    }
  }

  /* re-render a single element in place (fast path for prop edits) */
  function refreshComp(id) {
    var comp = findComp(id);
    var el = document.querySelector('.cv-el[data-id="' + id + '"]');
    if (!comp || !el) { renderCanvas(); return; }
    el.className = elClasses(comp);
    el.setAttribute('style', elStyle(comp.props));
    var box = el.querySelector(':scope > .cv-box');
    box.setAttribute('style', boxStyle(comp.props));
    box.innerHTML = C.render(comp.type, comp.props);
  }

  /* ------------------------------------------------------------------
     Left sidebar — components / layers / pages
     ------------------------------------------------------------------ */

  function renderCompGroups(filter) {
    var host = document.getElementById('comp-groups');
    var q = (filter || '').toLowerCase();
    var html = '';
    C.groups.forEach(function (g) {
      var types = g.types.filter(function (t) {
        return !q || C.label(t).toLowerCase().indexOf(q) !== -1;
      });
      if (!types.length) return;
      html += '<div class="bd-group"><div class="bd-group-title">' + g.label + '</div><div class="bd-comp-grid">' +
        types.map(function (t) {
          return '<button class="comp-tile" type="button" draggable="true" data-comp-type="' + t + '" aria-label="Add ' + C.label(t) + '">' +
            window.Icons.get(C.icon(t)) + '<span>' + C.label(t) + '</span></button>';
        }).join('') + '</div></div>';
    });
    host.innerHTML = html || '<div class="bd-empty">' + window.Icons.get('search') + '<p>No components match "' + C.escapeHtml(filter) + '".</p></div>';
  }

  function layerName(comp) {
    var p = comp.props;
    var txt = p.text || p.title || p.label || p.brand || p.caption || '';
    return txt ? C.label(comp.type) + ' · ' + txt : C.label(comp.type);
  }

  function renderLayers() {
    var host = document.getElementById('layers-list');
    var list = components();
    if (!list.length) {
      host.innerHTML = '<div class="bd-empty">' + window.Icons.get('layers') + '<p>No components on this page yet. Add some from the Components tab.</p></div>';
      return;
    }
    host.innerHTML = list.map(function (c, i) {
      return '<div class="layer-row' + (c.id === state.selectedId ? ' is-selected' : '') + '" data-layer-id="' + c.id + '" tabindex="0">' +
        '<span class="layer-ic">' + window.Icons.get(C.icon(c.type)) + '</span>' +
        '<span class="layer-name">' + C.escapeHtml(layerName(c)) + '</span>' +
        '<span class="layer-idx">' + (i + 1) + '</span>' +
        '<span class="layer-acts">' +
          '<button class="bd-btn" type="button" data-layer-act="up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + window.Icons.get('chevron-up') + '</button>' +
          '<button class="bd-btn" type="button" data-layer-act="down" aria-label="Move down"' + (i === list.length - 1 ? ' disabled' : '') + '>' + window.Icons.get('chevron-down') + '</button>' +
          '<button class="bd-btn" type="button" data-layer-act="duplicate" aria-label="Duplicate">' + window.Icons.get('copy') + '</button>' +
          '<button class="bd-btn is-danger" type="button" data-layer-act="delete" aria-label="Delete">' + window.Icons.get('trash') + '</button>' +
        '</span></div>';
    }).join('');
  }

  function renderPages() {
    var host = document.getElementById('pages-list');
    host.innerHTML = state.pages.map(function (p) {
      return '<div class="page-row' + (p.id === state.currentPageId ? ' is-active' : '') + '" data-page-id="' + p.id + '" tabindex="0">' +
        '<span class="layer-ic">' + window.Icons.get('card') + '</span>' +
        '<span class="page-name">' + C.escapeHtml(p.name) + '</span>' +
        '<span class="page-meta">' + p.components.length + ' blocks</span></div>';
    }).join('');
  }

  /* ------------------------------------------------------------------
     Properties panel
     ------------------------------------------------------------------ */

  function propRow(label, controlHTML, stack) {
    return '<div class="prop-row' + (stack ? ' is-stack' : '') + '"><span class="prop-label">' + label + '</span>' + controlHTML + '</div>';
  }
  function section(title, bodyHTML, collapsed) {
    return '<div class="prop-sec' + (collapsed ? ' is-collapsed' : '') + '">' +
      '<button class="prop-sec-head" type="button" aria-expanded="' + (!collapsed) + '">' + title + window.Icons.get('chevron-down') + '</button>' +
      '<div class="prop-sec-body">' + bodyHTML + '</div></div>';
  }
  function slider(key, min, max, val, unit) {
    return '<div class="prop-slider-wrap">' +
      '<input type="range" class="prop-range" min="' + min + '" max="' + max + '" value="' + val + '" data-prop="' + key + '" aria-label="' + key + '">' +
      '<span class="prop-val" data-prop-val="' + key + '">' + val + (unit || 'px') + '</span></div>';
  }
  function swatches(key, current, allowClear) {
    return '<div class="prop-swatches">' +
      (allowClear ? '<button class="prop-swatch is-clear' + (!current ? ' is-on' : '') + '" type="button" data-prop-swatch="' + key + '" data-swatch-value="" aria-label="No color"></button>' : '') +
      PALETTE.map(function (c) {
        return '<button class="prop-swatch' + (current === c ? ' is-on' : '') + '" type="button" style="background:' + c + '" data-prop-swatch="' + key + '" data-swatch-value="' + c + '" aria-label="' + c + '"></button>';
      }).join('') +
      '<input type="color" class="prop-color" value="' + (current && /^#/.test(current) ? current : '#7928AB') + '" data-prop-color="' + key + '" aria-label="Custom ' + key + ' color">' +
      '</div>';
  }
  function btngroup(key, options, current) {
    return '<div class="prop-btngroup">' + options.map(function (o) {
      return '<button type="button" data-prop-btn="' + key + '" data-btn-value="' + o[0] + '" class="' + (current === o[0] ? 'is-on' : '') + '" aria-label="' + o[1] + '">' + (o[2] || o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function switchRow(label, key, on) {
    return '<div class="prop-switchrow"><span class="prop-label">' + label + '</span>' +
      '<label class="bd-switch"><input type="checkbox" data-prop-switch="' + key + '"' + (on ? ' checked' : '') + '><span class="track"></span></label></div>';
  }

  function renderProps() {
    var host = document.getElementById('props-panel');
    var comp = state.selectedId ? findComp(state.selectedId) : null;

    if (!comp) {
      host.innerHTML = '<div class="prop-empty">' +
        '<span class="prop-empty-ic">' + window.Icons.get('edit') + '</span>' +
        '<strong>Nothing selected</strong>' +
        '<p>Select a component on the canvas to edit its content, style, and behavior.</p></div>';
      return;
    }

    var def = C.get(comp.type);
    var p = comp.props;
    var html = '<div class="prop-selected-head">' +
      '<span class="layer-ic">' + window.Icons.get(C.icon(comp.type)) + '</span>' +
      '<div><strong>' + C.label(comp.type) + '</strong><small>Block ' + (compIndex(comp.id) + 1) + ' of ' + components().length + '</small></div></div>';

    /* Content fields */
    if (def.fields && def.fields.length) {
      html += section('Content', def.fields.map(function (f) {
        var val = p[f.key];
        if (f.type === 'textarea') {
          return propRow(f.label, '<textarea class="prop-textarea" data-prop-field="' + f.key + '">' + C.escapeHtml(val) + '</textarea>', true);
        }
        if (f.type === 'select') {
          return propRow(f.label, '<select class="prop-select" data-prop-field="' + f.key + '">' + f.options.map(function (o) {
            return '<option value="' + o[0] + '"' + (String(val) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') + '</select>');
        }
        if (f.type === 'toggle') {
          return switchRow(f.label, '@field:' + f.key, !!val);
        }
        if (f.type === 'color') {
          return propRow(f.label, '<input type="color" class="prop-color" value="' + (val || '#7928AB') + '" data-prop-field-color="' + f.key + '">');
        }
        return propRow(f.label, '<input type="text" class="prop-input" value="' + C.escapeHtml(val) + '" data-prop-field="' + f.key + '">', f.label.length > 10);
      }).join(''));
    }

    /* Typography */
    if (def.typo) {
      html += section('Typography',
        propRow('Font', '<select class="prop-select" data-prop-sel="font">' + FONTS.map(function (f) {
          return '<option value="' + f[0].replace(/"/g, '&quot;') + '"' + (p.font === f[0] ? ' selected' : '') + '>' + f[1] + '</option>';
        }).join('') + '</select>') +
        propRow('Size', slider('fsize', 10, 64, p.fsize || 16)) +
        propRow('Weight', '<select class="prop-select" data-prop-sel="weight">' + [['', 'Default'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extrabold']].map(function (w) {
          return '<option value="' + w[0] + '"' + (String(p.weight) === w[0] ? ' selected' : '') + '>' + w[1] + '</option>';
        }).join('') + '</select>') +
        propRow('Align', btngroup('align', [['left', 'Left', window.Icons.get('arrow-left')], ['center', 'Center', window.Icons.get('minus')], ['right', 'Right', window.Icons.get('arrow-right')]], p.align || 'left'))
      );
    }

    /* Colors */
    html += section('Colors',
      propRow('Text', swatches('color', p.color, true), true) +
      propRow('Background', swatches('bg', p.bg, true), true)
    );

    /* Spacing */
    html += section('Spacing',
      propRow('Padding', slider('pad', 0, 64, Math.max(0, p.pad))) +
      propRow('Margin', slider('mgn', 0, 48, p.mgn || 0))
    );

    /* Border & Shadow */
    html += section('Border & Shadow',
      propRow('Radius', slider('radius', 0, 32, Math.max(0, p.radius))) +
      propRow('Border', slider('bw', 0, 6, p.bw || 0)) +
      propRow('B. color', '<input type="color" class="prop-color" value="' + (p.bcolor || '#E2E8F0') + '" data-prop-color="bcolor">') +
      propRow('Shadow', btngroup('shadow', [['none', 'None'], ['sm', 'S'], ['md', 'M'], ['lg', 'L']], p.shadow || 'none'))
    , true);

    /* Size */
    html += section('Size',
      propRow('Width', slider('wpct', 20, 100, p.wpct || 100, '%')) +
      (def.resizable ? propRow('Min height', slider('minh', 0, 600, p.minh || 0)) : '')
    , true);

    /* Animation */
    html += section('Animation',
      propRow('Entrance', '<select class="prop-select" data-prop-sel="anim">' + [['none', 'None'], ['fade', 'Fade in'], ['slide-up', 'Slide up'], ['zoom', 'Zoom in']].map(function (a) {
        return '<option value="' + a[0] + '"' + (p.anim === a[0] ? ' selected' : '') + '>' + a[1] + '</option>';
      }).join('') + '</select>')
    , true);

    /* Responsive */
    html += section('Responsive',
      switchRow('Hide on mobile', 'hideM', p.hideM) +
      switchRow('Hide on tablet', 'hideT', p.hideT)
    , true);

    host.innerHTML = html;
  }

  function updateAfterPropChange(id) {
    refreshComp(id);
    renderLayers();
  }

  /* ------------------------------------------------------------------
     Add / move / duplicate / delete
     ------------------------------------------------------------------ */

  function addComponent(type, index) {
    var comp = { id: AppStore.uid('cmp'), type: type, props: C.defaults(type) };
    mutate(function () {
      var list = components();
      if (index == null || index < 0 || index > list.length) list.push(comp);
      else list.splice(index, 0, comp);
    });
    state.selectedId = comp.id;
    renderAll();
    var el = document.querySelector('.cv-el[data-id="' + comp.id + '"]');
    if (el) {
      el.classList.add('is-new');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.Toast.success(C.label(type) + ' added to ' + currentPage().name + '.', 'Component added');
  }

  function moveComponent(id, dir) {
    var idx = compIndex(id);
    var to = idx + dir;
    if (idx === -1 || to < 0 || to >= components().length) return;
    mutate(function () {
      var list = components();
      var item = list.splice(idx, 1)[0];
      list.splice(to, 0, item);
    });
    renderAll();
  }

  function duplicateComponent(id) {
    var comp = findComp(id);
    if (!comp) return;
    var copy = { id: AppStore.uid('cmp'), type: comp.type, props: JSON.parse(JSON.stringify(comp.props)) };
    mutate(function () {
      components().splice(compIndex(id) + 1, 0, copy);
    });
    state.selectedId = copy.id;
    renderAll();
    window.Toast.info(C.label(comp.type) + ' duplicated.', 'Duplicated');
  }

  function deleteComponent(id) {
    var comp = findComp(id);
    if (!comp) return;
    mutate(function () {
      currentPage().components = components().filter(function (c) { return c.id !== id; });
    });
    if (state.selectedId === id) state.selectedId = null;
    renderAll();
    window.Toast.info(C.label(comp.type) + ' removed.', 'Deleted');
  }

  function select(id) {
    state.selectedId = id;
    document.querySelectorAll('.cv-el').forEach(function (el) {
      el.classList.toggle('is-selected', el.dataset.id === id);
    });
    renderLayers();
    renderProps();
  }

  /* ------------------------------------------------------------------
     Drag & drop
     ------------------------------------------------------------------ */

  var dragType = null;
  var dragExistingId = null;

  function dropIndexFromY(clientY) {
    var els = Array.prototype.slice.call(document.querySelectorAll('#canvas-page > .cv-el'));
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return els.length;
  }

  function positionIndicator(index) {
    var page = document.getElementById('canvas-page');
    var ind = document.getElementById('drop-indicator');
    var area = document.getElementById('canvas-area');
    var els = page.querySelectorAll(':scope > .cv-el');
    var pageRect = page.getBoundingClientRect();
    var areaRect = area.getBoundingClientRect();
    var y;
    if (!els.length) y = pageRect.top + 30;
    else if (index >= els.length) y = els[els.length - 1].getBoundingClientRect().bottom;
    else y = els[index].getBoundingClientRect().top;
    ind.style.display = 'block';
    ind.style.top = (y - areaRect.top + area.scrollTop - 2) + 'px';
    ind.style.left = (pageRect.left - areaRect.left + 10) + 'px';
    ind.style.right = (areaRect.right - pageRect.right + 10) + 'px';
  }

  function hideIndicator() {
    document.getElementById('drop-indicator').style.display = 'none';
    document.getElementById('canvas-page').classList.remove('is-dragover');
  }

  function initDnD() {
    var area = document.getElementById('canvas-area');

    document.addEventListener('dragstart', function (e) {
      var tile = e.target.closest('.comp-tile');
      if (tile) {
        dragType = tile.dataset.compType;
        dragExistingId = null;
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'copy';
        try { e.dataTransfer.setData('text/plain', dragType); } catch (err) { /* IE */ }
      }
    });
    document.addEventListener('dragend', function () {
      document.querySelectorAll('.comp-tile.is-dragging').forEach(function (t) { t.classList.remove('is-dragging'); });
      dragType = null;
      dragExistingId = null;
      hideIndicator();
    });

    area.addEventListener('dragover', function (e) {
      if (!dragType && !dragExistingId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = dragType ? 'copy' : 'move';
      document.getElementById('canvas-page').classList.add('is-dragover');
      positionIndicator(dropIndexFromY(e.clientY));
    });
    area.addEventListener('dragleave', function (e) {
      if (e.target === area) hideIndicator();
    });
    area.addEventListener('drop', function (e) {
      e.preventDefault();
      var index = dropIndexFromY(e.clientY);
      hideIndicator();
      if (dragType) {
        addComponent(dragType, index);
      }
      dragType = null;
    });
  }

  /* ------------------------------------------------------------------
     Resize handle (min-height drag)
     ------------------------------------------------------------------ */

  function initResize() {
    var resizing = null;
    document.addEventListener('mousedown', function (e) {
      var handle = e.target.closest('[data-resize]');
      if (!handle) return;
      var el = handle.closest('.cv-el');
      var comp = findComp(el.dataset.id);
      if (!comp) return;
      e.preventDefault();
      pushHistory();
      var box = el.querySelector(':scope > .cv-box');
      resizing = { comp: comp, startY: e.clientY, startH: box.getBoundingClientRect().height };
      document.body.style.cursor = 'ns-resize';
    });
    document.addEventListener('mousemove', function (e) {
      if (!resizing) return;
      var h = Math.max(60, Math.min(700, Math.round(resizing.startH + (e.clientY - resizing.startY))));
      resizing.comp.props.minh = h;
      refreshComp(resizing.comp.id);
    });
    document.addEventListener('mouseup', function () {
      if (!resizing) return;
      resizing = null;
      document.body.style.cursor = '';
      scheduleSave();
      renderProps();
    });
  }

  /* ------------------------------------------------------------------
     Inline text editing (double-click [data-edit])
     ------------------------------------------------------------------ */

  function initInlineEdit() {
    document.getElementById('canvas-page').addEventListener('dblclick', function (e) {
      var target = e.target.closest('[data-edit]');
      if (!target) return;
      var el = target.closest('.cv-el');
      var comp = findComp(el.dataset.id);
      if (!comp) return;
      var key = target.dataset.edit;
      target.setAttribute('contenteditable', 'true');
      target.focus();
      var range = document.createRange();
      range.selectNodeContents(target);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      function finish() {
        target.removeAttribute('contenteditable');
        var text = target.textContent.trim();
        if (text !== comp.props[key]) {
          pushHistory();
          comp.props[key] = text;
          scheduleSave();
          refreshComp(comp.id);
          renderLayers();
          renderProps();
        }
        target.removeEventListener('blur', finish);
        target.removeEventListener('keydown', onKey);
      }
      function onKey(ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); target.blur(); }
        if (ev.key === 'Escape') { target.textContent = comp.props[key]; target.blur(); }
        ev.stopPropagation();
      }
      target.addEventListener('blur', finish);
      target.addEventListener('keydown', onKey);
    });
  }

  /* ------------------------------------------------------------------
     Global click / input wiring
     ------------------------------------------------------------------ */

  function initEvents() {
    /* left sidebar tabs */
    document.querySelectorAll('[data-bd-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var side = tab.closest('.bd-side');
        side.querySelectorAll('.bd-tab').forEach(function (t) {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        side.querySelectorAll('.bd-panel-body').forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.bdPanel === tab.dataset.bdTab);
        });
      });
    });

    /* component search */
    document.getElementById('comp-search').addEventListener('input', function () {
      renderCompGroups(this.value);
    });

    /* click-to-add component tile */
    document.getElementById('comp-groups').addEventListener('click', function (e) {
      var tile = e.target.closest('.comp-tile');
      if (tile) addComponent(tile.dataset.compType, null);
    });

    /* canvas interactions */
    var canvasArea = document.getElementById('canvas-area');
    canvasArea.addEventListener('click', function (e) {
      var toolBtn = e.target.closest('[data-cv-act]');
      if (toolBtn) {
        var el = toolBtn.closest('.cv-el');
        var act = toolBtn.dataset.cvAct;
        if (act === 'up') moveComponent(el.dataset.id, -1);
        else if (act === 'down') moveComponent(el.dataset.id, 1);
        else if (act === 'duplicate') duplicateComponent(el.dataset.id);
        else if (act === 'delete') deleteComponent(el.dataset.id);
        return;
      }
      var cvEl = e.target.closest('.cv-el');
      if (cvEl) select(cvEl.dataset.id);
      else select(null);
    });

    /* layers */
    document.getElementById('layers-list').addEventListener('click', function (e) {
      var actBtn = e.target.closest('[data-layer-act]');
      var row = e.target.closest('[data-layer-id]');
      if (!row) return;
      var id = row.dataset.layerId;
      if (actBtn) {
        var act = actBtn.dataset.layerAct;
        if (act === 'up') moveComponent(id, -1);
        else if (act === 'down') moveComponent(id, 1);
        else if (act === 'duplicate') duplicateComponent(id);
        else if (act === 'delete') deleteComponent(id);
        return;
      }
      select(id);
      var el = document.querySelector('.cv-el[data-id="' + id + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    /* layer hover highlights canvas */
    document.getElementById('layers-list').addEventListener('mouseover', function (e) {
      var row = e.target.closest('[data-layer-id]');
      document.querySelectorAll('.cv-el.is-hover').forEach(function (el) { el.classList.remove('is-hover'); });
      if (row) {
        var el = document.querySelector('.cv-el[data-id="' + row.dataset.layerId + '"]');
        if (el) el.classList.add('is-hover');
      }
    });
    document.getElementById('layers-list').addEventListener('mouseleave', function () {
      document.querySelectorAll('.cv-el.is-hover').forEach(function (el) { el.classList.remove('is-hover'); });
    });

    /* pages */
    document.getElementById('pages-list').addEventListener('click', function (e) {
      var row = e.target.closest('[data-page-id]');
      if (!row) return;
      if (row.dataset.pageId === state.currentPageId) return;
      state.currentPageId = row.dataset.pageId;
      state.selectedId = null;
      renderAll();
      scheduleSave();
    });
    document.getElementById('bd-addpage').addEventListener('click', function () {
      var backdrop = window.Modal.custom({
        title: 'Add a page',
        size: 'sm',
        bodyHTML: '<div class="form-group"><label class="form-label" for="np-page">Page name</label>' +
          '<input class="form-control" id="np-page" placeholder="e.g. Pricing" maxlength="30"></div>',
        footHTML: '<button class="btn btn-secondary" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="button" data-page-create>Add page</button>'
      });
      var input = backdrop.querySelector('#np-page');
      setTimeout(function () { input.focus(); }, 100);
      backdrop.querySelector('[data-page-create]').addEventListener('click', function () {
        var name = input.value.trim() || 'Untitled';
        pushHistory();
        var page = { id: AppStore.uid('pg'), name: name, components: [] };
        state.pages.push(page);
        state.currentPageId = page.id;
        state.selectedId = null;
        window.Modal.close(backdrop);
        renderAll();
        scheduleSave();
        window.Toast.success('Page "' + name + '" added.', 'New page');
      });
    });

    /* properties panel */
    var props = document.getElementById('props-panel');
    props.addEventListener('click', function (e) {
      var head = e.target.closest('.prop-sec-head');
      if (head) {
        var sec = head.closest('.prop-sec');
        sec.classList.toggle('is-collapsed');
        head.setAttribute('aria-expanded', String(!sec.classList.contains('is-collapsed')));
        return;
      }
      var comp = state.selectedId ? findComp(state.selectedId) : null;
      if (!comp) return;

      var swatch = e.target.closest('[data-prop-swatch]');
      if (swatch) {
        pushHistory();
        comp.props[swatch.dataset.propSwatch] = swatch.dataset.swatchValue;
        scheduleSave();
        updateAfterPropChange(comp.id);
        renderProps();
        return;
      }
      var btn = e.target.closest('[data-prop-btn]');
      if (btn) {
        pushHistory();
        comp.props[btn.dataset.propBtn] = btn.dataset.btnValue;
        scheduleSave();
        updateAfterPropChange(comp.id);
        btn.closest('.prop-btngroup').querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
        });
      }
    });

    var propHistoryPending = false;
    function propEdit(comp, key, value) {
      if (!propHistoryPending) { pushHistory(); propHistoryPending = true; setTimeout(function () { propHistoryPending = false; }, 600); }
      comp.props[key] = value;
      scheduleSave();
    }

    props.addEventListener('input', function (e) {
      var comp = state.selectedId ? findComp(state.selectedId) : null;
      if (!comp) return;
      var t = e.target;
      if (t.dataset.propField != null) {
        propEdit(comp, t.dataset.propField, t.value);
        refreshComp(comp.id);
        renderLayers();
      } else if (t.dataset.propFieldColor != null) {
        propEdit(comp, t.dataset.propFieldColor, t.value);
        refreshComp(comp.id);
      } else if (t.dataset.prop != null) {
        var val = parseInt(t.value, 10);
        propEdit(comp, t.dataset.prop, val);
        var out = props.querySelector('[data-prop-val="' + t.dataset.prop + '"]');
        if (out) out.textContent = val + (t.dataset.prop === 'wpct' ? '%' : 'px');
        refreshComp(comp.id);
      } else if (t.dataset.propColor != null) {
        propEdit(comp, t.dataset.propColor, t.value);
        refreshComp(comp.id);
      }
    });
    props.addEventListener('change', function (e) {
      var comp = state.selectedId ? findComp(state.selectedId) : null;
      if (!comp) return;
      var t = e.target;
      if (t.dataset.propSel != null) {
        pushHistory();
        comp.props[t.dataset.propSel] = t.dataset.propSel === 'weight' ? t.value : t.value;
        scheduleSave();
        refreshComp(comp.id);
      } else if (t.dataset.propField != null && t.tagName === 'SELECT') {
        pushHistory();
        comp.props[t.dataset.propField] = t.value;
        scheduleSave();
        refreshComp(comp.id);
      } else if (t.dataset.propSwitch != null) {
        pushHistory();
        var key = t.dataset.propSwitch;
        if (key.indexOf('@field:') === 0) key = key.slice(7);
        comp.props[key] = t.checked;
        scheduleSave();
        refreshComp(comp.id);
      }
    });

    /* device seg */
    document.querySelectorAll('#bd-device-seg [data-device]').forEach(function (btn) {
      btn.addEventListener('click', function () { setDevice(btn.dataset.device); });
    });

    /* grid toggle */
    document.getElementById('bd-grid').addEventListener('click', function () {
      var area = document.getElementById('canvas-area');
      var on = area.classList.toggle('show-grid');
      this.classList.toggle('is-on', on);
      this.setAttribute('aria-pressed', String(on));
    });

    /* zoom */
    document.getElementById('bd-zoom').addEventListener('change', function () {
      document.getElementById('canvas-page').style.transform = 'scale(' + this.value + ')';
    });

    /* undo / redo */
    document.getElementById('bd-undo').addEventListener('click', undo);
    document.getElementById('bd-redo').addEventListener('click', redo);

    /* save */
    document.getElementById('bd-save').addEventListener('click', function () { persist(true); });

    /* app name inline edit */
    var nameEl = document.getElementById('bd-appname');
    function startNameEdit() {
      nameEl.setAttribute('contenteditable', 'true');
      nameEl.focus();
      var range = document.createRange();
      range.selectNodeContents(nameEl);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    nameEl.addEventListener('click', startNameEdit);
    nameEl.addEventListener('keydown', function (e) {
      if (nameEl.getAttribute('contenteditable') !== 'true' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startNameEdit();
        return;
      }
      if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
      if (e.key === 'Escape') { nameEl.textContent = state.project.name; nameEl.blur(); }
      e.stopPropagation();
    });
    nameEl.addEventListener('blur', function () {
      nameEl.removeAttribute('contenteditable');
      var name = nameEl.textContent.trim().slice(0, 60) || state.project.name;
      nameEl.textContent = name;
      if (name !== state.project.name) {
        state.project = AppStore.updateProject(state.project.id, { name: name }) || state.project;
        window.Toast.success('App renamed to "' + name + '".', 'Renamed');
      }
    });

    /* settings modal */
    document.getElementById('bd-settings').addEventListener('click', function () {
      var g = state.project.gradient || ['#7928AB', '#9A289C'];
      var backdrop = window.Modal.custom({
        title: 'App settings',
        bodyHTML:
          '<div class="form-group"><label class="form-label" for="st-name">App name</label>' +
          '<input class="form-control" id="st-name" maxlength="60"></div>' +
          '<div class="form-group"><label class="form-label" for="st-desc">Description</label>' +
          '<textarea class="form-control" id="st-desc" placeholder="What does this app do?" style="min-height:80px"></textarea></div>' +
          '<div class="form-group"><label class="form-label">Brand colors</label>' +
          '<div class="settings-color-row">' +
            '<input type="color" id="st-c1" value="' + g[0] + '" aria-label="Primary color">' +
            '<input type="color" id="st-c2" value="' + g[1] + '" aria-label="Secondary color">' +
            '<span class="settings-grad-preview" id="st-grad" style="background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')"></span>' +
          '</div><span class="form-hint">Used for the app thumbnail and default accents.</span></div>',
        footHTML:
          '<button class="btn btn-secondary" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="button" data-st-save>Save settings</button>'
      });
      backdrop.querySelector('#st-name').value = state.project.name;
      backdrop.querySelector('#st-desc').value = AppStore.read('builder_desc_' + state.project.id, '');
      function updateGrad() {
        backdrop.querySelector('#st-grad').style.background =
          'linear-gradient(135deg,' + backdrop.querySelector('#st-c1').value + ',' + backdrop.querySelector('#st-c2').value + ')';
      }
      backdrop.querySelector('#st-c1').addEventListener('input', updateGrad);
      backdrop.querySelector('#st-c2').addEventListener('input', updateGrad);
      backdrop.querySelector('[data-st-save]').addEventListener('click', function () {
        var name = backdrop.querySelector('#st-name').value.trim() || state.project.name;
        state.project = AppStore.updateProject(state.project.id, {
          name: name,
          gradient: [backdrop.querySelector('#st-c1').value, backdrop.querySelector('#st-c2').value]
        }) || state.project;
        AppStore.write('builder_desc_' + state.project.id, backdrop.querySelector('#st-desc').value.trim());
        document.getElementById('bd-appname').textContent = name;
        window.Modal.close(backdrop);
        window.Toast.success('App settings saved.', 'Settings');
      });
    });

    /* preview / share / publish (preview.js) */
    document.getElementById('bd-preview').addEventListener('click', function () {
      window.BuilderPreview.open();
    });
    document.getElementById('bd-share').addEventListener('click', function () {
      window.BuilderPreview.share();
    });
    document.getElementById('bd-publish').addEventListener('click', function () {
      window.BuilderPreview.publish(this);
    });

    /* keyboard shortcuts */
    document.addEventListener('keydown', function (e) {
      var editing = e.target.closest('input, textarea, select, [contenteditable="true"]');
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (editing) return;
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        if (editing) return;
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        persist(true);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId && !editing) {
        e.preventDefault();
        deleteComponent(state.selectedId);
      }
    });
  }

  function setDevice(device) {
    state.device = device;
    var area = document.getElementById('canvas-area');
    area.classList.remove('device-tablet', 'device-mobile');
    if (device === 'tablet') area.classList.add('device-tablet');
    if (device === 'mobile') area.classList.add('device-mobile');
    document.querySelectorAll('#bd-device-seg [data-device]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.device === device);
    });
    var caption = document.getElementById('canvas-caption');
    var meta = { desktop: ['monitor', 'Desktop · 1160px'], tablet: ['tablet', 'Tablet · 768px'], mobile: ['smartphone', 'Mobile · 390px'] }[device];
    caption.innerHTML = window.Icons.get(meta[0]) + ' ' + meta[1];
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  function renderAll() {
    renderCanvas();
    renderLayers();
    renderPages();
    renderProps();
  }

  window.BuilderCore = {
    state: state,
    components: components,
    currentPage: currentPage,
    renderAll: renderAll,
    persist: persist,
    setStatusBadge: function () {
      var badge = document.getElementById('bd-status');
      var live = state.project.status === 'published';
      badge.textContent = live ? 'Published' : 'Draft';
      badge.classList.toggle('is-published', live);
      badge.classList.toggle('is-draft', !live);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    loadProject();
    document.getElementById('bd-appname').textContent = state.project.name;
    document.title = state.project.name + ' · App Builder — Stackly';
    window.BuilderCore.setStatusBadge();

    var device = (AppStore.read('settings_prefs', {}) || {}).builder_device;
    renderCompGroups('');
    renderAll();
    if (device && device !== 'desktop') setDevice(device);
    initDnD();
    initResize();
    initInlineEdit();
    initEvents();
    window.Icons.inject();
    updateHistoryButtons();
  });
})();

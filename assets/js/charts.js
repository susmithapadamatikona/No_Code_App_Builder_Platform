/* ==========================================================================
   STACKLY — SVG Chart Engine (no libraries)
   API (container = element or selector):
     Charts.line(container,  { labels, series:[{name,data,color}], height, area })
     Charts.bars(container,  { labels, data, color, height, gradient })
     Charts.donut(container, { segments:[{label,value,color}], size, thickness, centerLabel })
     Charts.spark(container, { data, color, height })
   Charts re-render automatically on theme change.
   ========================================================================== */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const registry = [];

  function el(target) {
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function axisColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#7C8CA5' : '#94A3B8';
  }
  function gridColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.22)';
  }

  function niceMax(maxVal) {
    if (maxVal <= 0) return 10;
    const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const norm = maxVal / mag;
    let nice;
    if (norm <= 1) nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    return nice * mag;
  }

  function shortNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n));
  }

  /* ------------------------------------------------------------------ */

  function line(target, opts) {
    const host = el(target);
    if (!host) return;
    register(host, 'line', opts);

    const W = 600, H = opts.height || 260;
    const padL = 46, padR = 14, padT = 16, padB = 30;
    const labels = opts.labels || [];
    const series = opts.series || [];
    const maxRaw = Math.max.apply(null, series.flatMap(function (s) { return s.data; }).concat([1]));
    const max = niceMax(maxRaw);
    const iw = W - padL - padR, ih = H - padT - padB;

    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart chart-line', role: 'img', 'aria-label': opts.ariaLabel || 'Line chart', preserveAspectRatio: 'none', style: 'width:100%;height:auto;display:block;overflow:visible' });

    /* grid + y labels */
    for (let g = 0; g <= 4; g++) {
      const y = padT + ih - (ih * g / 4);
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: gridColor(), 'stroke-width': 1, 'stroke-dasharray': g === 0 ? '0' : '4 5' }));
      const t = svgEl('text', { x: padL - 9, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: axisColor(), 'font-family': 'Inter, sans-serif' });
      t.textContent = shortNum(max * g / 4);
      svg.appendChild(t);
    }
    /* x labels */
    labels.forEach(function (lb, i) {
      const step = Math.ceil(labels.length / 12);
      if (i % step !== 0) return;
      const x = padL + (labels.length === 1 ? iw / 2 : iw * i / (labels.length - 1));
      const t = svgEl('text', { x: x, y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: axisColor(), 'font-family': 'Inter, sans-serif' });
      t.textContent = lb;
      svg.appendChild(t);
    });

    series.forEach(function (s, si) {
      const color = s.color || ['#7928AB', '#47C1D1', '#22C55E', '#F59E0B'][si % 4];
      const pts = s.data.map(function (v, i) {
        const x = padL + (s.data.length === 1 ? iw / 2 : iw * i / (s.data.length - 1));
        const y = padT + ih - (ih * v / max);
        return [x, y];
      });
      let d = '';
      pts.forEach(function (p, i) {
        if (i === 0) { d = 'M' + p[0] + ',' + p[1]; return; }
        const prev = pts[i - 1];
        const cx = (prev[0] + p[0]) / 2;
        d += ' C' + cx + ',' + prev[1] + ' ' + cx + ',' + p[1] + ' ' + p[0] + ',' + p[1];
      });

      if (opts.area !== false) {
        const gid = 'cg' + Math.random().toString(36).slice(2, 8);
        const defs = svgEl('defs', {});
        const grad = svgEl('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
        grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.28 }));
        grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }));
        defs.appendChild(grad);
        svg.appendChild(defs);
        svg.appendChild(svgEl('path', { d: d + ' L' + (padL + iw) + ',' + (padT + ih) + ' L' + padL + ',' + (padT + ih) + ' Z', fill: 'url(#' + gid + ')', stroke: 'none' }));
      }

      const path = svgEl('path', { d: d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
      svg.appendChild(path);
      /* draw-in animation */
      try {
        const len = path.getTotalLength ? 1200 : 0;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)';
        requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
      } catch (e) { /* ignore */ }

      /* dots with tooltips */
      pts.forEach(function (p, i) {
        const dot = svgEl('circle', { cx: p[0], cy: p[1], r: 3.4, fill: color, stroke: '#fff', 'stroke-width': 1.5, style: 'cursor:pointer' });
        const tip = svgEl('title', {});
        tip.textContent = (s.name ? s.name + ' · ' : '') + (labels[i] || i) + ': ' + s.data[i].toLocaleString('en-US');
        dot.appendChild(tip);
        svg.appendChild(dot);
      });
    });

    host.innerHTML = '';
    host.appendChild(svg);
    if (series.length > 1 && opts.legend !== false) host.appendChild(legend(series));
  }

  /* ------------------------------------------------------------------ */

  function bars(target, opts) {
    const host = el(target);
    if (!host) return;
    register(host, 'bars', opts);

    const W = 600, H = opts.height || 260;
    const padL = 46, padR = 10, padT = 14, padB = 30;
    const labels = opts.labels || [];
    const data = opts.data || [];
    const max = niceMax(Math.max.apply(null, data.concat([1])));
    const iw = W - padL - padR, ih = H - padT - padB;
    const n = data.length || 1;
    const slot = iw / n;
    const bw = Math.min(slot * 0.55, 42);

    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart chart-bars', role: 'img', 'aria-label': opts.ariaLabel || 'Bar chart', preserveAspectRatio: 'none', style: 'width:100%;height:auto;display:block' });

    for (let g = 0; g <= 4; g++) {
      const y = padT + ih - (ih * g / 4);
      svg.appendChild(svgEl('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: gridColor(), 'stroke-width': 1, 'stroke-dasharray': g === 0 ? '0' : '4 5' }));
      const t = svgEl('text', { x: padL - 9, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: axisColor(), 'font-family': 'Inter, sans-serif' });
      t.textContent = shortNum(max * g / 4);
      svg.appendChild(t);
    }

    const gid = 'bg' + Math.random().toString(36).slice(2, 8);
    const defs = svgEl('defs', {});
    const grad = svgEl('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': opts.color || '#9A289C' }));
    grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': opts.color2 || opts.color || '#7928AB' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    data.forEach(function (v, i) {
      const h = ih * v / max;
      const x = padL + slot * i + (slot - bw) / 2;
      const y = padT + ih - h;
      const rect = svgEl('rect', { x: x, y: padT + ih, width: bw, height: 0, rx: Math.min(6, bw / 2.4), fill: 'url(#' + gid + ')', style: 'cursor:pointer;transition:height .9s cubic-bezier(0.4,0,0.2,1) ' + (i * 45) + 'ms, y .9s cubic-bezier(0.4,0,0.2,1) ' + (i * 45) + 'ms' });
      const tip = svgEl('title', {});
      tip.textContent = (labels[i] || i) + ': ' + v.toLocaleString('en-US');
      rect.appendChild(tip);
      svg.appendChild(rect);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          rect.setAttribute('height', Math.max(h, v > 0 ? 3 : 0));
          rect.setAttribute('y', y);
        });
      });

      const step = Math.ceil(n / 12);
      if (i % step === 0) {
        const t = svgEl('text', { x: padL + slot * i + slot / 2, y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: axisColor(), 'font-family': 'Inter, sans-serif' });
        t.textContent = labels[i] || '';
        svg.appendChild(t);
      }
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  /* ------------------------------------------------------------------ */

  function donut(target, opts) {
    const host = el(target);
    if (!host) return;
    register(host, 'donut', opts);

    const size = opts.size || 200;
    const thickness = opts.thickness || 26;
    const r = (size - thickness) / 2;
    const c = size / 2;
    const circ = 2 * Math.PI * r;
    const segments = opts.segments || [];
    const total = segments.reduce(function (a, s) { return a + s.value; }, 0) || 1;

    const svg = svgEl('svg', { viewBox: '0 0 ' + size + ' ' + size, class: 'chart chart-donut', role: 'img', 'aria-label': opts.ariaLabel || 'Donut chart', style: 'width:100%;max-width:' + size + 'px;height:auto;display:block;margin:0 auto' });

    svg.appendChild(svgEl('circle', { cx: c, cy: c, r: r, fill: 'none', stroke: gridColor(), 'stroke-width': thickness }));

    let offset = 0;
    segments.forEach(function (s, i) {
      const frac = s.value / total;
      const ring = svgEl('circle', {
        cx: c, cy: c, r: r, fill: 'none',
        stroke: s.color || ['#7928AB', '#9A289C', '#47C1D1', '#22C55E', '#F59E0B'][i % 5],
        'stroke-width': thickness, 'stroke-linecap': 'butt',
        'stroke-dasharray': '0 ' + circ,
        'stroke-dashoffset': -offset * circ,
        transform: 'rotate(-90 ' + c + ' ' + c + ')',
        style: 'transition: stroke-dasharray 1.1s cubic-bezier(0.4,0,0.2,1) ' + (i * 120) + 'ms;cursor:pointer'
      });
      const tip = svgEl('title', {});
      tip.textContent = s.label + ': ' + s.value.toLocaleString('en-US') + ' (' + Math.round(frac * 100) + '%)';
      ring.appendChild(tip);
      svg.appendChild(ring);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          ring.setAttribute('stroke-dasharray', (frac * circ - 1.5) + ' ' + circ);
        });
      });
      offset += frac;
    });

    if (opts.centerLabel) {
      const t1 = svgEl('text', { x: c, y: c - 3, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: document.documentElement.getAttribute('data-theme') === 'dark' ? '#F1F5F9' : '#0F172A', 'font-family': "'Plus Jakarta Sans', sans-serif" });
      t1.textContent = opts.centerLabel;
      svg.appendChild(t1);
      if (opts.centerSub) {
        const t2 = svgEl('text', { x: c, y: c + 17, 'text-anchor': 'middle', 'font-size': 11, fill: axisColor(), 'font-family': 'Inter, sans-serif' });
        t2.textContent = opts.centerSub;
        svg.appendChild(t2);
      }
    }

    host.innerHTML = '';
    host.appendChild(svg);
    if (opts.legend !== false) host.appendChild(legend(segments.map(function (s, i) {
      return { name: s.label + ' · ' + Math.round(s.value / total * 100) + '%', color: s.color || ['#7928AB', '#9A289C', '#47C1D1', '#22C55E', '#F59E0B'][i % 5] };
    })));
  }

  /* ------------------------------------------------------------------ */

  function spark(target, opts) {
    const host = el(target);
    if (!host) return;
    register(host, 'spark', opts);
    const W = 120, H = opts.height || 36;
    const data = opts.data || [];
    const max = Math.max.apply(null, data.concat([1]));
    const min = Math.min.apply(null, data.concat([0]));
    const range = max - min || 1;
    const pts = data.map(function (v, i) {
      return [(W * i / (data.length - 1 || 1)), H - 3 - (H - 6) * (v - min) / range];
    });
    const d = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    const color = opts.color || '#7928AB';
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart chart-spark', 'aria-hidden': 'true', preserveAspectRatio: 'none', style: 'width:100%;height:' + H + 'px;display:block' });
    svg.appendChild(svgEl('path', { d: d + ' L' + W + ',' + H + ' L0,' + H + ' Z', fill: color, opacity: 0.12, stroke: 'none' }));
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round' }));
    host.innerHTML = '';
    host.appendChild(svg);
  }

  /* ------------------------------------------------------------------ */

  function legend(items) {
    const box = document.createElement('div');
    box.className = 'chart-legend';
    box.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center;margin-top:14px;font-size:12.5px;color:var(--text-secondary)';
    items.forEach(function (it, i) {
      const item = document.createElement('span');
      item.style.cssText = 'display:inline-flex;align-items:center;gap:7px;font-weight:500';
      const dot = document.createElement('i');
      dot.style.cssText = 'width:10px;height:10px;border-radius:3px;background:' + (it.color || ['#7928AB', '#47C1D1', '#22C55E', '#F59E0B'][i % 4]);
      item.appendChild(dot);
      item.appendChild(document.createTextNode(it.name || ''));
      box.appendChild(item);
    });
    return box;
  }

  function register(host, type, opts) {
    for (let i = 0; i < registry.length; i++) {
      if (registry[i].host === host) { registry[i] = { host: host, type: type, opts: opts }; return; }
    }
    registry.push({ host: host, type: type, opts: opts });
  }

  /* Re-render all charts when theme flips (grid/axis colors change) */
  document.addEventListener('themechange', function () {
    registry.slice().forEach(function (r) {
      if (document.body.contains(r.host)) window.Charts[r.type](r.host, r.opts);
    });
  });

  window.Charts = { line: line, bars: bars, donut: donut, spark: spark };
})();

/* ==========================================================================
   STACKLY — User Analytics Page (analytics.html)
   Renders KPI cards, charts, top-apps table, and activity feed for the
   selected reporting period. Uses DashShell helpers + Charts.
   ========================================================================== */

(function () {
  'use strict';

  if (!window.AppStore || !AppStore.auth.isLoggedIn()) return;

  var D = null;
  var period = 30;

  /* Base metrics per period (scaled deterministic demo data) */
  var BASE = {
    7:  { visitors: 6420,  active: 1180, views: 31200,  conversions: 342,  downloads: 96,  growth: 4.2 },
    30: { visitors: 24800, active: 3420, views: 132400, conversions: 1284, downloads: 388, growth: 18.4 },
    90: { visitors: 68400, active: 8210, views: 361800, conversions: 3510, downloads: 1043, growth: 42.7 }
  };

  function labelsFor(p) {
    var out = [];
    if (p === 7) {
      for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        out.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else {
      var points = p === 30 ? 10 : 12;
      for (var j = points - 1; j >= 0; j--) {
        var dd = new Date();
        dd.setDate(dd.getDate() - Math.round(j * (p / points)));
        out.push(dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }
    return out;
  }

  function renderStats() {
    var b = BASE[period];
    var stats = [
      { label: 'Total Visitors', value: b.visitors, icon: 'users', tint: 'tint-purple', trend: '+' + b.growth + '%', color: '#7928AB', seed: 3 },
      { label: 'Active Users', value: b.active, icon: 'zap', tint: 'tint-blue', trend: '+9.6%', color: '#47C1D1', seed: 5 },
      { label: 'App Views', value: b.views, icon: 'eye', tint: 'tint-green', trend: '+12.8%', color: '#22C55E', seed: 7 },
      { label: 'Conversions', value: b.conversions, icon: 'check-circle', tint: 'tint-orange', trend: '+6.1%', color: '#F59E0B', seed: 9 }
    ];
    var host = document.getElementById('an-stats');
    host.innerHTML = stats.map(function (s, i) {
      return '<article class="card dash-stat">' +
        '<div class="dash-stat-top"><span class="stat-icon ' + s.tint + '"><i data-icon="' + s.icon + '"></i></span>' +
        '<span class="stat-trend is-up"><i data-icon="trend-up"></i>' + s.trend + '</span></div>' +
        '<div class="stat-value">' + D.fmtNum(s.value) + '</div>' +
        '<div class="stat-label">' + s.label + '</div>' +
        '<div class="dash-spark" id="an-spark-' + i + '"></div></article>';
    }).join('');
    stats.forEach(function (s, i) {
      window.Charts.spark('#an-spark-' + i, { data: D.series(s.seed * period, 12, s.value / 14, s.value / 22), color: s.color });
    });
    window.Icons.inject(host);
  }

  function renderCharts() {
    var b = BASE[period];
    var labels = labelsFor(period);
    var n = labels.length;

    window.Charts.line('#an-main-chart', {
      labels: labels,
      series: [
        { name: 'Visitors', data: D.series(period * 2, n, b.visitors / n, b.visitors / (n * 1.6)), color: '#7928AB' },
        { name: 'Active users', data: D.series(period * 3, n, b.active / n, b.active / (n * 1.4)), color: '#47C1D1' }
      ],
      height: 260,
      ariaLabel: 'Visitors and active users over the selected period'
    });

    window.Charts.bars('#an-growth-chart', {
      labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      data: [1240, 1810, 2260, 2140, 2980, 3620],
      color: '#9A289C', color2: '#7928AB',
      height: 260,
      ariaLabel: 'Monthly user growth'
    });

    window.Charts.donut('#an-device-chart', {
      segments: [
        { label: 'Desktop', value: 58, color: '#7928AB' },
        { label: 'Mobile', value: 33, color: '#47C1D1' },
        { label: 'Tablet', value: 9, color: '#9A289C' }
      ],
      size: 190, thickness: 24,
      centerLabel: '58%', centerSub: 'desktop',
      ariaLabel: 'Traffic by device'
    });

    window.Charts.donut('#an-sources-chart', {
      segments: [
        { label: 'Direct', value: 38, color: '#7928AB' },
        { label: 'Organic search', value: 27, color: '#22C55E' },
        { label: 'Social', value: 21, color: '#9A289C' },
        { label: 'Referral', value: 14, color: '#F59E0B' }
      ],
      size: 190, thickness: 24,
      centerLabel: D.fmtNum(BASE[period].visitors), centerSub: 'visitors',
      ariaLabel: 'Traffic sources'
    });
  }

  function renderTopApps() {
    var host = document.getElementById('an-top-apps');
    var apps = AppStore.getProjects().slice().sort(function (a, b) { return (b.views || 0) - (a.views || 0); }).slice(0, 5);
    if (!apps.length) {
      host.innerHTML = '<div class="empty-state"><div class="empty-icon"><i data-icon="chart"></i></div>' +
        '<h3>No data yet</h3><p>Publish an app to start collecting analytics.</p>' +
        '<a class="btn btn-primary" href="projects.html">Go to projects</a></div>';
    } else {
      host.innerHTML = '<div class="table-wrap" style="border:none;box-shadow:none"><table class="table" style="min-width:520px">' +
        '<thead><tr><th>App</th><th>Views</th><th>Visitors</th><th>Conv.</th><th>Conv. rate</th></tr></thead><tbody>' +
        apps.map(function (p) {
          var rate = p.visitors ? Math.min(100, Math.round((p.conversions / p.visitors) * 1000) / 10) : 0;
          return '<tr><td><div class="proj-cell"><span class="proj-thumb" style="' + D.gradientCSS(p.gradient) + '">' + D.thumbSVG() + '</span>' +
            '<a class="cell-strong" href="project-details.html?id=' + p.id + '">' + D.esc(p.name) + '</a></div></td>' +
            '<td>' + D.fmtNum(p.views) + '</td><td>' + D.fmtNum(p.visitors) + '</td><td>' + D.fmtNum(p.conversions) + '</td>' +
            '<td><div class="conv-cell"><div class="progress"><div class="progress-bar" data-value="' + Math.min(100, rate * 12) + '"></div></div>' +
            '<span>' + rate + '%</span></div></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    window.Icons.inject(host);
    D.animateBars(host);
  }

  function renderActivity() {
    var host = document.getElementById('an-activity');
    var tints = { publish: 'tint-green', edit: 'tint-purple', template: 'tint-blue', team: 'tint-orange', milestone: 'tint-green', create: 'tint-purple', delete: 'tint-red' };
    var list = AppStore.getActivity().slice(0, 6);
    host.innerHTML = list.length
      ? '<div class="feed">' + list.map(function (a) {
          return '<div class="feed-item"><span class="feed-icon ' + (tints[a.type] || 'tint-purple') + '"><i data-icon="' + D.esc(a.icon || 'edit') + '"></i></span>' +
            '<div class="feed-body"><p>' + D.esc(a.text) + '</p><time>' + D.esc(a.time) + '</time></div></div>';
        }).join('') + '</div>'
      : '<div class="empty-state"><div class="empty-icon"><i data-icon="clock"></i></div><h3>No activity yet</h3><p>Workspace events will appear here.</p></div>';
    window.Icons.inject(host);
  }

  function renderAll() {
    var badge = document.querySelector('[data-period-badge]');
    if (badge) badge.textContent = 'Last ' + period + ' days';
    var sub = document.getElementById('an-period-sub');
    if (sub) sub.textContent = 'Performance across all your published apps — last ' + period + ' days.';
    renderStats();
    renderCharts();
    renderTopApps();
    renderActivity();
  }

  document.addEventListener('DOMContentLoaded', function () {
    D = window.DashShell;
    if (!D) return;

    document.querySelectorAll('#period-tabs [data-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        period = parseInt(btn.dataset.period, 10);
        document.querySelectorAll('#period-tabs [data-period]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderAll();
      });
    });

    var dl = document.querySelector('[data-download-report]');
    if (dl) {
      dl.addEventListener('click', function () {
        dl.classList.add('is-loading');
        setTimeout(function () {
          dl.classList.remove('is-loading');
          window.Toast.success('Analytics report for the last ' + period + ' days was generated (demo).', 'Report ready');
        }, 900);
      });
    }

    renderAll();
  });
})();

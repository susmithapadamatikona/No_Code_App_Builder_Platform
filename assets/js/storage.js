/* ==========================================================================
   STACKLY — Storage Layer (LocalStorage / SessionStorage)
   Seeds demo data on first visit and exposes a tiny data API used by
   every page: AppStore.*
   ========================================================================== */

(function () {
  'use strict';

  const LS_PREFIX = 'appflow_';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    } catch (e) { /* storage full / private mode — demo data only */ }
  }

  function remove(key) {
    localStorage.removeItem(LS_PREFIX + key);
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  /* ------------------------------------------------------------------
     Seed data
     ------------------------------------------------------------------ */

  const SEED_TEMPLATES = [
    { id: 'tpl-crm-pro', name: 'NovaCRM Pro', category: 'CRM', industry: 'Sales', tier: 'premium', price: 49, rating: 4.9, reviews: 214, uses: 12840, gradient: ['#7928AB', '#9A289C'], icon: 'users', desc: 'A complete customer relationship suite with pipelines, contact management, deal tracking, and sales analytics.', pages: ['Dashboard', 'Contacts', 'Pipeline', 'Deals', 'Reports', 'Settings'], components: ['Kanban Board', 'Data Tables', 'Charts', 'Forms', 'Activity Feed'], tags: ['crm', 'sales', 'pipeline'] },
    { id: 'tpl-shopkit', name: 'ShopKit Commerce', category: 'E-Commerce', industry: 'Retail', tier: 'premium', price: 59, rating: 4.8, reviews: 342, uses: 18930, gradient: ['#5595E4', '#47C1D1'], icon: 'cart', desc: 'A modern storefront with product catalogs, cart flows, checkout screens, and order management dashboards.', pages: ['Storefront', 'Product', 'Cart', 'Checkout', 'Orders', 'Inventory'], components: ['Product Grid', 'Cart Drawer', 'Payment Form', 'Order Table'], tags: ['store', 'shop', 'retail'] },
    { id: 'tpl-medicare', name: 'MediCare Portal', category: 'Healthcare', industry: 'Healthcare', tier: 'premium', price: 55, rating: 4.9, reviews: 168, uses: 7420, gradient: ['#22C55E', '#47C1D1'], icon: 'heart', desc: 'Patient portal with appointment booking, doctor profiles, medical records, and telehealth screens.', pages: ['Home', 'Appointments', 'Doctors', 'Records', 'Prescriptions'], components: ['Booking Calendar', 'Profile Cards', 'Timeline', 'Forms'], tags: ['clinic', 'patients', 'medical'] },
    { id: 'tpl-edulearn', name: 'EduLearn LMS', category: 'Education', industry: 'Education', tier: 'free', price: 0, rating: 4.7, reviews: 452, uses: 24610, gradient: ['#F59E0B', '#EF4444'], icon: 'book', desc: 'Learning management system with courses, lessons, quizzes, progress tracking, and student dashboards.', pages: ['Courses', 'Lesson', 'Quiz', 'Progress', 'Certificates'], components: ['Course Cards', 'Video Player', 'Progress Bars', 'Quiz Forms'], tags: ['lms', 'courses', 'school'] },
    { id: 'tpl-finflow', name: 'FinFlow Banking', category: 'Finance', industry: 'Finance', tier: 'premium', price: 69, rating: 4.9, reviews: 198, uses: 9350, gradient: ['#0F172A', '#7928AB'], icon: 'chart', desc: 'Fintech dashboard with balances, transactions, budgets, card management, and spending analytics.', pages: ['Overview', 'Transactions', 'Cards', 'Budgets', 'Analytics'], components: ['Balance Cards', 'Charts', 'Transaction Table', 'Transfer Form'], tags: ['fintech', 'banking', 'wallet'] },
    { id: 'tpl-realnest', name: 'RealNest Estates', category: 'Real Estate', industry: 'Real Estate', tier: 'premium', price: 45, rating: 4.6, reviews: 121, uses: 6280, gradient: ['#9A289C', '#EC4899'], icon: 'home', desc: 'Property marketplace with listings, map search, agent profiles, and mortgage calculators.', pages: ['Listings', 'Property', 'Agents', 'Favorites', 'Contact'], components: ['Listing Cards', 'Gallery', 'Filters', 'Calculator'], tags: ['property', 'listings', 'agents'] },
    { id: 'tpl-tasteria', name: 'Tasteria Restaurant', category: 'Restaurant', industry: 'Hospitality', tier: 'free', price: 0, rating: 4.5, reviews: 289, uses: 15720, gradient: ['#EF4444', '#F59E0B'], icon: 'food', desc: 'Restaurant site with menus, table reservations, online ordering, and delivery tracking screens.', pages: ['Home', 'Menu', 'Reservations', 'Order', 'Track'], components: ['Menu Cards', 'Booking Form', 'Cart', 'Status Tracker'], tags: ['food', 'menu', 'booking'] },
    { id: 'tpl-bookly', name: 'Bookly Appointments', category: 'Booking', industry: 'Services', tier: 'free', price: 0, rating: 4.7, reviews: 334, uses: 19860, gradient: ['#47C1D1', '#22C55E'], icon: 'calendar', desc: 'Universal booking system with service catalogs, staff calendars, reminders, and payment screens.', pages: ['Services', 'Book', 'Calendar', 'Clients', 'Payments'], components: ['Calendar', 'Time Slots', 'Service Cards', 'Forms'], tags: ['booking', 'appointments', 'scheduling'] },
    { id: 'tpl-eventra', name: 'Eventra Events', category: 'Events', industry: 'Entertainment', tier: 'premium', price: 39, rating: 4.6, reviews: 143, uses: 5940, gradient: ['#EC4899', '#9A289C'], icon: 'ticket', desc: 'Event platform with schedules, speaker lineups, ticketing flows, and attendee check-in.', pages: ['Events', 'Details', 'Tickets', 'Speakers', 'Schedule'], components: ['Event Cards', 'Countdown', 'Ticket Form', 'Agenda'], tags: ['events', 'tickets', 'conference'] },
    { id: 'tpl-foliox', name: 'FolioX Portfolio', category: 'Portfolio', industry: 'Creative', tier: 'free', price: 0, rating: 4.8, reviews: 521, uses: 31240, gradient: ['#111827', '#9A289C'], icon: 'layers', desc: 'Designer portfolio with case studies, galleries, testimonials, and a contact pipeline.', pages: ['Home', 'Work', 'Case Study', 'About', 'Contact'], components: ['Gallery', 'Cards', 'Testimonials', 'Contact Form'], tags: ['portfolio', 'creative', 'showcase'] },
    { id: 'tpl-taskhive', name: 'TaskHive Productivity', category: 'Productivity', industry: 'SaaS', tier: 'premium', price: 42, rating: 4.9, reviews: 276, uses: 14530, gradient: ['#7928AB', '#47C1D1'], icon: 'check', desc: 'Project management workspace with boards, sprints, timelines, and team workload views.', pages: ['Boards', 'Sprints', 'Timeline', 'Team', 'Reports'], components: ['Kanban', 'Gantt', 'Task Cards', 'Filters'], tags: ['tasks', 'projects', 'kanban'] },
    { id: 'tpl-hrcentral', name: 'HR Central Suite', category: 'HR', industry: 'Corporate', tier: 'premium', price: 52, rating: 4.7, reviews: 118, uses: 4870, gradient: ['#22C55E', '#7928AB'], icon: 'users', desc: 'People-ops platform with employee directories, leave management, payroll views, and onboarding flows.', pages: ['Directory', 'Leave', 'Payroll', 'Onboarding', 'Reviews'], components: ['Profile Cards', 'Calendar', 'Tables', 'Workflows'], tags: ['hr', 'people', 'payroll'] },
    { id: 'tpl-marketio', name: 'Marketio Campaigns', category: 'Marketing', industry: 'Marketing', tier: 'free', price: 0, rating: 4.5, reviews: 203, uses: 11380, gradient: ['#F59E0B', '#EC4899'], icon: 'megaphone', desc: 'Campaign manager with landing pages, email flows, audience segments, and performance analytics.', pages: ['Campaigns', 'Audiences', 'Emails', 'Landing Pages', 'Analytics'], components: ['Campaign Cards', 'Charts', 'Segments', 'Email Builder'], tags: ['marketing', 'campaigns', 'email'] },
    { id: 'tpl-saasbase', name: 'SaaSbase Starter', category: 'SaaS', industry: 'SaaS', tier: 'premium', price: 64, rating: 4.9, reviews: 387, uses: 21050, gradient: ['#32287D', '#7928AB'], icon: 'rocket', desc: 'Full SaaS product shell with marketing site, auth flows, billing screens, and an admin console.', pages: ['Landing', 'Auth', 'Dashboard', 'Billing', 'Admin'], components: ['Pricing Tables', 'Auth Forms', 'Charts', 'Settings'], tags: ['saas', 'startup', 'billing'] },
    { id: 'tpl-dashio', name: 'Dashio Analytics', category: 'Dashboard', industry: 'SaaS', tier: 'free', price: 0, rating: 4.8, reviews: 465, uses: 28760, gradient: ['#47C1D1', '#7928AB'], icon: 'chart', desc: 'Analytics dashboard kit with KPI cards, charts, funnels, cohort tables, and report builders.', pages: ['Overview', 'Reports', 'Funnels', 'Cohorts', 'Exports'], components: ['KPI Cards', 'Line Charts', 'Donut Charts', 'Tables'], tags: ['dashboard', 'analytics', 'kpi'] },
    { id: 'tpl-bizsuite', name: 'BizSuite Corporate', category: 'Business', industry: 'Corporate', tier: 'free', price: 0, rating: 4.4, reviews: 176, uses: 13490, gradient: ['#1E293B', '#5595E4'], icon: 'briefcase', desc: 'Corporate business site with services, team pages, case studies, and lead-capture forms.', pages: ['Home', 'Services', 'Team', 'Cases', 'Contact'], components: ['Hero', 'Service Cards', 'Team Grid', 'Forms'], tags: ['business', 'corporate', 'agency'] }
  ];

  const SEED_PROJECTS = [
    { id: 'prj-1', name: 'Aurora CRM', template: 'NovaCRM Pro', templateId: 'tpl-crm-pro', status: 'published', gradient: ['#7928AB', '#9A289C'], views: 12480, visitors: 8210, conversions: 342, pages: 6, components: 48, created: '2026-05-12', modified: '2026-08-14', domain: 'aurora-crm.appflow.site' },
    { id: 'prj-2', name: 'Bloom Store', template: 'ShopKit Commerce', templateId: 'tpl-shopkit', status: 'published', gradient: ['#5595E4', '#47C1D1'], views: 9340, visitors: 6120, conversions: 518, pages: 8, components: 62, created: '2026-06-02', modified: '2026-08-11', domain: 'bloom-store.appflow.site' },
    { id: 'prj-3', name: 'FitTrack Studio', template: 'Bookly Appointments', templateId: 'tpl-bookly', status: 'draft', gradient: ['#47C1D1', '#22C55E'], views: 0, visitors: 0, conversions: 0, pages: 4, components: 27, created: '2026-07-19', modified: '2026-08-16', domain: null },
    { id: 'prj-4', name: 'Lumen Portfolio', template: 'FolioX Portfolio', templateId: 'tpl-foliox', status: 'published', gradient: ['#111827', '#9A289C'], views: 4210, visitors: 3480, conversions: 96, pages: 5, components: 31, created: '2026-04-28', modified: '2026-07-30', domain: 'lumen.appflow.site' },
    { id: 'prj-5', name: 'Everest HR Portal', template: 'HR Central Suite', templateId: 'tpl-hrcentral', status: 'draft', gradient: ['#22C55E', '#7928AB'], views: 0, visitors: 0, conversions: 0, pages: 3, components: 19, created: '2026-08-05', modified: '2026-08-17', domain: null }
  ];

  const SEED_ACTIVITY = [
    { id: 'act-1', type: 'publish', text: 'Published Aurora CRM to aurora-crm.appflow.site', time: '2 hours ago', icon: 'rocket' },
    { id: 'act-2', type: 'edit', text: 'Edited 4 components in Everest HR Portal', time: '5 hours ago', icon: 'edit' },
    { id: 'act-3', type: 'template', text: 'Used template ShopKit Commerce', time: 'Yesterday', icon: 'layers' },
    { id: 'act-4', type: 'team', text: 'Sarah Kim commented on Bloom Store checkout page', time: 'Yesterday', icon: 'chat' },
    { id: 'act-5', type: 'milestone', text: 'Aurora CRM passed 12,000 total views', time: '2 days ago', icon: 'chart' },
    { id: 'act-6', type: 'edit', text: 'Updated brand colors in FitTrack Studio', time: '3 days ago', icon: 'palette' }
  ];

  const SEED_NOTIFICATIONS = [
    { id: 'ntf-1', title: 'Publish successful', msg: 'Aurora CRM is now live on your custom domain.', time: '2h ago', read: false, type: 'success' },
    { id: 'ntf-2', title: 'New template drop', msg: '6 new premium templates were added to the marketplace.', time: '1d ago', read: false, type: 'info' },
    { id: 'ntf-3', title: 'Storage at 68%', msg: 'You are approaching your plan storage limit.', time: '2d ago', read: true, type: 'warning' },
    { id: 'ntf-4', title: 'Team invite accepted', msg: 'Sarah Kim joined your workspace as an Editor.', time: '3d ago', read: true, type: 'success' }
  ];

  const SEED_INTEGRATIONS = [
    { id: 'int-google', name: 'Google', desc: 'Sign-in, Analytics, and Workspace sync for your published apps.', color: '#EA4335', connected: true, category: 'Productivity' },
    { id: 'int-slack', name: 'Slack', desc: 'Send build, publish, and form-submission alerts to channels.', color: '#611F69', connected: true, category: 'Communication' },
    { id: 'int-stripe', name: 'Stripe', desc: 'Accept payments and subscriptions inside your apps.', color: '#635BFF', connected: false, category: 'Payments' },
    { id: 'int-mailchimp', name: 'Mailchimp', desc: 'Sync form leads into audiences and automated journeys.', color: '#FFE01B', connected: false, category: 'Marketing' },
    { id: 'int-shopify', name: 'Shopify', desc: 'Pull products, inventory, and orders into commerce apps.', color: '#95BF47', connected: false, category: 'E-Commerce' },
    { id: 'int-zapier', name: 'Zapier', desc: 'Automate 6,000+ app workflows triggered by your app events.', color: '#FF4F00', connected: true, category: 'Automation' },
    { id: 'int-sheets', name: 'Google Sheets', desc: 'Use spreadsheets as a live data source for tables and charts.', color: '#0F9D58', connected: false, category: 'Data' },
    { id: 'int-rest', name: 'REST API', desc: 'Connect any REST endpoint with auth headers and mapping.', color: '#7928AB', connected: false, category: 'Developer' },
    { id: 'int-webhooks', name: 'Webhooks', desc: 'Fire outbound webhooks on form submits and record changes.', color: '#47C1D1', connected: true, category: 'Developer' },
    { id: 'int-razor', name: 'Payment Gateway', desc: 'Regional payment gateway with UPI, cards, and wallets.', color: '#22C55E', connected: false, category: 'Payments' }
  ];

  function seed() {
    if (read('seeded_v1', false)) return;
    write('templates', SEED_TEMPLATES);
    write('projects', SEED_PROJECTS);
    write('activity', SEED_ACTIVITY);
    write('notifications', SEED_NOTIFICATIONS);
    write('integrations', SEED_INTEGRATIONS);
    write('favorites', ['tpl-saasbase', 'tpl-dashio']);
    write('users', [
      { id: 'usr-demo', name: 'Alex Morgan', email: 'demo@appflow.io', password: 'demo1234', role: 'user', plan: 'Pro', company: 'Northwind Studio', phone: '+1 555 0147', joined: '2026-03-02' },
      { id: 'usr-admin', name: 'Jordan Reyes', email: 'admin@appflow.io', password: 'admin1234', role: 'admin', plan: 'Business', company: 'Stackly HQ', phone: '+1 555 0101', joined: '2025-11-18' }
    ]);
    write('seeded_v1', true);
  }

  /* ------------------------------------------------------------------
     Auth (demo only — session lives in sessionStorage, "remember me"
     mirrors it into localStorage)
     ------------------------------------------------------------------ */

  const Auth = {
    login(email, password, remember) {
      const users = read('users', []);
      const user = users.find(function (u) {
        return u.email.toLowerCase() === String(email).toLowerCase() && u.password === password;
      });
      if (!user) return { ok: false, error: 'Invalid email or password. Try the demo accounts below.' };
      const session = { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, loginAt: Date.now() };
      sessionStorage.setItem(LS_PREFIX + 'session', JSON.stringify(session));
      if (remember) write('remember_session', session);
      else remove('remember_session');
      return { ok: true, user: session };
    },
    register(data) {
      const users = read('users', []);
      if (users.some(function (u) { return u.email.toLowerCase() === data.email.toLowerCase(); })) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      const user = {
        id: uid('usr'), name: data.name, email: data.email, password: data.password,
        role: 'user', plan: 'Free', company: data.company || '', phone: data.phone || '',
        joined: new Date().toISOString().slice(0, 10)
      };
      users.push(user);
      write('users', users);
      return { ok: true, user: user };
    },
    logout() {
      sessionStorage.removeItem(LS_PREFIX + 'session');
      remove('remember_session');
    },
    current() {
      try {
        const s = sessionStorage.getItem(LS_PREFIX + 'session');
        if (s) return JSON.parse(s);
      } catch (e) { /* ignore */ }
      const remembered = read('remember_session', null);
      if (remembered) {
        sessionStorage.setItem(LS_PREFIX + 'session', JSON.stringify(remembered));
        return remembered;
      }
      return null;
    },
    isLoggedIn() { return !!Auth.current(); },
    isAdmin() {
      const u = Auth.current();
      return !!u && u.role === 'admin';
    },
    requireAuth(redirect) {
      if (!Auth.isLoggedIn()) {
        window.location.href = redirect || 'login.html';
        return false;
      }
      return true;
    }
  };

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */

  window.AppStore = {
    read: read,
    write: write,
    remove: remove,
    uid: uid,
    auth: Auth,

    getTemplates() { return read('templates', SEED_TEMPLATES); },
    getTemplate(id) {
      return this.getTemplates().find(function (t) { return t.id === id; }) || null;
    },

    getProjects() { return read('projects', []); },
    saveProjects(list) { write('projects', list); },
    getProject(id) {
      return this.getProjects().find(function (p) { return p.id === id; }) || null;
    },
    addProject(partial) {
      const list = this.getProjects();
      const now = new Date().toISOString().slice(0, 10);
      const project = Object.assign({
        id: uid('prj'), name: 'Untitled App', template: 'Blank Canvas', templateId: null,
        status: 'draft', gradient: ['#7928AB', '#9A289C'], views: 0, visitors: 0,
        conversions: 0, pages: 1, components: 0, created: now, modified: now, domain: null
      }, partial || {});
      list.unshift(project);
      write('projects', list);
      this.logActivity({ type: 'create', text: 'Created new app "' + project.name + '"', icon: 'plus' });
      return project;
    },
    updateProject(id, patch) {
      const list = this.getProjects();
      const idx = list.findIndex(function (p) { return p.id === id; });
      if (idx === -1) return null;
      patch = patch || {};
      patch.modified = new Date().toISOString().slice(0, 10);
      list[idx] = Object.assign({}, list[idx], patch);
      write('projects', list);
      return list[idx];
    },
    deleteProject(id) {
      const list = this.getProjects().filter(function (p) { return p.id !== id; });
      write('projects', list);
    },
    duplicateProject(id) {
      const src = this.getProject(id);
      if (!src) return null;
      const copy = Object.assign({}, src, {
        id: uid('prj'), name: src.name + ' (Copy)', status: 'draft', views: 0,
        visitors: 0, conversions: 0, domain: null,
        created: new Date().toISOString().slice(0, 10),
        modified: new Date().toISOString().slice(0, 10)
      });
      const list = this.getProjects();
      list.unshift(copy);
      write('projects', list);
      return copy;
    },

    getFavorites() { return read('favorites', []); },
    toggleFavorite(templateId) {
      let favs = this.getFavorites();
      const isFav = favs.indexOf(templateId) !== -1;
      if (isFav) favs = favs.filter(function (f) { return f !== templateId; });
      else favs.push(templateId);
      write('favorites', favs);
      return !isFav;
    },
    isFavorite(templateId) { return this.getFavorites().indexOf(templateId) !== -1; },

    getActivity() { return read('activity', []); },
    logActivity(entry) {
      const list = this.getActivity();
      list.unshift(Object.assign({ id: uid('act'), time: 'Just now', icon: 'edit' }, entry));
      write('activity', list.slice(0, 30));
    },

    getNotifications() { return read('notifications', []); },
    saveNotifications(list) { write('notifications', list); },

    getIntegrations() { return read('integrations', SEED_INTEGRATIONS); },
    setIntegration(id, connected) {
      const list = this.getIntegrations().map(function (i) {
        return i.id === id ? Object.assign({}, i, { connected: connected }) : i;
      });
      write('integrations', list);
      return list;
    },

    getUsers() { return read('users', []); },
    saveUsers(list) { write('users', list); }
  };

  seed();
})();

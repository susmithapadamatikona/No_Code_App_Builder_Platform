/* ==========================================================================
   STACKLY — Auth Page Logic (login / register / forgot password)
   Uses AppStore.auth (storage.js) + Validate (validation.js).
   Auto-binds by form id: #login-form, #register-form, #forgot-form
   ========================================================================== */

(function () {
  'use strict';

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.classList.toggle('is-loading', loading);
    btn.disabled = loading;
  }

  /* "john.doe99@x.com" -> "John Doe" */
  function nameFromEmail(email) {
    const local = String(email || '').split('@')[0].replace(/[0-9]+/g, ' ').replace(/[._-]+/g, ' ').trim();
    const parts = local.split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return 'Stackly Maker';
    return parts.map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); }).join(' ');
  }

  /* ---------------------------- LOGIN ---------------------------- */
  function initLogin(form) {
    window.Validate.bindLive(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.Validate.form(form)) return;
      const btn = form.querySelector('[type="submit"]');
      const email = form.querySelector('#login-email').value;
      const password = form.querySelector('#login-password').value;
      const remember = form.querySelector('#remember-me');
      setLoading(btn, true);
      setTimeout(function () {
        const roleSelEl = form.querySelector('#login-role');
        let res = window.AppStore.auth.login(email, password, remember && remember.checked);
        let created = false;

        /* Open demo sign-in: unknown emails get an account on the spot */
        if (!res.ok) {
          const provisioned = window.AppStore.auth.register({
            name: nameFromEmail(email),
            email: email.trim(),
            password: password
          });
          if (provisioned.ok) {
            /* honor the selected role for the new account */
            if (roleSelEl && roleSelEl.value === 'admin') {
              const users = window.AppStore.getUsers().map(function (u) {
                return u.id === provisioned.user.id ? Object.assign({}, u, { role: 'admin' }) : u;
              });
              window.AppStore.saveUsers(users);
            }
            res = window.AppStore.auth.login(email, password, remember && remember.checked);
            created = true;
          }
        }

        setLoading(btn, false);
        if (!res.ok) {
          window.Toast.error(res.error, 'Sign in failed');
          return;
        }
        /* role selector (if present) must match the account's actual role */
        if (roleSelEl && roleSelEl.value !== res.user.role) {
          window.AppStore.auth.logout();
          window.Toast.error(
            res.user.role === 'admin'
              ? 'This is an admin account — switch "Sign in as" to Admin.'
              : 'This is a user account — switch "Sign in as" to User.',
            'Wrong role selected');
          return;
        }
        window.Toast.success(
          created
            ? 'Account created for ' + res.user.email + ' — welcome to Stackly!'
            : 'Welcome back, ' + res.user.name.split(' ')[0] + '!',
          created ? 'Signed up & in' : 'Signed in');
        setTimeout(function () {
          window.location.href = res.user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
        }, 800);
      }, 700);
    });

    /* Demo login buttons — [data-demo-login="user|admin"] */
    document.querySelectorAll('[data-demo-login]').forEach(function (b) {
      b.addEventListener('click', function () {
        const kind = b.getAttribute('data-demo-login');
        form.querySelector('#login-email').value = kind === 'admin' ? 'admin@appflow.io' : 'demo@appflow.io';
        form.querySelector('#login-password').value = kind === 'admin' ? 'admin1234' : 'demo1234';
        const roleSel = form.querySelector('#login-role');
        if (roleSel) roleSel.value = kind === 'admin' ? 'admin' : 'user';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });
  }

  /* --------------------------- REGISTER --------------------------- */
  function initRegister(form) {
    window.Validate.bindLive(form);

    const pwd = form.querySelector('#reg-password');
    const meter = document.querySelector('.strength-meter');
    if (pwd && meter) {
      pwd.addEventListener('input', function () {
        const s = window.Validate.passwordStrength(pwd.value);
        meter.dataset.level = s.level;
        const label = meter.querySelector('.strength-label');
        if (label) label.textContent = pwd.value ? 'Password strength: ' + s.label : 'Use 8+ characters with a mix of letters, numbers & symbols';
      });
    }

    /* Profile photo preview (initials fallback) */
    const photo = form.querySelector('#reg-photo');
    const preview = document.querySelector('[data-photo-preview]');
    if (photo && preview) {
      photo.addEventListener('change', function () {
        const file = photo.files && photo.files[0];
        if (!file || !file.type.match(/^image\//)) return;
        const reader = new FileReader();
        reader.onload = function () {
          preview.style.backgroundImage = 'url(' + reader.result + ')';
          preview.style.backgroundSize = 'cover';
          preview.style.backgroundPosition = 'center';
          preview.textContent = '';
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.Validate.form(form)) return;
      const btn = form.querySelector('[type="submit"]');
      setLoading(btn, true);
      setTimeout(function () {
        const res = window.AppStore.auth.register({
          name: form.querySelector('#reg-name').value.trim(),
          email: form.querySelector('#reg-email').value.trim(),
          phone: (form.querySelector('#reg-phone') || {}).value || '',
          company: (form.querySelector('#reg-company') || {}).value || '',
          password: form.querySelector('#reg-password').value
        });
        setLoading(btn, false);
        if (!res.ok) {
          window.Toast.error(res.error, 'Registration failed');
          return;
        }
        window.AppStore.auth.login(res.user.email, res.user.password, false);
        const success = document.querySelector('[data-register-success]');
        if (success) {
          form.classList.add('d-none');
          success.classList.remove('d-none');
        }
        window.Toast.success('Your account is ready. Redirecting to your dashboard…', 'Account created');
        setTimeout(function () { window.location.href = 'dashboard.html'; }, 1600);
      }, 900);
    });
  }

  /* ------------------------ FORGOT PASSWORD ------------------------ */
  function initForgot(form) {
    window.Validate.bindLive(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.Validate.form(form)) return;
      const btn = form.querySelector('[type="submit"]');
      setLoading(btn, true);
      setTimeout(function () {
        setLoading(btn, false);
        const success = document.querySelector('[data-forgot-success]');
        const emailOut = document.querySelector('[data-forgot-email]');
        if (emailOut) emailOut.textContent = form.querySelector('#forgot-email').value.trim();
        if (success) {
          form.classList.add('d-none');
          success.classList.remove('d-none');
        }
        window.Toast.success('If an account exists for that address, a reset link is on its way.', 'Reset link sent');
      }, 900);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const login = document.getElementById('login-form');
    const register = document.getElementById('register-form');
    const forgot = document.getElementById('forgot-form');
    if (login) initLogin(login);
    if (register) initRegister(register);
    if (forgot) initForgot(forgot);
  });
})();

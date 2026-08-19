/* ==========================================================================
   STACKLY — Form Validation Helpers
   Markup pattern:
     <div class="form-group">
       <label class="form-label" for="email">Email</label>
       <input class="form-control" id="email" data-validate="required|email">
       <span class="form-error" data-error-for="email"></span>
     </div>
   API:
     Validate.field(input) -> true/false (paints UI)
     Validate.form(formEl) -> true/false (validates all [data-validate])
     Validate.passwordStrength(value) -> {level: 0-4, label}
     Validate.bindLive(formEl) -> validates on blur/input
   ========================================================================== */

(function () {
  'use strict';

  const RULES = {
    required(v) { return v.trim().length > 0 || 'This field is required.'; },
    email(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email address.';
    },
    phone(v) {
      return v.trim() === '' || /^[+()\-\s\d]{7,18}$/.test(v.trim()) || 'Enter a valid phone number.';
    },
    minlen(v, arg) {
      return v.length >= parseInt(arg, 10) || ('Must be at least ' + arg + ' characters.');
    },
    password(v) {
      return v.length >= 8 || 'Password must be at least 8 characters.';
    },
    checked(v, arg, input) {
      return input.checked || 'You must accept this to continue.';
    },
    match(v, arg) {
      const other = document.getElementById(arg);
      return (other && v === other.value) || 'Passwords do not match.';
    },
    url(v) {
      return v.trim() === '' || /^https?:\/\/.+\..+/.test(v.trim()) || 'Enter a valid URL.';
    }
  };

  function errorEl(input) {
    const id = input.id;
    let el = id ? document.querySelector('[data-error-for="' + id + '"]') : null;
    if (!el) {
      const group = input.closest('.form-group');
      el = group ? group.querySelector('.form-error') : null;
    }
    return el;
  }

  function paint(input, ok, message) {
    input.classList.toggle('is-invalid', !ok);
    input.classList.toggle('is-valid', ok && input.value.trim() !== '');
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    const err = errorEl(input);
    if (err) {
      if (!ok) {
        err.innerHTML = window.Icons.get('alert-circle') + ' <span></span>';
        err.querySelector('span').textContent = message;
        err.classList.add('is-visible');
      } else {
        err.classList.remove('is-visible');
      }
    }
  }

  function field(input) {
    const spec = input.dataset.validate || '';
    if (!spec) return true;
    const rules = spec.split('|');
    for (let i = 0; i < rules.length; i++) {
      const parts = rules[i].split(':');
      const name = parts[0];
      const arg = parts[1];
      const rule = RULES[name];
      if (!rule) continue;
      const result = rule(input.value || '', arg, input);
      if (result !== true) {
        paint(input, false, result);
        return false;
      }
    }
    paint(input, true);
    return true;
  }

  function form(formEl) {
    let ok = true;
    let firstBad = null;
    formEl.querySelectorAll('[data-validate]').forEach(function (input) {
      if (!field(input)) {
        ok = false;
        if (!firstBad) firstBad = input;
      }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  function bindLive(formEl) {
    formEl.querySelectorAll('[data-validate]').forEach(function (input) {
      input.addEventListener('blur', function () {
        /* don't flag untouched empty fields on blur — the submit pass will;
           only re-check fields the user typed in or already got flagged on */
        if (input.value.trim() === '' && !input.classList.contains('is-invalid')) return;
        field(input);
      });
      input.addEventListener('input', function () {
        if (input.classList.contains('is-invalid')) field(input);
      });
      if (input.type === 'checkbox') {
        input.addEventListener('change', function () { field(input); });
      }
    });
  }

  function passwordStrength(v) {
    let level = 0;
    if (v.length >= 8) level++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) level++;
    if (/\d/.test(v)) level++;
    if (/[^A-Za-z0-9]/.test(v) && v.length >= 10) level++;
    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: level, label: labels[level] };
  }

  /* Password visibility toggles — [data-password-toggle="inputId"] */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-password-toggle]');
    if (!btn) return;
    const input = document.getElementById(btn.getAttribute('data-password-toggle'));
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.classList.toggle('is-visible', show);
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  window.Validate = {
    field: field,
    form: form,
    bindLive: bindLive,
    passwordStrength: passwordStrength,
    rules: RULES
  };
})();

/* ==========================================================================
   STACKLY — Pricing Page
   Billing period toggle (monthly / yearly) with a subtle price highlight,
   plus "choose plan" handling:
     - logged in  -> store choice + demo toast
     - logged out -> follow the link to register.html
   Load after main.js on pricing.html only.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ------------------------------------------------------------------
       Billing toggle — swaps data-monthly / data-yearly amounts and the
       period label, with a small pop animation on the price.
       ------------------------------------------------------------------ */
    var toggle = document.getElementById('billing-toggle');
    var monthlyLabel = document.getElementById('bill-monthly-label');
    var yearlyLabel = document.getElementById('bill-yearly-label');

    function applyBilling(yearly) {
      document.querySelectorAll('.plan-price .amount').forEach(function (el) {
        var next = yearly ? el.dataset.yearly : el.dataset.monthly;
        if (el.textContent === next) return;
        el.textContent = next;
        /* restart the highlight animation */
        el.classList.remove('price-pop');
        void el.offsetWidth;
        el.classList.add('price-pop');
      });
      document.querySelectorAll('.plan-price .period').forEach(function (el) {
        el.textContent = yearly ? '/month · billed yearly' : '/month';
      });
      if (monthlyLabel) monthlyLabel.style.opacity = yearly ? '0.55' : '1';
      if (yearlyLabel) yearlyLabel.style.opacity = yearly ? '1' : '0.55';
    }

    if (toggle) {
      toggle.addEventListener('change', function () {
        applyBilling(toggle.checked);
      });
    }

    /* ------------------------------------------------------------------
       Choose plan buttons — [data-plan-choose="Free|Pro|Business"]
       ------------------------------------------------------------------ */
    document.querySelectorAll('[data-plan-choose]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var plan = btn.getAttribute('data-plan-choose');
        if (window.AppStore && AppStore.auth.isLoggedIn()) {
          e.preventDefault();
          var yearly = toggle ? toggle.checked : false;
          AppStore.write('plan_choice', plan);
          AppStore.logActivity({
            type: 'billing',
            text: 'Selected the ' + plan + ' plan (' + (yearly ? 'yearly' : 'monthly') + ' billing)',
            icon: 'credit-card'
          });
          window.Toast.success('Plan updated (demo)', plan + ' plan');
        }
        /* logged out: let the link navigate to register.html */
      });
    });
  });
})();

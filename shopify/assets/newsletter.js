/* Newsletter forms: strict email check, AJAX submit (no page reload), toast feedback.
   Markup: a [data-newsletter] wrapper (JSON messages) containing the Shopify customer
   form, an email input inside [data-newsletter-field] and a [data-newsletter-hint].
   Validation happens here; the form is then submitted normally and the page that
   Shopify sends back shows the result ([data-newsletter-state] + toast). */
(function(){
  var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;
  var hideTimer;

  function getToast(){
    var t = document.getElementById('saint-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'saint-toast';
      t.className = 'saint-toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      t.innerHTML = '<span class="saint-toast-icon" aria-hidden="true"></span><span class="saint-toast-text"></span>';
      document.body.appendChild(t);
    }
    return t;
  }

  function showToast(message, type){
    var t = getToast();
    clearTimeout(hideTimer);
    t.className = 'saint-toast is-' + type;
    t.querySelector('.saint-toast-text').textContent = message;
    void t.offsetWidth;
    t.classList.add('is-visible');
    hideTimer = setTimeout(function(){ t.classList.remove('is-visible'); }, 5000);
  }
  window.saintToast = showToast;

  var preset = document.getElementById('saint-toast');
  if (preset && preset.classList.contains('is-visible')) {
    hideTimer = setTimeout(function(){ preset.classList.remove('is-visible'); }, 5000);
  }

  // Retour après inscription : on ramène la personne au message du formulaire.
  var state = document.querySelector('[data-newsletter-state]');
  if (state) state.closest('[data-newsletter]').scrollIntoView({ block: 'center' });

  document.querySelectorAll('[data-newsletter]').forEach(function(wrap){
    var form = wrap.querySelector('form');
    var input = form && form.querySelector('input[type="email"]');
    if (!input) return;
    var msgs = JSON.parse(wrap.getAttribute('data-newsletter'));
    var field = wrap.querySelector('[data-newsletter-field]');
    var hint = wrap.querySelector('[data-newsletter-hint]');
    var busy = false;
    form.noValidate = true;

    function setError(message){
      if (field) field.classList.toggle('has-error', !!message);
      if (hint) hint.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    input.addEventListener('input', function(){ if (field && field.classList.contains('has-error')) setError(''); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (busy) return;
      var value = input.value.trim();
      var error = !value ? msgs.empty : (!EMAIL_RE.test(value) ? msgs.invalid : '');
      if (error) { setError(error); showToast(error, 'error'); input.focus(); return; }
      // Optional phone: saved as customer tags (tel-33612345678, sms-ok) so it
      // never blocks the signup the way an invalid phone field would.
      var phone = form.querySelector('[data-phone]');
      var tags = form.querySelector('input[name="contact[tags]"]');
      if (tags) {
        if (!tags.dataset.base) tags.dataset.base = tags.value;
        var list = [tags.dataset.base];
        if (phone && phone.value.trim()) {
          var digits = phone.value.replace(/[^0-9+]/g, '');
          if (/^0\d{9}$/.test(digits)) digits = '33' + digits.slice(1);
          digits = digits.replace(/^\+/, '').replace(/^00/, '');
          if (!/^\d{8,15}$/.test(digits)) {
            var perr = msgs.phone || 'Numéro de téléphone non valide.';
            setError(perr); showToast(perr, 'error'); phone.focus(); return;
          }
          list.push('tel-' + digits);
          var sms = form.querySelector('[data-sms]');
          if (sms && sms.checked) list.push('sms-ok');
        }
        tags.value = list.join(',');
      }
      setError('');
      input.value = value;
      busy = true;
      wrap.classList.add('is-loading');

      // Envoi classique (rechargement de page) : Shopify suit sa propre redirection
      // et affiche lui-même le bon message (inscrit / déjà inscrit / erreur).
      // L'envoi en arrière-plan (fetch) pouvait renvoyer le formulaire deux fois
      // et afficher « déjà inscrit » à une personne qui venait de s'inscrire.
      HTMLFormElement.prototype.submit.call(form);
    });
  });
})();

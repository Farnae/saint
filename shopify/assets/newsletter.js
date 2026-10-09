/* Newsletter forms: strict email check, AJAX submit (no page reload), toast feedback.
   Markup: a [data-newsletter] wrapper (JSON messages) containing the Shopify customer
   form, an email input inside [data-newsletter-field] and a [data-newsletter-hint].
   The server-rendered result carries [data-newsletter-state]; we read it from the
   fetched page to know whether the signup succeeded. */
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

    function done(message){
      var p = document.createElement('p');
      p.className = 'cta-success newsletter-done';
      p.textContent = message;
      form.replaceWith(p);
    }

    input.addEventListener('input', function(){ if (field && field.classList.contains('has-error')) setError(''); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (busy) return;
      var value = input.value.trim();
      var error = !value ? msgs.empty : (!EMAIL_RE.test(value) ? msgs.invalid : '');
      if (error) { setError(error); showToast(error, 'error'); input.focus(); return; }
      setError('');
      input.value = value;
      busy = true;
      wrap.classList.add('is-loading');

      fetch(form.action, { method: 'POST', body: new FormData(form), credentials: 'same-origin' })
        .then(function(res){
          // Shopify may ask for a captcha: let the browser handle it with a normal submit.
          if (/\/challenge/.test(res.url)) { HTMLFormElement.prototype.submit.call(form); return null; }
          var postedOk = /[?&]customer_posted=true/.test(res.url);
          return res.text().then(function(html){ return { html: html, postedOk: postedOk }; });
        })
        .then(function(result){
          if (result === null) return;
          var doc = new DOMParser().parseFromString(result.html, 'text/html');
          var marker = doc.querySelector('[data-newsletter-state]');
          var state = marker ? marker.getAttribute('data-newsletter-state') : (result.postedOk ? 'success' : '');
          if (state === 'success') { showToast(msgs.success, 'success'); done(msgs.success); }
          else if (state === 'already') { showToast(msgs.already, 'info'); done(msgs.already); }
          else { showToast(msgs.error, 'error'); }
        })
        .catch(function(){ showToast(msgs.error, 'error'); })
        .then(function(){ busy = false; wrap.classList.remove('is-loading'); });
    });
  });
})();

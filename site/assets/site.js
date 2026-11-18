/* Axon Vision website: navigation, lazy video that plays only in view, reveal on scroll, the product rail and the
   full-screen film player. No dependencies; a classic script, so the site also runs straight from disk. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // The demo-request address. It is the contact on Axon's public UAE delegation deck: confirm it before going live.
  const CONTACT = 'Moshe.shimon@Axon-Vision.com';
  document.querySelectorAll('[data-contact]').forEach(a => {
    a.href = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent('Axon Vision: technical session and demo');
  });

  // Navigation turns solid once the page scrolls.
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('solid', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu.
  const menu = document.querySelector('.menu');
  const menuBtn = document.querySelector('.menu-btn');
  if (menu && menuBtn) {
    const setMenu = open => {
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) (menu.querySelector('a') || menu).focus(); else menuBtn.focus();
    };
    menuBtn.addEventListener('click', () => setMenu(true));
    menu.addEventListener('click', e => { if (e.target.closest('a, .menu-close')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  }

  // Video: a source loads as its section nears the screen; it plays only while in view, never with reduced motion,
  // never after the visitor paused it, and never while a film is open.
  const vids = [...document.querySelectorAll('video[data-src]')];
  const load = v => { if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src; };
  const allowed = v => !reduce.matches && !v.dataset.userPaused && !document.body.classList.contains('film-open');
  const play = v => {
    load(v);
    if (!allowed(v)) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const inRail = v => v.closest('.tile');
  const near = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { load(e.target); near.unobserve(e.target); }
  }), { rootMargin: '100% 0px' });
  const seen = new IntersectionObserver(entries => entries.forEach(e => {
    const v = e.target;
    v.inView = e.isIntersecting;
    if (!e.isIntersecting) { v.pause(); return; }
    if (inRail(v) && !v.closest('.tile.on')) return;
    play(v);
  }), { threshold: 0.2 });
  vids.forEach(v => {
    v.muted = true;
    v.playsInline = true;
    if (v.hasAttribute('data-eager')) load(v);
    near.observe(v);
    seen.observe(v);
  });

  // Pause control on each autoplaying hero.
  document.querySelectorAll('.vctl').forEach(btn => {
    const v = btn.parentElement.querySelector('video');
    if (!v) return;
    const sync = () => {
      btn.classList.toggle('paused', v.paused);
      btn.setAttribute('aria-label', v.paused ? 'Play background video' : 'Pause background video');
    };
    ['play', 'pause', 'ended'].forEach(ev => v.addEventListener(ev, sync));
    sync();
    btn.addEventListener('click', () => {
      if (v.paused) { delete v.dataset.userPaused; load(v); const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else { v.dataset.userPaused = '1'; v.pause(); }
    });
  });

  // Reveal on scroll.
  const rev = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => rev.observe(el));

  // Product rail: hovering or focusing a tile opens it and plays its clip; the others pause.
  document.querySelectorAll('.rail').forEach(rail => {
    const tiles = [...rail.querySelectorAll('.tile')];
    const open = tile => tiles.forEach(t => {
      const on = t === tile;
      t.classList.toggle('on', on);
      const v = t.querySelector('video');
      if (!v) return;
      if (on && v.inView) play(v); else if (!on) v.pause();
    });
    tiles.forEach(t => {
      t.addEventListener('mouseenter', () => open(t));
      t.addEventListener('focus', () => open(t));
    });
    open(rail.querySelector('.tile.on') || tiles[0]);
  });

  // Film player: full screen, with sound where the film has it.
  const film = document.querySelector('.film');
  if (film) {
    const fv = film.querySelector('video');
    const title = film.querySelector('.title');
    const close = film.querySelector('.x');
    let opener = null;
    let resume = [];
    const shut = () => {
      fv.pause();
      fv.removeAttribute('src');
      fv.load();
      film.classList.remove('open');
      film.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('film-open');
      document.body.style.overflow = '';
      resume.forEach(play);
      resume = [];
      if (opener) opener.focus();
    };
    document.querySelectorAll('[data-film]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault();
      opener = btn;
      resume = vids.filter(v => !v.paused);
      resume.forEach(v => v.pause());
      document.body.classList.add('film-open');
      document.body.style.overflow = 'hidden';
      title.textContent = btn.dataset.title || '';
      fv.poster = btn.dataset.poster || '';
      fv.src = btn.dataset.film;
      fv.muted = false;
      film.classList.add('open');
      film.setAttribute('aria-hidden', 'false');
      close.focus();
      const p = fv.play();
      if (p && p.catch) p.catch(() => {});
    }));
    close.addEventListener('click', shut);
    film.addEventListener('click', e => { if (e.target === film) shut(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && film.classList.contains('open')) shut(); });
  }

  // Reduced motion switched on or off while the page is open.
  const onReduce = () => {
    if (reduce.matches) vids.forEach(v => v.pause());
    else vids.filter(v => v.inView && (!inRail(v) || v.closest('.tile.on'))).forEach(play);
  };
  if (reduce.addEventListener) reduce.addEventListener('change', onReduce);

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
})();

/* Keynote animations on the site: each .stage scales its 1920x1080 design box to the width; its iframe loads as it nears
   the screen (with the label overrides in data-args); the story restarts when it comes back into view; Replay restarts it.
   The contact form: posts to data-endpoint when one is set, otherwise opens the visitor's email with the request. */
(() => {
  'use strict';
  const fit = st => st.style.setProperty('--k', String(st.clientWidth / 1920));
  const stages = [...document.querySelectorAll('.stage')];
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(es => es.forEach(e => fit(e.target))); stages.forEach(s => ro.observe(s)); }
  stages.forEach(fit);
  addEventListener('resize', () => stages.forEach(fit));

  const api = f => { try { const w = f.contentWindow; return w && (w.__cl || w.__ai); } catch (e) { return null; } };
  const loadFrame = f => {
    if (f.getAttribute('src') || !f.dataset.src) return;
    const args = f.dataset.args ? '#' + encodeURIComponent(f.dataset.args) : '';
    f.src = f.dataset.src + args;
  };
  const frames = [...document.querySelectorAll('.stage iframe[data-src]')];
  const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { loadFrame(e.target); near.unobserve(e.target); } }), { rootMargin: '60% 0px' });
  frames.forEach(f => { if (f.hasAttribute('data-eager')) loadFrame(f); else near.observe(f); });
  const seen = new IntersectionObserver(es => es.forEach(e => {
    const f = e.target;
    if (!e.isIntersecting) { f.dataset.away = '1'; return; }
    if (f.dataset.away && f.hasAttribute('data-restart')) { const a = api(f); if (a && a.setT) a.setT(0); }
    delete f.dataset.away;
  }), { threshold: 0.35 });
  frames.forEach(f => seen.observe(f));
  document.querySelectorAll('[data-replay]').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.closest('.stage').querySelector('iframe');
    const a = f && api(f);
    if (a && a.setT) a.setT(0); else if (f) { const s = f.src; f.src = 'about:blank'; f.src = s; }
  }));

  // Contact form.
  const form = document.querySelector('form.form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const CONTACT = 'Moshe.shimon@Axon-Vision.com';   // same address as the demo buttons: confirm before going live
  const say = (msg, cls) => { status.textContent = msg; status.className = 'form-status ' + (cls || ''); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('website')) return;                   // honeypot: a bot filled the hidden field
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      say('Sending...');
      try {
        const r = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(String(r.status));
        form.reset(); say('Thank you. Your request has been sent.', 'ok');
      } catch (err) { say('The request could not be sent. Please try again or write to ' + CONTACT + '.', 'err'); }
      return;
    }
    const v = k => (data.get(k) || '').toString().trim();
    const body = ['Name: ' + v('first') + ' ' + v('last'), 'Email: ' + v('email'), 'Organization: ' + v('org'), 'Role: ' + v('role'),
      'Country: ' + v('country'), 'Interest: ' + v('interest'), '', v('message')].join('\n');
    location.href = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent('Technical session and demo request: ' + v('org')) + '&body=' + encodeURIComponent(body);
    say('Your email app has opened with the request filled in. Send it to complete.', 'ok');
  });
})();

/* Steps synced to a clip: in a section whose video has data-cues, each [data-cue] lights at its second; all light at the
   end, with reduced motion, or if the clip cannot play. */
(() => {
  'use strict';
  document.querySelectorAll('video[data-cues]').forEach(v => {
    const sec = v.closest('section');
    const steps = [...sec.querySelectorAll('[data-cue]')];
    if (!steps.length) return;
    const all = () => steps.forEach(s => s.classList.add('lit'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { all(); return; }
    const sync = () => steps.forEach(s => s.classList.toggle('lit', v.currentTime >= parseFloat(s.dataset.cue)));
    v.addEventListener('timeupdate', sync);
    v.addEventListener('seeked', sync);
    v.addEventListener('ended', all);
    v.addEventListener('error', all);
  });
})();

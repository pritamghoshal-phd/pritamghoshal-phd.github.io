/* polish.js — pointer highlight, sticky nav, active section. Additive. */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- pointer-tracked highlight on panels --- */
  if(!reduce && window.matchMedia('(hover:hover)').matches){
    const panels = document.querySelectorAll('.card, .pub, .proj, .fig');
    panels.forEach(el=>{
      el.addEventListener('pointermove', e=>{
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
        el.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
      });
    });
  }

  /* --- nav condenses once you leave the hero --- */
  const nav = document.querySelector('.nav');
  if(nav){
    const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  }

  /* --- mobile menu ----------------------------------------------------
     The link row does not fit beside the name on a phone; below 900px the
     stylesheet collapses it into a panel and this drives the button. */
  (function mobileNav(){
    const bar = document.querySelector('.nav__in');
    const list = bar && bar.querySelector('.nav__links');
    if(!bar || !list || bar.querySelector('.nav__toggle')) return;

    if(!list.id) list.id = 'nav-menu';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav__toggle';
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls', list.id);
    btn.setAttribute('aria-label','Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    bar.insertBefore(btn, list);

    const set = open => {
      list.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      set(btn.getAttribute('aria-expanded') !== 'true');
    });
    list.addEventListener('click', e => { if(e.target.closest('a')) set(false); });
    document.addEventListener('click', e => {
      if(list.classList.contains('is-open') && !bar.contains(e.target)) set(false);
    });
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && list.classList.contains('is-open')){ set(false); btn.focus(); }
    });
    /* leaving mobile width with the panel open would leave it stuck */
    window.matchMedia('(max-width:900px)').addEventListener('change', e => { if(!e.matches) set(false); });
  })();

  /* --- active nav item follows the section in view --- */
  const links = [...document.querySelectorAll('.nav__links a[href*="#"]')];
  const map = new Map();
  links.forEach(a=>{
    const id = a.getAttribute('href').split('#')[1];
    const sec = id && document.getElementById(id);
    if(sec) map.set(sec, a);
  });
  if(map.size){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        const a = map.get(en.target);
        if(!a) return;
        if(en.isIntersecting && en.intersectionRatio > 0.25){
          links.forEach(l=>l.classList.remove('is-active'));
          a.classList.add('is-active');
        }
      });
    }, {threshold:[0.25,0.5], rootMargin:'-15% 0px -45% 0px'});
    map.forEach((_,sec)=>io.observe(sec));
  }

  /* --- safety net for the reveal animations ---------------------------
     Content starts at opacity 0 and is revealed by GSAP. That code lives
     inside a module that also imports Three.js, so if either CDN is slow,
     blocked by a network or stopped by an extension, the module never runs
     and the page stays blank. This watches the first element that should
     have been revealed immediately and, if it is still invisible, shows
     everything. Text must never depend on a third party being reachable. */
  (function revealSafetyNet(){
    const probe = document.querySelector('.hero [data-rev]') ||
                  document.querySelector('[data-rev]');
    if(!probe) return;
    const rescue = () => {
      if(parseFloat(getComputedStyle(probe).opacity) > 0.01) return;  // animation ran
      document.body.classList.add('no-motion');
      document.querySelectorAll('[data-rev], .will-reveal, .reveal').forEach(el=>{
        el.style.opacity = 1;
        el.style.transform = 'none';
      });
    };
    setTimeout(rescue, 1800);
    window.addEventListener('load', () => setTimeout(rescue, 600));
  })();

  /* --- motion control -------------------------------------------------
     The live figures drive themselves with requestAnimationFrame. This
     wraps rAF so every one of them can be held at its current frame, and
     offers a control to do it. Readers who ask their system for reduced
     motion get one settled frame and then stillness, with the option to
     start it again; everyone else gets a way to stop it.              */
  if(document.querySelector('canvas')){
    const realRAF = window.requestAnimationFrame.bind(window);
    let held = false;
    const pending = new Set();

    window.requestAnimationFrame = function(cb){
      if(!held) return realRAF(cb);
      pending.add(cb);
      return 0;
    };

    function setHeld(v){
      held = v;
      btn.setAttribute('aria-pressed', String(!held));
      btn.querySelector('.motion-toggle__icon').textContent = held ? '▶' : '❚❚';
      btn.querySelector('.motion-toggle__text').textContent = held ? 'Play motion' : 'Pause motion';
      if(!held && pending.size){
        const due = [...pending];
        pending.clear();
        due.forEach(cb => realRAF(cb));
      }
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'motion-toggle';
    btn.setAttribute('aria-pressed', 'true');
    btn.innerHTML = '<span class="motion-toggle__icon" aria-hidden="true">❚❚</span>' +
                    '<span class="motion-toggle__text">Pause motion</span>';
    btn.addEventListener('click', () => setHeld(!held));
    document.body.appendChild(btn);

    /* only offer the control while something that moves is on screen, so it
       is not permanently parked on top of the text */
    const onScreen = new Set();
    const vis = new IntersectionObserver(entries => {
      entries.forEach(en => en.isIntersecting ? onScreen.add(en.target) : onScreen.delete(en.target));
      btn.classList.toggle('is-away', onScreen.size === 0 && !held);
    }, {threshold: 0.08});
    document.querySelectorAll('canvas').forEach(c => vis.observe(c));
    btn.classList.add('is-away');

    /* let the figures reach a settled frame first, then hold */
    if(reduce) setTimeout(() => { if(!held) setHeld(true); }, 1400);
  }
})();

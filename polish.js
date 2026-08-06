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
})();

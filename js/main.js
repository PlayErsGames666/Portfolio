/* =====================================================
   PORTFOLIO — main.js
   All interactive features in one clean file
===================================================== */

'use strict';

/* ─── Helpers ─────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =====================================================
   1. PROGRESS BAR (reading / page-load indicator)
===================================================== */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;z-index:9999;background:linear-gradient(90deg,#7c3aed,#06b6d4);transition:width .12s linear;box-shadow:0 0 10px rgba(124,58,237,.7);';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }, { passive: true });
}

/* =====================================================
   2. CANVAS PARTICLE NETWORK BACKGROUND
===================================================== */
function initCanvas() {
  const canvas = $('#bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const MAX_DIST   = 140;
  const PARTICLE_COUNT = () => Math.min(Math.floor(W * H / 9000), 120);
  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles = Array.from({ length: PARTICLE_COUNT() }, createParticle);
  }

  function createParticle() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r:  Math.random() * 1.8 + 0.6,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const accent = isDark() ? '124,58,237' : '100,40,220';
    const accent2 = '6,182,212';

    particles.forEach(p => {
      // move
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      // dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent},.7)`;
      ctx.fill();

      // connect nearby particles
      particles.forEach(q => {
        if (q === p) return;
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${accent},${ alpha })`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      });

      // connect to mouse
      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const md  = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < MAX_DIST * 1.5) {
        const alpha = (1 - md / (MAX_DIST * 1.5)) * 0.55;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${accent2},${alpha})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize',      resize, { passive: true });
  window.addEventListener('mousemove',   e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave',  () => { mouse.x = -9999; mouse.y = -9999; });

  resize();
  draw();
}

/* =====================================================
   3. TYPING ANIMATION
===================================================== */
function initTyping() {
  const el = $('#typed-text');
  if (!el) return;

  const phrases = [
    'Full Stack Developer',
    'Open Source Contributor',
    'Backend Architect',
    'UI / UX Enthusiast',
    'Problem Solver',
    'Coffee-Driven Engineer ☕',
  ];

  let phraseIdx = 0, charIdx = 0, deleting = false, pauseTimer = null;

  function tick() {
    const phrase = phrases[phraseIdx];

    if (!deleting) {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) {
        deleting = true;
        pauseTimer = setTimeout(tick, 2000);
        return;
      }
      setTimeout(tick, 75 + Math.random() * 40);
    } else {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 38);
    }
  }

  setTimeout(tick, 800);
}

/* =====================================================
   4. ANIMATED COUNTERS
===================================================== */
function initCounters() {
  const counters = $$('.counter');
  if (!counters.length) return;

  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const run = el => {
    const target   = +el.dataset.target;
    const duration = 1600;
    const start    = performance.now();

    const step = now => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(ease(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { run(e.target); observer.unobserve(e.target); }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* =====================================================
   5. SKILL BAR ANIMATION
===================================================== */
function animateSkillBars(panel) {
  $$('.skill-fill', panel).forEach(fill => {
    const target = fill.dataset.pct + '%';
    // Reset first (for tab switching)
    fill.style.width = '0%';
    fill.classList.remove('animated');
    // Then animate
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = target;
        fill.classList.add('animated');
      });
    });
  });
}

function initSkillTabs() {
  const tabs   = $$('.skill-tab');
  const panels = $$('.skill-panel');
  if (!tabs.length) return;

  // Animate visible panel on page load
  const activePanel = $('.skill-panel.active');
  if (activePanel) {
    const skillsSection = $('#skills');
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateSkillBars(activePanel);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (skillsSection) observer.observe(skillsSection);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = $('#' + tab.dataset.target);
      if (target) {
        target.classList.add('active');
        animateSkillBars(target);
      }
    });
  });
}

/* =====================================================
   6. PROJECT FILTER
===================================================== */
function initProjectFilter() {
  const btns  = $$('.filter-btn');
  const items = $$('.project-item');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        if (match) {
          item.style.opacity   = '0';
          item.style.transform = 'scale(0.94)';
          item.style.display   = '';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              item.style.opacity   = '1';
              item.style.transform = 'scale(1)';
            });
          });
        } else {
          item.style.opacity   = '0';
          item.style.transform = 'scale(0.94)';
          setTimeout(() => { item.style.display = 'none'; }, 350);
        }
      });
    });
  });

  // Apply initial styles for transition
  items.forEach(item => {
    item.style.transition = 'opacity .35s, transform .35s';
  });
}

/* =====================================================
   7. NAVBAR — scroll effects & active link highlight
===================================================== */
function initNavbar() {
  const nav   = $('#mainNav');
  const links = $$('.nav-pill');
  if (!nav) return;

  // Scroll class + active link
  const sections = $$('section[id]');

  const onScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(link => {
      link.classList.toggle('active-link', link.getAttribute('href') === '#' + current);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Smooth close on mobile
  links.forEach(link => {
    link.addEventListener('click', () => {
      const menu = $('#navMenu');
      if (menu && menu.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(menu);
        bsCollapse?.hide();
      }
    });
  });
}

/* =====================================================
   8. BACK TO TOP BUTTON
===================================================== */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =====================================================
   9. THEME TOGGLE (dark / light)
===================================================== */
function initThemeToggle() {
  const btn  = $('#themeToggle');
  const html = document.documentElement;
  if (!btn) return;

  const saved = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', saved);
  updateIcon(saved);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateIcon(next);
  });

  function updateIcon(theme) {
    const icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
  }
}

/* =====================================================
   10. CONTACT FORM
===================================================== */
function initContactForm() {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  const submitBtn = $('#submitBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Button loading state
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin .7s linear infinite;margin-right:8px;"></span>Sending…';
    submitBtn.disabled = true;

    try {
      const data = new FormData(form);
      const action = form.action;

      // If a real formspree endpoint is configured, use it
      if (action && !action.includes('YOUR_FORMSPREE_ID')) {
        const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Network error');
      } else {
        // Demo mode — simulate delay
        await new Promise(r => setTimeout(r, 1200));
      }

      form.reset();
      form.style.display = 'none';
      if (success) success.style.display = 'flex';

    } catch (err) {
      submitBtn.innerHTML = original;
      submitBtn.disabled  = false;
      alert('Something went wrong. Please try again or contact me directly via email.');
    }
  });
}

/* =====================================================
   11. FOOTER YEAR
===================================================== */
function initFooterYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* =====================================================
   12. TILT EFFECT on project & blog cards (subtle)
===================================================== */
function initTilt() {
  const cards = $$('.project-card, .blog-card, .stat-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotX   = -dy * 5;
      const rotY   =  dx * 5;
      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* =====================================================
   13. AOS INIT
===================================================== */
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      once:     true,
      easing:   'ease-out-cubic',
      offset:   80,
    });
  }
}

/* =====================================================
   14. SMOOTH ANCHOR SCROLL (fallback for older browsers)
===================================================== */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* =====================================================
   15. GLITCH EFFECT on logo (hover)
===================================================== */
function initLogoGlitch() {
  const logo = $('.logo-text');
  if (!logo) return;

  logo.addEventListener('mouseenter', () => {
    logo.style.animation = 'none';
    let count = 0;
    const flicker = setInterval(() => {
      logo.style.opacity = Math.random() > 0.4 ? '1' : '0.6';
      if (++count > 8) { clearInterval(flicker); logo.style.opacity = '1'; }
    }, 60);
  });
}

/* =====================================================
   16. COPY EMAIL on click
===================================================== */
function initCopyEmail() {
  $$('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', e => {
      const email = link.href.replace('mailto:', '');
      if (email.includes('YOUR_EMAIL')) return; // placeholder, don't intercept
      e.preventDefault();
      navigator.clipboard.writeText(email).then(() => {
        const original = link.innerHTML;
        link.innerHTML = '<i class="bi bi-check2 me-1"></i>Copied!';
        link.style.color = 'var(--accent3)';
        setTimeout(() => { link.innerHTML = original; link.style.color = ''; }, 2000);
      }).catch(() => {
        window.location.href = link.href;
      });
    });
  });
}

/* =====================================================
   17. SECTION OBSERVER — subtle glow on entry
===================================================== */
function initSectionGlow() {
  const sections = $$('section');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      e.target.style.transition = 'box-shadow .6s';
    });
  }, { threshold: 0.15 });
  sections.forEach(s => obs.observe(s));
}

/* =====================================================
   BOOT — run everything when DOM is ready
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initCanvas();
  initTyping();
  initCounters();
  initSkillTabs();
  initProjectFilter();
  initNavbar();
  initBackToTop();
  initThemeToggle();
  initContactForm();
  initFooterYear();
  initAOS();
  initSmoothScroll();
  initLogoGlitch();
  initCopyEmail();
  initSectionGlow();

  // Tilt effect — only on non-touch devices
  if (!('ontouchstart' in window)) initTilt();

  // Re-run AOS after images load
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.refresh();
    initTilt();
  });
});

(function () {
  var THEME_KEY = 'bm-theme';

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function applyThemeScreenshots(dark) {
    document.querySelectorAll('img[data-light][data-dark]').forEach(function (img) {
      var next = dark ? img.getAttribute('data-dark') : img.getAttribute('data-light');
      if (next && img.getAttribute('src') !== next) {
        img.setAttribute('src', next);
      }
    });
  }

  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch (e) {}
    applyThemeScreenshots(dark);
    document.querySelectorAll('#theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', String(dark));
    });
  }

  // Sync screenshots on load (class may already be set by head script)
  applyThemeScreenshots(isDark());

  document.querySelectorAll('#theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(!isDark());
    });
  });

  // Mobile nav
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('mobile-menu');
  var iconOpen = document.getElementById('nav-icon-open');
  var iconClose = document.getElementById('nav-icon-close');

  if (toggle && menu) {
    function setOpen(isOpen) {
      menu.classList.toggle('hidden', !isOpen);
      if (iconOpen) iconOpen.classList.toggle('hidden', isOpen);
      if (iconClose) iconClose.classList.toggle('hidden', !isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(menu.classList.contains('hidden'));
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });
  }

  // Hero-style surfaces: spotlight + parallax + particle field (desktop only)
  (function initHeroPointerFx() {
    var surfaces = Array.prototype.slice.call(document.querySelectorAll('.hero-finance'));
    if (!surfaces.length) return;

    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var LINK_DIST = 110;
    var REPEL_RADIUS = 140;

    function enabled() {
      return finePointer.matches && !reduceMotion.matches;
    }

    function bindSurface(hero) {
      var spot = hero.querySelector('.hero-spotlight');
      var canvas = hero.querySelector('.hero-particles');
      if (!spot || !canvas) return;

      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var layers = hero.querySelectorAll('[data-parallax]');
      var targetX = 0.7;
      var targetY = 0.35;
      var curX = targetX;
      var curY = targetY;
      var mouse = { x: null, y: null, active: false };
      var rafId = 0;
      var particles = [];
      var width = 0;
      var height = 0;
      var dpr = 1;

      function particleCount() {
        var area = width * height;
        return Math.max(28, Math.min(80, Math.round(area / 14000)));
      }

      function makeParticle() {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1.2 + Math.random() * 2.2,
          a: 0.25 + Math.random() * 0.55,
        };
      }

      function initParticles() {
        var n = particleCount();
        particles = [];
        for (var i = 0; i < n; i++) particles.push(makeParticle());
      }

      function resize() {
        var rect = hero.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles();
      }

      function tick() {
        if (!enabled()) {
          rafId = 0;
          return;
        }

        curX += (targetX - curX) * 0.08;
        curY += (targetY - curY) * 0.08;
        spot.style.setProperty('--spot-x', (curX * 100).toFixed(2) + '%');
        spot.style.setProperty('--spot-y', (curY * 100).toFixed(2) + '%');

        var pdx = (curX - 0.5) * 2;
        var pdy = (curY - 0.5) * 2;
        layers.forEach(function (el) {
          var depth = parseFloat(el.getAttribute('data-parallax')) || 0.02;
          var x = pdx * depth * -80;
          var y = pdy * depth * -50;
          el.style.transform = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0)';
        });

        ctx.clearRect(0, 0, width, height);

        var i;
        var j;
        var p;
        var q;
        var dx;
        var dy;
        var dist;
        var force;

        for (i = 0; i < particles.length; i++) {
          p = particles[i];

          if (mouse.active && mouse.x != null) {
            dx = p.x - mouse.x;
            dy = p.y - mouse.y;
            dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < REPEL_RADIUS) {
              force = (1 - dist / REPEL_RADIUS) * 1.35;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          p.vx *= 0.96;
          p.vy *= 0.96;
          p.x += p.vx + (Math.random() - 0.5) * 0.05;
          p.y += p.vy + (Math.random() - 0.5) * 0.05;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        for (i = 0; i < particles.length; i++) {
          p = particles[i];
          for (j = i + 1; j < particles.length; j++) {
            q = particles[j];
            dx = p.x - q.x;
            dy = p.y - q.y;
            dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < LINK_DIST) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(46, 189, 133, ' + ((1 - dist / LINK_DIST) * 0.22).toFixed(3) + ')';
              ctx.lineWidth = 1;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.stroke();
            }
          }
        }

        for (i = 0; i < particles.length; i++) {
          p = particles[i];
          ctx.beginPath();
          ctx.fillStyle = 'rgba(110, 231, 183, ' + p.a.toFixed(3) + ')';
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (mouse.active && mouse.x != null) {
          var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 70);
          g.addColorStop(0, 'rgba(46, 189, 133, 0.22)');
          g.addColorStop(1, 'rgba(46, 189, 133, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 70, 0, Math.PI * 2);
          ctx.fill();
        }

        rafId = requestAnimationFrame(tick);
      }

      function onMove(e) {
        if (!enabled()) return;
        var rect = hero.getBoundingClientRect();
        if (
          e.clientY < rect.top ||
          e.clientY > rect.bottom ||
          e.clientX < rect.left ||
          e.clientX > rect.right
        ) {
          mouse.active = false;
          return;
        }
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
        targetX = Math.min(1, Math.max(0, mouse.x / rect.width));
        targetY = Math.min(1, Math.max(0, mouse.y / rect.height));
        if (!rafId) rafId = requestAnimationFrame(tick);
      }

      function onLeave() {
        mouse.active = false;
        mouse.x = null;
        mouse.y = null;
        targetX = 0.7;
        targetY = 0.35;
      }

      function stop() {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        ctx.clearRect(0, 0, width, height);
        spot.style.removeProperty('--spot-x');
        spot.style.removeProperty('--spot-y');
        layers.forEach(function (el) {
          el.style.transform = '';
        });
        canvas.style.display = 'none';
      }

      function start() {
        canvas.style.display = '';
        resize();
        if (!rafId) rafId = requestAnimationFrame(tick);
      }

      function sync() {
        if (!enabled()) {
          stop();
          return;
        }
        start();
      }

      window.addEventListener('mousemove', onMove, { passive: true });
      hero.addEventListener('mouseleave', onLeave);
      window.addEventListener('resize', function () {
        if (enabled()) resize();
      });
      finePointer.addEventListener('change', sync);
      reduceMotion.addEventListener('change', sync);
      sync();
    }

    surfaces.forEach(bindSurface);
  })();

  // Gradient mesh warp on lower sections (desktop only)
  (function initMeshWarp() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-mesh-warp]'));
    if (!sections.length) return;

    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var rafId = 0;
    var BLOB_PULL = [
      { x: 140, y: 100 },
      { x: -130, y: 90 },
      { x: 110, y: -120 },
      { x: -100, y: -80 },
    ];

    var states = sections.map(function (section) {
      var mesh = section.querySelector('.mesh-warp');
      var blobs = mesh
        ? Array.prototype.slice.call(mesh.querySelectorAll('.mesh-warp__blob'))
        : [];
      return {
        section: section,
        mesh: mesh,
        blobs: blobs,
        targetX: 0.5,
        targetY: 0.45,
        curX: 0.5,
        curY: 0.45,
        hovering: false,
      };
    });

    function enabled() {
      return finePointer.matches && !reduceMotion.matches;
    }

    function applyState(s) {
      if (!s.mesh) return;
      s.mesh.style.setProperty('--mx', s.curX.toFixed(4));
      s.mesh.style.setProperty('--my', s.curY.toFixed(4));

      var nx = s.curX - 0.5;
      var ny = s.curY - 0.5;
      s.blobs.forEach(function (blob, i) {
        var pull = BLOB_PULL[i] || BLOB_PULL[0];
        var tx = nx * pull.x * 1.35;
        var ty = ny * pull.y * 1.35;
        blob.style.setProperty('--tx', tx.toFixed(1) + 'px');
        blob.style.setProperty('--ty', ty.toFixed(1) + 'px');
      });
    }

    function tick() {
      var any = false;
      states.forEach(function (s) {
        if (!s.mesh) return;
        s.curX += (s.targetX - s.curX) * 0.14;
        s.curY += (s.targetY - s.curY) * 0.14;
        applyState(s);
        if (
          Math.abs(s.targetX - s.curX) > 0.0008 ||
          Math.abs(s.targetY - s.curY) > 0.0008 ||
          s.hovering
        ) {
          any = true;
        }
      });
      rafId = any ? requestAnimationFrame(tick) : 0;
    }

    function ensureTick() {
      if (!enabled()) return;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function onMove(e) {
      if (!enabled()) return;
      var needsTick = false;
      states.forEach(function (s) {
        var rect = s.section.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          s.targetX = (e.clientX - rect.left) / rect.width;
          s.targetY = (e.clientY - rect.top) / rect.height;
          s.hovering = true;
          needsTick = true;
        } else if (s.hovering) {
          s.hovering = false;
          s.targetX = 0.5;
          s.targetY = 0.45;
          needsTick = true;
        }
      });
      if (needsTick) ensureTick();
    }

    function sync() {
      if (!enabled()) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        states.forEach(function (s) {
          if (!s.mesh) return;
          s.curX = 0.5;
          s.curY = 0.45;
          s.targetX = 0.5;
          s.targetY = 0.45;
          s.hovering = false;
          applyState(s);
          s.blobs.forEach(function (blob) {
            blob.style.setProperty('--tx', '0px');
            blob.style.setProperty('--ty', '0px');
          });
        });
        return;
      }
      ensureTick();
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    finePointer.addEventListener('change', sync);
    reduceMotion.addEventListener('change', sync);
    sync();
  })();

  // Scroll reveal
  var nodes = document.querySelectorAll('.reveal');
  if (nodes.length) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(function (el) {
        el.classList.add('is-visible');
      });
    } else if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (el) {
        el.classList.add('is-visible');
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      );

      nodes.forEach(function (el) {
        observer.observe(el);
      });
    }
  }
})();

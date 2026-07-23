(function () {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('nav-icon-open');
  const iconClose = document.getElementById('nav-icon-close');

  if (!toggle || !menu) return;

  function setOpen(isOpen) {
    menu.classList.toggle('hidden', !isOpen);
    iconOpen.classList.toggle('hidden', isOpen);
    iconClose.classList.toggle('hidden', !isOpen);
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
})();

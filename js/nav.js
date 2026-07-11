(function () {
  'use strict';

  function initMegaMenu() {
    var menu = document.getElementById('megaMenu');
    var items = document.querySelectorAll('[data-mega]');
    if (!menu || !items.length) return;

    var cols = menu.querySelectorAll('.mega-col');
    var intros = menu.querySelectorAll('.mega-intro');
    var header = document.querySelector('.site-header');
    var timer;

    function setActive(section) {
      items.forEach(function (el) { el.classList.toggle('mega-active', el.dataset.mega === section); });
      cols.forEach(function (col) { col.classList.toggle('active', col.dataset.col === section); });
      intros.forEach(function (intro) { intro.classList.toggle('active', intro.dataset.col === section); });
    }

    function open(section) {
      clearTimeout(timer);
      setActive(section);
      menu.classList.add('open');
      if (header) header.classList.add('mega-open');
    }

    function close() {
      timer = setTimeout(function () {
        menu.classList.remove('open');
        if (header) header.classList.remove('mega-open');
      }, 180);
    }

    items.forEach(function (item) {
      item.addEventListener('mouseenter', function () { open(item.dataset.mega); });
      item.addEventListener('mouseleave', close);
    });
    menu.addEventListener('mouseenter', function () { clearTimeout(timer); });
    menu.addEventListener('mouseleave', close);
  }

  function initPhotoHero() {
    var bgs = document.querySelectorAll('.ph-bg');
    bgs.forEach(function (bg) {
      var url = bg.style.backgroundImage.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
      if (!url) { bg.classList.add('loaded'); return; }
      var img = new Image();
      img.onload = function () { bg.classList.add('loaded'); };
      img.onerror = function () { bg.classList.add('loaded'); };
      img.src = url;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMegaMenu();
      initPhotoHero();
    });
  } else {
    initMegaMenu();
    initPhotoHero();
  }
})();

function nlSub(e) {
  e.preventDefault();
  var f = document.getElementById('nlForm');
  var ok = document.getElementById('nlOk');
  if (!f || !ok) return;
  f.style.display = 'none';
  ok.style.display = 'block';
}

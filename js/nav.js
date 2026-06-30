(function () {
  'use strict';

  function initDropdowns() {
    var items = document.querySelectorAll('.nav-has-drop');
    items.forEach(function (item) {
      var drop = item.querySelector('.nav-drop');
      if (!drop) return;

      var timer;

      function open() {
        clearTimeout(timer);
        // Close all other dropdowns immediately
        document.querySelectorAll('.nav-has-drop.open').forEach(function (el) {
          if (el !== item) {
            el.classList.remove('open');
            var d = el.querySelector('.nav-drop');
            if (d) d.classList.remove('visible');
          }
        });
        item.classList.add('open');
        drop.classList.add('visible');
      }

      function close() {
        timer = setTimeout(function () {
          item.classList.remove('open');
          drop.classList.remove('visible');
        }, 300);
      }

      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', close);
      drop.addEventListener('mouseenter', function () { clearTimeout(timer); });
      drop.addEventListener('mouseleave', close);
    });

    /* Close all on outside click */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-has-drop')) {
        document.querySelectorAll('.nav-has-drop.open').forEach(function (el) {
          el.classList.remove('open');
          var d = el.querySelector('.nav-drop');
          if (d) d.classList.remove('visible');
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns);
  } else {
    initDropdowns();
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

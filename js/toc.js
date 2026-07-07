(function () {
  'use strict';

  var toc = document.querySelector('.toc');
  if (!toc) return;

  var links = Array.prototype.slice.call(toc.querySelectorAll('.toc__item'));

  // Секции, на которые ссылается оглавление
  var sections = links
    .map(function (link) {
      var id = link.getAttribute('href').slice(1);
      return { link: link, target: document.getElementById(id) };
    })
    .filter(function (item) { return item.target; });

  if (!sections.length) return;

  var sidebar = toc.closest('.article__sidebar') || toc.parentElement;

  // Подкручиваем ленту оглавления по горизонтали, не трогая прокрутку окна
  function revealLink(link) {
    var sr = sidebar.getBoundingClientRect();
    var lr = link.getBoundingClientRect();
    if (lr.left < sr.left) {
      sidebar.scrollLeft += lr.left - sr.left;
    } else if (lr.right > sr.right) {
      sidebar.scrollLeft += lr.right - sr.right;
    }
  }

  function setActive(link) {
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('toc__item--active', links[i] === link);
    }
    revealLink(link);
  }

  // Пока идёт прокрутка после клика, скроллспай не перехватывает активность
  var clickScrolling = false;
  var settleTimer = null;

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      clickScrolling = true;
      setActive(link);
    });
  });

  function onScroll() {
    if (clickScrolling) {
      // Прокрутка утихла — снова доверяем скроллспаю
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { clickScrolling = false; }, 150);
      return;
    }

    // Заголовок считается текущим, когда он поднялся выше трети экрана
    var threshold = window.innerHeight / 3;
    var current = sections[0];

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].target.getBoundingClientRect().top <= threshold) {
        current = sections[i];
      }
    }

    setActive(current.link);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

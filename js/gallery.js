(function () {
  'use strict';

  document.querySelectorAll('.gallery').forEach(initGallery);

  function initGallery(gallery) {
    var nav = gallery.querySelector('.gallery__nav');
    if (!nav) return;

    var buttons = nav.querySelectorAll('.gallery__nav-btn');
    var prevBtn = buttons[0];
    var nextBtn = buttons[1];

    var track = gallery.querySelector('.gallery__track');
    var thumbs = gallery.querySelectorAll('.gallery__thumb');

    var total = track ? track.children.length : thumbs.length;
    if (total < 2) return;

    var index = 0;

    function update() {
      if (track) {
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
      } else {
        var mainImg = gallery.querySelector('.gallery__img--main');
        var thumbImg = thumbs[index].querySelector('img');
        if (mainImg && thumbImg) mainImg.src = thumbImg.src;
        for (var i = 0; i < thumbs.length; i++) {
          thumbs[i].classList.toggle('gallery__thumb--active', i === index);
        }
        thumbs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === total - 1;
    }

    function goTo(next) {
      index = Math.max(0, Math.min(total - 1, next));
      update();
    }

    prevBtn.addEventListener('click', function () { goTo(index - 1); });
    nextBtn.addEventListener('click', function () { goTo(index + 1); });

    for (var i = 0; i < thumbs.length; i++) {
      (function (i) {
        thumbs[i].addEventListener('click', function () { goTo(i); });
      })(i);
    }

    var thumbsWrap = gallery.querySelector('.gallery__thumbs');
    if (thumbsWrap) enableDragScroll(thumbsWrap);

    // Свайп на тач-устройствах
    var swipeArea = track ? track.parentElement : gallery.querySelector('.gallery__img--main');
    if (swipeArea) {
      var startX = null;
      swipeArea.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
      }, { passive: true });
      swipeArea.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) goTo(dx < 0 ? index + 1 : index - 1);
      }, { passive: true });
    }

    update();
  }

  // Перетаскивание ленты миниатюр указателем
  function enableDragScroll(el) {
    var startX = 0;
    var startScroll = 0;
    var dragging = false;
    var moved = false;

    el.addEventListener('dragstart', function (e) {
      e.preventDefault();
    });

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add('gallery__thumbs--dragging');
      }
      if (moved) el.scrollLeft = startScroll - dx;
    });

    function stop() {
      dragging = false;
      el.classList.remove('gallery__thumbs--dragging');
    }
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);

    // После перетаскивания не даём сработать клику по миниатюре
    el.addEventListener('click', function (e) {
      if (moved) {
        moved = false;
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }
})();

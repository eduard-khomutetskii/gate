(function () {
  "use strict";

  var STACK_GAP = 14;
  var STACK_SCALE_STEP = 0.03;
  var ANIM_DURATION = 480;
  var ANIM_EASING = "cubic-bezier(.4,0,.2,1)";
  var LEAVE_EASING = "cubic-bezier(.55,0,1,.45)";

  var stackEl = document.getElementById("cardStack");
  var dotsEl = document.getElementById("dots");
  var cardEls = Array.prototype.slice.call(stackEl.querySelectorAll(".card"));
  var order = cardEls.slice();
  var isAnimating = false;

  function transformFor(pos) {
    return "translateY(" + (-STACK_GAP * pos) + "px) scale(" + (1 - STACK_SCALE_STEP * pos) + ")";
  }

  Array.prototype.forEach.call(dotsEl.children, function (dot, i) {
    dot.addEventListener("click", function () {
      goTo(i);
    });
  });

  function updateDots() {
    var frontIndex = parseInt(order[0].dataset.index, 10);
    Array.prototype.forEach.call(dotsEl.children, function (dot, i) {
      dot.setAttribute("aria-current", i === frontIndex ? "true" : "false");
    });
  }

  function animateAdvance(steps) {
    if (isAnimating || steps === 0) return;
    isAnimating = true;

    var oldOrder = order.slice();
    var n = oldOrder.length;
    var k = ((steps % n) + n) % n;
    var newOrder = oldOrder.slice(k).concat(oldOrder.slice(0, k));

    var finishedPromises = oldOrder.map(function (el, oldPos) {
      var newPos = newOrder.indexOf(el);
      var fromTransform = transformFor(oldPos);
      var toTransform = transformFor(newPos);
      var keyframes;

      var easing = ANIM_EASING;

      if (oldPos === 0) {
        keyframes = [
          { transform: fromTransform, opacity: 1 },
          { transform: "translateY(140%) scale(0.92)", opacity: 0, offset: 0.6 },
          { transform: toTransform, opacity: 1 }
        ];
        easing = LEAVE_EASING;
      } else {
        keyframes = [
          { transform: fromTransform, opacity: 1 },
          { transform: toTransform, opacity: 1 }
        ];
      }

      var animation = el.animate(keyframes, {
        duration: ANIM_DURATION,
        easing: easing,
        fill: "forwards"
      });
      return animation.finished;
    });

    Promise.all(finishedPromises).then(function () {
      oldOrder.forEach(function (el) {
        var newPos = newOrder.indexOf(el);
        el.className = "card pos-" + newPos;
        el.getAnimations().forEach(function (a) {
          a.cancel();
        });
      });
      order = newOrder;
      updateDots();
      isAnimating = false;
    });
  }

  function goNext() {
    animateAdvance(1);
  }

  function goPrev() {
    animateAdvance(-1);
  }

  function goTo(targetIndex) {
    var targetEl = cardEls.filter(function (el) {
      return parseInt(el.dataset.index, 10) === targetIndex;
    })[0];
    if (!targetEl) return;
    var k = order.indexOf(targetEl);
    animateAdvance(k);
  }

  stackEl.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  });

  updateDots();
})();

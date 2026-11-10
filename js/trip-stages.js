/* Native page scroll drives the timeline. No wheel/touch interception or dependency. */
(() => {
  'use strict';
  document.querySelectorAll('[data-trip-stages]').forEach((root) => {
    if (root.dataset.initialized) return;
    root.dataset.initialized = 'true';
    const slides = [...root.querySelectorAll('.trip-stages__slide')];
    const links = [...root.querySelectorAll('.trip-stages__pagination a')];
    if (slides.length < 2) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let step = 1;
    let top = 0;
    let intro = 0;
    let frame = 0;
    let active = -1;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function render() {
      frame = 0;
      const progress = clamp((top - root.getBoundingClientRect().top - intro) / step, 0, slides.length - 1);
      const current = Math.min(slides.length - 1, Math.floor(progress + .5));
      slides.forEach((slide, index) => {
        const distance = index - progress;
        // Hold each slide, then scrub the transition over the middle of the step.
        const amount = clamp((Math.abs(distance) - .22) / .56, 0, 1);
        const opacity = motion.matches ? Number(index === current) : 1 - amount;
        slide.style.opacity = opacity;
        slide.style.visibility = opacity > 0 ? 'visible' : 'hidden';
        slide.style.transform = motion.matches ? 'none' : `translateY(${Math.sign(distance) * amount * 48}px)`;
        slide.inert = index !== current;
        slide.setAttribute('aria-hidden', String(index !== current));
      });
      if (active !== current) {
        active = current;
        root.dataset.activeSlide = String(current + 1);
        links.forEach((link, index) => {
          if (index === current) link.setAttribute('aria-current', 'step');
          else link.removeAttribute('aria-current');
        });
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }
    function measure() {
      top = Math.max(0, Number(root.dataset.stickyTop) || 0);
      const viewport = document.documentElement.clientHeight;
      const available = Math.max(1, viewport - top);
      intro = root.querySelector('.trip-stages__heading').offsetHeight;
      step = Math.max(420, available * .9);
      root.style.setProperty('--trip-top', `${top}px`);
      root.style.setProperty('--trip-viewport-height', `${available}px`);
      root.style.setProperty('--trip-height', `${intro + available + step * (slides.length - 1)}px`);
      root.classList.add('is-enhanced');
      const stacked = matchMedia('(max-width: 768px)').matches &&
        !matchMedia('(max-height: 600px) and (min-width: 560px)').matches;
      slides.forEach((slide) => {
        const styles = getComputedStyle(slide);
        const copy = slide.querySelector('.trip-stages__copy');
        const imageHeight = slide.clientHeight - parseFloat(styles.paddingTop) -
          parseFloat(styles.paddingBottom) - (stacked ? copy.offsetHeight + parseFloat(styles.rowGap) : 0);
        slide.style.setProperty('--trip-image-height', `${Math.max(0, imageHeight)}px`);
      });
      render();
    }
    links.forEach((link, index) => link.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: window.scrollY + root.getBoundingClientRect().top + intro - top + step * index, behavior: motion.matches ? 'instant' : 'smooth' });
    }));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    motion.addEventListener('change', schedule);
    // Parent layout and loaded fonts can change the available width after initialization.
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    document.fonts.ready.then(measure);
  });
})();

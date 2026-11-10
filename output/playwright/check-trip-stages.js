async (page) => {
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  const check = (value, message) => { if (!value) throw new Error(message); };
  const initial = await page.evaluate(() => {
    const root = document.querySelector('[data-trip-stages]');
    const p = root.querySelector('.trip-stages__slide p');
    return { height: root.offsetHeight, font: getComputedStyle(p).font, step: (root.offsetHeight - innerHeight) / 5 };
  });
  console.log('Initial:', initial);
  for (let index = 0; index < 6; index++) {
    await page.evaluate(y => window.scrollTo(0, y), initial.step * index);
    await page.waitForTimeout(80);
    const state = await page.evaluate(() => ({ active: document.querySelector('[data-trip-stages]').dataset.activeSlide, sticky: document.querySelector('.trip-stages__sticky').getBoundingClientRect().top }));
    check(state.active === String(index + 1), `Slide ${index + 1} failed`);
    check(Math.abs(state.sticky) < 2, 'Block should remain pinned');
  }
  await page.evaluate(y => window.scrollTo(0, y), initial.height - 300);
  await page.waitForTimeout(80);
  check(await page.evaluate(() => document.querySelector('.trip-stages__sticky').getBoundingClientRect().top < 0), 'Block must unpin');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(80);
  check(await page.evaluate(() => document.querySelector('[data-trip-stages]').dataset.activeSlide === '1'), 'Reverse scroll failed');
  check(await page.locator('.trip-stages img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), 'Missing asset');
  await page.screenshot({path:'output/playwright/trip-stages-desktop.png'});
  await page.setViewportSize({width:375,height:812});
  await page.waitForTimeout(150);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile horizontal overflow');
  await page.screenshot({path:'output/playwright/trip-stages-mobile.png'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.trip-stages__pagination a').nth(5).click();
  await page.waitForTimeout(100);
  check(await page.evaluate(() => document.querySelector('[data-trip-stages]').dataset.activeSlide === '6'), 'Reduced motion navigation failed');
  console.log('PASS: six slides, pin/release, reverse scroll, images, mobile, reduced motion');
}

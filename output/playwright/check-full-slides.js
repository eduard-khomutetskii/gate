async (page) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:1016});
  await page.goto('http://127.0.0.1:4173/trip-stages.html');
  await page.evaluate(() => document.fonts.ready);
  const check = (ok, msg) => {if (!ok) throw new Error(msg);};
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  async function scrollSlide(index) {
    await page.evaluate(i=>{
      const root=document.querySelector('[data-trip-stages]');
      const step=(root.offsetHeight-innerHeight)/5;
      window.scrollTo(0,root.offsetTop+step*i);
    },index);
    await page.waitForTimeout(100);
  }
  for(let i=0;i<6;i++){
    await scrollSlide(i);
    const result=await page.locator('.trip-stages__slide').nth(i).evaluate(slide=>({
      visible:getComputedStyle(slide).opacity==='1',
      visual:!!slide.querySelector('.trip-stages__art,.trip-stages__visual'),
      action:!!slide.querySelector('.trip-stages__demo'),
      sticky:document.querySelector('.trip-stages__sticky').getBoundingClientRect().top,
      assets:[...slide.querySelectorAll('img')].every(img=>img.complete&&img.naturalWidth>0)
    }));
    check(result.visible && result.visual && result.action && result.assets,`Incomplete slide ${i+1}: ${JSON.stringify(result)}`);
    check(Math.abs(result.sticky)<2,'Pin failed');
    await page.screenshot({path:`output/playwright/full-slide-${i+1}.png`});
  }
  await page.evaluate(()=>window.scrollBy(0,500));
  await page.waitForTimeout(100);
  check(await page.evaluate(()=>document.querySelector('.trip-stages__sticky').getBoundingClientRect().top<0),'Release failed');
  await scrollSlide(0);
  check(await page.evaluate(()=>document.querySelector('[data-trip-stages]').dataset.activeSlide==='1'),'Reverse failed');
  for(const width of [375,320]){
    await page.setViewportSize({width,height:812});
    await page.waitForTimeout(100);
    for(let i=0;i<6;i++){
      await scrollSlide(i);
      const geometry=await page.locator('.trip-stages__slide').nth(i).evaluate(slide=>{
        const p=slide.querySelector('p').getBoundingClientRect();
        const button=slide.querySelector('.trip-stages__demo').getBoundingClientRect();
        return {overlap:p.bottom>button.top,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      check(!geometry.overlap&&!geometry.overflow,`Mobile layout failed ${width}, slide ${i+1}: ${JSON.stringify(geometry)}`);
      if(width===375) await page.screenshot({path:`output/playwright/full-slide-mobile-${i+1}.png`});
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.trip-stages__pagination a').first().click();
  await page.waitForTimeout(100);
  check(await page.evaluate(()=>document.querySelector('[data-trip-stages]').dataset.activeSlide==='1'),'Reduced motion failed');
  check(errors.length===0,errors.join('\n'));
  return 'PASS: complete six scenes, assets, scroll/reverse/release, 375px/320px, reduced motion';
}

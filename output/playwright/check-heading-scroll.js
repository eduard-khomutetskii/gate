async (page) => {
  await page.goto('http://127.0.0.1:4173/trip-stages.html');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>document.fonts.ready);
  const check=(ok,msg)=>{if(!ok)throw new Error(msg);};
  for(const [width,height] of [[1440,1016],[375,667],[320,568],[667,375]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>scrollTo(0,0));
    await page.waitForTimeout(100);
    const metrics=await page.evaluate(()=>{
      const root=document.querySelector('[data-trip-stages]');
      const intro=root.querySelector('.trip-stages__heading').offsetHeight;
      return {intro,step:(root.offsetHeight-intro-innerHeight)/5};
    });
    for(const y of [0,metrics.intro/2,metrics.intro-1]){
      await page.evaluate(y=>scrollTo(0,y),y);
      await page.waitForTimeout(40);
      check(await page.locator('.trip-stages__slide').first().evaluate(s=>s.style.opacity==='1'&&s.style.transform==='translateY(0px)'),'Slide moved before heading left');
    }
    for(let i=0;i<6;i++){
      await page.evaluate(y=>scrollTo(0,y),metrics.intro+metrics.step*i);
      await page.waitForTimeout(40);
      const state=await page.evaluate(()=>({
        title:document.querySelector('.trip-stages__title').getBoundingClientRect().bottom,
        sticky:document.querySelector('.trip-stages__sticky').getBoundingClientRect().top,
        slide:document.querySelector('[data-trip-stages]').dataset.activeSlide
      }));
      check(state.title<=0&&Math.abs(state.sticky)<2&&state.slide===String(i+1),JSON.stringify(state));
    }
    await page.evaluate(()=>scrollBy(0,200));
    await page.waitForTimeout(40);
    check(await page.locator('.trip-stages__sticky').evaluate(s=>s.getBoundingClientRect().top<0),'Release failed');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('.trip-stages__pagination a').nth(2).click();
    await page.waitForTimeout(50);
    check(await page.evaluate(()=>document.querySelector('[data-trip-stages]').dataset.activeSlide==='3'),'Indicator target failed');
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
  return 'PASS: heading scrolls away before timeline, six slides pin/release correctly, indicators work at four viewport sizes';
}

async (page) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:4173/trip-stages.html');
  await page.evaluate(()=>document.fonts.ready);
  const failures=[];
  for(const [width,height] of [[320,568],[375,667],[390,844],[640,800],[768,1024],[820,1180],[1024,768],[1440,1016],[667,375],[844,390]]){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(80);
    for(let i=0;i<6;i++){
      await page.evaluate(i=>{
        const root=document.querySelector('[data-trip-stages]');
        window.scrollTo(0,root.offsetTop + i*(root.offsetHeight-innerHeight)/5);
      },i);
      await page.waitForTimeout(40);
      const result=await page.locator('.trip-stages__slide').nth(i).evaluate(slide=>{
        const rect=element=>{const r=element.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
        const stage=rect(slide),copy=rect(slide.querySelector('.trip-stages__copy')),image=rect(slide.querySelector('.trip-stages__visual img')),button=rect(slide.querySelector('.trip-stages__demo'));
        const inside=r=>r.top>=stage.top-1&&r.bottom<=stage.bottom+1&&r.left>=stage.left-1&&r.right<=stage.right+1;
        return {inside:inside(copy)&&inside(image)&&inside(button),imageSize:image.width>20&&image.height>20,overflow:document.documentElement.scrollWidth>innerWidth,stage,copy,image};
      });
      if(!result.inside||!result.imageSize||result.overflow) failures.push({width,height,slide:i+1,...result});
      if(i===1) await page.screenshot({path:`output/playwright/responsive-${width}x${height}.png`});
    }
  }
  if(failures.length) throw new Error(JSON.stringify(failures));
  return 'PASS: all six slides fit at 10 viewport sizes, including mobile landscape';
}

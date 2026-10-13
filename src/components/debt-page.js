import {enhanceHeroWithShare} from "./hero-share.js";

export function debtHero({video, title, subtitle}) {
  const hero = document.createElement("section");
  hero.className = "hero debt-hero";
  hero.innerHTML = `
    <div class="hero__media">
      <video class="hero__video" autoplay muted loop playsinline preload="metadata">
        <source src="${video}" type="video/mp4">
      </video>
    </div>
    <div class="hero__overlay">
      <div class="hero__content">
        <p class="hero__eyebrow">PBO Insights</p>
        <h1 class="hero__title">${title}</h1>
        <p class="hero__subtitle">${subtitle}</p>
      </div>
    </div>
  `;
  enhanceHeroWithShare(hero, {title: `${title} — Parliamentary Budget Office`});
  return hero;
}

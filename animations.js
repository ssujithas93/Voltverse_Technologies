/* =========================================================
   TEXT REVEAL ANIMATIONS
   Split Text · Fade+Slide · Stagger · Mask Reveal · Scroll-Trigger
   Vanilla JS — no GSAP / SplitText license required.

   USAGE
   -----
   1) SPLIT BY CHARACTERS (letters fly in one by one):
      <h1 class="split-text" data-split="chars">Hello World</h1>

   2) SPLIT BY WORDS (each word masks up):
      <h1 class="split-text" data-split="words">Hello World</h1>

   3) SPLIT BY LINES (mark each line yourself for full control,
      e.g. multi-line hero headlines):
      <h1 class="split-text" data-split="lines">
        <span class="split-line-mask"><span class="split-line">Line one text</span></span>
        <span class="split-line-mask"><span class="split-line">Line two text</span></span>
      </h1>

   4) PLAIN FADE + SLIDE (no splitting, e.g. paragraphs/cards):
      <p class="fade-up">Some supporting text...</p>

   OPTIONAL ATTRIBUTES (on the .split-text element)
   -------------------------------------------------
   data-stagger="40"     -> ms delay between each unit (default 40)
   data-duration="800"   -> ms transition duration per unit (default from CSS)
   data-threshold="0.2"  -> how much of element must be visible to trigger (default 0.2)
========================================================= */

(function () {

  const splitIntoChars = (el) => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch) => {
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      const unit = document.createElement('span');
      unit.className = 'split-unit';
      unit.textContent = ch === ' ' ? '\u00A0' : ch;
      mask.appendChild(unit);
      el.appendChild(mask);
    });
  };

  const splitIntoWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      const unit = document.createElement('span');
      unit.className = 'split-unit';
      unit.textContent = word;
      mask.appendChild(unit);
      el.appendChild(mask);
      if (i < words.length - 1) {
        const space = document.createElement('span');
        space.className = 'split-word-space';
        el.appendChild(space);
      }
    });
  };

  const applyStagger = (el, unitSelector) => {
    const stagger = parseInt(el.dataset.stagger, 10) || 40;
    const duration = el.dataset.duration ? parseInt(el.dataset.duration, 10) : null;
    const units = el.querySelectorAll(unitSelector);
    units.forEach((unit, i) => {
      unit.style.transitionDelay = (i * stagger) + 'ms';
      if (duration) unit.style.transitionDuration = duration + 'ms';
    });
  };

  const initSplitText = () => {
    document.querySelectorAll('.split-text').forEach((el) => {
      const mode = el.dataset.split || 'words';

      if (mode === 'chars') {
        splitIntoChars(el);
        applyStagger(el, '.split-unit');
      } else if (mode === 'words') {
        splitIntoWords(el);
        applyStagger(el, '.split-unit');
      } else if (mode === 'lines') {
        // Lines are expected to be pre-marked in the HTML (see usage above)
        applyStagger(el, '.split-line');
      }
    });
  };

  const initScrollTrigger = () => {
    const targets = document.querySelectorAll('.split-text, .fade-up');
    if (!('IntersectionObserver' in window) || !targets.length) {
      // Fallback: reveal everything immediately if IO isn't supported
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

    targets.forEach((el) => observer.observe(el));
  };

  // Run splitting BEFORE observing, so units exist in the DOM when IO fires
  document.addEventListener('DOMContentLoaded', () => {
    initSplitText();
    initScrollTrigger();
  });

})();
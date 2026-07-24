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

      // Mark as split so CSS overrides (like gradient text-fill shifts) apply safely
      // without causing any color flashes during reload before JS loads!
      el.classList.add('is-split');
    });
  };

  const initScrollTrigger = () => {
    const targets = document.querySelectorAll('.split-text, .fade-up, .fade-left, .fade-right');
    console.log('[Voltverse Animations] Targets found:', targets.length);
    if (!targets.length) return;

    // Direct check to reveal elements that are already inside the viewport
    const checkVisibility = () => {
      const viewportHeight = window.innerHeight;
      targets.forEach((el) => {
        if (el.classList.contains('in-view')) return;
        const rect = el.getBoundingClientRect();
        // If element overlaps with the viewport, reveal it immediately
        if (rect.top < viewportHeight - 20 && rect.bottom > 0) {
          console.log('[Voltverse Animations] Revealing element in viewport:', el);
          el.classList.add('in-view');
        }
      });
    };

    // Run visibility check immediately and after a short layout delay
    checkVisibility();
    setTimeout(checkVisibility, 50);
    setTimeout(checkVisibility, 200);

    // Bulletproof scroll & resize listeners to catch visibility changes
    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });

    // Fallback: if IntersectionObserver is supported, use it to unbind scroll events later
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01, rootMargin: '0px' });

      targets.forEach((el) => {
        if (!el.classList.contains('in-view')) {
          observer.observe(el);
        }
      });
    }
  };

  // Run splitting BEFORE observing, so units exist in the DOM when IO fires
  const runAnimations = () => {
    initSplitText();
    initScrollTrigger();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAnimations);
  } else {
    runAnimations();
  }

})();
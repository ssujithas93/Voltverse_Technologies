// Live sensor readout — small randomized drift so the hero strip feels "live".
// Scoped, self-contained: doesn't touch scripts.js / animations.js.
(function(){
  const els = {
    depth: document.getElementById('rd-depth'),
    temp:  document.getElementById('rd-temp'),
    sal:   document.getElementById('rd-sal'),
    turb:  document.getElementById('rd-turb'),
  };
  if(!els.depth) return;
  let base = { depth: 18.4, temp: 26.7, sal: 34.9, turb: 2.1 };
  function drift(v, amt){ return +(v + (Math.random() - 0.5) * amt).toFixed(1); }
  setInterval(() => {
    base.depth = Math.max(0, drift(base.depth, 0.6));
    base.temp  = drift(base.temp, 0.15);
    base.sal   = drift(base.sal, 0.08);
    base.turb  = Math.max(0, drift(base.turb, 0.3));
    els.depth.innerHTML = base.depth + '<small> m</small>';
    els.temp.innerHTML  = base.temp + '<small> °C</small>';
    els.sal.innerHTML   = base.sal + '<small> PSU</small>';
    els.turb.innerHTML  = base.turb + '<small> NTU</small>';
  }, 1600);
})();

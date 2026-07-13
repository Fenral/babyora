document.addEventListener('DOMContentLoaded', () => {
  // Hver weather-animasjon-container: Lottie + fallback. Vis fallback hvis Lottie ikke laster.
  document.querySelectorAll('.sun-anim, .cloud-anim').forEach((container) => {
    const player = container.querySelector('lottie-player');
    const fallback = container.querySelector('.sun-fallback, .cloud-fallback');
    if (!player || !fallback) return;

    // Default: vis fallback til Lottie melder "ready"
    fallback.style.display = 'flex';
    player.style.position = 'absolute';
    player.style.top = '0';
    player.style.left = '0';

    player.addEventListener('ready', () => {
      fallback.style.display = 'none';
      player.style.position = 'static';
    });
    player.addEventListener('error', () => {
      try { player.style.display = 'none'; } catch(_) {}
    });
    // Failsafe
    setTimeout(() => {
      if (!player.shadowRoot || !player.shadowRoot.querySelector('canvas, svg')) {
        player.style.display = 'none';
      }
    }, 2500);
  });

  // prefers-reduced-motion: pause alle Lottie
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyReduce = () => {
    if (!reduce.matches) return;
    document.querySelectorAll('lottie-player').forEach((p) => {
      try { p.pause && p.pause(); } catch(_) {}
    });
  };
  reduce.addEventListener && reduce.addEventListener('change', applyReduce);
  applyReduce();
});

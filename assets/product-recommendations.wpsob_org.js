if (!window.Eurus.loadedScript.includes('product-recommendations.js')) {
  window.Eurus.loadedScript.push('product-recommendations.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xProductRecommendations', {
        load(el, url) {
          fetch(url)
            .then(response => response.text())
            .then(text => {
              const html = document.createElement('div');
              html.innerHTML = text;
              const recommendations = html.querySelector('.product-recommendations');

              if (recommendations && recommendations.innerHTML.trim().length) {
                requestAnimationFrame(() => {
                  el.innerHTML = recommendations.innerHTML;
                });
                if (recommendations.classList.contains('main-product')) {
                  el.className += ' mb-5 border-y border-solid accordion empty:border-b-0';
                }
              }
            })
            .catch(e => {
              console.error(e);
            });
        }
      });
    });
  });
}
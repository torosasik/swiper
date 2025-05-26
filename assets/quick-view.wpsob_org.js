requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xQuickView', {
      sectionId: window.xQuickView.sectionId,
      enabled: window.xQuickView.enabled,
      buttonLabel: window.xQuickView.buttonLabel,
      show_atc_button: window.xQuickView.show_atc_button,
      btn_atc_bottom: window.xQuickView.atc_btn_bottom,
      show: false,
      loading: false,
      currentVariant: '',
      cachedResults: [],
      cachedfetch: [],
      loadedChooseOptions: [],
      loadedChooseOptionsID: [],
      selected: false,
      addListener() {
        document.addEventListener('eurus:cart:items-changed', () => {
          this.cachedResults = [];
        });
      },
      showBtn(enable, showATCButton, textBtn) {
        this.enabled = enable;
        this.buttonLabel = textBtn;
        this.show_atc_button = showATCButton;
      },
      load(url, el, optionId) {
        let variant = document.getElementById('current-variant-' + optionId).innerText;
        let productUrl = variant?`${url}?variant=${variant}&section_id=${this.sectionId}`:`${url}?section_id=${this.sectionId}`;
        productUrl = productUrl.replace(/\s+/g, '');
        
        if (this.cachedResults[productUrl]) {
          document.getElementById('quickview-product-content').innerHTML = this.cachedResults[productUrl];
          return true;
        }
        
        if (this.cachedfetch[productUrl]) {
          return true;
        }

        this.loading = true;
        this.cachedfetch[productUrl] = true;
        fetch(productUrl)
          .then(reponse => {
            return reponse.text();
          })
          .then((response) => {
            const parser = new DOMParser();
            const content = parser.parseFromString(response,'text/html')
                              .getElementById("quickview-product-content").innerHTML;
            document.getElementById('quickview-product-content').innerHTML = content;
            this.cachedResults[productUrl] = content;
          })
          .finally(() => {
            this.loading = false;
            this.cachedfetch[productUrl] = false;
          })

        return true;
      },
      async loadChooseOptions(url, el, optionId) {
        let getVariant = document.getElementById('current-variant-' + optionId).innerText;
        let urlProduct = getVariant?`${url}?variant=${getVariant}&section_id=choose-option`:`${url}?section_id=choose-option`;
        var formData = {
          'attributes': {
            'choose_option_id': optionId           
          }
        };
        const isOptionLoaded  = document.getElementById("choose-options-content-"+ optionId);
        const variantId = getVariant?`${optionId}-${getVariant}`:optionId;
        let urlChooseOption = urlProduct + '_choose-options';
        let destinationElm = document.getElementById('choose-options-' + optionId).querySelector('.choose-options');
        let loadingEl = document.getElementById('choose-options-' + optionId).querySelector('.icon-loading');

        if (isOptionLoaded && this.loadedChooseOptionsID[variantId] && this.loadedChooseOptions[urlChooseOption]) {
          destinationElm.innerHTML = this.loadedChooseOptions[urlChooseOption];
          return true;
        }

        try {
          if (loadingEl) {
            loadingEl.classList.remove('hidden');
          }
          const response = await fetch(Shopify.routes.root + 'cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(formData)
          });
      
          const responseData = await response.json();
          this.loadedChooseOptionsID[variantId] = true;
          await this.renderChooseOptions(urlProduct, responseData.attributes.choose_option_id);
        } catch (error) {
          console.log(error);
        }
      },
      
      async renderChooseOptions(urlProduct, optionId) {
        let urlChooseOptions = urlProduct + '_choose-options';
        let destinationEl = document.getElementById('choose-options-' + optionId).querySelector('.choose-options');

        const isOptionLoaded  = document.getElementById("choose-options-content-"+ optionId);
        if (isOptionLoaded  && this.loadedChooseOptions[urlChooseOptions]) {
          destinationEl.innerHTML = this.loadedChooseOptions[urlChooseOptions];
          return true;
        }
        
        try {
          const response = await fetch(urlProduct);
          const content = await response.text();
      
          const parser = new DOMParser();
          const parsedContent = parser.parseFromString(content, 'text/html').getElementById("choose-options-content").innerHTML;
      
          if (parsedContent) {
            destinationEl.innerHTML = parsedContent;
            this.loadedChooseOptions[urlChooseOptions] = parsedContent;
          }
          let loadingEl = document.getElementById('choose-options-' + optionId).querySelector('.icon-loading');
          if (loadingEl) {
            loadingEl.classList.add('hidden');
          }
        } catch (error) {
          console.log(error);
        }
      },      
      open() {
        this.show = true;
        Alpine.store('xPopup').open = true;
      },
      close() {
        this.show = false;
        Alpine.store('xPopup').open = false;
      },
      focusQuickView(quickView, btnClose) {
        if ( !this.selected ) { 
          Alpine.store('xFocusElement').trapFocus(quickView, btnClose);
        }
      },
      removeFocusQuickView() {
        if ( !this.selected ) { 
          const elementActive = document.getElementById("button_quickview");
          Alpine.store('xFocusElement').removeTrapFocus(elementActive);
        }
      }
    });
  });
});
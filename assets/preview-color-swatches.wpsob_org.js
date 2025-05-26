if (!window.Eurus.loadedScript.includes('preview-color-swatches.js')) {
  window.Eurus.loadedScript.push('preview-color-swatches.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xProductCard', (
        sectionId,
        productUrl,
        productId,
      ) => ({
        currentVariantCard: '',
        isSelect: false,
        productId: productId,
        showOptions: false,
        init() {
          document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
            this.checkVariantSelected();
            this.currentVariantCard = e.detail.currentVariant;
            this.options = e.detail.options;
          });
        },
        checkVariantSelected() {
          const fieldset = [...document.querySelectorAll(`#variant-update-${sectionId} fieldset`)];
          if(fieldset.findIndex(item => !item.querySelector("input:checked")) == "-1") {
            this.isSelect = true;
          }
        }
      }))

      Alpine.store('xPreviewColorSwatch', {
        onChangeVariant(el, productUrl, src, variantId, sectionId) {
          document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
            if (e.detail.currentVariant == null) {
              this.updateImage(el, productUrl, src, variantId, sectionId);
            }
          })
        },
        updateImage(el, productUrl, src, variantId) {
          const cardProduct = el.closest('.card-product');
          let getLink =  productUrl + `?variant=${variantId}`;
          if (!cardProduct) return;
          const linkVariant = cardProduct.getElementsByClassName("link-product-variant");
          for (var i = 0; i < linkVariant.length; i ++) {
            linkVariant[i].setAttribute("href", getLink);
          }

          if (src != '') {
            const previewImg = cardProduct.getElementsByClassName("preview-img")[0];
            if (!previewImg) return;
            previewImg.removeAttribute("srcset");
            previewImg.setAttribute("src", src);
          }

          const currentVariant = cardProduct.querySelector(".current-variant");
          if (currentVariant) {
            currentVariant.innerText = variantId;
          }
        }
      });
    })
  });
}    
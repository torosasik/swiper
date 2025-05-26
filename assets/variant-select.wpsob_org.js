if (!window.Eurus.loadedScript.includes('variant-select.js')) {
  window.Eurus.loadedScript.push('variant-select.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xVariantSelect', (
        sectionId,
        isProductPage,
        unavailableText,
        productUrl,
        productId,
        showFirstImageAvaiable,
        chooseOption,
        productBundle,
        handleSectionId,
        firstAvailableVariantId
      ) => ({
        variants: null,
        currentVariant: {},
        options: [],
        currentAvailableOptions: [],
        cachedResults: [],
        quickViewSectionId: 'quick-view',
        handleSectionId: sectionId,
        paramVariant: false,
        init() {
          this.variants = JSON.parse(this.$el.querySelector('[type="application/json"]').textContent);

          if (chooseOption) {
            this.handleSectionId = 'choose-option';
          }
          if (productBundle) {
            this.handleSectionId = handleSectionId;
          }

          document.addEventListener('eurus:cart:items-changed', () => {
            this.cachedResults = [];
            Alpine.store('xUpdateVariantQuanity').updateQuantity(sectionId, productUrl, this.currentVariant?.id);
          });

          this.$watch('options', () => {
            this._updateVariantSelector();
          });
        },
        initMedia() {
          this._updateMasterId();
          this._updateMultiMediaWithVariant();
          this._updateMedia();
        },
        _updateVariantSelector() {
          this._updateMasterId();
          this._updateVariantStatuses();
          
          if (!this.currentVariant) {
            this._dispatchUpdateVariant();
            this._setUnavailable();
            return;
          }
          if (firstAvailableVariantId != this.currentVariant.id) {
            this.paramVariant = true;
          }
          if (isProductPage && this.paramVariant) {
            window.history.replaceState({}, '', `?variant=${this.currentVariant.id}`);
          }
          if (chooseOption == '' && !isProductPage) { 
            this.updateImageVariant();
          }
          this._updateVariantInput();
          if (showFirstImageAvaiable) {
            this._updateMedia();
          } else if (document.readyState === "complete" && !sectionId.includes(this.quickViewSectionId)) {
            this._updateMedia();
          }
          this._updateProductForms();
          this._setAvailable();
          Alpine.store('xPickupAvailable').updatePickUp(sectionId, this.currentVariant.id);

          const cacheKey = sectionId + '-' + this.currentVariant.id;
          if (this.cachedResults[cacheKey]) {
            const html = this.cachedResults[cacheKey];
      
            this._renderPriceProduct(html);
            this._renderSkuProduct(html);
            this._renderProductBadges(html);
            this._renderInventoryStatus(html);
            this._renderBuyButtons(html);
            this._setMessagePreOrder(html)
            this._setEstimateDelivery(html);
            this._setCartEstimateDelivery(html);
            this._setBackInStockAlert(html);
            this._setPickupPreOrder(html);
            
            this._dispatchUpdateVariant();
            this._dispatchVariantSelected(html);
            Alpine.store('xUpdateVariantQuanity').render(html, sectionId);
          } else {
            const variantId = this.currentVariant.id;
            fetch(`${productUrl}?variant=${variantId}&section_id=${this.handleSectionId}`)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                if (this.currentVariant && variantId == this.currentVariant.id
                  && html.getElementById(`x-product-template-${productId}-${sectionId}`)) {
                  this._renderPriceProduct(html);
                  this._renderSkuProduct(html);
                  this._renderProductBadges(html);
                  this._renderInventoryStatus(html);
                  this._renderBuyButtons(html);
                  this._setMessagePreOrder(html);
                  this._setEstimateDelivery(html);
                  this._setPickupPreOrder(html);
                  this._setCartEstimateDelivery(html);
                  this._setBackInStockAlert(html);
                  Alpine.store('xUpdateVariantQuanity').render(html, sectionId);
                  this.cachedResults[cacheKey] = html;
                  
                  this._dispatchUpdateVariant(html);
                  this._dispatchVariantSelected(html);
                } else if (this.currentVariant && variantId == this.currentVariant.id) {
                  this._dispatchUpdateVariant(html);
                }
              });
          }
        },
        _dispatchVariantSelected(html) {
          document.dispatchEvent(new CustomEvent(`eurus:product-page-variant-select:updated:${sectionId}`, {
            detail: {
              currentVariantStatus: this.currentVariant.available,
              currentAvailableOptions: this.currentAvailableOptions,
              options: this.options,
              html: html
            }
          }));
        },
        _updateVariantStatuses() {
          const selectedOptionOneVariants = this.variants.filter(variant => this.options[0] === this._decodeOptionValue(variant.option1));
          this.options.forEach((option, index) => {
            this.currentAvailableOptions[index] = [];
            if (index === 0) return;

            const previousOptionSelected = this.options[index - 1];
            selectedOptionOneVariants.forEach((variant) => {
              if (variant.available && this._decodeOptionValue(variant[`option${ index }`]) === previousOptionSelected) {
                this.currentAvailableOptions[index].push(this._decodeOptionValue(variant[`option${ index + 1 }`]));
              }
            });
          });
        },
        _decodeOptionValue(option) {
          if (option) {
            return option
                    .replaceAll('\\/', '/');
          }
        },
        _renderInventoryStatus(html) {
          const destination = document.getElementById('block-inventory-' + sectionId);
          const source = html.getElementById('block-inventory-' + sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _updateMedia() {
          if (!chooseOption && !productBundle) {
            let splideEl = document.getElementById("x-product-" + sectionId);
            let slideVariant = ""
            let index = ""
            let activeEL = ""
            if (this.currentVariant && this.currentVariant.featured_media != null ) {
              slideVariant = document.getElementsByClassName(this.currentVariant.featured_media.id + '-' + sectionId);
              index = parseInt(slideVariant[0].getAttribute('index'));
              activeEL = document.getElementById('postion-image-' + sectionId + '-' + this.currentVariant.featured_media.id);
            } else {
              slideVariant = splideEl.querySelector(".featured-image");
              index = parseInt(slideVariant.getAttribute('index'));
              activeEL = document.querySelector(`#stacked-${sectionId} .featured-image`);
            }
            let mediaWithVariantSelected = document.getElementById("product-media-" + sectionId).dataset.mediaWithVariantSelected;
            if (splideEl && !mediaWithVariantSelected) {
              if (splideEl.splide && slideVariant) {
                splideEl.splide.go(index)
              } else {
                document.addEventListener(`eurus:media-gallery-ready:${sectionId}`, () => {
                  if (splideEl.splide)
                    splideEl.splide.go(index);
                });
              }
            }
            if (!activeEL) return;
            
            if (!mediaWithVariantSelected) {
              let stackedEL = document.getElementById('stacked-' + sectionId);
              stackedEL.prepend(activeEL);
            }
          }
        },
        validateOption() {
          const mediaWithOption = document.querySelector(`#shopify-section-${sectionId} [data-media-option]`);
          if (mediaWithOption )
            this.mediaOption = mediaWithOption.dataset.mediaOption
        },
        _updateMultiMediaWithVariant() {
          this.validateOption()
          if (!this.mediaOption || !this.currentVariant)
            return;

          const variantInput = document.querySelector(`#shopify-section-${sectionId} [data-option-name="${this.mediaOption}"]`);
          const variantOptionIndex = variantInput && variantInput.dataset.optionIndex;
          const optionValue = this.handleText(this.currentVariant.options[variantOptionIndex]);
          var optionConnect = this.mediaOption + '-' + optionValue;
          
          this.optionIndex = variantOptionIndex;
          
          const newMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-type="${optionConnect}"], #shopify-section-${ sectionId } [data-media-type="${optionConnect}"]`);     
          if (!newMedias.length) {
            document.querySelectorAll( `#ProductModal-${ sectionId } [data-media-type], #shopify-section-${ sectionId } [data-media-type]`).forEach(function(media){
              media.classList.add('media_active');
              media.classList.add('splide__slide')
            });

            document.dispatchEvent(new CustomEvent("reload-thumbnail-" + sectionId));
            return;
          };
          document.querySelectorAll( `#shopify-section-${ sectionId } [data-media-type], #ProductModal-${ sectionId } [data-media-type]`).forEach(function(media){
            media.classList.remove('media_active');
            media.classList.remove('splide__slide');
          });

          Array.from(newMedias).reverse().forEach(function(newMedia, position) {
            newMedia.classList.add('media_active');
            if (newMedia.classList.contains('media-slide')) {
              newMedia.classList.add('splide__slide');
            }
            let parent = newMedia.parentElement;
            if (parent.firstChild != newMedia) {
              parent.prepend(newMedia);
            }
          });
          if (this.optionConnect != optionConnect) {
            document.dispatchEvent(new CustomEvent("reload-thumbnail-" + sectionId));
          }
          this.optionConnect = optionConnect;
        },
        handleText(someString) {
          if (someString) {
            return someString.toString().replace('ı', 'i').replace('ß', 'ss').normalize('NFD').replace('-', ' ').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, "-");
          }
        },
        goToFirstSlide() {
          let splideEl = document.getElementById("x-product-" + sectionId);
          let mediaWithVariantSelected = document.getElementById("product-media-" + sectionId).dataset.mediaWithVariantSelected;
          if (splideEl && mediaWithVariantSelected) {
            if (splideEl.splide && this.currentVariant && this.currentVariant.featured_image != null) {
              splideEl.splide.go(0);
            }
          }

          let activeEL = document.querySelector(`#stacked-${sectionId} .featured-image`);
          let stackedEL = document.getElementById('stacked-' + sectionId);
          if(stackedEL) stackedEL.prepend(activeEL);
        },
        _updateMasterId() {
          this.currentVariant = this.variants.find((variant) => {
            return !variant.options.map((option, index) => {
              return this.options[index] === option.replaceAll('\\/', '/');
            }).includes(false);
          });
        },
        _updateVariantInput() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            if (!input) return;
            input.value = this.currentVariant.id;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          })
        },
        _updateProductForms() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            if (input) {
              input.value = this.currentVariant.id;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        },
        _renderPriceProduct(html) {
          const destination = document.getElementById('price-' + sectionId);
          const source = html.getElementById('price-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _renderSkuProduct(html) {
          const destination = document.getElementById('sku-' + sectionId);
          const source = html.getElementById('sku-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _renderProductBadges(html) {
          const destination = document.getElementById('x-badges-' + sectionId);
          const source = html.getElementById('x-badges-'+ sectionId);
          
          if (source && destination) destination.innerHTML += source.innerHTML;
        },
        _renderBuyButtons(html) {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          const atcSource = html.getElementById('x-atc-button-' + sectionId);
          productForms.forEach((productForm) => {
            const atcDestination = productForm.querySelector('.add_to_cart_button');
            if (!atcDestination) return;

            if (atcSource && atcDestination) atcDestination.innerHTML = atcSource.innerHTML;
    
            if (this.currentVariant.available) {
              /// Enable add to cart button
              if (html.getElementById('form-gift-card-' + sectionId)) {
                document.getElementById('Recipient-checkbox-' + sectionId).checked && atcDestination.disabled ? atcDestination.setAttribute('disabled', 'disabled') : atcDestination.removeAttribute('disabled');
              } else {
                atcDestination.removeAttribute('disabled');
              }
            } else {
              atcDestination.setAttribute('disabled', 'disabled');
            }
          });
          const paymentButtonDestination = document.getElementById('x-payment-button-' + sectionId);
          const paymentButtonSource = html.getElementById('x-payment-button-' + sectionId);
          if (paymentButtonSource && paymentButtonDestination) {
            if (paymentButtonSource.classList.contains('hidden')) {
              paymentButtonDestination.classList.add('hidden');
            } else {
              paymentButtonDestination.classList.remove('hidden');
            }
          }
        },
        _setMessagePreOrder(html) {
          const msg = document.querySelector(`.pre-order-${sectionId}`);
          if (!msg) return;
          msg.classList.add('hidden');
          const msg_pre = html.getElementById(`pre-order-${sectionId}`);
          if (msg_pre) {
            msg.classList.remove('hidden');
            msg.innerHTML = msg_pre.innerHTML;
          }
        },
        _setEstimateDelivery(html) {
          const est = document.getElementById(`x-estimate-delivery-${sectionId}`);
          if (!est) return;
          const est_res = html.getElementById(`x-estimate-delivery-${sectionId}`);
          if (est_res.classList.contains('disable-estimate')) {
            est.classList.add('hidden');
          } else {
            est.classList.remove('hidden');
          }
        },
        _setCartEstimateDelivery(html) {
          const est = document.getElementById(`cart-edt-${sectionId}`);
          const est_res = html.getElementById(`cart-edt-${sectionId}`);
          if (est && est_res) est.innerHTML = est_res.innerHTML;
        },
        _setBackInStockAlert(html) {
          const destination = document.getElementById(`back_in_stock_alert-${sectionId}`);
          const source = html.getElementById(`back_in_stock_alert-${sectionId}`);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _setPickupPreOrder(html) {
          const pickup = document.getElementById(`pickup-pre-order-${sectionId}`);
          if (!pickup) return;
          const pickup_res = html.getElementById(`pickup-pre-order-${sectionId}`);
          if (pickup_res.classList.contains('disable-pickup')) {
            pickup.classList.add('hidden');
          } else {
            pickup.classList.remove('hidden');
          }
        },
        _setUnavailable() {
          const price = document.getElementById(`price-` + sectionId);
          if (price) price.classList.add('hidden');

          const priceDesktop = document.getElementById(`price-sticky-${sectionId}`);
          if (priceDesktop) priceDesktop.classList.add('hidden');
          
          const inventory = document.getElementById(`block-inventory-` + sectionId);
          if (inventory) inventory.classList.add('hidden');
  
          const badges = document.getElementById(`x-badges-` + sectionId);
          if (badges) badges.classList.add('hidden');
  
          const pickup = document.getElementById(`pickup-` + sectionId);
          if (pickup) pickup.classList.add('hidden');
  
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (quantity) quantity.classList.add('unavailable');

          const msg_pre = document.querySelector(`.pre-order-${sectionId}`);
          if (msg_pre) msg_pre.classList.add('hidden');
          

          this._setBuyButtonUnavailable();
        },
        _setAvailable() {
          const price = document.getElementById(`price-` + sectionId);
          if (price) price.classList.remove('hidden');
  
          const inventory = document.getElementById(`block-inventory-` + sectionId);
          if (inventory) inventory.classList.remove('hidden');
  
          const badges = document.getElementById(`x-badges-` + sectionId);
          if (badges) badges.classList.remove('hidden');
  
          const pickup = document.getElementById(`pickup-` + sectionId);
          if (pickup) pickup.classList.remove('hidden');
  
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (quantity) quantity.classList.remove('unavailable');
        },
        _setBuyButtonUnavailable() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId},  #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const addButton = productForm.querySelector('.add_to_cart_button');
            if (!addButton) return;
            addButton.setAttribute('disabled', 'disabled');
            const addButtonText = addButton.querySelector('.x-atc-text');
            if (addButtonText) addButtonText.textContent = unavailableText;
          });
        },
        _dispatchUpdateVariant(html="") {
          document.dispatchEvent(new CustomEvent(`eurus:product-card-variant-select:updated:${sectionId}`, {
            detail: {
              currentVariant: this.currentVariant,
              currentAvailableOptions: this.currentAvailableOptions,
              options: this.options,
              html: html
            }
          }));
        },
        updateImageVariant() {
          if (this.currentVariant != null) {
            let featured_image = ""
            if (this.currentVariant.featured_image != null) {
              featured_image = this.currentVariant.featured_image.src;
            }
            Alpine.store('xPreviewColorSwatch').updateImage(this.$el, productUrl, featured_image, this.currentVariant.id)
          }
        }
      }))
    });
  });

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xStickyATC', (sectionId) => ({
        openDetailOnMobile: false,
        currentAvailableOptions: [],
        options: [],
        init() {
          this.variants = xParseJSON(this.$el.getAttribute('x-variants-data'));

          document.addEventListener('eurus:product-page-variant-select:updated', (e) => {
            this.currentAvailableOptions = e.detail.currentAvailableOptions,
            this.options = e.detail.options;

            this.renderProductPrice(e.detail.html);
            this.renderMedia(e.detail.html);
          });
        },
        renderProductPrice(html) {
          const destinations = document.querySelectorAll(`.price-sticky-${sectionId}`);
          destinations.forEach((destination) => {
            const source = html.getElementById('price-sticky-' + sectionId);
            if (source && destination) destination.innerHTML = source.innerHTML;
          })
        },
        renderMedia(html) {
          const destination = document.getElementById('product-image-sticky-' + sectionId);
          const source = html.getElementById('product-image-sticky-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      }))
    })
  });

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xPickupAvailable', {
        updatePickUp(id, variantId) {
          const container = document.getElementsByClassName('pick-up-'+ id)[0];
          if (!container) return;
  
          fetch(window.Shopify.routes.root + `variants/${variantId}/?section_id=pickup-availability`)
            .then(response => response.text())
            .then(text => {
              const pickupAvailabilityHTML = new DOMParser()
                .parseFromString(text, 'text/html')
                .querySelector('.shopify-section');
  
              container.innerHTML = pickupAvailabilityHTML.innerHTML;
            })
            .catch(e => {
              console.error(e);
            }); 
        }
      });
    });
  });
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xUpdateVariantQuanity', {
        updateQuantity(sectionId, productUrl, currentVariant) {
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (!quantity) return;
          const url = currentVariant ? `${productUrl}?variant=${currentVariant}&section_id=${sectionId}` :
                        `${productUrl}?section_id=${sectionId}`;
          fetch(url)
            .then((response) => response.text())
            .then((responseText) => {
              let html = new DOMParser().parseFromString(responseText, 'text/html');
              this.render(html, sectionId);
            });
        },
        render(html, sectionId) {
          const destination = document.getElementById('x-quantity-' + sectionId);
          const source = html.getElementById('x-quantity-'+ sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      });
    });
  });
}
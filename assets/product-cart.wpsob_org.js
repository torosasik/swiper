if (!window.Eurus.loadedScript.includes('product-cart.js')) {
  window.Eurus.loadedScript.push('product-cart.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xProductCart', (
        wrappringVariantId,
      ) => ({
        loading: false,
        errorMessage: false,
        buttonSubmit: "",
        error_message_wrapper: {},
        stopAction: false,
        async addToCart(e, required) {
          e.preventDefault();
          
          if (required) {
            var productInfo = this.$el.closest('.product-info');
            if (productInfo) {
              var propertiesInput = productInfo.querySelectorAll(`.customization-picker`);
              this.stopAction = false;
              propertiesInput.length && propertiesInput.forEach((input) => {
                if (input.required && input.value == '' || input.classList.contains("validate-checkbox")) {
                  input.classList.add("required-picker");
                  this.stopAction = true;
                }
              });
            }
            if (this.stopAction) {
              return true;
            }
          }

          this.loading = true;

          if (this.$refs.gift_wrapping_checkbox && this.$refs.gift_wrapping_checkbox.checked && wrappringVariantId) {
            const giftData = {
              items: [
                {
                  id: wrappringVariantId,
                  quantity: 1
                }
              ]
            };
    
            const giftResponse = await window.fetch('/cart/add.js', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(giftData),
            });
    
            const giftResponse1 = await giftResponse.json();
            if (!giftResponse.ok) {
              if (giftResponse1.status == 422) {
                this.$refs.gift_wrapping_error.textContent = giftResponse1.description;
                this.loading = false;
                setTimeout(() => {
                  this.$refs.gift_wrapping_error.textContent = "";
                }, 5000);
              }
              return;
            }
          }

          let formData = new FormData(this.$refs.product_form);
          formData.append(
            'sections',
            Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          await fetch(`${Eurus.cart_add_url}`, {
            method:'POST',
            headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
          }).then(reponse => {
            return reponse.json();
          }).then((response) => {
            if (response.status == '422') {
              if (typeof response.errors == 'object') {
                this.error_message_wrapper = response.errors;
                document.querySelector('.recipient-error-message').classList.remove('hidden');
              } else {
                this.errorMessage = true;
                if(this.$refs.error_message){
                  this.$refs.error_message.textContent = response.description;
                }
              }
              if (Alpine.store('xMiniCart')) {
                Alpine.store('xMiniCart').reLoad();
              }
            } else {
              document.querySelector('.recipient-error-message') ? document.querySelector('.recipient-error-message').classList.add('hidden') : '';
              this.error_message_wrapper = {};

              Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
                const sectionElement = document.querySelector(section.selector);
                if (sectionElement) {
                  if (response.sections[section.id])
                    sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
                }
              }));
  
              if (Alpine.store('xQuickView') && Alpine.store('xQuickView').show) {
                Alpine.store('xQuickView').show = false;
              }
              Alpine.store('xPopup').open = false;
              Alpine.store('xMiniCart').openCart();
              
              Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').innerHTML);
              document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
            }
          }).catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loading = false;
            if(this.$refs.gift_wrapping_checkbox) this.$refs.gift_wrapping_checkbox.checked = false;
          }) 
        }
      }))
    });
  });
}

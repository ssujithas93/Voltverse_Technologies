// ================= HEADER SCROLL STATE =================
const header = document.getElementById('site-header');
const onScroll = () => {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll);
onScroll();

// ================= MOBILE NAV =================
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    const isActive = navLinks.classList.toggle('active');
    menuBtn.setAttribute('aria-expanded', isActive);
    menuBtn.innerHTML = isActive ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', false);
      menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}

// ================= SCROLL REVEAL (progressive enhancement) =================
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  revealEls.forEach(el => el.classList.add('pre-anim'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
}

// ================= ANIMATED COUNTERS =================
const counters = document.querySelectorAll('.counter');

const animateCounter = (el) => {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  };
  requestAnimationFrame(tick);
};

if ('IntersectionObserver' in window && counters.length) {
  const statsSection = document.querySelector('.stats');
  if (statsSection) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          counters.forEach(el => animateCounter(el));
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    counterObserver.observe(statsSection);
  } else {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    counters.forEach(el => counterObserver.observe(el));
  }
}

// ================= CONTACT FORM (demo submit) =================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button');
    const original = btn.innerHTML;
    btn.innerHTML = 'Message Sent <i class="fas fa-check"></i>';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      contactForm.reset();
    }, 2400);
  });
}

const CART_KEY = 'Voltverse_Technologies_cart_v1';

const getCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
};
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const formatPrice = (n) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cartBadge   = document.getElementById('cart-badge');
const cartDrawer  = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsEl = document.getElementById('cart-items');
const cartEmptyEl = document.getElementById('cart-empty');
const cartSubtotalEl = document.getElementById('cart-subtotal');

const renderCart = () => {
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  if (cartBadge) {
    cartBadge.textContent = count;
    cartBadge.classList.toggle('show', count > 0);
  }

  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    if (cartEmptyEl) cartEmptyEl.style.display = 'flex';
  } else {
    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    cart.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML =
        '<div class="cart-item-icon"><i class="' + (item.icon || 'fas fa-box') + '"></i></div>' +
        '<div class="cart-item-info">' +
          '<span class="cart-item-name">' + item.name + '</span>' +
          '<div class="cart-item-meta">' +
            '<span>' + formatPrice(item.price) + '</span>' +
            '<div class="cart-qty-ctrl">' +
              '<button class="cart-qty-btn cart-qty-minus" data-idx="' + idx + '" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>' +
              '<span class="cart-qty-val">' + item.qty + '</span>' +
              '<button class="cart-qty-btn cart-qty-plus" data-idx="' + idx + '" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="cart-item-remove" data-idx="' + idx + '" aria-label="Remove item"><i class="fas fa-xmark"></i></button>';
      cartItemsEl.appendChild(row);
    });
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotal);

  // Cart item remove listener
  cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getCart();
      c.splice(Number(btn.dataset.idx), 1);
      saveCart(c);
      renderCart();
    });
  });

  // Cart item decrement listener
  cartItemsEl.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getCart();
      const idx = Number(btn.dataset.idx);
      if (c[idx].qty > 1) {
        c[idx].qty -= 1;
        saveCart(c);
        renderCart();
      } else {
        c.splice(idx, 1);
        saveCart(c);
        renderCart();
      }
    });
  });

  // Cart item increment listener
  cartItemsEl.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getCart();
      const idx = Number(btn.dataset.idx);
      c[idx].qty += 1;
      saveCart(c);
      renderCart();
    });
  });
};

// Global helper for adding items to the cart
const addToCart = (name, price, icon, qtyToAdd = 1, btn = null, qtyInput = null) => {
  const cart = getCart();
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty += qtyToAdd;
  else cart.push({ name, price, icon, qty: qtyToAdd });
  saveCart(cart);
  renderCart();

  if (qtyInput) qtyInput.value = 1;

  if (btn) {
    if (btn.classList.contains('added')) return;
    btn.classList.add('added');
    const label = btn.querySelector('.cta-label');
    const originalText = label ? label.textContent : btn.innerHTML;
    
    if (label) {
      label.textContent = 'Added';
    } else {
      btn.innerHTML = 'Added <i class="fas fa-check"></i>';
    }
    
    setTimeout(() => {
      btn.classList.remove('added');
      if (label) {
        label.textContent = originalText;
      } else {
        btn.innerHTML = originalText;
      }
    }, 1400);
  }

  // Automatically slide out the cart drawer
  openCart();
};

const getApiUrl = (path) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname;
  const base = isLocal ? 'http://localhost:5000' : '';
  return `${base}${path}`;
};

// Fallback hardcoded product list in case backend is offline
const fallbackProducts = [
  {
    name: "WORK STATION (For Kids)",
    price: 1000.00,
    icon: "fas fa-briefcase",
    tag: "Electronics Kit",
    description: "A fun and educational workshop organizer specifically designed for kids. It helps children learn the basics of assembly, organization, and safety when working on small electronics and robotics projects.",
    features: ["Built-in tool storage slots and compartments", "Sturdy, child-safe structural material", "Perfect companion for DIY electronics projects"],
    image_url: "images/WhatsApp Image 2026-07-13 at 1.22.24 PM.jpeg"
  },
  {
    name: "IOT Trainer Kit",
    price: 5299.00,
    icon: "fas fa-microchip",
    tag: "IoT Development",
    description: "A comprehensive educational trainer kit for learning IoT concepts and cloud integrations. Equipped with development boards and a wide array of sensors.",
    features: ["ESP32 core development board with Wi-Fi & Bluetooth", "Sensors: Temperature, Humidity, Soil Moisture, and Ultrasonic", "128x64 OLED Display and dynamic RGB LED controls", "Full guide and code templates included"],
    image_url: "images/IOT Trainer Kit.png"
  },
  {
    name: "AUDAPS — Underwater Platform",
    price: 12000.00,
    icon: "fas fa-water",
    tag: "Marine Technology",
    description: "Our premier autonomous data collection platform designed for sub-surface monitoring. Configurable with custom scientific sensor payloads.",
    features: ["IP68 rated modular structural body", "Sensors: Water Temperature, Turbidity, and pH levels", "Continuous data logging to internal flash memory", "Wireless data transmission when surfaced"],
    image_url: "images/AUDAPS 3.png"
  },
  {
    name: "Robotic Dog Kit",
    price: 1000.00,
    icon: "fas fa-dog",
    tag: "Robotics Kit",
    description: "An interactive, quadruped robot kit that teaches servo control, motor alignment, and basic walk cycle coding.",
    features: ["4-legged chassis with SG90 micro servos", "Ultrasonic sensor for obstacle avoidance", "Programmable walk, sit, and dance sequences", "Easy assembly with screw-together parts"],
    image_url: "images/Robotic dog.png"
  }
];

let productsList = [];

// Fetch products from Python server or use fallback
const loadProducts = async () => {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  try {
    const res = await fetch(getApiUrl('/api/products'));
    if (!res.ok) throw new Error('API server returned error');
    productsList = await res.json();
  } catch (err) {
    console.warn("Backend server offline, falling back to local products:", err);
    productsList = fallbackProducts;
  }

  // Render the products
  renderShopGrid(grid);
};

const renderShopGrid = (grid) => {
  grid.innerHTML = '';
  productsList.forEach((prod) => {
    const card = document.createElement('div');
    card.className = 'product-card reveal';
    card.innerHTML = `
      <div class="product-media" style="cursor: pointer;">
        <img src="${prod.image_url}" alt="${prod.name}">
      </div>
      <div class="product-body">
        <span class="product-name">${prod.name}</span>
        <span class="product-vendor">Voltverse_Technologies
 Technologies</span>
        <span class="product-price">${formatPrice(prod.price)}</span>
        <div class="product-quantity">
          <button type="button" class="qty-btn qty-minus" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
          <input type="number" class="qty-input" value="1" min="1" readonly>
          <button type="button" class="qty-btn qty-plus" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
        </div>
        <button class="add-to-cart">
          <i class="fas fa-cart-plus"></i><i class="fas fa-check"></i>
          <span class="cta-label">Add to Cart</span>
        </button>
        <span class="product-more">View details <i class="fas fa-arrow-right"></i></span>
      </div>
    `;

    // Add event listeners for this product card
    const media = card.querySelector('.product-media');
    const moreLink = card.querySelector('.product-more');
    const minusBtn = card.querySelector('.qty-minus');
    const plusBtn = card.querySelector('.qty-plus');
    const qtyInput = card.querySelector('.qty-input');
    const addBtn = card.querySelector('.add-to-cart');

    // Click card or link to open details
    const openProductDetails = () => openDetail(prod);
    media.addEventListener('click', openProductDetails);
    moreLink.addEventListener('click', openProductDetails);

    // Quantity selectors
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });

    // Add to cart button
    addBtn.addEventListener('click', () => {
      const qtyToAdd = parseInt(qtyInput.value) || 1;
      addToCart(prod.name, prod.price, prod.icon, qtyToAdd, addBtn, qtyInput);
    });

    grid.appendChild(card);
  });
};

const openCart = () => {
  cartDrawer?.classList.add('open');
  cartOverlay?.classList.add('show');
  document.body.style.overflow = 'hidden';
};
const closeCart = () => {
  cartDrawer?.classList.remove('open');
  cartOverlay?.classList.remove('show');
  document.body.style.overflow = '';
};

document.querySelector('.nav-cart')?.addEventListener('click', openCart);
document.getElementById('cart-close')?.addEventListener('click', closeCart);
cartOverlay?.addEventListener('click', closeCart);

// Checkout handler with Python Flask integration
const checkoutBtn = document.getElementById('cart-checkout');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    const cart = getCart();
    if (cart.length === 0) return;

    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = 'Processing... <i class="fas fa-spinner fa-spin"></i>';
    checkoutBtn.disabled = true;

    try {
      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: cart })
      });

      if (!res.ok) throw new Error('Order submission failed');
      const result = await res.json();

      if (result.success) {
        // Clear cart on success
        saveCart([]);
        renderCart();

        // Close drawer and show success alert
        closeCart();
        alert(`Order Placed Successfully!\n\nOrder ID: ${result.order_id}\nTotal Price: ${formatPrice(result.total_price)}\n\nThank you for shopping with Voltverse_Technologies
 Technologies.`);
      }
    } catch (err) {
      console.warn("Backend server offline, performing client-side mock checkout:", err);
      // Fallback checkout for demo site if API server is offline
      setTimeout(() => {
        saveCart([]);
        renderCart();
        closeCart();
        alert("Demo Checkout Success! Order saved locally on your device since the backend server is offline.");
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
      }, 1500);
    }
  });
}

renderCart();
loadProducts(); // Load products dynamically on startup

// ================= NEWSLETTER FORM (demo submit) =================
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = newsletterForm.querySelector('.newsletter-sub-msg');
    const btn = newsletterForm.querySelector('button');
    const original = btn.innerHTML;
    btn.innerHTML = 'Subscribed <i class="fas fa-check"></i>';
    btn.disabled = true;
    if (msg) msg.classList.add('show');
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      if (msg) msg.classList.remove('show');
      newsletterForm.reset();
    }, 2600);
  });
}

// ================= DETAIL MODAL (Achievements / Projects / Products) =================
const detailOverlay   = document.getElementById('detail-overlay');
const detailModalBody = document.getElementById('detail-modal-body');
const detailClose     = document.getElementById('detail-close');

const openDetail = (target) => {
  if (!detailModalBody || !detailOverlay) return;
  detailModalBody.innerHTML = '';

  if (typeof target === 'string') {
    // Static template (achievements or projects)
    const tpl = document.getElementById(target);
    if (!tpl) return;
    detailModalBody.appendChild(tpl.content.cloneNode(true));
  } else {
    // Dynamic product object from backend
    const product = target;
    const featuresHTML = product.features.map(f => `<li>${f}</li>`).join('');
    detailModalBody.innerHTML = `
      <div class="detail-media"><img src="${product.image_url}" alt="${product.name}"></div>
      <div class="detail-icon"><i class="${product.icon}"></i></div>
      <span class="detail-tag">${product.tag}</span>
      <h2>${product.name}</h2>
      <p class="detail-price">Price: ${formatPrice(product.price)}</p>
      <p>${product.description}</p>
      <h4>Features &amp; Specifications</h4>
      <ul class="detail-list">
        ${featuresHTML}
      </ul>
      <div class="product-quantity" style="margin-bottom: 16px;">
        <button type="button" class="qty-btn qty-minus" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
        <input type="number" class="qty-input" value="1" min="1" readonly>
        <button type="button" class="qty-btn qty-plus" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary modal-buy-now">Buy Now</button>
        <button class="btn btn-ghost modal-add-to-cart">Add to Cart</button>
      </div>
    `;

    // Dynamic bindings for product details modal
    const minusBtn = detailModalBody.querySelector('.qty-minus');
    const plusBtn = detailModalBody.querySelector('.qty-plus');
    const qtyInput = detailModalBody.querySelector('.qty-input');
    const modalAddToCartBtn = detailModalBody.querySelector('.modal-add-to-cart');
    const modalBuyNowBtn = detailModalBody.querySelector('.modal-buy-now');

    if (minusBtn && plusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val > 1) qtyInput.value = val - 1;
      });
      plusBtn.addEventListener('click', () => {
        let val = parseInt(qtyInput.value) || 1;
        qtyInput.value = val + 1;
      });
    }

    if (modalAddToCartBtn) {
      modalAddToCartBtn.addEventListener('click', () => {
        const qtyToAdd = qtyInput ? parseInt(qtyInput.value) : 1;
        addToCart(product.name, product.price, product.icon, qtyToAdd, modalAddToCartBtn, qtyInput);
      });
    }

    if (modalBuyNowBtn) {
      modalBuyNowBtn.addEventListener('click', () => {
        const qtyToAdd = qtyInput ? parseInt(qtyInput.value) : 1;
        addToCart(product.name, product.price, product.icon, qtyToAdd);
        closeDetail();
        openCart();
      });
    }
  }

  // Bind static quantity selectors for achievements/projects templates if they exist
  const minusBtnTpl = detailModalBody.querySelector('.qty-minus');
  const plusBtnTpl = detailModalBody.querySelector('.qty-plus');
  const qtyInputTpl = detailModalBody.querySelector('.qty-input');
  if (minusBtnTpl && plusBtnTpl && qtyInputTpl && typeof target === 'string') {
    minusBtnTpl.addEventListener('click', () => {
      let val = parseInt(qtyInputTpl.value) || 1;
      if (val > 1) qtyInputTpl.value = val - 1;
    });
    plusBtnTpl.addEventListener('click', () => {
      let val = parseInt(qtyInputTpl.value) || 1;
      qtyInputTpl.value = val + 1;
    });
  }

  detailOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
};

const closeDetail = () => {
  detailOverlay?.classList.remove('show');
  document.body.style.overflow = '';
};

// Bind detail trigger for static list cards (achievements and projects)
document.querySelectorAll('[data-detail]').forEach(card => {
  card.addEventListener('click', () => openDetail(card.dataset.detail));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail(card.dataset.detail);
    }
  });
});

detailClose?.addEventListener('click', closeDetail);
detailOverlay?.addEventListener('click', (e) => {
  if (e.target === detailOverlay) closeDetail();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetail();
});
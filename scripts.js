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
    price: 2500.00,
    icon: "fas fa-briefcase",
    tag: "Electronics Kit",
    description: "A fun and educational workshop organizer specifically designed for kids. It helps children learn the basics of assembly, organization, and safety when working on small electronics and robotics projects.",
    features: ["Built-in tool storage slots and compartments", "Sturdy, child-safe structural material", "Perfect companion for DIY electronics projects"],
    image_url: "images/WhatsApp Image 2026-07-13 at 1.22.24 PM.jpeg"
  },
  {
    name: "IOT Trainer Kit",
    price: 6000.00,
    icon: "fas fa-microchip",
    tag: "IoT Development",
    description: "A comprehensive educational trainer kit for learning IoT concepts and cloud integrations. Equipped with development boards and a wide array of sensors.",
    features: ["ESP32 core development board with Wi-Fi & Bluetooth", "Sensors: Temperature, Humidity, Soil Moisture, and Ultrasonic", "128x64 OLED Display and dynamic RGB LED controls", "Full guide and code templates included"],
    image_url: "images/IOT Trainer Kit.png"
  },
  {
    name: "AUDAPS — Underwater Platform",
    price: 16000.00,
    icon: "fas fa-water",
    tag: "Marine Technology",
    description: "Our premier autonomous data collection platform designed for sub-surface monitoring. Configurable with custom scientific sensor payloads.",
    features: ["IP68 rated modular structural body", "Sensors: Water Temperature, Turbidity, and pH levels", "Continuous data logging to internal flash memory", "Wireless data transmission when surfaced"],
    image_url: "images/AUDAPS 3.png"
  },
  {
    name: "Robotic Dog Kit",
    price: 3500.00,
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
  checkoutBtn.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) return;

    if (!currentUser) {
      alert("Please sign in or create an account to proceed with checkout.");
      closeCart();
      sessionStorage.setItem('checkout_pending', 'true');
      window.location.href = 'login.html';
      return;
    }

    closeCart();
    openCheckoutModal();
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
    initCardSlideshows(detailModalBody);
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
        const cartItem = {
          name: product.name,
          price: product.price,
          icon: product.icon,
          qty: qtyToAdd
        };
        saveCart([cartItem]);
        renderCart();
        closeDetail();
        
        if (!currentUser) {
          alert("Please sign in or create an account to proceed with checkout.");
          sessionStorage.setItem('checkout_pending', 'true');
          window.location.href = 'login.html';
          return;
        }
        
        openCheckoutModal();
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

// ================= CARD SLIDESHOW (Card 4) =================
const initCardSlideshows = (container = document) => {
  const slideshows = container.querySelectorAll('.card-slideshow');
  slideshows.forEach(slideshow => {
    const slides = slideshow.querySelectorAll('.slide');
    const prevBtn = slideshow.querySelector('.prev');
    const nextBtn = slideshow.querySelector('.next');
    
    if (slides.length <= 1) return;
    
    let currentIndex = 0;
    let timer = null;
    
    const showSlide = (index) => {
      slides.forEach((slide, idx) => {
        if (idx === index) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
      currentIndex = index;
    };
    
    const nextSlide = () => {
      let nextIndex = (currentIndex + 1) % slides.length;
      showSlide(nextIndex);
    };
    
    const prevSlide = () => {
      let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(prevIndex);
    };
    
    const startTimer = () => {
      timer = setInterval(nextSlide, 3500); // 3.5 seconds
    };
    
    const resetTimer = () => {
      if (timer) {
        clearInterval(timer);
        startTimer();
      }
    };
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening modal
        prevSlide();
        resetTimer();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening modal
        nextSlide();
        resetTimer();
      });
    }
    
    // Start auto loop
    startTimer();
  });
};

// Initialize slideshows
initCardSlideshows();

// ================= USER AUTHENTICATION CLIENT LOGIC =================

// Helper to show custom alerts inside login/signup pages
const showAuthAlert = (msg, type = 'error') => {
  const alertEl = document.getElementById('auth-alert');
  if (!alertEl) return;
  alertEl.className = `auth-alert ${type}`;
  alertEl.innerHTML = (type === 'error' ? '<i class="fas fa-circle-exclamation"></i>' : '<i class="fas fa-circle-check"></i>') + `<span>${msg}</span>`;
  alertEl.classList.remove('hidden');
};

const hideAuthAlert = () => {
  const alertEl = document.getElementById('auth-alert');
  if (alertEl) alertEl.classList.add('hidden');
};

// Check current user session status
let currentUser = null;

const checkUserSession = async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'login.html';
      }
      return;
    }
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      updateNavbarForUser(data.user);
      
      // Auto-trigger checkout if pending marker exists
      if (sessionStorage.getItem('checkout_pending') === 'true') {
        sessionStorage.removeItem('checkout_pending');
        setTimeout(() => {
          openCheckoutModal();
        }, 500);
      }
      
      // Initialize profile page if we are on it
      if (window.location.pathname.includes('profile.html')) {
        initProfilePage(data.user);
      }
    } else {
      if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'login.html';
      }
    }
  } catch (err) {
    console.warn("Could not retrieve user session:", err);
    if (window.location.pathname.includes('profile.html')) {
      // Fallback details render for demo testing if offline
      initProfilePage({
        name: "Demo Account",
        email: "demo@voltversetech.com",
        phone: "+91 98765 43210"
      });
    }
  }
};

// Update navbar with user details and logout dropdown
const updateNavbarForUser = (user) => {
  const userBtn = document.getElementById('nav-user-btn');
  if (!userBtn) return;
  
  // Wrap userBtn in a dropdown container
  const parent = userBtn.parentElement;
  if (!parent) return;
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-user-dropdown-wrapper';
  
  // Clone userBtn and configure it
  const newUserBtn = userBtn.cloneNode(true);
  newUserBtn.classList.add('active');
  newUserBtn.setAttribute('href', 'profile.html');
  newUserBtn.style.cursor = 'pointer';
  
  if (user.avatar) {
    newUserBtn.innerHTML = `<img src="${user.avatar}" alt="${user.name}">`;
  } else {
    // Generate an initial icon or default icon
    const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    newUserBtn.innerHTML = `<span style="font-weight: 700; font-family: var(--font-title);">${initials}</span>`;
  }
  
  // Create dropdown menu
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-user-dropdown';
  dropdown.innerHTML = `
    <div class="dropdown-user-info">
      <span class="dropdown-user-name">${user.name}</span>
      <span class="dropdown-user-email">${user.email}</span>
    </div>
    <a href="profile.html" class="dropdown-link"><i class="fas fa-user-gear"></i> View Profile</a>
    <a href="shop.html" class="dropdown-link"><i class="fas fa-store"></i> Shop Products</a>
    <button class="dropdown-btn" id="logout-btn"><i class="fas fa-right-from-bracket"></i> Sign Out</button>
  `;
  
  wrapper.appendChild(newUserBtn);
  wrapper.appendChild(dropdown);
  
  // Toggle dropdown on click/touch
  newUserBtn.addEventListener('click', (e) => {
    // Only prevent default redirection and toggle dropdown on mobile screens
    if (window.innerWidth <= 768) {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('active-toggle');
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('active-toggle');
    }
  });
  
  // Replace the old button with wrapper
  parent.replaceChild(wrapper, userBtn);
  
  // Add logout listener
  const logoutBtn = dropdown.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.location.reload();
        }
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }
};

// Initialize profile page details
const initProfilePage = (user) => {
  if (!document.getElementById('profile-name')) return;
  
  document.getElementById('profile-name').innerText = user.name;
  document.getElementById('profile-email').innerText = user.email;
  document.getElementById('profile-phone').innerText = user.phone || 'Not provided';
  
  const initialsEl = document.getElementById('profile-initials');
  if (initialsEl) {
    if (user.avatar) {
      initialsEl.parentElement.innerHTML = `<img src="${user.avatar}" alt="${user.name}">`;
    } else {
      initialsEl.innerText = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    }
  }
  
  // Bind profile logout button
  const profileLogout = document.getElementById('profile-logout-btn');
  if (profileLogout) {
    profileLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = 'index.html';
        }
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }
  
  // Fetch order history
  loadOrderHistory();
};

const loadOrderHistory = async () => {
  const listContainer = document.getElementById('orders-list-container');
  if (!listContainer) return;
  
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error("Could not fetch orders");
    const data = await res.json();
    
    if (data.success && data.orders && data.orders.length > 0) {
      listContainer.innerHTML = '';
      data.orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        let itemsHtml = '';
        order.items.forEach(item => {
          itemsHtml += `
            <div class="order-item-row">
              <span class="order-item-name">${item.name} <span class="order-item-qty">x${item.qty}</span></span>
              <span class="order-item-price">${formatPrice(item.price * item.qty)}</span>
            </div>
          `;
        });
        
        card.innerHTML = `
          <div class="order-card-header">
            <div class="order-meta-item">
              <span class="order-meta-label">Order ID</span>
              <span class="order-meta-val">${order.order_id}</span>
            </div>
            <div class="order-meta-item">
              <span class="order-meta-label">Date Placed</span>
              <span class="order-meta-val">${order.created_at || 'Recently'}</span>
            </div>
            <div class="order-meta-item">
              <span class="order-meta-label">Total Amount</span>
              <span class="order-meta-val price">${formatPrice(order.total_price)}</span>
            </div>
          </div>
          <div class="order-card-body">
            <div class="order-items-list">
              ${itemsHtml}
            </div>
            <div class="order-shipping-details">
              <div class="shipping-detail-block">
                <span class="shipping-detail-label">Shipping Address</span>
                <span class="shipping-detail-val">${order.address}</span>
              </div>
              <div class="shipping-detail-block">
                <span class="shipping-detail-label">Contact / Payment</span>
                <span class="shipping-detail-val">
                  Phone: ${order.phone}<br>
                  Method: ${order.payment_method}
                </span>
              </div>
            </div>
          </div>
        `;
        listContainer.appendChild(card);
      });
    } else {
      listContainer.innerHTML = `
        <div class="empty-orders-state">
          <i class="fas fa-bag-shopping"></i>
          <p>You haven't placed any orders yet.</p>
          <a href="shop.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
    }
  } catch (err) {
    console.warn("Could not load order history from server:", err);
    listContainer.innerHTML = `
      <div class="empty-orders-state">
        <i class="fas fa-circle-exclamation" style="color: #f87171;"></i>
        <p>Offline or unable to load your order history.</p>
      </div>
    `;
  }
};

// Google Auth Callback Handler
const handleGoogleAuthCallback = async (response) => {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();
    if (data.success) {
      showAuthAlert("Successfully signed in with Google!", "success");
      setTimeout(() => {
        window.location.href = 'shop.html';
      }, 1000);
    } else {
      showAuthAlert(data.error || "Google Authentication failed.");
    }
  } catch (err) {
    showAuthAlert("Error connecting to server. Please try again.");
    console.error("Google authentication error:", err);
  }
};

// Initialize Google GSI Client
const initGoogleAuth = async () => {
  const loginGbtn = document.getElementById('google-signin-btn');
  const signupGbtn = document.getElementById('google-signup-btn');
  if (!loginGbtn && !signupGbtn) return;
  
  try {
    const res = await fetch('/api/auth/google-config');
    if (!res.ok) throw new Error("Config endpoint offline");
    const data = await res.json();
    
    if (data.google_client_id) {
      // GSI Library is loaded asynchronously
      const checkGsiLoaded = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkGsiLoaded);
          window.google.accounts.id.initialize({
            client_id: data.google_client_id,
            callback: handleGoogleAuthCallback
          });
          
          if (loginGbtn) {
            window.google.accounts.id.renderButton(loginGbtn, {
              theme: "outline",
              size: "large",
              width: loginGbtn.offsetWidth || 300
            });
          }
          if (signupGbtn) {
            window.google.accounts.id.renderButton(signupGbtn, {
              theme: "outline",
              size: "large",
              width: signupGbtn.offsetWidth || 300
            });
          }
        }
      }, 100);
    } else {
      // Setup Mock Login Button for local development
      console.warn("GOOGLE_CLIENT_ID not found, displaying developer mock buttons.");
      const setupMockBtn = (btnEl) => {
        if (!btnEl) return;
        btnEl.innerHTML = `
          <button class="btn btn-ghost btn-block" type="button" style="border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;">
            <i class="fab fa-google" style="margin-right: 8px;"></i> Continue with Google (Mock)
          </button>
        `;
        btnEl.querySelector('button').addEventListener('click', () => {
          handleGoogleAuthCallback({
            credential: "mock_token_success_demo@gmail.com_John_Doe_123456"
          });
        });
      };
      setupMockBtn(loginGbtn);
      setupMockBtn(signupGbtn);
    }
  } catch (err) {
    console.warn("Could not load Google Sign-In config, fallback to mock:", err);
    const setupMockBtn = (btnEl) => {
      if (!btnEl) return;
      btnEl.innerHTML = `
        <button class="btn btn-ghost btn-block" type="button" style="border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;">
          <i class="fab fa-google" style="margin-right: 8px;"></i> Continue with Google (Mock)
        </button>
      `;
      btnEl.querySelector('button').addEventListener('click', () => {
        handleGoogleAuthCallback({
          credential: "mock_token_success_demo@gmail.com_John_Doe_123456"
        });
      });
    };
    setupMockBtn(loginGbtn);
    setupMockBtn(signupGbtn);
  }
};

// Initialize Forms and Toggles on Auth Pages
const initAuthPages = () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  // Password Visibility Toggles
  const bindToggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.innerHTML = isPwd ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
      });
    }
  };
  
  bindToggle('pwd-toggle', 'login-password');
  bindToggle('pwd-toggle-1', 'signup-password');
  bindToggle('pwd-toggle-2', 'signup-confirm');
  
  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAuthAlert();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-submit-btn');
      
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Signing In... <i class="fas fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
          showAuthAlert("Sign in successful! Redirecting...", "success");
          setTimeout(() => {
            window.location.href = 'shop.html';
          }, 1200);
        } else {
          showAuthAlert(data.error || "Invalid credentials.");
          submitBtn.innerHTML = origText;
          submitBtn.disabled = false;
        }
      } catch (err) {
        showAuthAlert("Error connecting to server. Please check your connection.");
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Signup Form Submission
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAuthAlert();
      
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const phone = document.getElementById('signup-phone').value;
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      const submitBtn = document.getElementById('signup-submit-btn');
      
      if (password !== confirm) {
        showAuthAlert("Passwords do not match.");
        return;
      }
      
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Creating Account... <i class="fas fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();
        
        if (data.success) {
          showAuthAlert("Registration successful! Check email for confirmation. Redirecting...", "success");
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2400);
        } else {
          showAuthAlert(data.error || "Registration failed.");
          submitBtn.innerHTML = origText;
          submitBtn.disabled = false;
        }
      } catch (err) {
        showAuthAlert("Error connecting to server. Please try again.");
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      }
    });
  }
};

// ================= CHECKOUT DETAILS MODAL DYNAMIC INJECTION & LOGIC =================

const injectCheckoutModal = () => {
  if (document.getElementById('checkout-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'checkout-overlay';
  overlay.className = 'checkout-overlay';
  overlay.innerHTML = `
    <div class="checkout-modal">
      <button class="checkout-close" id="checkout-close-btn" aria-label="Close checkout"><i class="fas fa-xmark"></i></button>
      <div class="checkout-header">
        <h2>Checkout Details</h2>
        <p>Please provide your shipping details and payment method</p>
      </div>
      <div class="checkout-summary">
        <span class="checkout-summary-label">Total Amount:</span>
        <span class="checkout-summary-price" id="checkout-total-price">Rs. 0.00</span>
      </div>
      <form id="checkout-form" class="checkout-form">
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="checkout-address" style="display: block; margin-bottom: 8px; font-size: 13.5px; font-weight: 600; color: rgba(238,244,242,0.85);">Shipping Address</label>
          <textarea id="checkout-address" placeholder="Enter your full street address, landmark, city, state and pincode" required></textarea>
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="checkout-phone" style="display: block; margin-bottom: 8px; font-size: 13.5px; font-weight: 600; color: rgba(238,244,242,0.85);">Contact Phone Number</label>
          <input type="tel" id="checkout-phone" placeholder="+91 98765 43210" required style="width: 100%; padding: 13px 18px; border-radius: 8px; background: rgba(7, 13, 20, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); color: #ffffff; font-size: 14.5px; font-family: var(--font-body);">
        </div>
        <div class="form-group" style="margin-bottom: 25px;">
          <label for="checkout-payment" style="display: block; margin-bottom: 8px; font-size: 13.5px; font-weight: 600; color: rgba(238,244,242,0.85);">Payment Method</label>
          <select id="checkout-payment" required>
            <option value="" disabled selected>Select a payment method</option>
            <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="NetBanking">Net Banking</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" type="submit" id="checkout-submit-btn" style="font-family: var(--font-title); font-weight: 700; height: 50px; font-size: 15px;">Place Order</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Close actions
  overlay.querySelector('#checkout-close-btn').addEventListener('click', closeCheckoutModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCheckoutModal();
  });
  
  // Submit action
  overlay.querySelector('#checkout-form').addEventListener('submit', handleCheckoutSubmit);
};

const openCheckoutModal = () => {
  injectCheckoutModal();
  const cart = getCart();
  if (cart.length === 0) return;
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  document.getElementById('checkout-total-price').innerText = formatPrice(total);
  
  // Prefill phone from currentUser
  const phoneInput = document.getElementById('checkout-phone');
  if (phoneInput && currentUser && currentUser.phone) {
    phoneInput.value = currentUser.phone;
  }
  
  document.getElementById('checkout-overlay').classList.add('show');
};

const closeCheckoutModal = () => {
  const overlay = document.getElementById('checkout-overlay');
  if (overlay) overlay.classList.remove('show');
};

const handleCheckoutSubmit = async (e) => {
  e.preventDefault();
  const cart = getCart();
  if (cart.length === 0) return;
  
  const address = document.getElementById('checkout-address').value;
  const phone = document.getElementById('checkout-phone').value;
  const payment_method = document.getElementById('checkout-payment').value;
  
  const submitBtn = document.getElementById('checkout-submit-btn');
  const origText = submitBtn.innerHTML;
  submitBtn.innerHTML = 'Placing Order... <i class="fas fa-spinner fa-spin"></i>';
  submitBtn.disabled = true;
  
  try {
    const res = await fetch(getApiUrl('/api/orders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        address,
        phone,
        payment_method
      })
    });
    
    if (!res.ok) throw new Error('Order submission failed');
    const result = await res.json();
    
    if (result.success) {
      saveCart([]);
      renderCart();
      closeCheckoutModal();
      alert(`Order Placed Successfully!\n\nOrder ID: ${result.order_id}\nTotal Price: ${formatPrice(result.total_price)}\nPayment Method: ${payment_method}\n\nThank you for shopping with Voltverse Technologies.`);
    } else {
      alert(result.error || "Order placement failed.");
      submitBtn.innerHTML = origText;
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.warn("Backend server offline, executing mock order placement:", err);
    setTimeout(() => {
      saveCart([]);
      renderCart();
      closeCheckoutModal();
      alert(`Demo Checkout Success!\n\nShipping Address: ${address}\nPhone: ${phone}\nPayment: ${payment_method}\n\nOrder processed locally since server is offline.`);
      submitBtn.innerHTML = origText;
      submitBtn.disabled = false;
    }, 1500);
  }
};

// Initialize session and auth events
checkUserSession();
initGoogleAuth();

// ================= WEBGL FLUID SIMULATION CURSOR EFFECT =================
const initFluidCursor = () => {
  // Only run WebGL fluid tracking on the Home page (root pathname or index.html)
  const path = window.location.pathname;
  const isHome = path === '/' || path.endsWith('/index.html') || path === '' || path.endsWith('/');
  if (!isHome) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'splash-cursor';
  document.body.appendChild(canvas);

  const script = document.createElement('script');
  script.onload = () => {
    if (typeof window.WebGLFluid !== 'function') return;

    // Block the library's mouseup/touchend listeners on window to prevent the pointer from going "up" (down = false).
    // This keeps the internal simulation pointer permanently active (down = true).
    window.addEventListener('mouseup', (e) => e.stopImmediatePropagation(), false);
    window.addEventListener('touchend', (e) => e.stopImmediatePropagation(), false);

    // We pass an object reference for SPLAT_COLOR, so we can mutate it dynamically
    const fluidColor = { r: 0.49, g: 0.23, b: 0.93 }; // Starts at #7c3aed

    window.WebGLFluid(canvas, {
      TRIGGER: 'hover',
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 512,
      CAPTURE_RESOLUTION: 256,
      DENSITY_DISSIPATION: 4.0, // Extremely fast dissipation so the trail is tiny and short
      VELOCITY_DISSIPATION: 0.8, // Instant velocity decay to prevent any lingering swirls
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 4, // Virtually straight trail, no turbulent curls
      SPLAT_RADIUS: 0.035, // Microscopic line thickness for extreme subtlety
      SPLAT_FORCE: 7000,
      SHADING: false, // Flat shading gives a clean "watercolor/flowing silk" look on white
      COLORFUL: false,
      SPLAT_COLOR: fluidColor,
      TRANSPARENT: true,
      BLOOM: false, // Bloom/glow is disabled since multiply blending over white doesn't benefit from glow
      SUNRAYS: false
    });

    // Programmatically initialize the pointer object in "down = true" state on the canvas.
    // Because mouseup/touchend are blocked, the library will keep the pointer permanently active,
    // drawing hover trails immediately on mousemove without requiring clicks!
    setTimeout(() => {
      const rect = canvas.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      const downEvent = new MouseEvent('mousedown', {
        clientX: x,
        clientY: y,
        bubbles: false
      });
      Object.defineProperty(downEvent, 'offsetX', { value: x });
      Object.defineProperty(downEvent, 'offsetY', { value: y });
      canvas.dispatchEvent(downEvent);
    }, 200);

    // Get the header element and calculate its height dynamically to block trails near the navigation bar
    const getHeaderHeight = () => {
      const header = document.getElementById('site-header');
      return header ? header.getBoundingClientRect().height : 90;
    };

    // Since the canvas has pointer-events: none in CSS (allowing clicks to pass through to nav links),
    // we listen to mousemove on window and proxy it programmatically to the canvas event listeners.
    window.addEventListener('mousemove', (e) => {
      // Ignore mouse movement if it is inside or near the header/nav bar (with a 10px buffer)
      if (e.clientY < getHeaderHeight() + 10) return;

      const canvasEvent = new MouseEvent('mousemove', {
        bubbles: false,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY
      });
      Object.defineProperty(canvasEvent, 'offsetX', { value: e.clientX });
      Object.defineProperty(canvasEvent, 'offsetY', { value: e.clientY });
      canvas.dispatchEvent(canvasEvent);
    }, { passive: true });

    // Touch equivalent proxy for mobile touchmove tracking
    window.addEventListener('touchmove', (e) => {
      if (e.targetTouches.length === 0) return;
      const touch = e.targetTouches[0];

      // Ignore touch movement if it is inside or near the header/nav bar
      if (touch.clientY < getHeaderHeight() + 10) return;

      const canvasEvent = new MouseEvent('mousemove', {
        bubbles: false,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      Object.defineProperty(canvasEvent, 'offsetX', { value: touch.clientX });
      Object.defineProperty(canvasEvent, 'offsetY', { value: touch.clientY });
      canvas.dispatchEvent(canvasEvent);
    }, { passive: true });

    // Helper: converts HSL to RGB (values normalized between 0 and 1)
    const hslToRgb = (h, s, l) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return { r, g, b };
    };

    // Cycle hue dynamically between purple (265deg) and pink (325deg)
    let hue = 275;
    let dir = 1;
    setInterval(() => {
      hue += dir * 0.8;
      if (hue >= 325) dir = -1;
      if (hue <= 265) dir = 1;

      // Darker, highly saturated colors look much richer under mix-blend-mode: multiply
      const rgb = hslToRgb(hue / 360, 0.95, 0.48);
      fluidColor.r = rgb.r;
      fluidColor.g = rgb.g;
      fluidColor.b = rgb.b;
    }, 40);
  };
  script.src = 'webgl-fluid.js';
  document.head.appendChild(script);
};

// Cursor-tracking radial glow for highlight cards (spotlight overlay)
const initCardGlows = () => {
  document.querySelectorAll('.highlight-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  });
};

// Initialize after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initFluidCursor();
    initCardGlows();
  });
} else {
  initFluidCursor();
  initCardGlows();
}
initAuthPages();
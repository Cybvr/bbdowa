const productMenus = document.querySelectorAll("[data-products-menu]");

document.querySelectorAll(".site-nav").forEach((nav) => {
  const navList = nav.querySelector(":scope > ul");
  if (!navList) return;

  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open navigation");
  toggle.textContent = "Menu";
  nav.insertBefore(toggle, navList);

  const closeNavigation = () => {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.textContent = "Menu";
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    toggle.textContent = isOpen ? "Close" : "Menu";
  });

  navList.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNavigation();
  });

  nav.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNavigation();
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeNavigation();
  });
});

if (window.CHAOS_CONTENT && productMenus.length) {
  const products = window.CHAOS_CONTENT.products;
  const currentFile = window.location.pathname.split("/").pop();
  const currentSlug = currentFile === "product.html" ? window.location.hash.slice(1) : "";

  productMenus.forEach((menu) => {
    const overviewCurrent = currentFile === "products.html" ? ' aria-current="page"' : "";
    const productLinks = products.map((product) => {
      const destination = product.url || `product.html#${product.slug}`;
      const current = currentSlug === product.slug ? ' aria-current="page"' : "";
      return `<li><a href="${destination}"${current}>${product.name}</a></li>`;
    }).join("");

    menu.innerHTML = `<li><a href="products.html"${overviewCurrent}>All Products</a></li>${productLinks}`;
  });
}

document.querySelectorAll(".site-nav .has-menu").forEach((dropdown) => {
  const trigger = dropdown.querySelector(":scope > .trigger");
  const menu = dropdown.querySelector(":scope > .menu");

  if (!trigger || !menu) return;

  trigger.setAttribute("aria-expanded", "false");

  const close = () => {
    dropdown.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  };

  const open = () => {
    document.querySelectorAll(".site-nav .has-menu.open").forEach((item) => {
      if (item !== dropdown) {
        item.classList.remove("open");
        item.querySelector(":scope > .trigger")?.setAttribute("aria-expanded", "false");
      }
    });
    dropdown.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.contains("open") ? close() : open();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open();
      menu.querySelector("a")?.focus();
    }
  });

  dropdown.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      trigger.focus();
    }
  });
});

document.addEventListener("click", (event) => {
  document.querySelectorAll(".site-nav .has-menu.open").forEach((dropdown) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("open");
      dropdown.querySelector(":scope > .trigger")?.setAttribute("aria-expanded", "false");
    }
  });
});

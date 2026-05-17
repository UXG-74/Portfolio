(function () {
  var THEME_KEY = "portfolio-theme";
  var MOON_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SUN_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function getSavedTheme() {
    try {
      return window.localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // No-op when storage is blocked.
    }
  }

  function setTheme(isDark) {
    document.body.classList.toggle("theme-dark", isDark);
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.innerHTML = isDark ? SUN_ICON : MOON_ICON;
    });
  }

  function injectThemeToggles() {
    var targets = document.querySelectorAll(".header-tools");

    targets.forEach(function (target) {
      if (target.querySelector("[data-theme-toggle]")) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-toggle";
      btn.setAttribute("data-theme-toggle", "");
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Switch to dark mode");
      btn.innerHTML = MOON_ICON;

      btn.addEventListener("click", function () {
        var willBeDark = !document.body.classList.contains("theme-dark");
        setTheme(willBeDark);
        saveTheme(willBeDark ? "dark" : "light");
      });

      target.prepend(btn);
    });
  }

  injectThemeToggles();
  /* Default dark on first visit; respect saved preference when set ("light" or "dark"). */
  setTheme(getSavedTheme() !== "light");
  document.querySelectorAll("[data-menu-year]").forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });
  document.documentElement.style.background = "";
  document.documentElement.style.color = "";
  var preloadThemeStyle = document.getElementById("portfolio-theme-preload");
  if (preloadThemeStyle) preloadThemeStyle.remove();

  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-nav-mobile]");
  if (!navToggle || !mobileNav) return;

  function setMenuOpen(open) {
    mobileNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }

  navToggle.addEventListener("click", function () {
    var open = mobileNav.classList.toggle("is-open");
    setMenuOpen(open);
  });

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      var isHash = href && href.charAt(0) === "#";
      var isExternal = href && /^(https?:)?\/\//.test(href);
      if (!href || isHash || isExternal) {
        setMenuOpen(false);
        return;
      }

      // Keep menu motion coherent: selection exits right-to-left before route change.
      event.preventDefault();
      mobileNav.classList.add("is-routing");
      setTimeout(function () {
        window.location.href = href;
      }, 320);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenuOpen(false);
  });

  document.querySelectorAll('[data-work-scroll="work-lead"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hero = document.getElementById("work-hero-heading");
      var work = document.getElementById("work-index-heading");
      if (!hero || !work) return;
      event.preventDefault();
      var leadTop = hero.getBoundingClientRect().top + window.scrollY;
      var workTop = work.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: window.scrollY + (workTop - leadTop) + 20,
        behavior: "smooth",
      });
    });
  });
})();

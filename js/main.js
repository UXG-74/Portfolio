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

  function getScrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function setScrollY(y) {
    window.scrollTo(0, y);
    document.documentElement.scrollTop = y;
    document.body.scrollTop = y;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function smoothScrollTo(targetY, duration, onComplete, easeFn) {
    var startY = getScrollY();
    var distance = targetY - startY;
    var ease = easeFn || easeInOutCubic;
    if (Math.abs(distance) < 1) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScrollY(targetY);
      if (typeof onComplete === "function") onComplete();
      return;
    }

    var startTime = performance.now();
    var previousHtmlBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    function step(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      setScrollY(startY + distance * ease(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setScrollY(targetY);
        document.documentElement.style.scrollBehavior = previousHtmlBehavior;
        if (typeof onComplete === "function") onComplete();
      }
    }

    requestAnimationFrame(step);
  }

  function initHomeWorkNav(setMenuOpen) {
    if (!document.body.classList.contains("home-combined")) return;

    var workHeading = document.getElementById("work-index-heading");
    if (!workHeading) return;

    var aboutHeading = document.getElementById("home-about-heading");
    var SECTION_ANCHOR_TOP = 66;
    var scrollAnimating = false;
    var scrollNavIntent = null;

    function getSectionScrollTarget(heading) {
      return getScrollY() + (heading.getBoundingClientRect().top - SECTION_ANCHOR_TOP);
    }

    function getWorkScrollTarget() {
      return getSectionScrollTarget(workHeading);
    }

    function getAboutScrollTarget() {
      return aboutHeading ? getSectionScrollTarget(aboutHeading) : Infinity;
    }

    function snapSectionToAnchor(heading) {
      var delta = heading.getBoundingClientRect().top - SECTION_ANCHOR_TOP;
      if (Math.abs(delta) > 0.25) setScrollY(getScrollY() - delta);
    }

    function finishAboutScroll() {
      finishSectionScroll(aboutHeading);
    }

    function setHomeNavActive(selector, active) {
      document.querySelectorAll(selector).forEach(function (link) {
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }

    function setWorkNavActive(active) {
      setHomeNavActive("[data-home-work-link]", active);
      document.body.classList.toggle("home-work-view", active);
    }

    function setAboutNavActive(active) {
      setHomeNavActive("[data-home-about-link]", active);
      document.body.classList.toggle("home-about-anchor", active);
    }

    function finishSectionScroll(heading, onDone) {
      snapSectionToAnchor(heading);
      scrollAnimating = false;
      scrollNavIntent = null;
      if (typeof onDone === "function") onDone();
    }

    function scrollToWork() {
      var targetY = getWorkScrollTarget();
      scrollNavIntent = "work";
      scrollAnimating = true;
      setAboutNavActive(false);
      setWorkNavActive(true);
      if (history.replaceState) history.replaceState(null, "", "#work");
      smoothScrollTo(targetY, 980, function () {
        finishSectionScroll(workHeading);
      });
    }

    function scrollToAbout() {
      if (!aboutHeading) return;

      var targetY = getAboutScrollTarget();
      var workTarget = getWorkScrollTarget();
      var currentY = getScrollY();
      var scrollDownPastWork =
        targetY > currentY + 8 && currentY < workTarget - 32;
      var aboutEase = scrollDownPastWork ? easeOutCubic : easeInOutCubic;

      scrollNavIntent = "about";
      scrollAnimating = true;
      setWorkNavActive(false);
      setAboutNavActive(true);
      if (history.replaceState) history.replaceState(null, "", "#about");

      smoothScrollTo(targetY, 980, finishAboutScroll, aboutEase);
    }

    function syncNavFromScroll() {
      if (scrollAnimating || scrollNavIntent) {
        if (scrollNavIntent === "about") {
          setAboutNavActive(true);
          setWorkNavActive(false);
        } else if (scrollNavIntent === "work") {
          setWorkNavActive(true);
          setAboutNavActive(false);
        }
        return;
      }

      var workTarget = getWorkScrollTarget();
      var aboutTarget = getAboutScrollTarget();
      var isAboutView = aboutHeading && getScrollY() >= aboutTarget - 24;
      var isWorkView = !isAboutView && getScrollY() >= workTarget - 24;

      setAboutNavActive(isAboutView);
      setWorkNavActive(isWorkView);

      if (
        !isWorkView &&
        !isAboutView &&
        getScrollY() < 48 &&
        (location.hash === "#work" || location.hash === "#about") &&
        history.replaceState
      ) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    document.addEventListener(
      "click",
      function (event) {
        var workLink = event.target.closest("[data-home-work-link]");
        if (workLink) {
          event.preventDefault();
          scrollToWork();
          if (setMenuOpen) setMenuOpen(false);
          return;
        }

        var aboutLink = event.target.closest("[data-home-about-link]");
        if (!aboutLink) return;
        event.preventDefault();
        scrollToAbout();
        if (setMenuOpen) setMenuOpen(false);
      },
      true
    );

    var scrollTicking = false;
    window.addEventListener("scroll", function () {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        scrollTicking = false;
        syncNavFromScroll();
      });
    });

    function runInitialHashScroll() {
      if (location.hash === "#work") {
        scrollToWork();
        return;
      }
      if (location.hash === "#about") {
        scrollToAbout();
      }
    }

    function primeHashScroll() {
      if (location.hash !== "#work" && location.hash !== "#about") return;
      setScrollY(0);
      if (history.replaceState) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      window.setTimeout(runInitialHashScroll, 80);
      window.addEventListener("load", function onLoad() {
        window.removeEventListener("load", onLoad);
        runInitialHashScroll();
      });
    }

    window.addEventListener("hashchange", function () {
      if (location.hash === "#work") scrollToWork();
      else if (location.hash === "#about") scrollToAbout();
    });

    var resizeTicking = false;
    window.addEventListener("resize", function () {
      if (resizeTicking) return;
      resizeTicking = true;
      requestAnimationFrame(function () {
        resizeTicking = false;
        syncNavFromScroll();
      });
    });

    if (location.hash === "#work" || location.hash === "#about") {
      primeHashScroll();
    } else {
      setWorkNavActive(false);
      setAboutNavActive(false);
    }
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

  var setMenuOpen = function () {};
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-nav-mobile]");

  if (navToggle && mobileNav) {
    setMenuOpen = function (open) {
      mobileNav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    };

    navToggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      setMenuOpen(open);
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (link.hasAttribute("data-home-work-link") || link.hasAttribute("data-home-about-link")) return;

        var href = link.getAttribute("href");
        var isHash = href && href.charAt(0) === "#";
        var isExternal = href && /^(https?:)?\/\//.test(href);
        var isMailto = href && href.indexOf("mailto:") === 0;
        if (!href || isHash || isExternal || isMailto) {
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
  }

  var HOME_WORK_STUDIES = [
    {
      slug: "lucille",
      href: "/work/lucille-london/",
      title: "LUCILLE LONDON - Luxury brand and storefront built entirely with AI",
      titleSub: "",
      p1: "AI-led creative shaped a luxury brand, storefront, and identity from a standing start.",
      p2:
        "The test was whether a full luxury experience could clear a believable shelf when every decision came from the same machine-led workflow. Restraint, hierarchy, and editorial voice did the selling.",
      industry: "Luxury eCommerce",
      tags: ["ai", "brand", "commerce"],
    },
    {
      slug: "kinetik",
      href: "/work/kinetik/",
      title: "KINETIK - Brand and fitness experience",
      titleSub: "built for ambition",
      p1: "AI-directed UX was shaped to surface genuine demand and build credibility before launch.",
      p2:
        "It turned early user intent into waitlist momentum while holding Kinetik's performance-driven voice clearly in place. The visual system channelled sport, precision, and data-backed trust",
      industry: "Fitness",
      tags: ["product", "brand identity", "ux", "ai"],
    },
    {
      slug: "distrelec",
      href: "/work/distrelec/",
      title: "DISTRELEC - Registration UX built on evidence, not assumption",
      titleSub: "",
      p1: "Evidence-led research exposed where 79% of users abandoned - before a single field was redesigned.",
      p2:
        "Hotjar replays and Useberry flow tests shaped every decision. A single disciplined pipeline reduced duplicate accounts and made the registration path read as audit-ready across six regions.",
      industry: "Industrial eCommerce",
      tags: ["ux", "usability", "ecommerce", "ai"],
    },
  ];

  function studyIndexFromSlug(slug) {
    for (var i = 0; i < HOME_WORK_STUDIES.length; i += 1) {
      if (HOME_WORK_STUDIES[i].slug === slug) return i;
    }
    return -1;
  }

  function renderHomeWorkDetail(detail, studyIndex, state) {
    if (!detail) return;
    if (!state) state = { currentStudyIndex: -1, currentVideoSlot: -1 };
    if (studyIndex === state.currentStudyIndex) return;
    state.currentStudyIndex = studyIndex;

    var study = HOME_WORK_STUDIES[studyIndex];
    if (!study) return;

    var titleLinkEl = detail.querySelector("[data-work-detail-link]");
    var titleEl = detail.querySelector("[data-work-detail-title]");
    var titleSubEl = detail.querySelector("[data-work-detail-title-sub]");
    var p1El = detail.querySelector("[data-work-detail-p1]");
    var p2El = detail.querySelector("[data-work-detail-p2]");
    var industryEl = detail.querySelector("[data-work-detail-industry]");
    var tagsEl = detail.querySelector("[data-work-detail-tags]");

    if (titleLinkEl && study.href) {
      titleLinkEl.href = study.href;
      titleLinkEl.setAttribute("aria-label", "Open " + study.title.split(" - ")[0] + " case study");
    }
    if (titleEl) titleEl.textContent = study.title;
    if (titleSubEl) {
      if (study.titleSub) {
        titleSubEl.textContent = study.titleSub;
        titleSubEl.hidden = false;
      } else {
        titleSubEl.textContent = "";
        titleSubEl.hidden = true;
      }
    }
    if (p1El) p1El.textContent = study.p1;
    if (p2El) p2El.textContent = study.p2;
    if (industryEl) industryEl.textContent = study.industry;
    detail.setAttribute("data-active-slug", study.slug);

    if (tagsEl) {
      tagsEl.innerHTML = "";
      study.tags.forEach(function (tag) {
        var chip = document.createElement("span");
        chip.textContent = tag;
        tagsEl.appendChild(chip);
      });
    }
  }

  function syncHomeWorkVideos(cards, slot, state) {
    if (!state) state = { currentVideoSlot: -1 };
    if (slot === state.currentVideoSlot) return;
    state.currentVideoSlot = slot;
    cards.forEach(function (card) {
      var video = card.querySelector("video");
      if (!video) return;
      var cardSlot = studyIndexFromSlug(card.getAttribute("data-work-slug"));
      if (cardSlot === slot) {
        if (video.paused) video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }

  function initHomeWorkMobile(carousel, detail) {
    carousel.classList.add("is-mobile-scroll");
    var cards = Array.prototype.slice.call(
      carousel.querySelectorAll(".home-work-card[data-work-slug]")
    );
    if (!cards.length) return;

    var detailState = { currentStudyIndex: -1, currentVideoSlot: -1 };
    var activeSlug = "";

    function setActiveCard(slug) {
      if (slug === activeSlug) return;
      activeSlug = slug;
      cards.forEach(function (card) {
        card.classList.toggle("is-mobile-active", card.getAttribute("data-work-slug") === slug);
      });
    }

    function activateFromCard(card) {
      var index = studyIndexFromSlug(card.getAttribute("data-work-slug"));
      if (index < 0) return;
      renderHomeWorkDetail(detail, index, detailState);
      syncHomeWorkVideos(cards, index, detailState);
      setActiveCard(card.getAttribute("data-work-slug"));
    }

    function pickCenterCard() {
      var rootRect = carousel.getBoundingClientRect();
      var centerX = rootRect.left + rootRect.width * 0.5;
      var best = null;
      var bestDist = Infinity;
      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        var cardCenter = rect.left + rect.width * 0.5;
        var dist = Math.abs(cardCenter - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          best = card;
        }
      });
      if (best) activateFromCard(best);
    }

    var scrollTick = 0;
    carousel.addEventListener(
      "scroll",
      function () {
        if (scrollTick) return;
        scrollTick = requestAnimationFrame(function () {
          scrollTick = 0;
          pickCenterCard();
        });
      },
      { passive: true }
    );

    var defaultCard =
      carousel.querySelector('.home-work-card[data-work-slug="kinetik"]') || cards[0];

    requestAnimationFrame(function () {
      if (defaultCard) {
        defaultCard.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
        pickCenterCard();
      }
    });
  }

  function initHomeWorkCarousel() {
    var carousel = document.querySelector("[data-home-work-carousel]");
    if (!carousel) return;

    var track = carousel.querySelector(".home-work-track");
    var detail = document.querySelector("[data-home-work-detail]");
    if (!track || !detail) return;

    if (window.matchMedia("(max-width: 768px)").matches) {
      initHomeWorkMobile(carousel, detail);
      return;
    }

    var ANCHOR = 166;
    var MAIN_W = 1131;
    var SIDE_W = 893;
    var GAP = 24;
    var REAL_COUNT = 3;
    var SET_WIDTH = 2965;
    var SNAP_OFFSETS = [238, 1155, 2311];
    var LOOP_MARGIN = 420;

    var originals = Array.prototype.slice.call(track.querySelectorAll(".home-work-card"));
    if (originals.length !== REAL_COUNT) return;

    originals.slice()
      .reverse()
      .forEach(function (card) {
        track.insertBefore(card.cloneNode(true), track.firstChild);
      });

    originals.forEach(function (card) {
      track.appendChild(card.cloneNode(true));
    });

    track.style.width = SET_WIDTH * 3 + "px";

    var cards = Array.prototype.slice.call(track.querySelectorAll(".home-work-card"));
    cards.forEach(function (card, index) {
      card.setAttribute("data-set-slot", String(index % REAL_COUNT));
    });
    var isDragging = false;
    var dragPending = false;
    var dragMoved = false;
    var dragStartX = 0;
    var dragStartScroll = 0;
    var pointerId = null;
    var DRAG_THRESHOLD_PX = 6;
    var velocity = 0;
    var velocitySamples = [];
    var rafId = 0;
    var dragRafId = 0;
    var pendingClientX = 0;
    var isAnimating = false;
    var virtualScroll = 0;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var detailState = { currentStudyIndex: -1, currentVideoSlot: -1 };

    function scrollScale() {
      var frame = carousel.closest(".home-figma-frame");
      if (!frame) return 1;
      var layoutW = frame.offsetWidth || frame.getBoundingClientRect().width;
      if (!layoutW) return 1;
      return frame.getBoundingClientRect().width / layoutW;
    }

    function snapScroll(slot) {
      return SET_WIDTH + SNAP_OFFSETS[slot];
    }

    function localScroll(scroll) {
      var local = scroll - SET_WIDTH;
      local %= SET_WIDTH;
      if (local < 0) local += SET_WIDTH;
      return local;
    }

    function smoothstep(value) {
      var t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    }

    function getScroll() {
      return virtualScroll;
    }

    function applyTrackTransform() {
      track.style.transform = "translate3d(" + -virtualScroll + "px, 0, 0)";
    }

    function setScroll(nextScroll, adjustDragAnchor) {
      var prev = virtualScroll;
      virtualScroll = nextScroll;
      normalizeLoop();
      if (adjustDragAnchor && virtualScroll !== prev) {
        dragStartScroll += virtualScroll - prev;
      }
      applyTrackTransform();
    }

    function normalizeLoop() {
      if (virtualScroll >= SET_WIDTH * 2 - LOOP_MARGIN) {
        virtualScroll -= SET_WIDTH;
      } else if (virtualScroll < SET_WIDTH - LOOP_MARGIN) {
        virtualScroll += SET_WIDTH;
      }
    }


    function widthForFocus(focus) {
      return SIDE_W + (MAIN_W - SIDE_W) * focus;
    }

    function segmentState(local) {
      var lucilleSnap = SNAP_OFFSETS[0];
      var kinetikSnap = SNAP_OFFSETS[1];
      var distrelecSnap = SNAP_OFFSETS[2];
      var wrapSpan = SET_WIDTH - distrelecSnap + lucilleSnap;

      if (local < lucilleSnap) {
        return {
          from: 2,
          to: 0,
          t: (local + SET_WIDTH - distrelecSnap) / wrapSpan,
        };
      }

      if (local < kinetikSnap) {
        return {
          from: 0,
          to: 1,
          t: (local - lucilleSnap) / (kinetikSnap - lucilleSnap),
        };
      }

      if (local < distrelecSnap) {
        return {
          from: 1,
          to: 2,
          t: (local - kinetikSnap) / (distrelecSnap - kinetikSnap),
        };
      }

      return {
        from: 2,
        to: 0,
        t: (local - distrelecSnap) / wrapSpan,
      };
    }

    function transitionFromScroll(scroll) {
      var state = segmentState(localScroll(scroll));
      var blend = smoothstep(state.t);
      return {
        from: state.from,
        to: state.to,
        blend: blend,
      };
    }

    function focusesFromScroll(scroll) {
      var transition = transitionFromScroll(scroll);
      var focuses = [0, 0, 0];
      focuses[transition.from] = 1 - transition.blend;
      focuses[transition.to] = transition.blend;
      return focuses;
    }

    function viewLeftsFromScroll(scroll, focuses, transition) {
      var fromSlot = transition.from;
      var toSlot = transition.to;
      var idleSlot = 3 - fromSlot - toSlot;
      var fromWidth = widthForFocus(focuses[fromSlot]);
      var toWidth = widthForFocus(focuses[toSlot]);
      var idleWidth = widthForFocus(focuses[idleSlot]);
      var viewLefts = [0, 0, 0];

      if (transition.blend < 0.5) {
        viewLefts[fromSlot] = ANCHOR;
        viewLefts[toSlot] = ANCHOR + fromWidth + GAP;
        viewLefts[idleSlot] = ANCHOR - GAP - idleWidth;
        return viewLefts;
      }

      viewLefts[toSlot] = ANCHOR;
      viewLefts[fromSlot] = ANCHOR - GAP - fromWidth;
      viewLefts[idleSlot] = ANCHOR + toWidth + GAP;
      return viewLefts;
    }

    function layoutCards(focuses, scroll) {
      var transition = transitionFromScroll(scroll);
      var viewLefts = viewLeftsFromScroll(scroll, focuses, transition);

      cards.forEach(function (card, index) {
        var slot = index % REAL_COUNT;
        var setIndex = Math.floor(index / REAL_COUNT) - 1;
        var focus = focuses[slot];

        card.style.left = scroll + viewLefts[slot] + setIndex * SET_WIDTH + "px";
        card.style.setProperty("--focus", String(focus));
        card.style.setProperty("--work-dim", String(Math.max(0, 1 - focus)));
        card.classList.toggle("is-focused", focus > 0.55);
        card.style.zIndex = String(10 + Math.round(focus * 30));
        card.style.pointerEvents = "auto";
      });
    }

    function cardHitFromEvent(event) {
      var hit = event.target.closest(".home-work-card-hit");
      if (hit) return hit;
      if (typeof document.elementsFromPoint !== "function") return null;
      var stack = document.elementsFromPoint(event.clientX, event.clientY);
      for (var i = 0; i < stack.length; i++) {
        if (!stack[i].closest) continue;
        hit = stack[i].closest(".home-work-card-hit");
        if (hit) return hit;
      }
      return null;
    }

    function nearestSlot(scroll) {
      var transition = transitionFromScroll(scroll);
      return transition.blend >= 0.5 ? transition.to : transition.from;
    }

    function updateVisuals() {
      var scroll = getScroll();
      var slot = nearestSlot(scroll);
      var focuses = focusesFromScroll(scroll);
      layoutCards(focuses, scroll);
      renderHomeWorkDetail(detail, slot, detailState);
      syncHomeWorkVideos(cards, slot, detailState);
    }

    function animateScrollTo(target, duration, done) {
      cancelAnimationFrame(rafId);
      isAnimating = true;
      carousel.classList.add("is-snapping");
      if (duration <= 0 || reducedMotion) {
        setScroll(target, false);
        isAnimating = false;
        carousel.classList.remove("is-snapping");
        updateVisuals();
        if (done) done();
        return;
      }

      var start = virtualScroll;
      var startTime = performance.now();

      function step(now) {
        var t = Math.min(1, (now - startTime) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        setScroll(start + (target - start) * eased, false);
        updateVisuals();
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setScroll(target, false);
          isAnimating = false;
          carousel.classList.remove("is-snapping");
          updateVisuals();
          if (done) done();
        }
      }

      rafId = requestAnimationFrame(step);
    }

    function snapToNearest() {
      animateScrollTo(snapScroll(nearestSlot(getScroll())), reducedMotion ? 0 : 640, null);
    }

    function recordVelocity(clientX, scale) {
      var now = performance.now();
      velocitySamples.push({ x: clientX, t: now });
      if (velocitySamples.length > 5) velocitySamples.shift();
      if (velocitySamples.length < 2) return;
      var first = velocitySamples[0];
      var last = velocitySamples[velocitySamples.length - 1];
      var dt = last.t - first.t;
      if (dt <= 0) return;
      velocity = ((last.x - first.x) / dt / scale) * 16;
    }

    function momentumLoop() {
      if (isDragging) return;
      if (Math.abs(velocity) > 0.2 && !reducedMotion) {
        setScroll(virtualScroll - velocity, false);
        velocity *= 0.94;
        updateVisuals();
        rafId = requestAnimationFrame(momentumLoop);
        return;
      }
      velocity = 0;
      velocitySamples = [];
      snapToNearest();
    }

    function applyDragFrame() {
      dragRafId = 0;
      if (!isDragging) return;
      var scale = scrollScale();
      var delta = (pendingClientX - dragStartX) / scale;
      if (Math.abs(delta) > 4) dragMoved = true;
      setScroll(dragStartScroll - delta, true);
      updateVisuals();
    }

    function beginDrag(event) {
      isDragging = true;
      dragPending = false;
      dragMoved = true;
      velocity = 0;
      velocitySamples = [];
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(dragRafId);
      isAnimating = false;
      carousel.classList.remove("is-snapping");
      carousel.classList.add("is-dragging");
      try {
        carousel.setPointerCapture(event.pointerId);
      } catch (e) {
        // No-op.
      }
    }

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragPending = true;
      isDragging = false;
      dragMoved = false;
      dragStartX = event.clientX;
      pendingClientX = event.clientX;
      dragStartScroll = virtualScroll;
      pointerId = event.pointerId;
    }

    function onPointerMove(event) {
      if (event.pointerId !== pointerId) return;

      if (dragPending && !isDragging) {
        var scale = scrollScale();
        if (Math.abs(event.clientX - dragStartX) / scale >= DRAG_THRESHOLD_PX) {
          beginDrag(event);
        } else {
          return;
        }
      }

      if (!isDragging) return;
      pendingClientX = event.clientX;
      recordVelocity(event.clientX, scrollScale());
      if (!dragRafId) dragRafId = requestAnimationFrame(applyDragFrame);
    }

    function onPointerUp(event) {
      if (event.pointerId !== pointerId) return;

      if (dragPending && !isDragging) {
        dragPending = false;
        pointerId = null;
        return;
      }

      if (!isDragging) return;

      isDragging = false;
      dragPending = false;
      carousel.classList.remove("is-dragging");
      try {
        carousel.releasePointerCapture(event.pointerId);
      } catch (e) {
        // No-op.
      }
      pointerId = null;
      if (!dragRafId) applyDragFrame();
      momentumLoop();
    }

    carousel.addEventListener("pointerdown", onPointerDown);
    carousel.addEventListener("pointermove", onPointerMove);
    carousel.addEventListener("pointerup", onPointerUp);
    carousel.addEventListener("pointercancel", onPointerUp);

    carousel.addEventListener(
      "click",
      function (event) {
        if (dragMoved) {
          event.preventDefault();
          event.stopPropagation();
          dragMoved = false;
          return;
        }

        var hit = cardHitFromEvent(event);
        if (!hit || !hit.href) return;

        if (event.target.closest(".home-work-card-hit")) return;

        event.preventDefault();
        window.location.assign(hit.href);
      },
      true
    );


    window.addEventListener("resize", function () {
      setScroll(snapScroll(1), false);
      updateVisuals();
    });

    setScroll(snapScroll(1), false);
    requestAnimationFrame(function () {
      updateVisuals();
      renderHomeWorkDetail(detail, 1, detailState);
    });
  }

  initHomeWorkNav(setMenuOpen);
  initHomeWorkCarousel();

  document.querySelectorAll('[data-work-scroll="work-lead"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hero = document.getElementById("work-hero-heading");
      var work = document.getElementById("work-index-heading");
      if (!hero || !work) return;
      event.preventDefault();
      var leadTop = hero.getBoundingClientRect().top + window.scrollY;
      var workTop = work.getBoundingClientRect().top + window.scrollY;
      smoothScrollTo(getScrollY() + (workTop - leadTop) + 20, 980);
    });
  });
})();

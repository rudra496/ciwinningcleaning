/* ============================================================
   CI WINNING CLEANING — site interactions
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CONFIG = window.FLY_CONFIG || {};

  /* ---------- scroll progress / header / back-to-top ---------- */
  var progress = document.getElementById("scroll-progress");
  var header = document.querySelector(".site-header");
  var fabTop = document.querySelector(".fab--top");
  function onScroll() {
    var h = document.documentElement;
    if (progress) {
      var max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (fabTop) fabTop.classList.toggle("is-visible", window.scrollY > 650);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();
  if (fabTop) {
    fabTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- mobile menu ---------- */
  var mobileMenu = document.getElementById("mobile-menu");
  var navToggle = document.querySelector(".nav__toggle");
  if (mobileMenu && navToggle) {
    var closeBtn = mobileMenu.querySelector(".mobile-menu__close");
    var backdrop = mobileMenu.querySelector(".mobile-menu__backdrop");
    function openMenu() {
      mobileMenu.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      mobileMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    navToggle.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu();
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ---------- promo expiry (auto-hide after end date) ---------- */
  document.querySelectorAll("[data-promo-end]").forEach(function (el) {
    var end = new Date(el.getAttribute("data-promo-end") + "T23:59:59");
    if (!isNaN(end) && new Date() > end) el.style.display = "none";
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  function revealAll() { revealEls.forEach(function (el) { el.classList.add("is-visible"); }); }
  if ("IntersectionObserver" in window && revealEls.length && !prefersReduced) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 180px 0px" });
    var vh = window.innerHeight;
    var pending = [];
    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("is-visible");
      else { pending.push(el); revealIO.observe(el); }
    });
    /* safety net: fast flicks can jump past the IO window — reveal anything
       already scrolled above the viewport bottom. No rAF here: rAF callbacks
       don't run in background/occluded windows. */
    var revealPassed = function () {
      if (!pending.length) return;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.05) {
          el.classList.add("is-visible");
          revealIO.unobserve(el);
          return false;
        }
        return true;
      });
    };
    window.addEventListener("scroll", revealPassed, { passive: true });
    window.addEventListener("beforeprint", revealAll);
  } else {
    revealAll();
  }

  /* ---------- counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced || isNaN(target)) { el.textContent = target + suffix; return; }
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var pr = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - pr, 3))) + suffix;
      if (pr < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); countIO.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- FAQ: one open at a time ---------- */
  var faqs = document.querySelectorAll(".faq-item");
  faqs.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      faqs.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });

  /* ---------- booking form ---------- */
  var form = document.getElementById("booking-form");
  if (form) {
    var summary = document.getElementById("booking-summary");
    var summaryList = document.getElementById("summary-list");
    var sendWa = document.getElementById("send-whatsapp");
    var sendMail = document.getElementById("send-email");
    var channelNote = document.getElementById("channel-note");
    var waLink = "", mailLink = "";
    var bookingText = "";

    function setError(name, on) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      var field = input.closest(".form-field");
      if (field) field.classList.toggle("has-error", on);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      var valid = true;
      ["name", "phone", "email", "service", "property", "bedrooms", "postcode", "date"].forEach(function (k) {
        var input = form.querySelector('[name="' + k + '"]');
        var val = (input ? input.value : "").trim();
        data[k] = val;
        var bad = !val;
        if (k === "phone" && val.replace(/[^\d]/g, "").length < 7) bad = true;
        if (k === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) bad = true;
        if (k === "email") bad = !val ? false : bad; /* email optional */
        if (k === "postcode" && val && val.replace(/\s/g, "").length < 4) bad = true;
        setError(k, bad);
        if (bad) valid = false;
      });
      data.frequency = form.querySelector('[name="frequency"]').value;
      data.message = (form.querySelector('[name="message"]').value || "").trim();
      if (!valid) {
        var firstErr = form.querySelector(".has-error input, .has-error select");
        if (firstErr) firstErr.focus();
        return;
      }

      bookingText = [
        "Hello CI Winning Cleaning! I would like to book a cleaning service.",
        "",
        "Service: " + data.service,
        "Property type: " + data.property,
        "Bedrooms: " + data.bedrooms,
        "Postcode: " + data.postcode.toUpperCase(),
        "Preferred date: " + data.date,
        "Frequency: " + data.frequency,
        "",
        "Name: " + data.name,
        "Phone: " + data.phone
      ];
      if (data.email) bookingText.push("Email: " + data.email);
      if (data.message) bookingText.push("", "Notes: " + data.message);

      /* render summary */
      var rows = [
        ["Service", data.service], ["Property", data.property],
        ["Bedrooms", data.bedrooms], ["Postcode", data.postcode.toUpperCase()],
        ["Date", data.date], ["Frequency", data.frequency],
        ["Name", data.name], ["Phone", data.phone]
      ];
      if (data.email) rows.push(["Email", data.email]);
      summaryList.innerHTML = rows.map(function (r) {
        return "<dt>" + r[0] + "</dt><dd>" + String(r[1]).replace(/</g, "&lt;") + "</dd>";
      }).join("");
      summary.classList.add("is-visible");
      summary.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "nearest" });

      /* build send links if channels configured */
      var channelsReady = false;
      if (CONFIG.whatsapp && /^\d{6,}$/.test(CONFIG.whatsapp)) {
        waLink = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(bookingText.join("\n"));
        sendWa.href = waLink;
        sendWa.target = "_blank";
        sendWa.rel = "noopener";
        sendWa.classList.remove("is-disabled");
        channelsReady = true;
      } else {
        sendWa.classList.add("is-disabled");
        sendWa.removeAttribute("href");
      }
      if (CONFIG.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONFIG.email)) {
        mailLink = "mailto:" + CONFIG.email + "?subject=" +
          encodeURIComponent("Cleaning booking — " + data.service + " (" + data.postcode.toUpperCase() + ")") +
          "&body=" + encodeURIComponent(bookingText.join("\n"));
        sendMail.href = mailLink;
        sendMail.classList.remove("is-disabled");
        channelsReady = true;
      } else {
        sendMail.classList.add("is-disabled");
        sendMail.removeAttribute("href");
      }
      if (channelNote) {
        channelNote.textContent = channelsReady
          ? "Pick a channel above — your booking details are attached automatically."
          : "Our online booking channels go live shortly. Your request summary is ready — keep it handy and contact us once channels open, or check back soon.";
      }
    });
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();

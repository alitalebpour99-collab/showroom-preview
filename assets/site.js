/* Showroom: language switch (EN / DE / FA with full RTL), header state, toast. Each page sets window.T first. */
(function () {
  const T = window.T || { en: {} };
  const LANGS = ["en", "de", "fa"];
  const subs = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get() { try { return localStorage.getItem("sr-lang"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem("sr-lang", v); } catch (e) {} }
  };
  function pick() {
    const q = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(q)) return q;
    const s = store.get(); if (LANGS.includes(s)) return s;
    const n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.includes(n) ? n : "en";
  }
  const tr = (l, k) => (T[l] && T[l][k] != null ? T[l][k] : (T.en[k] != null ? T.en[k] : null));
  let cur = null;
  function setLang(l, first) {
    if (!LANGS.includes(l)) l = "en";
    cur = l;
    const root = document.documentElement;
    root.lang = l; root.dir = l === "fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-t]").forEach((el) => { const v = tr(l, el.dataset.t); if (v != null) el.innerHTML = v; });
    document.querySelectorAll("[data-ta]").forEach((el) => { const v = tr(l, el.dataset.ta); if (v != null) el.setAttribute("aria-label", v); });
    document.querySelectorAll("[data-tp]").forEach((el) => { const v = tr(l, el.dataset.tp); if (v != null) el.setAttribute("placeholder", v); });
    const ti = tr(l, "_title"); if (ti) document.title = ti;
    const de = tr(l, "_desc"); const m = document.querySelector('meta[name="description"]'); if (de && m) m.setAttribute("content", de);
    document.querySelectorAll(".langs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    if (!first) store.set(l);
    subs.forEach((f) => { try { f(l, !!first); } catch (e) { console.warn(e); } });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".langs button[data-lang]");
    if (b) setLang(b.dataset.lang);
  });
  // header: transparent over the hero, solid after it
  const top = document.querySelector(".top");
  if (top) {
    const onScroll = () => top.classList.toggle("solid", scrollY > 24);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  let tt;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2600);
  }
  // Persian digits for numbers we build in JS
  const fa = (s) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]).replace(/\./g, "٫");
  window.SR = { setLang, onLang: (f) => subs.push(f), get lang() { return cur; }, tr: (k) => tr(cur, k), reduce, toast, digits: (s) => (cur === "fa" ? fa(s) : String(s)) };
  setLang(pick(), true);
})();

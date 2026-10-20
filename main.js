/* WinPlayer 官网交互 · 原生 JS，无依赖 */
(() => {
  "use strict";
  const root = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Toast（提前声明，供各模块调用） ── */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.querySelector("span").textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ── 1. 明暗主题 ── */
  const themeBtn = $("#themeToggle");
  const applyAccent = (id) => {
    const c = ACCENTS[id]; if (!c) return;
    root.style.setProperty("--accent", root.dataset.theme === "dark" ? c.dark : c.light);
  };
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem("wp-theme", t); } catch {}
    themeBtn.setAttribute("aria-label", t === "dark" ? "切换到亮色主题" : "切换到暗色主题");
    if (customAccent) applyAccent(customAccent);
  };
  themeBtn.addEventListener("click", () =>
    setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  /* ── 2. 色卡换肤（主题开发 tab 内的小演示） ── */
  const ACCENTS = {
    blue:   { light: "#0067C0", dark: "#4CC2FF" },
    iris:   { light: "#5B5FC7", dark: "#9FA3F5" },
    teal:   { light: "#038387", dark: "#4AD6DE" },
    green:  { light: "#107C10", dark: "#6CCB5F" },
    orange: { light: "#CA5010", dark: "#FF9349" },
    rose:   { light: "#C239B3", dark: "#E879F1" },
  };
  let customAccent = null;
  try { customAccent = localStorage.getItem("wp-accent"); } catch {}
  const markSwatches = (id) =>
    $$(".swatch").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.accent === id)));
  const setAccent = (id) => {
    if (id === "blue") {
      root.style.removeProperty("--accent");
      customAccent = null;
      try { localStorage.removeItem("wp-accent"); } catch {}
    } else {
      customAccent = id; applyAccent(id);
      try { localStorage.setItem("wp-accent", id); } catch {}
    }
    markSwatches(id);
  };
  $$(".swatch").forEach(b => b.addEventListener("click", () => setAccent(b.dataset.accent)));
  if (customAccent && ACCENTS[customAccent]) { applyAccent(customAccent); markSwatches(customAccent); }

  /* ── 3. 阅读进度条 + 导航状态 ── */
  const nav = $("#nav"), progress = $("#progress");
  const onScroll = () => {
    nav.classList.toggle("scrolled", scrollY > 8);
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ── 4. 移动端菜单 ── */
  const menuBtn = $("#menuBtn"), mobileMenu = $("#mobileMenu");
  const closeMenu = () => { mobileMenu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.addEventListener("click", e => { if (e.target.tagName === "A") closeMenu(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  /* ── 5. 滚动导航高亮（scrollspy） ── */
  const navLinks = $$(".nav-links a");
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting)
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  ["plugins", "search", "develop", "features", "download"].forEach(id => {
    const s = document.getElementById(id); if (s) spy.observe(s);
  });

  /* ── 6. 滚动进场（网格内自动交错延迟） ── */
  $$(".grid").forEach(g => [...g.children].forEach((c, i) => {
    if (c.classList.contains("reveal")) c.style.setProperty("--d", Math.min(i * 80, 400) + "ms");
  }));
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add("visible");
    io.unobserve(el);
    const d = (parseFloat(getComputedStyle(el).transitionDelay) || 0) * 1000;
    setTimeout(() => el.style.setProperty("--d", "0s"), d + 650); // 进场后清除延迟，避免影响悬停
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => reduced ? el.classList.add("visible") : io.observe(el));

  /* ── 7. 一次性触发动画：架构图 / 步骤连线 / 计数器 ── */
  const once = (el, cls, cb, thr = 0.3) => {
    if (!el) return;
    const o = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { el.classList.add(cls); cb && cb(); o.disconnect(); }
    }, { threshold: thr });
    o.observe(el);
  };
  once($("#diagram"), "play", null, 0.35);
  once($("#steps"), "drawn", null, 0.4);

  const countUp = (el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = target + suffix; return; }
    const start = performance.now(), dur = 1300;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const cIO = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { countUp(en.target); cIO.unobserve(en.target); }
  }), { threshold: 0.6 });
  $$("[data-count]").forEach(el => cIO.observe(el));

  /* ── 8. 聚合搜索自动演示（循环） ── */
  const RUNS = [
    { kw: "うちゅうのふしぎ", results: [
      { s: "A", t: "うちゅうのふしぎ",              a: "夢限大みゅーたいぷ",      d: "02:18" },
      { s: "C", t: "うちゅうのふしぎ",       a: "浅茶子ASAKO",      d: "01:30" },
      { s: "B", t: "うちゅうのふしぎ",      a: "夢限大みゅーたいぷ",        d: "02:18" },
      { s: "A", t: "うちゅうのふしぎ",      a: "我是坨金块/洛天依",     d: "01:30" },
    ]},
    { kw: "Here, the world!", results: [
      { s: "A", t: "Here, the world!",                    a: "sumimi",        d: "04:23" },
      { s: "B", t: "Sweet Escape",                a: "sumimi/反田葉月/佐々木李子",  d: "03:39" },
      { s: "C", t: "Here, the world! -Instrumental",          a: "sumimi/反田葉月/佐々木李子",        d: "04:23" },
    ]},
    { kw: "春日影", results: [
      { s: "B", t: "春日影 (MyGO!!!!! ver.)",                a: "MyGO!!!!",  d: "04:16" },
      { s: "A", t: "春日影",           a: "CRYCHIC",  d: "04:17" },
      { s: "C", t: "春日影", a: "CRYCHIC",        d: "04:17" },
    ]},
  ];
  const demoBox = $("#searchDemo"), demoText = $("#demoText"), demoRes = $("#demoResults");
  const chips = $$(".dsrc", demoBox);
  let demoVisible = false;
  new IntersectionObserver(es => { demoVisible = es[0].isIntersecting; }, { threshold: 0.25 })
    .observe(demoBox);

  const resetDemo = () => {
    demoText.textContent = "";
    demoRes.innerHTML = ""; demoRes.classList.remove("fade");
    chips.forEach(c => { c.className = "dsrc idle"; c.querySelector(".state").textContent = ""; });
  };
  const fillResults = (run, animate) => run.results.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "drow";
    row.innerHTML = `<span class="dbadge b-${r.s}">${r.s}</span><span class="dtitle">${r.t}</span><span class="dartist">${r.a}</span><span class="ddur">${r.d}</span>`;
    demoRes.appendChild(row);
    if (animate) requestAnimationFrame(() => setTimeout(() => row.classList.add("in"), i * 30));
    else row.classList.add("in");
  });

  if (reduced) { // 减弱动效：静态展示一组结果
    demoText.textContent = RUNS[0].kw;
    chips.forEach(c => c.classList.add("done"));
    fillResults(RUNS[0], false);
  } else {
    let started = false;
    new IntersectionObserver((es, o) => {
      if (es[0].isIntersecting && !started) { started = true; demoLoop(); o.disconnect(); }
    }, { threshold: 0.3 }).observe(demoBox);

    async function demoLoop() {
      while (true) {
        for (const run of RUNS) {
          if (!demoVisible || document.hidden) { await sleep(900); continue; }
          resetDemo();
          await sleep(500);
          for (const ch of run.kw) { demoText.textContent += ch; await sleep(120); }
          await sleep(250);
          chips.forEach((c, i) => setTimeout(() => {
            c.classList.remove("idle"); c.classList.add("searching");
          }, i * 160));
          await sleep(900);
          chips.forEach((c, i) => setTimeout(() => {
            c.classList.remove("searching"); c.classList.add("done");
            c.querySelector(".state").textContent = "✓";
          }, i * 140));
          await sleep(350);
          for (const r of run.results) {
            const row = document.createElement("div");
            row.className = "drow";
            row.innerHTML = `<span class="dbadge b-${r.s}">${r.s}</span><span class="dtitle">${r.t}</span><span class="dartist">${r.a}</span><span class="ddur">${r.d}</span>`;
            demoRes.appendChild(row);
            requestAnimationFrame(() => row.classList.add("in"));
            await sleep(130);
          }
          await sleep(2800);
          demoRes.classList.add("fade");
          chips.forEach(c => c.classList.add("idle"));
          await sleep(400);
        }
      }
    }
  }

  /* ── 9. 卡片聚光（跟随鼠标的径向光） ── */
  document.addEventListener("pointermove", e => {
    const c = e.target.closest(".card,.code-block");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, { passive: true });

  /* ── 10. 代码复制 ── */
  const flash = (btn) => {
    const old = btn.textContent;
    btn.textContent = "已复制 ✓"; btn.classList.add("done");
    setTimeout(() => { btn.textContent = old; btn.classList.remove("done"); }, 1800);
  };
  $$(".copy-btn").forEach(btn => btn.addEventListener("click", async () => {
    const pre = $(btn.dataset.copy); if (!pre) return;
    try { await navigator.clipboard.writeText(pre.innerText); flash(btn); }
    catch {
      const ta = Object.assign(document.createElement("textarea"), { value: pre.innerText });
      document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove(); flash(btn);
    }
  }));

  /* ── 11. Tabs（含键盘左右键） ── */
  const tabs = $$('[role="tab"]');
  const selectTab = (tab) => tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    $("#" + t.getAttribute("aria-controls")).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); selectTab(n);
    });
  });

  /* ── 12. Hero 预览图轻视差 ── */
  const stage = $("#previewStage");
  if (stage && matchMedia("(pointer:fine)").matches && !reduced) {
    let raf = null;
    addEventListener("mousemove", e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = stage.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) { raf = null; return; }
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        stage.style.transform = `perspective(1200px) rotateX(${(-dy * 2.4).toFixed(2)}deg) rotateY(${(dx * 2.4).toFixed(2)}deg)`;
        raf = null;
      });
    }, { passive: true });
    stage.addEventListener("mouseleave", () => { stage.style.transform = "perspective(1200px)"; });
  }

  $("#year").textContent = new Date().getFullYear();
})();

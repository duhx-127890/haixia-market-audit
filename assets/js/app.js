/* ═══════════════════════════════════════════════════════════════
   海峡市场核查 · 主引擎
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var A = window.AUDIT || { markets: [] };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;
  var TIER_CLS = { 1: "t1", 2: "t2", 3: "t3" };
  var TIER_NAME = { 1: "一级批发", 2: "二级批发", 3: "三级市场" };
  var GRADE_CLS = { S: "gS", A: "gA", B: "gB", C: "gC" };
  var GRADE_NAME = { S: "战略级", A: "强覆盖", B: "标准型", C: "补充型" };

  /* ─────────── 预加载 ─────────── */
  (function preload() {
    var el = $("#preloader"), num = $("#pre-count"), line = $(".pre-line i");
    if (!el) return;
    var t0 = performance.now(), DUR = reduced ? 200 : 1350;
    function step(now) {
      var p = Math.min((now - t0) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(eased * 100);
      num.textContent = v;
      line.style.width = (eased * 100) + "%";
      if (p < 1) { requestAnimationFrame(step); }
      else {
        el.classList.add("done");
        document.body.classList.remove("is-loading");
        document.body.classList.add("ready");
      }
    }
    requestAnimationFrame(step);
  })();

  /* ─────────── 标题拆字 ─────────── */
  (function splitTitle() {
    var el = $("#hero-title");
    if (!el) return;
    var text = el.textContent.trim();
    el.textContent = "";
    Array.from(text).forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "ch"; s.style.setProperty("--i", i);
      s.textContent = ch;
      el.appendChild(s);
    });
  })();

  /* ─────────── 自定义光标 ─────────── */
  (function cursor() {
    if (isTouch) return;
    var dot = $("#cursor-dot"), ring = $("#cursor-ring");
    var rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    }, { passive: true });
    (function loop() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      document.body.classList.toggle("cursor-big", !!e.target.closest("a,button,.dir-card,.mk,[data-hover],input,select"));
    });
    document.addEventListener("mouseleave", function () { document.body.classList.add("cursor-hide"); });
    document.addEventListener("mouseenter", function () { document.body.classList.remove("cursor-hide"); });
  })();

  /* ─────────── 滚动：进度 / 导航 / 回顶 / 视差 ─────────── */
  var hero = $("#hero"), heroContent = $(".hero-content"), scrollCue = $(".scroll-cue");
  var lastY = 0;
  (function scrollFx() {
    var nav = $("#nav"), prog = $("#progress i"), toTop = $("#toTop");
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      nav.classList.toggle("scrolled", y > 30);
      if (y > 700 && y > lastY) nav.classList.add("hidden");
      else nav.classList.remove("hidden");
      lastY = y;
      toTop.classList.toggle("show", y > 900);
      if (!reduced && hero && y < innerHeight * 1.2) {
        heroContent.style.transform = "translateY(" + y * 0.22 + "px)";
        heroContent.style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.85)));
        if (scrollCue) scrollCue.style.opacity = String(Math.max(0, 1 - y / 260));
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  })();

  /* ─────────── 显现与计数 ─────────── */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        revealIO.unobserve(en.target);
        firePanelHooks(en.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (el) { revealIO.observe(el); });

  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      animateCount(en.target);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { countIO.observe(el); });

  function animateCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var t0 = performance.now(), DUR = reduced ? 10 : 1700;
    (function tick(now) {
      var p = Math.min((now - t0) / DUR, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function firePanelHooks(el) {
    if (el.id === "tier-legend") return; /* 由图表初始化处理 */
  }

  /* ─────────── 滚动横幅 ─────────── */
  (function marquee() {
    var track = $("#marquee-track");
    if (!track) return;
    var names = A.markets.map(function (m) { return m.city + "·" + m.name.replace(/^.*?·/, ""); });
    function build() {
      var html = "";
      for (var k = 0; k < 2; k++) {
        names.forEach(function (n) { html += '<span class="mq">' + n + ' <i>✦</i></span>'; });
      }
      track.innerHTML = html;
    }
    build();
  })();

  /* ─────────── 总览图表 ─────────── */
  (function charts() {
    /* 级别环形图 */
    var C = 2 * Math.PI * 82;
    var total = A.markets.length;
    var segs = [["seg1", A.tierCount[1] || 0], ["seg2", A.tierCount[2] || 0], ["seg3", A.tierCount[3] || 0]];
    var off = 0;
    segs.forEach(function (s, i) {
      var el = $(".donut ." + s[0]);
      if (!el) return;
      var len = (s[1] / total) * C - 2.5;
      el.setAttribute("stroke-dasharray", len + " " + C);
      el.setAttribute("stroke-dashoffset", C);
      el._target = -off;
      off += (s[1] / total) * C;
    });
    var donutPanel = $(".chart-panel");
    var donutDone = false;
    function setDonut() {
      if (donutDone) return;
      donutDone = true;
      segs.forEach(function (s) {
        var el = $(".donut ." + s[0]);
        if (el) el.setAttribute("stroke-dashoffset", el._target);
      });
    }
    window.__setDonut = setDonut;
    var io = new IntersectionObserver(function (ens) {
      ens.forEach(function (en) {
        if (en.isIntersecting) { setDonut(); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    if (donutPanel) io.observe(donutPanel);

    /* 级别图例 */
    var legend = $("#tier-legend");
    if (legend) {
      var tiers = [[1, "一级批发市场"], [2, "二级批发市场"], [3, "三级市场"]];
      legend.innerHTML = tiers.map(function (t) {
        return '<li><i style="background:var(--t' + t[0] + ');color:var(--t' + t[0] + ')"></i>' + t[1] +
          '<b>' + (A.tierCount[t[0]] || 0) + '</b><em>' + Math.round((A.tierCount[t[0]] || 0) / total * 100) + '%</em></li>';
      }).join("");
    }

    /* 覆盖能力等级条形 */
    var gb = $("#grade-bars");
    if (gb) {
      var order = ["S", "A", "B", "C"];
      gb.innerHTML = order.map(function (g) {
        var v = A.gradeCount[g] || 0;
        return '<div class="bar-row"><span>' + g + ' · ' + GRADE_NAME[g] + '</span>' +
          '<div class="bar-track"><div class="bar-i" data-w="' + (v / total * 100) + '" style="background:var(--grade-' + g.toLowerCase() + ')"></div></div>' +
          '<b>' + v + '</b></div>';
      }).join("");
    }

    /* 品类条形 */
    var cb = $("#cat-bars");
    if (cb) {
      cb.innerHTML = A.catCount.slice(0, 8).map(function (c) {
        return '<div class="bar-row"><span>' + c[0] + '</span>' +
          '<div class="bar-track"><div class="bar-i" data-w="' + (c[1] / total * 100) + '" style="background:linear-gradient(90deg,var(--teal),var(--cyan))"></div></div>' +
          '<b>' + c[1] + '</b></div>';
      }).join("");
    }

    /* 条形宽度触发 */
    var barIO = new IntersectionObserver(function (ens) {
      ens.forEach(function (en) {
        if (!en.isIntersecting) return;
        barIO.unobserve(en.target);
        $$(".bar-i[data-w]", en.target).forEach(function (b, i) {
          setTimeout(function () { b.style.width = b.getAttribute("data-w") + "%"; }, i * 90);
        });
      });
    }, { threshold: 0.35 });
    if (gb) barIO.observe(gb);
    if (cb) barIO.observe(cb);
  })();

  /* ─────────── 地图 ─────────── */
  var mapState = { tier: 0, selected: null, hover: null };
  var proj = (function () {
    var W = 1000, H = 760, PAD = 46;
    var LNG0 = 73.2, LNG1 = 135.1, LAT0 = 53.6, LAT1 = 17.8;
    var k = Math.min((W - PAD * 2) / (LNG1 - LNG0), (H - PAD * 2) / (LAT0 - LAT1));
    var x0 = (W - (LNG1 - LNG0) * k) / 2, y0 = (H - (LAT0 - LAT1) * k) / 2;
    return {
      k: k,
      x: function (lng) { return x0 + (lng - LNG0) * k; },
      y: function (lat) { return y0 + (LAT0 - lat) * k; }
    };
  })();

  function ringPath(ring) {
    var d = "";
    for (var i = 0; i < ring.length; i++) {
      var p = ring[i];
      d += (i === 0 ? "M" : "L") + proj.x(p[0]).toFixed(2) + " " + proj.y(p[1]).toFixed(2);
    }
    return d + "Z";
  }
  function geomPath(geom) {
    if (!geom) return "";
    if (geom.type === "Polygon") return geom.coordinates.map(ringPath).join(" ");
    if (geom.type === "MultiPolygon") return geom.coordinates.map(function (poly) { return poly.map(ringPath).join(" "); }).join(" ");
    return "";
  }

  var svg = $("#map-svg"), stage = $(".map-stage"), tooltip = $("#map-tooltip"), coverNote = $("#map-cover-note");
  var provEls = {};

  function initMap() {
    if (!svg || !window.CHINA_GEO) return;
    var ns = "http://www.w3.org/2000/svg";
    var g = document.createElementNS(ns, "g");
    g.setAttribute("id", "map-g");
    window.CHINA_GEO.features.forEach(function (f) {
      if (f.properties && f.properties.adcode === "100000_JD") return;
      var name = f.properties && f.properties.name;
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", geomPath(f.geometry));
      path.setAttribute("class", "prov");
      path.setAttribute("data-name", name);
      g.appendChild(path);
      if (name) provEls[name] = path;
    });
    svg.appendChild(g);

    var dots = document.createElementNS(ns, "g");
    dots.setAttribute("id", "dots-g");
    var sorted = A.markets.slice().sort(function (a, b) { return a.plan - b.plan; });
    sorted.forEach(function (m) {
      var grp = document.createElementNS(ns, "g");
      grp.setAttribute("class", "mk");
      grp.setAttribute("data-id", m.id);
      grp.setAttribute("data-tier", m.tier);
      grp.setAttribute("transform", "translate(" + proj.x(m.lng).toFixed(2) + "," + proj.y(m.lat).toFixed(2) + ")");
      var col = "var(--t" + m.tier + ")";
      var ping = document.createElementNS(ns, "circle");
      ping.setAttribute("class", "mk-ping"); ping.setAttribute("r", 13);
      ping.setAttribute("fill", col); ping.setAttribute("style", "color:" + col);
      var core = document.createElementNS(ns, "circle");
      core.setAttribute("class", "mk-core"); core.setAttribute("r", 5);
      core.setAttribute("fill", col); core.setAttribute("style", "color:" + col);
      var label = document.createElementNS(ns, "text");
      label.setAttribute("class", "mk-label"); label.setAttribute("y", -16);
      label.setAttribute("text-anchor", "middle");
      label.textContent = m.name.length > 9 ? m.name.slice(0, 9) + "…" : m.name;
      grp.appendChild(ping); grp.appendChild(core); grp.appendChild(label);
      dots.appendChild(grp);
    });
    svg.appendChild(dots);

    svg.addEventListener("pointerover", onDotOver);
    svg.addEventListener("pointerout", onDotOut);
    svg.addEventListener("pointermove", onDotMove);
    svg.addEventListener("click", onDotClick);
  }

  function marketById(id) { return A.markets.find(function (m) { return m.id === id; }); }
  function dotEl(id) { return $('.mk[data-id="' + id + '"]', svg); }

  function setProvHighlight(m) {
    var set = {};
    (m ? m.provinces : []).forEach(function (p) { set[p] = true; });
    Object.keys(provEls).forEach(function (name) {
      var p = provEls[name];
      if (!m) { p.classList.remove("hl", "dim"); return; }
      p.classList.toggle("hl", !!set[name]);
      p.classList.toggle("dim", !set[name]);
    });
  }

  function showTooltip(m, x, y) {
    if (!tooltip) return;
    tooltip.innerHTML =
      '<div class="tt-name">' + m.name + "</div>" +
      '<div class="tt-meta"><i style="background:var(--t' + m.tier + ');box-shadow:0 0 6px var(--t' + m.tier + ')"></i>' +
      m.city + " · " + m.tierLabel + "</div>" +
      '<div class="tt-foot"><span>辐射 ' + m.coverage.length + " 城</span><span>规划 <b>" + m.plan + "</b> 店</span></div>";
    var rect = stage.getBoundingClientRect();
    var px = rect.left + (x / 1000) * rect.width;
    var py = rect.top + (y / 760) * rect.height;
    tooltip.style.left = px + "px";
    tooltip.style.top = py + "px";
    tooltip.classList.add("on");
  }
  function hideTooltip() { if (tooltip) tooltip.classList.remove("on"); }

  function onDotOver(e) {
    var t = e.target.closest(".mk");
    if (!t) return;
    var m = marketById(parseInt(t.getAttribute("data-id"), 10));
    if (!m) return;
    mapState.hover = m.id;
    var tr = t.getAttribute("transform").match(/translate\(([-\d.]+),([-\d.]+)\)/);
    if (!mapState.selected) setProvHighlight(m);
    showTooltip(m, parseFloat(tr[1]), parseFloat(tr[2]));
    if (coverNote) {
      $("#map-cover-name").textContent = m.city + "·" + m.name;
      coverNote.classList.add("on");
    }
  }
  function onDotOut(e) {
    var t = e.target.closest(".mk");
    if (!t) return;
    mapState.hover = null;
    hideTooltip();
    if (coverNote) coverNote.classList.remove("on");
    setProvHighlight(mapState.selected ? marketById(mapState.selected) : null);
  }
  function onDotMove(e) {
    var t = e.target.closest(".mk");
    if (!t) return;
    var m = marketById(parseInt(t.getAttribute("data-id"), 10));
    if (!m) return;
    var rect = stage.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    showTooltip(m, (px / rect.width) * 1000, (py / rect.height) * 760);
  }
  function onDotClick(e) {
    var t = e.target.closest(".mk");
    if (!t) return;
    var m = marketById(parseInt(t.getAttribute("data-id"), 10));
    if (!m) return;
    selectMapMarket(m.id);
    openDrawer(m.id);
  }

  function selectMapMarket(id) {
    $$(".mk.sel", svg).forEach(function (d) { d.classList.remove("sel"); });
    mapState.selected = id;
    var m = marketById(id);
    var el = dotEl(id);
    if (el) el.classList.add("sel");
    setProvHighlight(m);
    if (m && coverNote) {
      $("#map-cover-name").textContent = m.city + "·" + m.name;
      coverNote.classList.add("on");
    }
  }
  function clearMapSelect() {
    mapState.selected = null;
    $$(".mk.sel", svg).forEach(function (d) { d.classList.remove("sel"); });
    setProvHighlight(null);
    if (coverNote) coverNote.classList.remove("on");
  }

  function applyMapFilter() {
    $$(".mk", svg).forEach(function (d) {
      var t = parseInt(d.getAttribute("data-tier"), 10);
      var show = mapState.tier === 0 || t === mapState.tier;
      d.style.display = show ? "" : "none";
    });
    if (mapState.selected && !marketById(mapState.selected)) clearMapSelect();
  }

  var mfButtons = $$("#map-filters .mf");
  mfButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      mfButtons.forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      mapState.tier = parseInt(b.getAttribute("data-tier"), 10);
      applyMapFilter();
    });
  });

  /* ─────────── 名录 ─────────── */
  var dirState = { q: "", city: "", tier: 0, cat: "", sortPlan: true };
  var grid = $("#dir-grid"), countEl = $("#dir-count");
  var sortBtn = $("#dir-sort");

  function buildCitySelect() {
    var sel = $("#dir-city");
    if (!sel) return;
    A.cities.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
  }
  function buildCatChips() {
    var wrap = $("#dir-cat-filters");
    if (!wrap) return;
    wrap.innerHTML = '<button class="active" data-cat="">全部品类</button>' +
      A.catCount.map(function (c) { return '<button data-cat="' + c[0] + '">' + c[0] + " <em>" + c[1] + "</em></button>"; }).join("");
    $$("button", wrap).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("button", wrap).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        dirState.cat = b.getAttribute("data-cat");
        renderGrid();
      });
    });
  }

  function filterMarkets() {
    var q = dirState.q.trim().toLowerCase();
    return A.markets.filter(function (m) {
      if (dirState.tier && m.tier !== dirState.tier) return false;
      if (dirState.city && m.city !== dirState.city) return false;
      if (dirState.cat && m.cats.indexOf(dirState.cat) === -1) return false;
      if (q) {
        var hay = (m.name + m.city + m.address + m.regName + m.tierLabel).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (!dirState.sortPlan) return a.id - b.id;
      return b.plan - a.plan || a.id - b.id;
    });
  }

  function cardHTML(m, i) {
    var cats = m.cats.slice(0, 4);
    var more = m.cats.length - cats.length;
    return (
      '<article class="dir-card" data-id="' + m.id + '" tabindex="0" role="button" aria-label="查看' + m.name + '档案" style="animation-delay:' + (i * 55) + 'ms">' +
        '<div class="dc-top"><span class="dc-no">NO.' + String(m.id).padStart(2, "0") + '</span>' +
        '<span class="dc-tier ' + TIER_CLS[m.tier] + '">' + TIER_NAME[m.tier] + "</span></div>" +
        '<span class="dc-arrow"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></span>' +
        '<h3 class="dc-name">' + m.name + "</h3>" +
        '<p class="dc-city">' + m.city + "</p>" +
        '<p class="dc-scale">' + m.scale + "</p>" +
        '<div class="dc-cats">' + cats.map(function (c) { return "<span>" + c + "</span>"; }).join("") +
        (more > 0 ? '<span class="more">+' + more + "</span>" : "") + "</div>" +
        '<div class="dc-foot"><span>辐射 <b>' + m.coverage.length + "</b> 城</span><span>规划 <b>" + m.plan + "</b> 店</span>" +
        '<i class="dc-grade ' + GRADE_CLS[m.grade] + '" title="覆盖能力 ' + GRADE_NAME[m.grade] + '">' + m.grade + "</i></div>" +
      "</article>"
    );
  }

  function renderGrid() {
    var list = filterMarkets();
    if (countEl) countEl.textContent = list.length + " 座市场 / 共 " + A.markets.length + " 座";
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<div class="dir-empty">未找到匹配的市场 · 换个筛选条件试试</div>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join("");
    bindCards();
  }

  function bindCards() {
    $$(".dir-card", grid).forEach(function (card) {
      card.addEventListener("click", function () { openDrawer(parseInt(card.getAttribute("data-id"), 10)); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDrawer(parseInt(card.getAttribute("data-id"), 10)); }
      });
      if (isTouch || reduced) return;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transition = "transform .12s linear";
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - py) * 5) + "deg) rotateY(" + ((px - 0.5) * 5) + "deg) translateY(-4px)";
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.transition = "transform .6s var(--ease)";
        card.style.transform = "";
      });
    });
  }

  function initDirectory() {
    buildCitySelect();
    buildCatChips();
    var search = $("#dir-search"), citySel = $("#dir-city");
    var t = null;
    search.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { dirState.q = search.value; renderGrid(); }, 160);
    });
    citySel.addEventListener("change", function () { dirState.city = citySel.value; renderGrid(); });
    $$("#dir-tier-filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#dir-tier-filters button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        dirState.tier = parseInt(b.getAttribute("data-tier"), 10);
        renderGrid();
      });
    });
    sortBtn.addEventListener("click", function () {
      dirState.sortPlan = !dirState.sortPlan;
      sortBtn.querySelector("span").textContent = dirState.sortPlan ? "按门店容量" : "按编号";
      renderGrid();
    });
    renderGrid();
  }

  /* ─────────── 档案抽屉 ─────────── */
  var drawer = $("#drawer"), backdrop = $("#drawer-backdrop"), drawerBody = $("#drawer-body");

  function confCls(conf) {
    return conf === "高" ? "conf-h" : conf === "中" ? "conf-m" : "conf-l";
  }
  function drawerHTML(m) {
    var cats = m.cats.map(function (c) { return "<span>" + c + "</span>"; }).join("");
    var figures = m.figures.map(function (f) {
      return '<div class="dw-fig"><p class="dw-fig-label">' + f.label + "</p>" +
        '<p class="dw-fig-val">' + f.value + (f.unit ? ' <small style="font-size:.5em;color:var(--muted)">' + f.unit + "</small>" : "") + "</p>" +
        '<p class="dw-fig-src"><i class="' + confCls(f.conf) + '"></i>' + f.source + " · 置信度" + f.conf + "</p></div>";
    }).join("");
    var statusCls = m.status.indexOf("待") === 0 ? "st-wait" : "st-ok";
    var many = m.coverage.length > 14;
    var coverage = m.coverage.map(function (c) { return "<span>" + c + "</span>"; }).join("") +
      (many ? '<button class="dw-cover-more" data-cover-more>展开全部 ' + m.coverage.length + " 城</button>" : "");
    var maxPlan = Math.max.apply(null, A.markets.map(function (x) { return x.plan; }));
    return (
      '<div class="dw-head">' +
        '<div class="dw-grade ' + GRADE_CLS[m.grade] + '"><b>' + m.grade + '</b><span>' + GRADE_NAME[m.grade] + "</span></div>" +
        '<div class="dw-title"><p class="dw-no">MARKET FILE · NO.' + String(m.id).padStart(2, "0") + "</p>" +
        '<h2 id="drawer-title">' + m.name + "</h2>" +
        '<p class="dw-city">' + m.city + " · " + m.tierLabel + "</p></div>" +
      "</div>" +
      '<div class="dw-chips"><span class="dw-chip ' + TIER_CLS[m.tier] + '">' + m.tierLabel + "</span>" +
      '<span class="dw-chip ' + statusCls + '">' + m.status + "</span>" +
      '<span class="dw-chip" style="color:var(--muted);border-color:var(--line)">辐射 ' + m.coverage.length + " 城</span></div>" +
      '<div class="dw-block"><h3>供应能力画像</h3><p class="dw-scale">' + m.scale + "</p></div>" +
      '<div class="dw-block"><h3>规模与能力指标</h3><div class="dw-figures">' + figures + "</div></div>" +
      '<div class="dw-block"><h3>供应品类</h3><div class="dw-cats">' + cats + "</div></div>" +
      '<div class="dw-block"><h3>覆盖城市 <em style="font-style:normal;color:var(--dim);letter-spacing:.1em">(' + m.coverage.length + ")</em></h3><div class=\"dw-cover\">" + coverage + "</div></div>" +
      '<div class="dw-block"><h3>规划开店容量</h3><div class="dw-plan">' +
        '<div class="dw-plan-num">' + m.plan + "</div>" +
        '<div class="dw-plan-meta"><div class="dw-plan-track"><div class="dw-plan-bar" data-w="' + (m.plan / maxPlan * 100) + '"></div></div>' +
        "<p>占 30 市最大容量 " + maxPlan + " 家的 " + Math.round(m.plan / maxPlan * 100) + "% · 台账口径</p></div></div></div>" +
      '<div class="dw-block"><p class="dw-conclusion">' + m.conclusion + "</p>" +
      (m.nameNote ? '<p class="dw-note">※ ' + m.nameNote + "</p>" : "") + "</div>" +
      '<div class="dw-block"><h3>位置信息</h3><p class="dw-scale" style="font-size:13px">' + m.address +
      "<br>经度 " + m.lng.toFixed(6) + " · 纬度 " + m.lat.toFixed(6) + "</p></div>" +
      '<div class="dw-actions">' +
      '<a class="btn btn-primary magnetic" target="_blank" rel="noopener" href="https://uri.amap.com/marker?position=' + m.lng + "," + m.lat + "&name=" + encodeURIComponent(m.name) + '">高德地图导航</a>' +
      '<button class="dw-btn-ghost" data-map-jump>在地图查看</button>' +
      '<button class="dw-btn-ghost" data-copy-coord>复制坐标</button>' +
      "</div>"
    );
  }

  function openDrawer(id) {
    var m = marketById(id);
    if (!m) return;
    drawerBody.innerHTML = drawerHTML(m);
    drawer.classList.add("open");
    backdrop.classList.add("on");
    document.body.style.overflow = "hidden";
    var closeBtn = $("#drawer-close");
    if (closeBtn && !isTouch) closeBtn.focus({ preventScroll: true });
    var bar = $(".dw-plan-bar", drawerBody);
    if (bar) setTimeout(function () { bar.style.width = bar.getAttribute("data-w") + "%"; }, 120);
    var more = $("[data-cover-more]", drawerBody);
    if (more) more.addEventListener("click", function () {
      var cover = $(".dw-cover", drawerBody);
      cover.classList.toggle("expand");
      more.textContent = cover.classList.contains("expand") ? "收起" : "展开全部 " + m.coverage.length + " 城";
    });
    var jump = $("[data-map-jump]", drawerBody);
    if (jump) jump.addEventListener("click", function () {
      closeDrawer();
      setTimeout(function () {
        $("#map").scrollIntoView({ behavior: "smooth" });
        selectMapMarket(m.id);
      }, 420);
    });
    var copy = $("[data-copy-coord]", drawerBody);
    if (copy) copy.addEventListener("click", function () {
      var txt = m.lng.toFixed(6) + "," + m.lat.toFixed(6);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { copy.textContent = "已复制 ✓"; });
      } else {
        copy.textContent = txt;
      }
      setTimeout(function () { copy.textContent = "复制坐标"; }, 1800);
    });
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("on");
    document.body.style.overflow = "";
  }
  $("#drawer-close").addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  /* ─────────── 磁吸按钮 ─────────── */
  (function magnetic() {
    if (isTouch || reduced) return;
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * 0.28;
        var dy = (e.clientY - r.top - r.height / 2) * 0.34;
        el.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
        el.style.transition = "transform .5s var(--ease)";
        setTimeout(function () { el.style.transition = ""; }, 500);
      });
    });
  })();

  /* ─────────── 启动 ─────────── */
  initMap();
  initDirectory();

  /* 版本徽标 → 核查方法 */
  var navVer = $(".nav-ver");
  if (navVer) navVer.addEventListener("click", function () {
    $("#method").scrollIntoView({ behavior: "smooth" });
  });

  /* 深链：#market-N 直接打开档案 */
  (function deepLink() {
    var m = location.hash.match(/^#market-(\d+)$/);
    if (!m) return;
    var id = parseInt(m[1], 10);
    setTimeout(function () {
      if (marketById(id)) { selectMapMarket(id); openDrawer(id); }
    }, 1400);
  })();

  /* 兜底：任何原因导致显现未触发时，3 秒后强制完成（防白屏） */
  var fallbackTimer = setTimeout(function () {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
    $$("[data-count]").forEach(animateCount);
    if (window.__setDonut) window.__setDonut();
    $$(".bar-i[data-w]").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
  }, 3000);

  /* 若 GeoJSON 未加载（离线兜底）：地图区显示提示 */
  if (!window.CHINA_GEO && svg) {
    svg.innerHTML = "";
    stage.insertAdjacentHTML("afterbegin", '<p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--dim);letter-spacing:.2em">地图数据未加载 · 名录与档案仍可用</p>');
  }
})();

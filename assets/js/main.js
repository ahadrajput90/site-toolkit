(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var roundTo = function (n, step) { return Math.round(n / step) * step; };

  /* ---------- Footer year ---------- */
  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  var toggle = $("#navToggle");
  var menu = $("#navMenu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  $$("a", menu).forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 820) setMenu(false);
  });

  /* ---------- Budget planner ---------- */
  // Base cost range (USD) by site type, for a mid-sized build.
  var TYPE = {
    business:  { label: "Small business website", low: 1800, high: 3200, hours: 40 },
    portfolio: { label: "Portfolio website",      low: 1200, high: 2400, hours: 28 },
    blog:      { label: "Blog or resource website", low: 1500, high: 2800, hours: 34 },
    store:     { label: "Online store",           low: 3200, high: 6000, hours: 70 },
    landing:   { label: "Landing page",           low: 600,  high: 1500, hours: 14 }
  };
  // Multipliers by page count.
  var PAGES = {
    "1-3":  { label: "1–3 pages",  m: 0.7, weeks: 0 },
    "4-7":  { label: "4–7 pages",  m: 1.0, weeks: 1 },
    "8-15": { label: "8–15 pages", m: 1.6, weeks: 3 },
    "16+":  { label: "16+ pages",  m: 2.4, weeks: 5 }
  };
  var DESIGN = {
    theme:  { label: "Existing theme, minor adjustments", m: 0.75, weeks: 0 },
    custom: { label: "Customized design",                  m: 1.0,  weeks: 1 },
    system: { label: "Custom design system",               m: 1.7,  weeks: 3 }
  };
  // Flat add-ons: low / high cost, hours.
  var FEATURES = {
    forms:        { label: "Contact or lead forms",           low: 150,  high: 400,  hours: 4 },
    booking:      { label: "Booking or calendar integration", low: 400,  high: 1100, hours: 12 },
    blog:         { label: "Blog or resource library",        low: 350,  high: 900,  hours: 10 },
    ecom:         { label: "E-commerce",                      low: 1500, high: 3500, hours: 36 },
    email:        { label: "Email integration",               low: 150,  high: 450,  hours: 4 },
    multilingual: { label: "Multilingual support",            low: 700,  high: 2200, hours: 20 },
    seo:          { label: "SEO setup",                       low: 250,  high: 800,  hours: 8 },
    copy:         { label: "Copywriting help",                low: 400,  high: 1800, hours: 12 }
  };
  var TIMELINE = { flexible: 0.95, standard: 1.0, rush: 1.25 };

  var plannerState = null;

  function readPlanner() {
    var f = $("#plannerForm");
    var val = function (name) { var el = $('input[name="' + name + '"]:checked', f); return el ? el.value : null; };
    return {
      type: val("type"),
      pages: val("pages"),
      design: val("design"),
      timeline: val("timeline"),
      features: $$('input[name="feature"]:checked', f).map(function (i) { return i.value; })
    };
  }

  // Pure calculation so it can be tested outside the browser.
  function calculate(s) {
    var t = TYPE[s.type], p = PAGES[s.pages], d = DESIGN[s.design];
    var tl = TIMELINE[s.timeline] || 1;
    var feats = s.features.slice();

    // A store already includes e-commerce; avoid double-counting.
    var skipEcom = s.type === "store";
    // A blog site already includes a resource library.
    var skipBlog = s.type === "blog";

    var baseLow = t.low * p.m * d.m;
    var baseHigh = t.high * p.m * d.m;
    var baseHours = t.hours * p.m * (0.85 + 0.15 * d.m * d.m);

    var addLow = 0, addHigh = 0, addHours = 0;
    feats.forEach(function (k) {
      if ((k === "ecom" && skipEcom) || (k === "blog" && skipBlog)) return;
      addLow += FEATURES[k].low;
      addHigh += FEATURES[k].high;
      addHours += FEATURES[k].hours;
    });

    var low = (baseLow + addLow) * tl;
    var high = (baseHigh + addHigh) * tl;
    var hours = (baseHours + addHours) * (s.timeline === "rush" ? 1.1 : 1);

    var weeks = 1 + p.weeks + d.weeks + Math.ceil(addHours / 14);
    if (s.type === "landing") weeks = Math.max(1, Math.round(weeks / 2));
    if (s.timeline === "rush") weeks = Math.max(1, Math.round(weeks * 0.7));
    if (s.timeline === "flexible") weeks = Math.round(weeks * 1.2);

    var design = (baseLow + baseHigh) / 2 * 0.35;
    var build = (baseLow + baseHigh) / 2 * 0.65;
    var featMid = (addLow + addHigh) / 2;
    var rushMid = ((baseLow + baseHigh) / 2 + featMid) * (tl - 1);
    var mid = (low + high) / 2;

    return {
      low: roundTo(low, 50),
      high: roundTo(high, 50),
      hours: [Math.round(hours * 0.85), Math.round(hours * 1.15)],
      weeks: [Math.max(1, Math.round(weeks * 0.8)), Math.max(1, Math.round(weeks * 1.2))],
      parts: [
        { name: "Design & layout", value: design * (tl === 1 ? 1 : tl), color: "#7566C6" },
        { name: "Build & content setup", value: build * (tl === 1 ? 1 : tl), color: "#202A3A" },
        { name: "Optional features", value: featMid * tl, color: "#3F9B6E" }
      ],
      mid: mid,
      rush: rushMid
    };
  }

  function renderPlanner() {
    var s = readPlanner();
    plannerState = s;
    var r = calculate(s);
    plannerState.result = r;

    $("#resRange").textContent = money(r.low) + " – " + money(r.high);
    $("#resHours").textContent = r.hours[0] + "–" + r.hours[1] + " hrs";
    $("#resWeeks").textContent = r.weeks[0] === r.weeks[1] ? r.weeks[0] + " wk" : r.weeks[0] + "–" + r.weeks[1] + " wks";

    var total = r.parts.reduce(function (a, p) { return a + p.value; }, 0) || 1;
    var bar = $("#resBar");
    var list = $("#resBreakdown");
    bar.innerHTML = "";
    list.innerHTML = "";
    r.parts.forEach(function (p) {
      if (p.value <= 0) return;
      var seg = document.createElement("span");
      seg.style.width = (p.value / total * 100).toFixed(1) + "%";
      seg.style.background = p.color;
      bar.appendChild(seg);

      var li = document.createElement("li");
      var left = document.createElement("span");
      var dot = document.createElement("i");
      dot.className = "dot";
      dot.style.background = p.color;
      left.appendChild(dot);
      left.appendChild(document.createTextNode(p.name));
      var amt = document.createElement("span");
      amt.className = "amt";
      amt.textContent = "≈ " + money(roundTo(p.value, 50));
      li.appendChild(left);
      li.appendChild(amt);
      list.appendChild(li);
    });

    var notes = [];
    if (s.type === "store" && s.features.indexOf("ecom") > -1) notes.push("E-commerce is already included in an online store, so it isn't counted twice.");
    if (s.type === "blog" && s.features.indexOf("blog") > -1) notes.push("A resource library is already part of a blog site, so it isn't counted twice.");
    if (s.timeline === "rush") notes.push("A rushed timeline adds roughly 25% for priority scheduling.");
    if (s.design === "system" && s.pages === "1-3") notes.push("A full design system is often more than a very small site needs. A customized design may be enough.");
    $("#resNote").textContent = notes.join(" ");
  }

  var plannerForm = $("#plannerForm");
  plannerForm.addEventListener("change", function () { renderPlanner(); updateBrief(); });
  renderPlanner();

  /* ---------- Scope gap checklist ---------- */
  var SCOPE = [
    { group: "Goals & strategy", items: [
      { id: "goal", label: "A single main goal for the site is written down", gap: "Define the main goal of the site" },
      { id: "audience", label: "The target audience is defined", gap: "Describe who the site is for" },
      { id: "success", label: "Success is measurable (leads, sales, bookings…)", gap: "Decide how you'll measure success" },
      { id: "competitors", label: "Reference or competitor sites have been collected", gap: "Collect 3–5 reference sites" }
    ]},
    { group: "Content", items: [
      { id: "sitemap", label: "The page list or sitemap is agreed", gap: "Agree on the list of pages" },
      { id: "copy", label: "Page copy is written, or someone is responsible for it", gap: "Assign who writes the copy" },
      { id: "images", label: "Photos, logo and brand assets are ready", gap: "Gather logo, photos and brand assets" },
      { id: "legal", label: "Legal pages (privacy, terms) are covered", gap: "Plan privacy policy and terms pages" }
    ]},
    { group: "Technical", items: [
      { id: "domain", label: "Domain name is registered and you have access", gap: "Confirm domain ownership and access" },
      { id: "hosting", label: "Hosting is chosen and credentials are available", gap: "Choose hosting and share access" },
      { id: "integrations", label: "Required integrations are listed (payments, email, CRM…)", gap: "List every third-party integration" },
      { id: "migration", label: "Existing site content or data migration is scoped", gap: "Scope any content or data migration" }
    ]},
    { group: "Process", items: [
      { id: "owner", label: "One person can approve work and give feedback", gap: "Name a single decision-maker" },
      { id: "budget", label: "A budget range has been set", gap: "Set a budget range" },
      { id: "deadline", label: "A target launch date exists, with reasons for it", gap: "Set a target launch date" },
      { id: "maintenance", label: "Post-launch support and maintenance are planned", gap: "Plan post-launch maintenance" }
    ]}
  ];
  var ALL_ITEMS = [];
  SCOPE.forEach(function (g) { g.items.forEach(function (i) { ALL_ITEMS.push(i); }); });

  var scopeBox = $("#scopeGroups");
  SCOPE.forEach(function (g) {
    var wrap = document.createElement("div");
    wrap.className = "sg";
    wrap.setAttribute("data-group", g.group);
    var h = document.createElement("h3");
    h.innerHTML = "<span></span><small></small>";
    h.firstChild.textContent = g.group;
    wrap.appendChild(h);
    g.items.forEach(function (it) {
      var lab = document.createElement("label");
      lab.className = "check";
      var inp = document.createElement("input");
      inp.type = "checkbox";
      inp.name = "scope";
      inp.value = it.id;
      var sp = document.createElement("span");
      sp.textContent = it.label;
      lab.appendChild(inp);
      lab.appendChild(sp);
      wrap.appendChild(lab);
    });
    scopeBox.appendChild(wrap);
  });

  var CIRC = 2 * Math.PI * 52;
  function readScope() {
    return $$('input[name="scope"]:checked').map(function (i) { return i.value; });
  }
  function renderScope() {
    var done = readScope();
    var pct = Math.round(done.length / ALL_ITEMS.length * 100);
    $("#ringVal").textContent = pct + "%";
    var fg = $("#ringFg");
    fg.style.strokeDasharray = CIRC;
    fg.style.strokeDashoffset = CIRC * (1 - pct / 100);
    fg.style.stroke = pct >= 75 ? "#3F9B6E" : "#7566C6";

    $$(".sg").forEach(function (sg) {
      var boxes = $$('input[name="scope"]', sg);
      var n = boxes.filter(function (b) { return b.checked; }).length;
      $("small", sg).textContent = n + " / " + boxes.length;
    });

    var text;
    if (done.length === 0) text = "Start ticking items to see your readiness.";
    else if (pct < 40) text = "Early stage. Expect scope to shift until these gaps are closed.";
    else if (pct < 75) text = "Taking shape. A few decisions left before work can start smoothly.";
    else if (pct < 100) text = "Nearly ready. Close the last gaps to avoid surprises.";
    else text = "Everything is covered. You're ready to brief a builder.";
    $("#readyText").textContent = text;

    var gaps = ALL_ITEMS.filter(function (i) { return done.indexOf(i.id) === -1; });
    var list = $("#gapList");
    list.innerHTML = "";
    if (gaps.length === 0) {
      var li = document.createElement("li");
      li.className = "ok";
      li.textContent = "No open gaps.";
      list.appendChild(li);
    } else {
      gaps.slice(0, 5).forEach(function (g) {
        var li = document.createElement("li");
        li.textContent = g.gap;
        list.appendChild(li);
      });
      if (gaps.length > 5) {
        var more = document.createElement("li");
        more.textContent = "…and " + (gaps.length - 5) + " more";
        list.appendChild(more);
      }
    }
  }
  scopeBox.addEventListener("change", function () { renderScope(); updateBrief(); });
  $("#resetScope").addEventListener("click", function () {
    $$('input[name="scope"]').forEach(function (i) { i.checked = false; });
    renderScope();
    updateBrief();
  });
  renderScope();

  /* ---------- Brief builder ---------- */
  var briefIds = ["bName", "bOrg", "bGoal", "bAudience", "bLaunch", "bRefs", "bNotes"];
  var includeEstimate = false;

  function v(id) { return ($("#" + id).value || "").trim(); }

  function buildBrief() {
    var s = readPlanner();
    var r = calculate(s);
    var gaps = ALL_ITEMS.filter(function (i) { return readScope().indexOf(i.id) === -1; });
    var out = [];
    var line = function (t) { out.push(t); };
    var sect = function (t) { out.push(""); out.push(t.toUpperCase()); out.push("-".repeat(t.length)); };

    line("PROJECT BRIEF" + (v("bName") ? ": " + v("bName") : ""));
    if (v("bOrg")) line("Prepared for: " + v("bOrg"));
    line("Date: " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));

    sect("Goal");
    line(v("bGoal") || "[Add the main goal of the website]");

    sect("Audience");
    line(v("bAudience") || "[Describe the target audience]");

    sect("Scope");
    line("Type: " + TYPE[s.type].label);
    line("Pages: " + PAGES[s.pages].label);
    line("Design approach: " + DESIGN[s.design].label);
    if (s.features.length) {
      line("Features:");
      s.features.forEach(function (k) { line("  - " + FEATURES[k].label); });
    } else {
      line("Features: none beyond the basics");
    }

    sect("Budget & timeline");
    line("Planning estimate: " + money(r.low) + " – " + money(r.high) + " USD (excludes hosting, domain, licences, maintenance)");
    line("Typical duration: " + (r.weeks[0] === r.weeks[1] ? r.weeks[0] : r.weeks[0] + "–" + r.weeks[1]) + " weeks");
    line("Timeline preference: " + ({ flexible: "Flexible", standard: "Standard", rush: "Rushed" })[s.timeline]);
    if (v("bLaunch")) line("Target launch: " + v("bLaunch"));

    if (v("bRefs")) {
      sect("References");
      v("bRefs").split(",").forEach(function (x) { if (x.trim()) line("  - " + x.trim()); });
    }

    sect("Open items");
    if (readScope().length === 0) {
      line("[Complete the Scope Gap Checklist to list open items]");
    } else if (gaps.length === 0) {
      line("None. All checklist items are covered.");
    } else {
      gaps.forEach(function (g) { line("  - " + g.gap); });
    }

    if (v("bNotes")) {
      sect("Notes");
      line(v("bNotes"));
    }
    return out.join("\n");
  }

  function updateBrief() {
    $("#briefPreview").textContent = buildBrief();
  }
  briefIds.forEach(function (id) {
    $("#" + id).addEventListener("input", updateBrief);
  });
  updateBrief();

  $("#sendToBrief").addEventListener("click", function () {
    updateBrief();
    $("#brief").scrollIntoView({ behavior: "smooth" });
  });

  function flash(msg) {
    var el = $("#copyStatus");
    el.textContent = msg;
    setTimeout(function () { el.textContent = ""; }, 3000);
  }

  $("#copyBrief").addEventListener("click", function () {
    var text = buildBrief();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { flash("Brief copied to clipboard."); },
        function () { fallbackCopy(text); }
      );
    } else {
      fallbackCopy(text);
    }
  });
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); flash("Brief copied to clipboard."); }
    catch (e) { flash("Couldn't copy automatically. Select the text and copy it."); }
    document.body.removeChild(ta);
  }

  $("#downloadBrief").addEventListener("click", function () {
    var blob = new Blob([buildBrief()], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var name = (v("bName") || "project-brief").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    a.href = url;
    a.download = (name || "project-brief") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    flash("Brief downloaded.");
  });

  /* ---------- Subtle reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var targets = $$(".section-head, .tool, .panel, .steps li, .guide");
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // Exposed for testing in Node-like environments only.
  if (typeof window !== "undefined") window.__sitewise = { calculate: calculate };
})();

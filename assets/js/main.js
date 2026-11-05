/* ==========================================================================
   Логика лендинга. Контент — в config.js, здесь трогать ничего не нужно.
   ========================================================================== */
(() => {
  const S = window.SITE, C = S.contacts;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rub = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const NS = "http://www.w3.org/2000/svg";
  const tween = (from, to, ms, cb) => {
    if (reduced) return cb(to);
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / ms); cb(from + (to - from) * (1 - Math.pow(1 - p, 3))); p < 1 && requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  addEventListener("pointermove", (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

  /* ---------- Тема и тексты ---------- */
  Object.entries(S.theme || {}).forEach(([k, v]) => v && document.documentElement.style.setProperty("--" + k, v));
  document.title = `${S.brand.name} — ${S.brand.tagline}, ${S.brand.city}`;
  $$("[data-brand]").forEach((el) => (el.textContent = S.brand.name));
  $$("[data-tagline]").forEach((el) => (el.textContent = S.brand.tagline));
  $$("[data-phone]").forEach((el) => { el.textContent = C.phone; el.href = "tel:" + C.phoneRaw; });

  /* ---------- Hero ---------- */
  const H = S.hero;
  $("[data-hero-eyebrow]").textContent = H.eyebrow;
  $("[data-hero-title]").innerHTML = H.title.map((l, i) => `<span class="ln"><span>${esc(l)}</span>${i === H.smileWord ? `<svg class="smile-line" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M6 10 Q200 34 394 10"/></svg>` : ""}</span>`).join("");
  $("[data-hero-text]").textContent = H.text;
  $("[data-hero-cta]").textContent = H.cta;
  $("[data-hero-chips]").innerHTML = H.chips.map((c) => `<div class="floater"><i>${esc(c.icon)}</i><div><b>${esc(c.text)}</b><small>${esc(c.sub)}</small></div></div>`).join("");

  // улыбка под заголовком и лицо зуба реагируют на курсор
  const smilePath = $(".smile-line path"), eyes = $$(".big-tooth .eye"), mouth = $(".big-tooth .mouth"), tooth = $(".big-tooth");
  let sm = 24;
  const heroLoop = () => {
    const r = tooth.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.4;
    const dx = Math.max(-1, Math.min(1, (mouseX - cx) / 400)), dy = Math.max(-1, Math.min(1, (mouseY - cy) / 400));
    eyes.forEach((e) => (e.style.transform = `translate(${dx * 6}px, ${dy * 5}px)`));
    const near = 1 - Math.min(1, Math.hypot(mouseX - cx, mouseY - cy) / 600);
    const target = 18 + near * 26;
    sm += (target - sm) * 0.1;
    mouth.setAttribute("d", `M120 160 Q150 ${160 + sm} 180 160`);
    smilePath && smilePath.setAttribute("d", `M6 10 Q200 ${12 + sm * 0.9} 394 10`);
    if (heroOn) requestAnimationFrame(heroLoop);
  };
  let heroOn = true;
  new IntersectionObserver(([en]) => { const was = heroOn; heroOn = en.isIntersecting; if (heroOn && !was) heroLoop(); }).observe($(".hero"));
  if (!reduced) heroLoop();
  setInterval(() => { const v = $("[data-hero-visual]"); v.classList.add("blink"); setTimeout(() => v.classList.remove("blink"), 150); }, 3800);

  /* ---------- Бегущая строка ---------- */
  const mq = S.marquee.map((t) => `<span>${esc(t)}</span>`).join("");
  $("[data-marquee]").innerHTML = mq + mq;

  /* ---------- Зубная карта ---------- */
  const jaw = $("[data-jaw]");
  const typeOf = (pos) => (pos <= 2 ? "incisor" : pos === 3 ? "canine" : pos <= 5 ? "premolar" : "molar");
  const W = { incisor: 26, canine: 28, premolar: 30, molar: 38 }, Hgt = { incisor: 36, canine: 40, premolar: 36, molar: 40 };
  const arch = (cx, cy, from, to, rx, ry) => {
    const p = (a) => [cx + rx * Math.cos((a * Math.PI) / 180), cy + ry * Math.sin((a * Math.PI) / 180)];
    let d = "", steps = 40;
    for (let i = 0; i <= steps; i++) { const [x, y] = p(from + ((to - from) * i) / steps); d += (i ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
    return d;
  };
  let svg = `<path class="gum" d="${arch(300, 262, -172, -8, 232, 210)}" fill="none" stroke-width="66" stroke-linecap="round" style="stroke:color-mix(in srgb,#ff9fa8 25%,#fff)"/>`;
  svg += `<path class="gum" d="${arch(300, 298, 8, 172, 232, 210)}" fill="none" stroke-width="66" stroke-linecap="round" style="stroke:color-mix(in srgb,#ff9fa8 25%,#fff)"/>`;
  const buildRow = (nums, cx, cy, from, to) => {
    const ws = nums.map((n) => W[typeOf(n % 10)]), total = ws.reduce((a, b) => a + b, 0);
    let acc = 0, out = "";
    nums.forEach((n, i) => {
      const t = (acc + ws[i] / 2) / total; acc += ws[i];
      const a = from + (to - from) * t, rad = (a * Math.PI) / 180;
      const x = cx + 232 * Math.cos(rad), y = cy + 210 * Math.sin(rad);
      const lx = cx + 284 * Math.cos(rad), ly = cy + 258 * Math.sin(rad);
      const type = typeOf(n % 10), w = ws[i] - 3, h = Hgt[type];
      out += `<g class="tooth" tabindex="0" role="button" aria-label="Зуб ${n}" data-n="${n}" data-type="${type}">
        <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a + 90).toFixed(1)})"><rect class="tb" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${type === "molar" ? 12 : 10}"/></g>
        <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}">${n}</text></g>`;
    });
    return out;
  };
  svg += buildRow([18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], 300, 262, -172, -8);
  svg += buildRow([48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], 298 + 2, 298, 172, 8);
  svg += `<text x="300" y="282" text-anchor="middle" style="font:800 13px var(--body);fill:var(--muted)">◂ правая · левая ▸</text>`;
  jaw.innerHTML = svg;

  const card = $("[data-tooth-card]"), plan = new Map();
  let curTooth = null;
  const renderPlan = () => {
    const list = $("[data-plan]");
    list.innerHTML = plan.size ? [...plan.entries()].map(([k, v]) => `<li><span>Зуб ${k.split("|")[0]} · ${esc(k.split("|")[1])}</span><b>${rub(v)}</b></li>`).join("") : `<li class="plan__empty">Пока пусто</li>`;
    const total = [...plan.values()].reduce((a, b) => a + b, 0), out = $("[data-plan-total]"), from = parseInt(out.textContent.replace(/\D/g, "")) || 0;
    tween(from, total, 500, (v) => (out.textContent = rub(v)));
    $$(".tooth").forEach((t) => t.classList.toggle("is-plan", [...plan.keys()].some((k) => k.startsWith(t.dataset.n + "|"))));
  };
  const showTooth = (g) => {
    curTooth = g;
    $$(".tooth").forEach((t) => t.classList.toggle("is-sel", t === g));
    const n = g.dataset.n, T = S.teeth[g.dataset.type];
    card.innerHTML = `<div class="tooth-card__top"><b>${esc(T.name)}</b><span class="tooth-card__num">Зуб № ${n}</span></div>` +
      T.items.map((it) => `<button type="button" class="proc${plan.has(n + "|" + it.name) ? " is-added" : ""}" data-proc="${esc(it.name)}" data-price="${it.price}"><span>${plan.has(n + "|" + it.name) ? "✓ " : "+ "}${esc(it.name)}</span><span>${rub(it.price)}</span></button>`).join("");
    card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
  };
  jaw.addEventListener("click", (e) => { const g = e.target.closest(".tooth"); g && showTooth(g); });
  jaw.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".tooth")) { e.preventDefault(); showTooth(e.target.closest(".tooth")); } });
  card.addEventListener("click", (e) => {
    const b = e.target.closest(".proc"); if (!b || !curTooth) return;
    const key = curTooth.dataset.n + "|" + b.dataset.proc;
    plan.has(key) ? plan.delete(key) : plan.set(key, +b.dataset.price);
    renderPlan(); showTooth(curTooth);
  });
  $("[data-plan-clear]").addEventListener("click", () => { plan.clear(); renderPlan(); curTooth && showTooth(curTooth); });
  $("[data-plan-send]").addEventListener("click", () => {
    if (!plan.size) return;
    $("[data-comment]").value = "План: " + [...plan.keys()].map((k) => `зуб ${k.split("|")[0]} — ${k.split("|")[1]}`).join("; ") + `. Сумма с сайта: ${$("[data-plan-total]").textContent}`;
  });

  /* ---------- Отбеливание ---------- */
  const WH = S.whitening, n = WH.shades.length;
  const shadeColor = (i) => {
    const t = i / (n - 1), a = [251, 249, 242], b = [214, 186, 132];
    const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };
  $("[data-shade-scale]").innerHTML = WH.shades.map((s, i) => `<span style="background:${shadeColor(i)}">${s}</span>`).join("");
  const smileSVG = (el) => {
    let s = `<path class="lip" d="M10 60 Q160 -10 310 60 Q160 180 10 60Z"/><path class="dark" d="M40 66 Q160 26 280 66 Q160 150 40 66Z"/><path class="gum2" d="M40 66 Q160 26 280 66 L280 70 Q160 40 40 70Z"/>`;
    const up = [[52, 58, 24, 30], [78, 50, 26, 36], [106, 44, 26, 42], [134, 40, 26, 46], [160, 40, 26, 46], [188, 44, 26, 42], [216, 50, 26, 36], [244, 58, 24, 30]];
    up.forEach(([x, y, w, h]) => (s += `<rect class="t" x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/>`));
    [[92, 104, 26, 20], [120, 108, 26, 20], [148, 110, 26, 20], [176, 108, 26, 20], [204, 104, 26, 20]].forEach(([x, y, w, h]) => (s += `<rect class="t" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`));
    el.innerHTML = s;
  };
  $$("[data-smile]").forEach(smileSVG);
  const shade = $("[data-shade]");
  Object.assign(shade, { min: 0, max: n - 1, step: 1, value: WH.start });
  $("[data-white-price]").textContent = WH.price;
  const setShade = () => {
    const i = +shade.value, j = Math.max(0, i - WH.stepsUp);
    $("[data-shade-now]").textContent = WH.shades[i];
    $("[data-shade-after]").textContent = WH.shades[j];
    $("[data-shade-diff]").textContent = i - j;
    $$("[data-shade-scale] span").forEach((s, k) => { s.classList.toggle("is-now", k === i); s.classList.toggle("is-after", k === j && j !== i); });
    $$("[data-smile=now] .t").forEach((t) => (t.style.fill = shadeColor(i)));
    $$("[data-smile=after] .t").forEach((t) => (t.style.fill = shadeColor(j)));
  };
  shade.addEventListener("input", setShade);
  setShade();

  /* ---------- Услуги ---------- */
  $("[data-services]").innerHTML = S.services.map((s) => `<article class="svc"><div class="svc__i">${s.icon}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><span class="svc__price">${esc(s.price)}</span></article>`).join("");

  /* ---------- Рассрочка ---------- */
  const I = S.installment, inst = $("[data-inst]");
  Object.assign(inst, { min: I.min, max: I.max, step: I.step, value: I.value });
  $("[data-inst-note]").textContent = I.note;
  let months = I.months[Math.min(1, I.months.length - 1)];
  $("[data-inst-months]").innerHTML = I.months.map((m) => `<button type="button" role="radio" aria-checked="${m === months}" data-m="${m}">${m} мес</button>`).join("");
  let lastPay = 0;
  const calcInst = () => {
    const v = +inst.value;
    $("[data-inst-sum]").textContent = rub(v);
    inst.style.setProperty("--p", ((v - I.min) / (I.max - I.min)) * 100 + "%");
    const pay = Math.ceil(v / months / 10) * 10, out = $("[data-inst-pay]"), from = lastPay;
    lastPay = pay; tween(from, pay, 400, (x) => (out.textContent = rub(x)));
  };
  inst.addEventListener("input", calcInst);
  $("[data-inst-months]").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    months = +b.dataset.m; $$("[data-inst-months] button").forEach((x) => x.setAttribute("aria-checked", x === b)); calcInst();
  });
  calcInst();

  /* ---------- Первый визит ---------- */
  $("[data-visit]").innerHTML = S.visit.map((v, i) => `<li class="vstep" style="transition-delay:${i * 0.15}s"><div class="vstep__dot">${i + 1}</div><span class="vstep__time">${esc(v.time)}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join("");

  /* ---------- Врачи и клиника ---------- */
  $("[data-doctors]").innerHTML = S.doctors.map((d) => `
    <article class="doc"><div class="doc__img"><img src="${esc(d.img)}" alt="${esc(d.name)}"><span class="doc__rate">${esc(d.rating)}</span><span class="doc__exp">Стаж ${esc(d.exp)}</span></div>
    <h3>${esc(d.name)}</h3><p>${esc(d.role)}</p></article>`).join("");
  $("[data-gallery]").innerHTML = S.gallery.map((g, i) => `<img src="${esc(g)}" alt="Клиника, фото ${i + 1}">`).join("");

  /* ---------- Отзывы: 3D-барабан ---------- */
  const ring = $("[data-ring]"), drum = $("[data-drum]");
  ring.innerHTML = S.reviews.map((r) => `<article class="rv"><div class="rv__stars">★★★★★</div><p>«${esc(r.text)}»</p><div class="rv__who"><b>${esc(r.name)}</b><span>${esc(r.service)}</span></div></article>`).join("");
  const cards = $$(".rv", ring), step = 360 / cards.length;
  let cur = 0, auto;
  const layoutDrum = () => {
    const w = ring.offsetWidth, rad = Math.round(w / 2 / Math.tan(Math.PI / cards.length)) + 30;
    cards.forEach((c, i) => (c.style.transform = `rotateY(${i * step}deg) translateZ(${rad}px)`));
    ring.style.transform = `translateZ(${-rad}px) rotateY(${-cur * step}deg)`;
    cards.forEach((c, i) => { const d = Math.abs(((i - cur) % cards.length + cards.length) % cards.length); c.style.opacity = d === 0 ? 1 : d === 1 || d === cards.length - 1 ? 0.55 : 0.2; });
  };
  const spin = (k) => { cur += k; layoutDrum(); };
  const restart = () => { clearInterval(auto); if (!reduced) auto = setInterval(() => spin(1), 4500); };
  $("[data-drum-next]").onclick = () => { spin(1); restart(); };
  $("[data-drum-prev]").onclick = () => { spin(-1); restart(); };
  drum.addEventListener("mouseenter", () => clearInterval(auto));
  drum.addEventListener("mouseleave", restart);
  let sx = 0;
  drum.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  drum.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { spin(dx < 0 ? 1 : -1); restart(); } });
  addEventListener("resize", layoutDrum);
  layoutDrum(); restart();

  /* ---------- FAQ ---------- */
  $("[data-faq]").innerHTML = S.faq.map(([q, a], i) => `
    <div class="acc${i === 0 ? " is-open" : ""}"><button class="acc__q" aria-expanded="${i === 0}">${esc(q)}<span class="acc__i">↓</span></button>
    <div class="acc__a"><div><p>${esc(a)}</p></div></div></div>`).join("");
  $("[data-faq]").addEventListener("click", (e) => {
    const q = e.target.closest(".acc__q"); if (!q) return;
    const it = q.parentElement, open = !it.classList.contains("is-open");
    $$(".acc").forEach((x) => { x.classList.remove("is-open"); $(".acc__q", x).setAttribute("aria-expanded", false); });
    if (open) { it.classList.add("is-open"); q.setAttribute("aria-expanded", true); }
  });

  /* ---------- Форма ---------- */
  $("[data-reasons]").innerHTML = S.form.reasons.map((r) => `<label class="reason"><input type="checkbox" name="reason" value="${esc(r)}"><span>${esc(r)}</span></label>`).join("");
  const form = $("[data-form]"), phone = form.phone, status = $(".form__status", form);
  phone.addEventListener("input", () => {
    let d = phone.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    phone.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") + (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const okN = form.name.value.trim().length > 1, okP = phone.value.replace(/\D/g, "").length === 11;
    form.name.parentElement.classList.toggle("is-error", !okN);
    phone.parentElement.classList.toggle("is-error", !okP);
    status.className = "form__status";
    if (!okN || !okP) return (status.textContent = "Проверьте имя и телефон");
    if (!form.agree.checked) return (status.textContent = "Нужно согласие на обработку данных");
    const reasons = $$("[name=reason]:checked", form).map((c) => c.value);
    const data = { name: form.name.value, phone: phone.value, reasons, comment: form.comment.value };
    if (S.form.endpoint) {
      try { const r = await fetch(S.form.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!r.ok) throw 0; }
      catch { return (status.textContent = "Не удалось отправить. Позвоните: " + C.phone); }
    } else {
      const msg = `Здравствуйте! Хочу на консультацию.\nИмя: ${data.name}\nТелефон: ${data.phone}\nПричина: ${reasons.join(", ") || "—"}\n${data.comment}`;
      window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    }
    status.className = "form__status is-ok"; status.textContent = S.form.successText;
    form.reset(); form.agree.checked = true;
  });

  /* ---------- Контакты ---------- */
  $("[data-address]").textContent = C.address;
  $("[data-f-address]").textContent = C.address;
  $("[data-hours]").innerHTML = C.hours.map(([d, t]) => `<dt>${esc(d)}</dt><dd>${esc(t)}</dd>`).join("");
  $("[data-socials]").innerHTML = [
    C.whatsapp && `<a href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`,
    C.telegram && `<a href="https://t.me/${C.telegram}" target="_blank" rel="noopener">Telegram</a>`,
    C.vk && `<a href="https://vk.com/${C.vk}" target="_blank" rel="noopener">ВКонтакте</a>`,
  ].filter(Boolean).join("");
  $("[data-map-link]").href = C.mapLink;
  const toothIco = $(".logo__tooth").innerHTML;
  $("[data-map]").innerHTML = C.mapEmbed
    ? `<iframe src="${esc(C.mapEmbed)}" loading="lazy" title="Карта"></iframe>`
    : `<div class="map__ph"><div><div class="map__pin"><svg viewBox="0 0 64 64">${toothIco}</svg></div>${esc(S.brand.city)}<br>${esc(C.address)}</div></div>`;

  /* ==========================================================================
     ПОДВАЛ: лицо следит за курсором и улыбается шире, когда вы рядом
     ========================================================================== */
  const F = S.footer, footer = $("[data-footer]");
  const words = F.phrase.split(" — ");
  $("[data-phrase]").innerHTML = words.length > 1 ? `${esc(words[0])} — <em>${esc(words.slice(1).join(" — "))}</em>` : esc(F.phrase);
  $("[data-legal]").textContent = F.legal;
  $("[data-license]").textContent = C.license || "";
  $("[data-year]").textContent = new Date().getFullYear();
  const credit = $("[data-credit]");
  if (F.credit && F.credit.text) {
    credit.href = F.credit.url || "#";
    credit.innerHTML = `<span class="sp" aria-hidden="true">✦</span><span>${esc(F.credit.text)}</span><span class="go" aria-hidden="true">↗</span>`;
  } else credit.remove();

  const fsvg = $(".face-svg"), fsmile = $("[data-fsmile]"), fteeth = $("[data-fteeth]");
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = `<clipPath id="mclip"><path data-mclip/></clipPath>`;
  fsvg.prepend(defs);
  fteeth.setAttribute("clip-path", "url(#mclip)");
  const mclip = $("[data-mclip]");
  const TN = 10;
  fteeth.innerHTML = Array.from({ length: TN }, () => `<rect rx="10"/>`).join("");
  const teethR = $$("rect", fteeth), pupils = $$(".fe__pupil", fsvg), feyes = $$(".fe", fsvg);
  let open = 30, footOn = false;
  const qp = (t, p0, p1, p2) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  const footLoop = () => {
    if (!footOn) return;
    const r = fsvg.getBoundingClientRect(), k = r.width / 1200;
    const fx = (mouseX - r.left) / k, fy = (mouseY - r.top) / k;
    pupils.forEach((p, i) => {
      const ex = i ? 780 : 420, ey = 130, a = Math.atan2(fy - ey, fx - ex), dist = Math.min(26, Math.hypot(fx - ex, fy - ey) / 10);
      p.style.transform = `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px)`;
    });
    const near = 1 - Math.min(1, Math.hypot(fx - 600, fy - 240) / 900);
    const target = 30 + near * 150;
    open += (target - open) * 0.08;
    const y0 = 250, up = y0 + open * 0.25, low = y0 + open * 1.25 + 20;
    const d = `M220 ${y0} Q600 ${up} 980 ${y0} Q600 ${low} 220 ${y0} Z`;
    fsmile.setAttribute("d", d); mclip.setAttribute("d", d);
    const th = Math.max(0, open * 0.42);
    teethR.forEach((t, i) => {
      const tt = (i + 0.5) / TN * 0.84 + 0.08, x = qp(tt, 220, 600, 980), y = qp(tt, y0, up, y0);
      t.setAttribute("x", (x - 33).toFixed(1)); t.setAttribute("y", (y - 12).toFixed(1));
      t.setAttribute("width", 64); t.setAttribute("height", (th + 12).toFixed(1));
    });
    requestAnimationFrame(footLoop);
  };
  new IntersectionObserver(([en]) => { const was = footOn; footOn = en.isIntersecting; if (footOn && !was) footLoop(); }).observe(fsvg);
  if (reduced) { footOn = true; open = 110; footLoop(); footOn = false; }
  setInterval(() => { feyes.forEach((e) => e.classList.add("is-blink")); setTimeout(() => feyes.forEach((e) => e.classList.remove("is-blink")), 140); }, 4200);
  footer.addEventListener("touchmove", (e) => { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }, { passive: true });

  /* ---------- Cookie ---------- */
  const cookie = $(".cookie");
  if (!store.get("cookie-consent")) setTimeout(() => (cookie.hidden = false), 1800);
  $$("[data-cookie]").forEach((b) => b.addEventListener("click", () => {
    store.set("cookie-consent", b.dataset.cookie); cookie.hidden = true;
    // if (b.dataset.cookie === "all") { /* подключите здесь Яндекс.Метрику */ }
  }));
  $$("[data-open-cookies]").forEach((b) => b.addEventListener("click", () => (cookie.hidden = false)));

  /* ---------- Политика ---------- */
  const policy = $(".policy");
  $$("[data-open-policy]").forEach((b) => b.addEventListener("click", () => policy.showModal?.()));
  $(".policy__close").onclick = () => policy.close();
  policy.addEventListener("click", (e) => e.target === policy && policy.close());

  /* ---------- Меню ---------- */
  const burger = $(".burger");
  const menu = (on) => { document.body.classList.toggle("menu-open", on); burger.setAttribute("aria-expanded", on); };
  burger.onclick = () => menu(!document.body.classList.contains("menu-open"));
  $$(".nav a").forEach((a) => (a.onclick = () => menu(false)));
  document.addEventListener("click", (e) => { if (document.body.classList.contains("menu-open") && !e.target.closest(".header")) menu(false); });

  /* ---------- Скролл (шапка всегда закреплена) ---------- */
  const header = $(".header"), bar = $(".progress"), fab = $(".fab"), heroEl = $(".hero");
  let busy = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("is-scrolled", y > 20);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    fab.classList.toggle("is-on", y > heroEl.offsetHeight * 0.8 && y < max - 1100);
    busy = false;
  };
  addEventListener("scroll", () => { if (!busy) { busy = true; requestAnimationFrame(onScroll); } }, { passive: true });

  const navLinks = $$(".nav a");
  const secIO = new IntersectionObserver((ents) => ents.forEach((en) => en.isIntersecting && navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id))), { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((l) => { const s = $(l.getAttribute("href")); s && secIO.observe(s); });

  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { const t = en.target; t.classList.add("is-in"); if (!t.classList.contains("vstep")) setTimeout(() => (t.style.transitionDelay = ""), 1000); io.unobserve(t); } }), { threshold: 0.2 });
  $$(".reveal, .svc, .vstep, .doc").forEach((el, i) => { if (!el.classList.contains("reveal") && !el.classList.contains("vstep")) el.style.transitionDelay = (i % 3) * 0.08 + "s"; io.observe(el); });

  /* ---------- Старт ---------- */
  requestAnimationFrame(() => setTimeout(() => document.body.classList.add("is-loaded"), 120));
  onScroll();
})();

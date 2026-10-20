(() => {
const RECIPES = DATA.r, ING = DATA.ing;
const byId = Object.fromEntries(RECIPES.map(r => [r.id, r]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe");

// ---------- stockage local (confort par appareil, jamais indispensable)
// Chaque profil (prénom + pays) a ses propres clés : les données de deux personnes ne se croisent jamais.
const gstore = {
  get(k, d) { try { const v = localStorage.getItem("lfr_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("lfr_" + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem("lfr_" + k); } catch (e) {} }
};
let PROFILES = gstore.get("profiles", []);
let ME = PROFILES.find(p => p.id === gstore.get("active", null)) || null;
const store = {
  get(k, d) { return gstore.get((ME ? ME.id : "invite") + "_" + k, d); },
  set(k, v) { gstore.set((ME ? ME.id : "invite") + "_" + k, v); }
};

const SHOPS = {
  asia: "Épicerie asiatique", kor: "Épicerie coréenne", frais: "Primeur / Mon-marché", super: "Supermarché",
  bio: "Magasin bio", web: "En ligne", orient: "Épicerie orientale"
};
const FAM_SHORT = {
  "Rouleaux frais": "Rouleaux", "Nems & rouleaux frits": "Nems", "Pizzas de riz": "Pizzas", "Bourek & bricks": "Bourek",
  "Samoussas": "Samoussas", "Raviolis & dumplings": "Raviolis", "Tacos & wraps": "Tacos", "Lasagnes & gratins": "Lasagnes",
  "Quiches & tartes salées": "Quiches", "Omelettes & galettes": "Omelettes", "Tteokbokki": "Tteokbokki", "Nouilles": "Nouilles",
  "Croustillants": "Tenders", "Coupelles & salades": "Coupelles", "Chips & apéro": "Chips", "Spécialités algériennes": "Algérie",
  "Spécialités orientales": "Pastilla", "Makis & sushis": "Makis", "Rouleaux fruités": "Fruités", "Mochis": "Mochis",
  "Chips & churros sucrés": "Churros", "Chaussons & strudels": "Chaussons", "Pâtisseries orientales": "Baklava",
  "Crèmes & mille-feuilles": "Mille-feuille", "Crêpes & croffles": "Crêpes", "Tartes & nids": "Tartelettes"
};
const TAGS = [["proteine", "Protéiné (25 g+)"], ["leger", "Léger (≤ 300 kcal)"], ["vege", "Végétarien"], ["rapide", "Rapide (≤ 20 min)"],
  ["oriental", "Oriental & algérien"], ["asiatique", "Asiatique"], ["fav", "Mes favoris"]];
const COOKS = ["Sans cuisson", "Air fryer", "Four", "Poêle", "Micro-ondes", "Wok", "Gaufrier", "Casserole", "Congélateur"];
const TINT = r => (r.col && r.col.find(c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 215; })) || "#c9a96b";

let uidN = 0;
const art = r => ART.svg(r, "a" + (uidN++));

// ---------- formats
function fmtN(n) {
  const w = Math.floor(n), f = n - w;
  if (Math.abs(f - 0.5) < 0.01) return (w ? w : "") + "½";
  return String(Math.round(n));
}
function qty(key, g) {
  const I = ING[key];
  if (I.taste) return "à ton goût";
  if (g <= 0) return "";
  if (key === "oeuf" && g < 25) return "un peu (dorure)";
  if (I.piece) {
    const [s, p, w] = I.piece;
    let n = Math.round((g / w) * 2) / 2; if (n < 0.5) n = 0.5;
    const extra = (w >= 12 && key !== "oeuf" && key !== "feuille") ? ` (${Math.round(g)} g)` : "";
    return `${fmtN(n)} ${n > 1 ? p : s}${extra}`;
  }
  if (I.ml) {
    if (g <= 22) { const cc = g / 5; if (cc < 2.75) return `${fmtN(Math.max(0.5, Math.round(cc * 2) / 2))} c. à c.`; return `${fmtN(Math.round((g / 15) * 2) / 2)} c. à s.`; }
    return `${Math.round(g / 5) * 5} ml`;
  }
  if (I.sp && g < I.sp * 9) {
    const cc = g / I.sp;
    if (cc < 0.4) return "1 pincée";
    if (cc < 2.75) return `${fmtN(Math.round(cc * 2) / 2)} c. à c.`;
    return `${fmtN(Math.round((cc / 3) * 2) / 2)} c. à s.`;
  }
  return `${g < 20 ? Math.round(g) : Math.round(g / 5) * 5} g`;
}
const timeTxt = r => r.t + " min" + (r.rest ? ` + ${r.rest >= 60 ? Math.round(r.rest / 60) + " h" : r.rest + " min"} de repos` : "");

// ---------- mélange stable
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const mixRank = {};
(() => { const rnd = seeded(20261019); const ids = RECIPES.map(r => r.id); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } ids.forEach((id, i) => mixRank[id] = i); })();

// ---------- état
const S = {
  cat: "all", q: "", fam: null, tags: new Set(), cooks: new Set(), kmax: 450, pmin: 0, sort: "mix", page: 1,
  fav: new Set(store.get("fav", [])),
  cart: store.get("cart", []), // [{id, n}]
  checks: new Set(store.get("checks", [])),
  fridge: new Set(store.get("fridge", ["oeuf", "poulet", "tomate", "oignon", "skyr", "poivron", "feta", "epinards"])),
  plan: store.get("plan", null),
};
const PAGE = 24;

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2200);
}
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); }
  catch (e) {
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "-1000px";
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (err) {}
    ta.remove(); toast(ok ? okMsg : "Copie impossible ici : sélectionne le texte à la main");
  }
}

// ---------- profils & suivi (feuille Google de Mehdi)
const TRACK_URL = "https://script.google.com/macros/s/AKfycbweeQvz_yU3V0AMJ8ZBFk5UDfcqtKWeQczqJiZVap_gsCyEc2-1Uia8kQF9nMNxu445/exec";
const TRACK_OK = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(TRACK_URL);
const COUNTRY_FIRST = ["FR", "DZ", "MA", "TN", "BE", "CH", "CA", "LU", "DE", "ES", "IT", "GB", "US"];
const COUNTRY_ALL = "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GF GH GM GN GP GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MQ MR MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NZ OM PA PE PF PG PH PK PL PR PS PT PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TO TR TT TW TZ UA UG US UY UZ VA VC VE VN VU WS YE YT ZA ZM ZW".split(" ");
let regionName = c => c;
try { const dn = new Intl.DisplayNames(["fr"], { type: "region" }); regionName = c => dn.of(c) || c; } catch (e) {}
const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
const device = () => { try { return matchMedia("(pointer: coarse)").matches ? "mobile" : "ordinateur"; } catch (e) { return "ordinateur"; } };
function newId() {
  const a = new Uint8Array(8);
  try { crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256); }
  return [...a].map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 12);
}
function track(ev, later) {
  if (!TRACK_OK || !ME) return;
  const q = gstore.get("queue", []);
  q.push({ e: ev, p: ME.prenom, c: ME.pays, id: ME.id, d: device() });
  gstore.set("queue", q.slice(-20));
  if (!later) flushTrack();
}
let flushing = false;
function flushTrack() {
  if (!TRACK_OK || flushing || !navigator.onLine) return;
  const q = gstore.get("queue", []);
  if (!q.length) return;
  flushing = true;
  fetch(TRACK_URL, { method: "POST", mode: "no-cors", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", keepalive: true,
    headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(q[0]) })
    .then(() => { const r = gstore.get("queue", []); r.shift(); gstore.set("queue", r); flushing = false; if (r.length) flushTrack(); })
    .catch(() => { flushing = false; });
}
window.addEventListener("online", flushTrack);
function saveAll() {
  store.set("fav", [...S.fav]); store.set("cart", S.cart); store.set("checks", [...S.checks]);
  store.set("fridge", [...S.fridge]); if (S.plan) store.set("plan", S.plan);
}
function paintMe() {
  const b = $("#meBtn");
  if (!b) return;
  b.textContent = ME ? ME.prenom.trim().charAt(0).toUpperCase() : "?";
  b.setAttribute("aria-label", ME ? `Profil de ${ME.prenom}, changer de profil` : "Créer ton profil");
  const hi = $("#hello"); if (hi) hi.textContent = ME ? `Salut ${ME.prenom} · ` : "";
}
function countryOptions(sel) {
  const first = COUNTRY_FIRST.map(c => [c, regionName(c)]);
  const rest = COUNTRY_ALL.filter(c => !COUNTRY_FIRST.includes(c)).map(c => [c, regionName(c)]).sort((x, y) => x[1].localeCompare(y[1], "fr"));
  const opt = ([c, n]) => `<option value="${c}"${c === sel ? " selected" : ""}>${esc(n)}</option>`;
  return `<option value="">Choisis ton pays</option>` + first.map(opt).join("") + `<option disabled>──────────</option>` + rest.map(opt).join("");
}
function openWelcome(adding) {
  const w = $("#welcome"), others = PROFILES.filter(p => !ME || p.id !== ME.id);
  $("#wCountry").innerHTML = countryOptions(adding ? "" : "FR");
  $("#wName").value = "";
  $("#wErr").hidden = true;
  $("#wOthers").innerHTML = others.length ? `<p class="lab">Ou reprendre sur cet appareil</p><div class="chips">` +
    others.map(p => `<button type="button" class="chip" data-switch="${p.id}">${esc(p.prenom)} · ${esc(p.pays)}</button>`).join("") + `</div>` : "";
  $("#wClose").hidden = !ME;
  w.hidden = false; document.body.style.overflow = "hidden";
  setTimeout(() => $("#wName").focus({ preventScroll: true }), 60);
}
function closeWelcome() { if (!ME) return; $("#welcome").hidden = true; document.body.style.overflow = ""; }
function switchTo(id) {
  if (ME && ME.id === id) { closeWelcome(); closeProfile(); return; }
  saveAll(); gstore.set("active", id); location.reload();
}
$("#welcomeForm").addEventListener("submit", e => {
  e.preventDefault();
  if ($("#wHp").value) return;
  const prenom = $("#wName").value.replace(/\s+/g, " ").trim();
  const cc = $("#wCountry").value;
  const err = msg => { $("#wErr").textContent = msg; $("#wErr").hidden = false; };
  if (!/^[\p{L}][\p{L}' -]{0,29}$/u.test(prenom)) return err("Écris ton prénom avec des lettres seulement (30 au maximum).");
  if (!cc || !COUNTRY_ALL.includes(cc)) return err("Choisis ton pays de résidence dans la liste.");
  if (ME) saveAll();
  const p = { id: newId(), prenom, pays: regionName(cc), cc, at: today() };
  const firstEver = !ME;
  PROFILES.push(p); gstore.set("profiles", PROFILES); gstore.set("active", p.id);
  if (!firstEver) { ME = p; track("inscription", true); store.set("lastVisit", today()); location.reload(); return; }
  ME = p; saveAll();
  track("inscription"); store.set("lastVisit", today());
  $("#welcome").hidden = true; document.body.style.overflow = "";
  paintMe(); toast(`Bienvenue ${prenom} !`);
});
$("#welcome").addEventListener("click", e => {
  const s = e.target.closest("[data-switch]"); if (s) { switchTo(s.dataset.switch); return; }
  if (e.target.closest("#wClose")) closeWelcome();
});
function openProfile() {
  if (!ME) return openWelcome(false);
  const others = PROFILES.filter(p => p.id !== ME.id);
  $("#profBody").innerHTML = `
    <div class="me-card"><span class="avatar big">${esc(ME.prenom.charAt(0).toUpperCase())}</span>
      <div><h3 id="profTitle">${esc(ME.prenom)}</h3><p class="note">${esc(ME.pays)} · profil créé le ${esc(ME.at.split("-").reverse().map(x => x.padStart(2, "0")).join("/"))}</p></div></div>
    <p class="note">Tes favoris (${S.fav.size}), ton frigo, ta semaine et ta liste de courses (${S.cart.length} recette${S.cart.length > 1 ? "s" : ""}) sont rangés sous ce profil, sur cet appareil uniquement.</p>
    ${others.length ? `<div><p class="lab">Changer de personne</p><div class="chips mt8">${others.map(p => `<button type="button" class="chip" data-switch="${p.id}">${esc(p.prenom)} · ${esc(p.pays)}</button>`).join("")}</div></div>` : ""}
    <div class="actions flush"><button class="btn" type="button" id="profAdd">Ajouter une personne</button>
      <button class="btn ghost" type="button" id="profDel">Retirer ce profil de l'appareil</button></div>
    <p class="note">Ton prénom, ton pays et la date de tes visites sont transmis à Mehdi, l'auteur du site, pour savoir qui l'utilise. Pour les faire effacer, demande-le-lui.</p>`;
  $("#prof").hidden = false; document.body.style.overflow = "hidden";
}
function closeProfile() { $("#prof").hidden = true; document.body.style.overflow = ""; }
$("#prof").addEventListener("click", e => {
  if (e.target.id === "prof" || e.target.closest("#profClose")) return closeProfile();
  const s = e.target.closest("[data-switch]"); if (s) return switchTo(s.dataset.switch);
  if (e.target.closest("#profAdd")) { closeProfile(); return openWelcome(true); }
  const d = e.target.closest("#profDel");
  if (d) {
    if (!d.dataset.confirm) { d.dataset.confirm = "1"; d.textContent = "Confirmer : effacer ce profil et ses données ici"; d.classList.add("hot"); return; }
    const id = ME.id;
    ["fav", "cart", "checks", "fridge", "plan", "tab", "lastVisit"].forEach(k => gstore.del(id + "_" + k));
    PROFILES = PROFILES.filter(p => p.id !== id); gstore.set("profiles", PROFILES);
    gstore.set("active", PROFILES.length ? PROFILES[0].id : null); location.reload();
  }
});
$("#meBtn").addEventListener("click", openProfile);
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("#prof").hidden) closeProfile(); else if (!$("#welcome").hidden) closeWelcome(); } });

// ---------- héros
const nSale = RECIPES.filter(r => r.c === "sale").length;
$("#hN").textContent = RECIPES.length;
$("#hS").textContent = nSale;
$("#hD").textContent = RECIPES.length - nSale;
$("#hP").textContent = RECIPES.filter(r => r.tags.includes("proteine")).length;

// ---------- filtres
function filtered(ignoreFam) {
  const q = norm(S.q.trim());
  const words = q ? q.split(/\s+/) : [];
  return RECIPES.filter(r => {
    if (S.cat !== "all" && r.c !== S.cat) return false;
    if (!ignoreFam && S.fam && r.f !== S.fam) return false;
    if (r.k > S.kmax || r.p < S.pmin) return false;
    for (const t of S.tags) { if (t === "fav" ? !S.fav.has(r.id) : !r.tags.includes(t)) return false; }
    if (S.cooks.size && !r.ck.some(c => S.cooks.has(c))) return false;
    if (words.length) {
      const hay = r._hay || (r._hay = norm([r.n, r.f, r.cu, r.ck.join(" "), r.i.map(([k]) => ING[k].n).join(" "),
        r.tags.includes("vege") ? "vege vegetarien" : "", r.tags.includes("proteine") ? "proteine" : "", r.c === "sucre" ? "sucre dessert" : "sale"].join(" ")));
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
}
function sorted(list) {
  const L = list.slice();
  const by = {
    mix: (a, b) => mixRank[a.id] - mixRank[b.id], kcal: (a, b) => a.k - b.k, prot: (a, b) => b.p - a.p,
    ratio: (a, b) => (b.p / b.k) - (a.p / a.k), time: (a, b) => a.t - b.t, az: (a, b) => a.n.localeCompare(b.n, "fr")
  }[S.sort];
  return L.sort(by);
}

function cardHTML(r) {
  return `<article class="card" style="--tint:${TINT(r)}">
    <div class="art">${art(r)}</div>
    ${r.tags.includes("proteine") ? `<span class="badge">${Math.round(r.p)} g prot</span>` : ""}
    <button class="fav" type="button" data-fav="${r.id}" aria-pressed="${S.fav.has(r.id)}" aria-label="Ajouter aux favoris : ${esc(r.n)}"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
    <div class="body"><span class="fam">${esc(r.f)}</span><h3>${esc(r.n)}</h3>
      <div class="meta"><span><b>${r.k}</b> kcal</span><span>${Math.round(r.p)} g prot</span><span>${r.t} min</span></div></div>
    <button class="hit" type="button" data-open="${r.id}" aria-label="Ouvrir la recette : ${esc(r.n)}"></button>
  </article>`;
}

function renderChips() {
  $("#tagChips").innerHTML = TAGS.map(([k, l]) => `<button type="button" class="chip" data-tag="${k}" aria-pressed="${S.tags.has(k)}">${l}</button>`).join("");
  $("#cookChips").innerHTML = COOKS.map(c => `<button type="button" class="chip" data-cook="${c}" aria-pressed="${S.cooks.has(c)}">${c}</button>`).join("");
}
function renderFams() {
  const pool = filtered(true), counts = {};
  pool.forEach(r => counts[r.f] = (counts[r.f] || 0) + 1);
  const fams = Object.keys(FAM_SHORT).filter(f => counts[f] || f === S.fam);
  $("#famChips").innerHTML = `<button type="button" class="chip" data-fam="" aria-pressed="${!S.fam}">Toutes <span class="n">${pool.length}</span></button>` +
    fams.map(f => `<button type="button" class="chip" data-fam="${esc(f)}" aria-pressed="${S.fam === f}">${esc(f)} <span class="n">${counts[f] || 0}</span></button>`).join("");
}
let currentList = [];
function renderGrid(reset = true) {
  if (reset) { S.page = 1; currentList = sorted(filtered()); }
  const n = currentList.length;
  $("#rCount").textContent = `${n} recette${n > 1 ? "s" : ""}`;
  const nf = S.tags.size + S.cooks.size + (S.kmax < 450) + (S.pmin > 0) + (S.sort !== "mix");
  $("#fCount").hidden = !nf; $("#fCount").textContent = nf;
  $("#rNote").textContent = n ? `${Math.round(currentList.reduce((s, r) => s + r.k, 0) / n)} kcal en moyenne par portion` : "";
  const g = $("#grid");
  if (!n) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Aucune recette avec ces filtres</h3><p>Monte le plafond de calories ou retire une envie.</p><button class="btn ghost" type="button" data-reset>Tout réinitialiser</button></div>`;
    $("#moreBtn").hidden = true; return;
  }
  const slice = currentList.slice(reset ? 0 : (S.page - 1) * PAGE, S.page * PAGE);
  const html = slice.map(cardHTML).join("");
  if (reset) g.innerHTML = html; else g.insertAdjacentHTML("beforeend", html);
  $("#moreBtn").hidden = S.page * PAGE >= n;
  $("#moreBtn").textContent = `Afficher plus (${n - S.page * PAGE} restantes)`;
}
function refresh() { renderFams(); renderGrid(); buildWheel(); }
function more() { if (S.page * PAGE < currentList.length) { S.page++; renderGrid(false); } }

$("#q").addEventListener("input", e => { S.q = e.target.value; clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 140); });
$$(".seg [data-cat]").forEach(b => b.addEventListener("click", () => {
  S.cat = b.dataset.cat; S.fam = null; $$(".seg [data-cat]").forEach(x => x.setAttribute("aria-pressed", x === b)); refresh();
}));
$("#toggleFilters").addEventListener("click", e => {
  const f = $("#filters"); f.hidden = !f.hidden; e.currentTarget.setAttribute("aria-expanded", !f.hidden);
});
$("#filters").addEventListener("click", e => {
  const t = e.target.closest("[data-tag],[data-cook]"); if (!t) return;
  if (t.dataset.tag) { const k = t.dataset.tag; S.tags.has(k) ? S.tags.delete(k) : S.tags.add(k); }
  else { const k = t.dataset.cook; S.cooks.has(k) ? S.cooks.delete(k) : S.cooks.add(k); }
  t.setAttribute("aria-pressed", t.dataset.tag ? S.tags.has(t.dataset.tag) : S.cooks.has(t.dataset.cook)); refresh();
});
$("#kmax").addEventListener("input", e => { S.kmax = +e.target.value; $("#kmaxOut").textContent = S.kmax + " kcal"; clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 80); });
$("#pmin").addEventListener("input", e => { S.pmin = +e.target.value; $("#pminOut").textContent = S.pmin + " g"; clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 80); });
$("#sort").addEventListener("change", e => { S.sort = e.target.value; renderGrid(); });
function resetAll() {
  Object.assign(S, { cat: "all", q: "", fam: null, kmax: 450, pmin: 0, sort: "mix" }); S.tags.clear(); S.cooks.clear();
  $("#q").value = ""; $("#kmax").value = 450; $("#kmaxOut").textContent = "450 kcal"; $("#pmin").value = 0; $("#pminOut").textContent = "0 g"; $("#sort").value = "mix";
  $$(".seg [data-cat]").forEach(x => x.setAttribute("aria-pressed", x.dataset.cat === "all")); renderChips(); refresh();
}
$("#reset").addEventListener("click", resetAll);
$("#famChips").addEventListener("click", e => { const b = e.target.closest("[data-fam]"); if (!b) return; S.fam = b.dataset.fam || null; renderFams(); renderGrid(); });
$("#moreBtn").addEventListener("click", more);
if ("IntersectionObserver" in window) new IntersectionObserver(es => { if (es[0].isIntersecting && !$("#v-recettes").hidden) more(); }, { rootMargin: "600px" }).observe($("#sentinel"));
$("#favTop").addEventListener("click", () => {
  goTab("recettes"); S.tags.add("fav"); renderChips(); $("#filters").hidden = false; $("#toggleFilters").setAttribute("aria-expanded", "true"); refresh();
  $(".controls").scrollIntoView({ behavior: "smooth", block: "start" });
});

// délégation globale : ouvrir, favoris, reset
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if (o) { openRecipe(o.dataset.open); return; }
  const f = e.target.closest("[data-fav]"); if (f) { toggleFav(f.dataset.fav); return; }
  if (e.target.closest("[data-reset]")) resetAll();
});
function toggleFav(id) {
  S.fav.has(id) ? S.fav.delete(id) : S.fav.add(id); store.set("fav", [...S.fav]);
  $$(`[data-fav="${id}"]`).forEach(b => b.setAttribute("aria-pressed", S.fav.has(id)));
  $("#favCount").textContent = S.fav.size;
  toast(S.fav.has(id) ? "Ajoutée aux favoris" : "Retirée des favoris");
  if (S.tags.has("fav")) refresh();
}
$("#favCount").textContent = S.fav.size;

// ---------- la roue
let wheelFams = [], wheelRot = 0, spinning = false;
const WHEEL_COLS = ["#f2b14d", "#9bcb63", "#f2896a", "#ffd36b", "#7caf66", "#e8884a", "#c9b3e6", "#f4a7b4"];
function buildWheel() {
  if (spinning) return;
  const pool = filtered(true), counts = {};
  pool.forEach(r => counts[r.f] = (counts[r.f] || 0) + 1);
  let fams = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  if (S.cat === "all" && fams.length > 8) {
    const sw = fams.filter(f => pool.find(r => r.f === f).c === "sucre").slice(0, 3);
    fams = fams.filter(f => !sw.includes(f)).slice(0, 8 - sw.length).concat(sw);
    fams.sort((a, b) => mixRank[pool.find(r => r.f === a).id] - mixRank[pool.find(r => r.f === b).id]);
  } else fams = fams.slice(0, 8);
  const key = fams.join("|");
  if (key === buildWheel._key) return;
  buildWheel._key = key; wheelFams = fams;
  $("#wheel").innerHTML = fams.length >= 2 ? ART.wheel(fams.map(f => esc(FAM_SHORT[f] || f)), WHEEL_COLS) : ART.wheel(["Aucune", "recette"], WHEEL_COLS);
  $("#spin").disabled = fams.length < 1;
}
function showPick(r, label) {
  const p = $("#pick");
  p.style.setProperty("--tint", TINT(r));
  p.dataset.open = r.id;
  p.innerHTML = `<div class="art">${art(r)}</div><div><div class="k">${label}</div><h3>${esc(r.n)}</h3><div class="meta">${r.k} kcal · ${Math.round(r.p)} g prot · ${r.t} min · Voir la recette →</div></div>`;
  p.classList.remove("flash"); void p.offsetWidth; p.classList.add("flash");
}
$("#spin").addEventListener("click", () => {
  if (spinning || !wheelFams.length) return;
  spinning = true;
  const n = wheelFams.length, i = Math.floor(Math.random() * n), seg = 360 / n;
  const target = 360 - (i + 0.2 + Math.random() * 0.6) * seg;
  const cur = ((wheelRot % 360) + 360) % 360;
  wheelRot += 360 * 5 + ((target - cur + 360) % 360);
  const d = $("#wheel"); d.classList.remove("wet"); void d.offsetWidth; d.classList.add("wet");
  d.style.transform = `rotate(${wheelRot}deg)`;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(() => {
    spinning = false;
    const pool = filtered(true).filter(r => r.f === wheelFams[i]);
    if (pool.length) showPick(pool[Math.floor(Math.random() * pool.length)], `La roue a choisi : ${FAM_SHORT[wheelFams[i]] || wheelFams[i]}`);
    buildWheel();
  }, reduced ? 50 : 3900);
});

// ---------- fiche recette
let sheetR = null, sheetN = 1, lastFocus = null;
function scaleIngs(r, n) { return r.i.map(([k, g]) => [k, g * n]); }
let sheetPushed = false;
function openRecipe(id, opts) {
  const r = byId[id]; if (!r) return;
  sheetR = r; sheetN = 1; lastFocus = document.activeElement;
  renderSheet();
  const wasOpen = !$("#sheet").hidden;
  $("#sheet").hidden = false; document.body.style.overflow = "hidden";
  if (!opts || !opts.fromHash) { setHash("#recette-" + id, !wasOpen); sheetPushed = sheetPushed || !wasOpen; }
  $("#sheetPanel").scrollTop = 0;
  setTimeout(() => { const c = $("#sheetClose"); c && c.focus({ preventScroll: true }); }, 30);
}
function closeSheet(fromPop) {
  if ($("#sheet").hidden) return;
  $("#sheet").hidden = true; document.body.style.overflow = ""; sheetR = null;
  if (!fromPop) { if (sheetPushed) { sheetPushed = false; try { history.back(); } catch (e) {} } else setHash("#" + currentTab, false); }
  else sheetPushed = false;
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
const ingChecks = new Set();
function renderSheet() {
  const r = sheetR, n = sheetN;
  const k = r.k * n, P = r.p * n, G = r.g * n, L = r.l * n, tot = P * 4 + G * 4 + L * 9 || 1;
  const pv = r.c === "sucre" && r.i.some(([key]) => key === "purevia");
  const shopTags = key => (ING[key].s || []).slice(0, 2).map(s => `<span class="shop ${s}">${SHOPS[s]}</span>`).join("");
  const ingRows = scaleIngs(r, n).map(([key, g], idx) => {
    const ck = ingChecks.has(r.id + idx);
    return `<li><button type="button" class="ing" data-ing="${idx}" aria-pressed="${ck}"><span class="box"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></span>
      <span class="q">${qty(key, g)}</span><span class="nmw"><span class="nm">${esc(ING[key].n)}</span>${ING[key].pantry ? "" : `<span class="shops">${shopTags(key)}</span>`}</span></button></li>`;
  }).join("");
  const steps = r.s.map(([txt, m], idx) => `<li><div><p>${esc(txt)}</p>${m ? timerBtn(r.id + "-" + idx, m) : ""}</div></li>`).join("");
  $("#sheetPanel").style.setProperty("--tint", TINT(r));
  $("#sheetPanel").innerHTML = `
    <div class="sheet-top"><button class="round" id="sheetClose" type="button" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <span class="r"><button class="round" type="button" id="shareBtn" aria-label="Partager la recette"><svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg></button>
      <button class="round" type="button" data-fav="${r.id}" aria-pressed="${S.fav.has(r.id)}" aria-label="Favori"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></span></div>
    <div class="sheet-art">${art(r)}</div>
    <div class="sheet-body">
      <div style="display:grid;gap:8px">
        <span class="eyebrow">${esc(r.f)} · ${esc(r.cu)}</span>
        <h2 id="sheetTitle">${esc(r.n)}</h2>
        <div class="tags">
          <span class="tag-s">${timeTxt(r)}</span><span class="tag-s">${esc(r.d)}</span>
          ${r.ck.map(c => `<span class="tag-s">${esc(c)}</span>`).join("")}
          ${r.tags.includes("proteine") ? `<span class="tag-s hot">Protéiné</span>` : ""}${r.tags.includes("vege") ? `<span class="tag-s hot">Végétarien</span>` : ""}${pv ? `<span class="tag-s hot">Zéro sucre ajouté</span>` : ""}
        </div>
      </div>
      <div class="nutri">
        <div class="kbig"><span id="kTot">${Math.round(k)}</span> <span style="font-size:18px;font-weight:600">kcal</span><small>${n > 1 ? `pour ${n} portions · ${r.k} kcal chacune` : `par portion · ${esc(r.po)}`}</small></div>
        <div>
          <div class="macro-bar" role="img" aria-label="Répartition des calories">
            <span class="mP" style="width:${(P * 4 / tot * 100).toFixed(1)}%"></span><span class="mG" style="width:${(G * 4 / tot * 100).toFixed(1)}%"></span><span class="mL" style="width:${(L * 9 / tot * 100).toFixed(1)}%"></span>
          </div>
          <div class="macro-leg"><span><i class="mP"></i>Protéines<b>${Math.round(P)} g</b></span><span><i class="mG"></i>Glucides<b>${Math.round(G)} g</b></span><span><i class="mL"></i>Lipides<b>${Math.round(L)} g</b></span></div>
        </div>
      </div>
      <div class="sheet-actions">
        <button class="btn" type="button" id="cookBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>Mode cuisine</button>
        <button class="btn hot" type="button" id="addCart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h14l-1.5 11.5h-11z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>Ajouter aux courses</button>
        <button class="btn ghost" type="button" id="copyTrack">Copier les grammes</button>
      </div>
      <div style="display:grid;gap:10px">
        <div class="sec-h"><h3>Ingrédients</h3>
          <div class="stepper" aria-label="Nombre de portions"><button type="button" id="nMinus" aria-label="Une portion de moins">−</button><output id="nOut">${n} portion${n > 1 ? "s" : ""}</output><button type="button" id="nPlus" aria-label="Une portion de plus">+</button></div></div>
        <ul class="ings">${ingRows}</ul>
        <p class="note">Une portion = ${esc(r.po)}. Calculé avec une feuille de 10 g ; pèse les tiennes, ça varie de 8 à 13 g selon les marques.</p>
      </div>
      <div style="display:grid;gap:10px"><div class="sec-h"><h3>Étapes</h3></div><ol class="steps">${steps}</ol></div>
      <div class="tip"><b>Astuce · </b>${esc(r.tip)}</div>
      ${pv ? `<p class="note">Pure Via Pâtisserie se dose comme le sucre, cuillère pour cuillère. À forte dose, les polyols qu'il contient peuvent avoir un effet laxatif : reste sur des portions dessert.</p>` : ""}
    </div>`;
}
$("#sheet").addEventListener("click", e => {
  if (e.target.id === "sheet") return closeSheet();
  if (e.target.closest("#sheetClose")) return closeSheet();
  const ing = e.target.closest("[data-ing]");
  if (ing) { const key = sheetR.id + ing.dataset.ing; ingChecks.has(key) ? ingChecks.delete(key) : ingChecks.add(key); ing.setAttribute("aria-pressed", ingChecks.has(key)); return; }
  if (e.target.closest("#nPlus")) { sheetN = Math.min(8, sheetN + 1); renderSheetKeep(); return; }
  if (e.target.closest("#nMinus")) { sheetN = Math.max(1, sheetN - 1); renderSheetKeep(); return; }
  if (e.target.closest("#addCart")) { addToCart(sheetR.id, sheetN); return; }
  if (e.target.closest("#cookBtn")) { openCook(sheetR); return; }
  if (e.target.closest("#shareBtn")) { shareRecipe(sheetR); return; }
  if (e.target.closest("#copyTrack")) {
    const t = `${sheetR.n} (${sheetN} portion${sheetN > 1 ? "s" : ""}) : ${Math.round(sheetR.k * sheetN)} kcal\n` +
      scaleIngs(sheetR, sheetN).filter(([k, g]) => g > 0 && !ING[k].taste).map(([k, g]) => `- ${ING[k].n} : ${Math.round(g)} ${ING[k].ml ? "ml" : "g"}`).join("\n");
    copyText(t, "Grammes copiés pour ton appli de suivi"); return;
  }
  const tb = e.target.closest("[data-timer]"); if (tb) startTimer(tb.dataset.timer, +tb.dataset.min);
});
function renderSheetKeep() { const st = $("#sheetPanel").scrollTop; renderSheet(); $("#sheetPanel").scrollTop = st; }
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!$("#cook").hidden) closeCook(); else if (!$("#sheet").hidden) closeSheet(); }
});

async function shareRecipe(r) {
  const url = location.href.split("#")[0] + "#recette-" + r.id;
  const text = `${r.n} : ${r.k} kcal, ${Math.round(r.p)} g de protéines, ${r.t} min.`;
  if (navigator.share) {
    try { await navigator.share({ title: r.n, text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  copyText(url, "Lien de la recette copié");
}

// ---------- minuteurs
const timers = {}; let audioCtx = null;
function fmtT(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function timerBtn(key, m) {
  const t = timers[key];
  const cls = t ? (t.done ? "done" : "run") : "";
  const label = t ? (t.done ? "Terminé" : fmtT((t.end - Date.now()) / 1000)) : `${m >= 60 ? Math.round(m / 60) + " h" : m + " min"}`;
  return `<button type="button" class="timer ${cls}" data-timer="${key}" data-min="${m}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg><span>${label}</span></button>`;
}
function startTimer(key, m) {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  const t = timers[key];
  if (t && !t.done) { delete timers[key]; paintTimers(); return; } // re-toucher = arrêter
  timers[key] = { end: Date.now() + m * 60000, done: false };
  paintTimers(); tick();
}
function beep() {
  if (!audioCtx) return;
  try { [0, .35, .7].forEach(d => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(.0001, audioCtx.currentTime + d); g.gain.exponentialRampToValueAtTime(.3, audioCtx.currentTime + d + .02); g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + d + .25); o.start(audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d + .3); }); } catch (e) {}
}
function paintTimers() {
  $$("[data-timer]").forEach(b => { const tmp = document.createElement("div"); tmp.innerHTML = timerBtn(b.dataset.timer, +b.dataset.min); const nb = tmp.firstChild; b.className = nb.className; b.querySelector("span").textContent = nb.querySelector("span").textContent; });
}
let ticking = null;
function tick() {
  if (ticking) return;
  ticking = setInterval(() => {
    let live = 0;
    for (const [k, t] of Object.entries(timers)) { if (!t.done) { if (Date.now() >= t.end) { t.done = true; beep(); toast("Minuteur terminé"); } else live++; } }
    paintTimers();
    if (!live) { clearInterval(ticking); ticking = null; }
  }, 500);
}

// ---------- mode cuisine
let cookR = null, cookI = 0, wakeLock = null;
function openCook(r) {
  cookR = r; cookI = 0; $("#cook").hidden = false; renderCook();
  try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => {}); } catch (e) {}
}
function closeCook() { $("#cook").hidden = true; try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; }
function renderCook() {
  const r = cookR, [txt, m] = r.s[cookI], last = cookI === r.s.length - 1;
  $("#cook").innerHTML = `<div class="cook-top"><span class="t">${esc(r.n)}</span><button class="round" type="button" id="cookClose" aria-label="Quitter le mode cuisine"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="cook-main"><div class="cook-n">Étape ${cookI + 1} sur ${r.s.length}</div><p class="cook-txt">${esc(txt)}</p>${m ? timerBtn(r.id + "-" + cookI, m) : ""}</div>
    <div class="cook-nav"><button class="btn ghost" type="button" id="cPrev" ${cookI ? "" : "disabled"}>Précédente</button>
      <div class="cook-dots">${r.s.map((_, i) => `<i class="${i <= cookI ? "on" : ""}"></i>`).join("")}</div>
      <button class="btn" type="button" id="cNext">${last ? "Terminé" : "Suivante"}</button></div>`;
}
$("#cook").addEventListener("click", e => {
  if (e.target.closest("#cookClose")) return closeCook();
  if (e.target.closest("#cPrev")) { cookI = Math.max(0, cookI - 1); return renderCook(); }
  if (e.target.closest("#cNext")) { if (cookI >= cookR.s.length - 1) { closeCook(); toast("Bon appétit !"); return; } cookI++; return renderCook(); }
  const tb = e.target.closest("[data-timer]"); if (tb) startTimer(tb.dataset.timer, +tb.dataset.min);
});

// ---------- courses
function saveCart() { store.set("cart", S.cart); updateCartDot(); }
function updateCartDot() { const d = $("#cartDot"); d.hidden = !S.cart.length; d.textContent = S.cart.length; }
function addToCart(id, n, silent) {
  const ex = S.cart.find(c => c.id === id);
  if (ex) ex.n += n; else S.cart.push({ id, n });
  saveCart(); if (!silent) toast(`Ajoutée aux courses (${n} portion${n > 1 ? "s" : ""})`);
  if (!$("#v-courses").hidden) renderCart();
}
function renderCart() {
  const box = $("#cartBox");
  if (!S.cart.length) {
    box.innerHTML = `<div class="panel empty"><h3>Ta liste est vide</h3><p>Ouvre une recette et touche « Ajouter aux courses », ou envoie toute ta semaine d'un coup.</p>
      <div class="actions" style="justify-content:center"><button class="btn hot" type="button" id="cartFromPlan">Ajouter ma semaine</button><button class="btn ghost" type="button" data-goto="recettes">Parcourir les recettes</button></div></div>`;
    return;
  }
  const agg = {};
  S.cart.forEach(({ id, n }) => { const r = byId[id]; if (!r) return; r.i.forEach(([k, g]) => { agg[k] = (agg[k] || 0) + g * n; }); });
  const groups = {};
  Object.entries(agg).forEach(([k, g]) => {
    const I = ING[k]; const a = I.pantry ? "Placard (sûrement déjà chez toi)" : I.a;
    (groups[a] = groups[a] || []).push([k, g]);
  });
  const order = ["Feuilles de riz", "Légumes & herbes", "Fruits", "Viandes, poissons & œufs", "Crèmerie", "Épicerie", "Épicerie asiatique", "Sucrant & pâtisserie", "Épices & aromates", "Placard (sûrement déjà chez toi)"];
  const kTot = S.cart.reduce((s, c) => s + (byId[c.id] ? byId[c.id].k * c.n : 0), 0);
  const nPor = S.cart.reduce((s, c) => s + c.n, 0);
  let html = `<div class="panel"><div class="sec-h"><h3 style="font-family:var(--font-display);font-size:16px">${S.cart.length} recette${S.cart.length > 1 ? "s" : ""} · ${nPor} portion${nPor > 1 ? "s" : ""}</h3><span class="mono note">${Math.round(kTot)} kcal au total</span></div>
    <div class="cart-recipes" style="margin-top:10px">${S.cart.map(c => byId[c.id] ? `<span class="chip"><button type="button" style="padding:0;border:0;background:none;font-weight:600" data-open="${c.id}">${esc(byId[c.id].n)}</button> ×${c.n}<button type="button" data-rm="${c.id}" aria-label="Retirer ${esc(byId[c.id].n)}">×</button></span>` : "").join("")}</div>
    <div class="actions"><button class="btn" type="button" id="copyCart">Copier la liste</button><button class="btn ghost" type="button" id="clearCart">Vider la liste</button></div></div>`;
  order.filter(a => groups[a]).forEach(a => {
    const items = groups[a].sort((x, y) => ING[x[0]].n.localeCompare(ING[y[0]].n, "fr"));
    html += `<div class="aisle"><h3>${esc(a)} <span>${items.length}</span></h3><ul class="items">` + items.map(([k, g]) => {
      const I = ING[k], ck = S.checks.has(k);
      return `<li><button type="button" class="item" data-check="${k}" aria-pressed="${ck}"><span class="box"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></span>
        <span><span class="nm">${esc(I.n)}</span> <span class="q">${I.taste ? "" : "· " + qty(k, g)}</span>${I.pantry ? "" : `<span class="shops">${(I.s || []).map(s => `<span class="shop ${s}">${SHOPS[s]}</span>`).join("")}</span>`}</span></button></li>`;
    }).join("") + `</ul></div>`;
  });
  html += `<p class="note" style="margin-top:14px">Les noms des boutiques et leurs adresses sont dans l'onglet Guide.</p>`;
  box.innerHTML = html;
}
$("#cartBox").addEventListener("click", e => {
  const c = e.target.closest("[data-check]");
  if (c) { const k = c.dataset.check; S.checks.has(k) ? S.checks.delete(k) : S.checks.add(k); store.set("checks", [...S.checks]); c.setAttribute("aria-pressed", S.checks.has(k)); return; }
  const rm = e.target.closest("[data-rm]"); if (rm) { S.cart = S.cart.filter(x => x.id !== rm.dataset.rm); saveCart(); renderCart(); return; }
  if (e.target.closest("#clearCart")) {
    const b = e.target.closest("#clearCart");
    if (b.dataset.confirm) { S.cart = []; S.checks.clear(); store.set("checks", []); saveCart(); renderCart(); toast("Liste vidée"); }
    else { b.dataset.confirm = "1"; b.textContent = "Confirmer : tout vider"; b.classList.add("hot"); setTimeout(() => { if (b.isConnected) { delete b.dataset.confirm; b.textContent = "Vider la liste"; b.classList.remove("hot"); } }, 3500); }
    return;
  }
  if (e.target.closest("#cartFromPlan")) { planToCart(); return; }
  if (e.target.closest("#copyCart")) {
    const agg = {};
    S.cart.forEach(({ id, n }) => byId[id] && byId[id].i.forEach(([k, g]) => agg[k] = (agg[k] || 0) + g * n));
    const lines = Object.entries(agg).filter(([k]) => !ING[k].taste).sort((a, b) => ING[a[0]].a.localeCompare(ING[b[0]].a, "fr"))
      .map(([k, g]) => `${S.checks.has(k) ? "[x]" : "[ ]"} ${ING[k].n} : ${qty(k, g)}`);
    copyText("Courses feuille de riz\n" + lines.join("\n"), "Liste copiée");
  }
});
document.addEventListener("click", e => { const g = e.target.closest("[data-goto]"); if (g) { e.preventDefault(); goTab(g.dataset.goto); } });

// ---------- frigo
const FRIDGE = [
  ["Protéines", ["poulet", "dinde", "boeuf", "jambon_dinde", "thon", "crevettes", "saumon_fume", "cabillaud", "surimi", "oeuf", "tofu", "pois_chiches"]],
  ["Crèmerie", ["skyr", "fromage_blanc", "yaourt_grec", "mozza", "emmental", "feta", "ricotta", "fromage_frais", "lait"]],
  ["Légumes", ["tomate", "poivron", "oignon", "carotte", "concombre", "courgette", "champignons", "epinards", "chou", "laitue", "avocat", "pdt"]],
  ["Fruits", ["pomme", "banane", "fraises", "framboises", "myrtilles", "mangue", "poire", "kiwi"]],
  ["Herbes", ["persil", "coriandre", "menthe", "basilic", "oignon_nouveau"]]
];
function renderFridgePicker() {
  $("#fridgePicker").innerHTML = FRIDGE.map(([g, keys]) => `<div class="group-title">${g}</div><div class="chips">` +
    keys.filter(k => ING[k]).map(k => `<button type="button" class="chip" data-fr="${k}" aria-pressed="${S.fridge.has(k)}">${esc(ING[k].n.replace(/ \(.+\)/, ""))}</button>`).join("") + `</div>`).join("") +
    `<p class="note" style="margin-top:12px">Sélection d'exemple au premier lancement : change-la avec ce que tu as vraiment.</p>`;
}
function renderFridge() {
  const have = S.fridge;
  const scored = RECIPES.map(r => {
    const m = r.m.filter(k => k !== "feuille");
    const got = m.filter(k => have.has(k)).length;
    return { r, score: m.length ? got / m.length : 0, miss: m.filter(k => !have.has(k)), got };
  }).filter(x => x.got > 0 && x.score >= 0.5).sort((a, b) => b.score - a.score || a.miss.length - b.miss.length || b.r.p - a.r.p).slice(0, 40);
  $("#frCount").textContent = have.size ? `${scored.length} recette${scored.length > 1 ? "s" : ""} faisable${scored.length > 1 ? "s" : ""} ou presque` : "";
  $("#fridgeList").innerHTML = !have.size ? `<div class="empty"><h3>Coche au moins un ingrédient</h3><p>Les recettes apparaîtront ici, de la plus faisable à la moins faisable.</p></div>` :
    !scored.length ? `<div class="empty"><h3>Pas encore de recette qui colle</h3><p>Ajoute une protéine ou un légume de plus.</p></div>` :
    scored.map(({ r, score, miss }) => {
      const pct = Math.round(score * 100), c = 2 * Math.PI * 18;
      return `<div class="fr-item" style="--tint:${TINT(r)}"><div class="art">${art(r)}</div>
        <div style="min-width:0"><h3>${esc(r.n)}</h3><div class="miss ${miss.length ? "" : "ok"}">${miss.length ? "Il te manque : " + miss.map(k => esc(ING[k].n.replace(/ \(.+\)/, "").toLowerCase())).join(", ") : "Tu as tout ce qu'il faut"}</div>
        <div class="note">${r.k} kcal · ${Math.round(r.p)} g prot · ${r.t} min</div></div>
        <svg class="ring" viewBox="0 0 46 46" role="img" aria-label="${pct} % des ingrédients"><circle cx="23" cy="23" r="18" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="23" cy="23" r="18" fill="none" stroke="var(--jade)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * score).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 23 23)"/><text x="23" y="27" text-anchor="middle">${pct}%</text></svg>
        <button class="hit" type="button" data-open="${r.id}" aria-label="Ouvrir ${esc(r.n)}" style="position:absolute;inset:0;border:0;background:transparent;border-radius:var(--r-md)"></button></div>`;
    }).join("");
}
$("#fridgePicker").addEventListener("click", e => {
  const b = e.target.closest("[data-fr]"); if (!b) return;
  const k = b.dataset.fr; S.fridge.has(k) ? S.fridge.delete(k) : S.fridge.add(k);
  b.setAttribute("aria-pressed", S.fridge.has(k)); store.set("fridge", [...S.fridge]); renderFridge();
});
$("#frClear").addEventListener("click", () => { S.fridge.clear(); store.set("fridge", []); renderFridgePicker(); renderFridge(); });

// ---------- semaine
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MEAL_NAMES = { 1: ["Repas"], 2: ["Déjeuner", "Dîner"], 3: ["Petit-déj", "Déjeuner", "Dîner"] };
const MAINS = RECIPES.filter(r => r.c === "sale" && r.p >= 18 && !["chips", "bacon"].includes(r.sh));
const DESSERTS = RECIPES.filter(r => r.c === "sucre");
function pickMeal(rnd, used, budget, dessert, idx, meals) {
  const breakfast = meals === 3 && idx === 0;
  const pool = breakfast ? RECIPES.filter(r => ["Omelettes & galettes", "Crêpes & croffles", "Rouleaux fruités", "Mochis"].includes(r.f) || r.f === "Quiches & tartes salées") : MAINS;
  const room = dessert && !breakfast ? budget - 140 : budget;
  let cand = pool.filter(r => !used.has(r.id) && r.k <= room);
  if (!cand.length) cand = pool.filter(r => r.k <= budget);
  if (!cand.length) cand = pool;
  const m = cand[Math.floor(rnd() * cand.length)];
  used.add(m.id);
  const n = Math.max(1, Math.min(3, Math.floor(room / m.k)));
  let d = null;
  if (dessert && !breakfast) {
    const left = budget - m.k * n;
    const dc = DESSERTS.filter(x => x.k <= left && !used.has(x.id));
    if (dc.length) { d = dc[Math.floor(rnd() * dc.length)]; used.add(d.id); }
  }
  return { id: m.id, n, d: d ? d.id : null };
}
function generatePlan(seed) {
  const meals = S.plan ? S.plan.meals : 2, budget = S.plan ? S.plan.budget : 650, dessert = S.plan ? S.plan.dessert : true;
  const rnd = seed != null ? seeded(seed) : Math.random;
  const used = new Set();
  S.plan = { meals, budget, dessert, days: DAYS.map(() => Array.from({ length: meals }, (_, i) => pickMeal(rnd, used, budget, dessert, i, meals))) };
  store.set("plan", S.plan);
}
function mealK(m) { return byId[m.id].k * m.n + (m.d ? byId[m.d].k : 0); }
function mealP(m) { return byId[m.id].p * m.n + (m.d ? byId[m.d].p : 0); }
function renderPlan() {
  if (!S.plan || !S.plan.days || S.plan.days.some(d => d.some(m => !byId[m.id] || (m.d && !byId[m.d])))) { S.plan = null; generatePlan(7); }
  const P = S.plan;
  $$("#mealsSeg [data-m]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.m === P.meals));
  $("#budget").value = P.budget; $("#budgetOut").textContent = P.budget + " kcal";
  $("#dessertChip").setAttribute("aria-pressed", P.dessert);
  const dayK = P.days.map(d => d.reduce((s, m) => s + mealK(m), 0)), dayP = P.days.map(d => d.reduce((s, m) => s + mealP(m), 0));
  const avg = a => Math.round(a.reduce((s, x) => s + x, 0) / a.length);
  $("#planSum").innerHTML = `<div class="stat"><b>${avg(dayK)}</b><span>kcal par jour en moyenne</span></div><div class="stat"><b>${avg(dayP)} g</b><span>protéines par jour</span></div><div class="stat"><b>${new Set(P.days.flat().map(m => m.id)).size}</b><span>plats différents</span></div>`;
  const names = MEAL_NAMES[P.meals];
  $("#days").innerHTML = P.days.map((d, di) => `<div class="day"><div class="day-h"><h3>${DAYS[di]}</h3><span class="tot">${Math.round(dayK[di])} kcal · ${Math.round(dayP[di])} g prot</span></div>` +
    d.map((m, mi) => { const r = byId[m.id], ds = m.d ? byId[m.d] : null;
      return `<div class="meal" style="--tint:${TINT(r)}"><div class="art">${art(r)}</div><div style="min-width:0"><div class="lab">${names[mi]}</div>
        <button class="nm" type="button" data-open="${r.id}">${esc(r.n)}${m.n > 1 ? ` ×${m.n}` : ""}</button>
        <div class="sub">${Math.round(r.k * m.n)} kcal · ${Math.round(r.p * m.n)} g prot</div>
        ${ds ? `<div class="dess">+ <button type="button" data-open="${ds.id}">${esc(ds.n)}</button> · ${ds.k} kcal</div>` : ""}</div>
        <button class="icon-btn" type="button" data-reroll="${di}-${mi}" aria-label="Changer ce plat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg></button></div>`; }).join("") + `</div>`).join("");
}
$("#days").addEventListener("click", e => {
  const b = e.target.closest("[data-reroll]"); if (!b) return;
  const [di, mi] = b.dataset.reroll.split("-").map(Number), P = S.plan;
  const used = new Set(P.days.flat().flatMap(m => [m.id, m.d]).filter(Boolean));
  P.days[di][mi] = pickMeal(Math.random, used, P.budget, P.dessert, mi, P.meals);
  store.set("plan", P); renderPlan();
});
$("#mealsSeg").addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (!b) return; S.plan.meals = +b.dataset.m; generatePlan(); renderPlan(); });
$("#budget").addEventListener("input", e => { $("#budgetOut").textContent = e.target.value + " kcal"; });
$("#budget").addEventListener("change", e => { S.plan.budget = +e.target.value; generatePlan(); renderPlan(); });
$("#dessertChip").addEventListener("click", () => { S.plan.dessert = !S.plan.dessert; generatePlan(); renderPlan(); });
$("#regen").addEventListener("click", () => { generatePlan(); renderPlan(); toast("Nouvelle semaine générée"); });
function planToCart() {
  if (!S.plan) generatePlan(7);
  S.plan.days.flat().forEach(m => { addToCart(m.id, m.n, true); if (m.d) addToCart(m.d, 1, true); });
  toast("Semaine ajoutée aux courses"); if (!$("#v-courses").hidden) renderCart();
}
$("#planToCart").addEventListener("click", () => { planToCart(); goTab("courses"); });

// ---------- guide
const STORES = [
  { n: "Tang Frères", tag: "Le temple asiatique", a: "48 avenue d'Ivry, 75013 Paris", sub: "Métro 7 Porte d'Ivry · une 2e adresse plus petite avenue de Choisy", buy: "Feuilles de riz dans toutes les tailles, nuoc-mâm, sauce soja, vinaigre de riz, citronnelle, gingembre, herbes fraîches asiatiques, crevettes, tofu.", web: "https://www.tang-freres.fr" },
  { n: "Paris Store", tag: "Asiatique", a: "44 avenue d'Ivry, 75013 Paris", sub: "Autre adresse : 5 boulevard de la Villette, 75010 Paris (Belleville)", buy: "Feuilles de riz, sauces, surgelés (crevettes, edamame), vaisselle et paniers vapeur." },
  { n: "K-Mart", tag: "Coréen & japonais", a: "6-8 rue Sainte-Anne, 75001 Paris", sub: "Aussi : 9-11 rue Robert-de-Flers (15e), 9 rue du Colisée (8e), 20 rue du Pont-Neuf (1er), 96 rue de Provence (9e)", buy: "Gochujang pour les tteokbokki, kimchi, matcha, feuilles de nori, tofu." },
  { n: "Ace Mart", tag: "Coréen", a: "63 rue Sainte-Anne, 75002 Paris", sub: "Aussi : 6 rue de l'Arbalète, 75005 Paris", buy: "Gochujang, kimchi, nori, sauces coréennes." },
  { n: "Mon-marché.fr", tag: "Le Grand Frais version Paris", a: "20 rue Lecourbe, 75015 Paris", sub: "Autres magasins dans Paris : Réaumur (2e), Léon-Frot (11e), Losserand (14e)…", buy: "Fruits et légumes, herbes, poisson, crèmerie, rayon épicerie du monde. Click & collect et livraison.", web: "https://www.mon-marche.fr" },
  { n: "Izraël, l'épicerie du monde", tag: "Épices & fruits secs", a: "30 rue François-Miron, 75004 Paris", sub: "Mardi–vendredi 9h30–13h et 14h30–19h, samedi 9h–19h", buy: "Ras el hanout, za'atar, cumin, pistaches brutes, fruits secs pour les baklavas et cigares." },
  { n: "Marché Barbès", tag: "Petits prix", a: "Boulevard de la Chapelle, 75018 Paris", sub: "Sous le métro aérien, mercredi et samedi matin · vérifie avant d'y aller", buy: "Herbes fraîches en bottes, citrons, dattes, eau de fleur d'oranger, épices." },
  { n: "Grand Frais", tag: "Hors Paris", a: "Plus de 200 magasins en France", sub: "Le premier dans les Hauts-de-Seine est prévu à Clichy", buy: "Rayon épicerie du monde avec feuilles de riz, fruits et légumes, crèmerie.", web: "https://www.grandfrais.com", noMap: true },
];
const CHAINS = [
  ["Supermarchés (Auchan, Carrefour, Leclerc, Monoprix…)", "Feuilles de riz au rayon produits du monde, skyr, fromage blanc 0 %, mozzarella light, cancoillotte, huile en spray. Pure Via Pâtisserie en sachet de 380 g (référencé chez Auchan)."],
  ["Magasins bio (Biocoop, Naturalia, La Vie Claire)", "Feuilles de riz complètes (Autour du Riz, La Vie Claire), tofu, vermicelles de konjac, matcha, érythritol."],
  ["En ligne", "Myprotein : beurre de cacahuète en poudre et whey. Amazon : Pure Via Pâtisserie, sirops zéro type Jordan's Skinny Syrups. purevia.fr : toute la gamme Pure Via."]
];
const WRAPS = [["2 feuilles de riz (20 g)", 68, true], ["Tortilla de blé (≈ 60 g)", 180], ["Pain pita (≈ 60 g)", 160], ["¼ de pâte feuilletée (≈ 57 g)", 230], ["½ pâte à pizza (≈ 130 g)", 340]];
const SWAPS = [
  ["Sucre, 2 c. à s. (24 g)", 96, "Pure Via Pâtisserie, même dose", 7],
  ["Crème fraîche 30 %, 2 c. à s.", 90, "Skyr, 2 c. à s.", 18],
  ["Mayonnaise, 1 c. à s.", 105, "Skyr + moutarde, 1 c. à s.", 10],
  ["Huile, 1 c. à s.", 90, "Spray, 6 pulvérisations", 27],
  ["Beurre de cacahuète, 1 c. à s.", 90, "Cacahuète en poudre réhydratée", 52],
  ["Miel, 1 c. à s.", 64, "Sirop Pure Via + fleur d'oranger", 4],
  ["Mozzarella classique, 50 g", 125, "Mozzarella light, 50 g", 83],
  ["Chocolat noir 70 %, 10 g", 57, "Cacao maigre, 5 g", 17],
];
const GESTURES = [
  ["3 s", "Tremper court", "3 à 5 secondes dans l'eau tiède. La feuille doit rester ferme : elle finit de ramollir sur le plan de travail. Trop trempée, elle se déchire."],
  ["×2", "Doubler pour cuire", "Pour pizza, wrap, tacos ou chaussons, superpose deux feuilles mouillées : elles se soudent et tiennent à la cuisson."],
  ["≈", "Planche humide", "Travaille sur une planche en bois ou un torchon humide, jamais sur une assiette sèche : la feuille colle et se déchire."],
  ["200°", "Air fryer, l'arme absolue", "190 à 200 °C, une fine vaporisation d'huile, 8 à 14 min en retournant. Les nems et bourek croustillent comme frits."],
  ["40 s", "Micro-ondes soufflé", "Une feuille sèche au micro-ondes 30 à 40 s gonfle en galette soufflée : chips, coupelles et nids en un instant."],
  ["✂", "Ciseaux sur feuille sèche", "Coupe toujours la feuille sèche : lanières pour nouilles et konafa, triangles pour chips, demi-lunes pour samoussas."],
  ["24 h", "Conserver", "Rouleaux frais : 24 h au frigo sous un torchon humide, sans se toucher. Bourek et nems crus : se congèlent à plat puis en sac."],
];
function renderGuide() {
  const maxW = Math.max(...WRAPS.map(w => w[1]));
  $("#guideBox").innerHTML = `
  <div class="g-sec" style="margin-top:8px"><h3>La feuille, version honnête</h3>
    <p>Une feuille de riz, c'est du riz déshydraté : environ 340 kcal pour 100 g, comme des pâtes sèches. Ce qui la rend légère, c'est sa finesse : 8 à 13 g la feuille de 22 cm, soit 30 à 45 kcal. Les recettes comptent 10 g, soit 34 kcal. Pèse un paquet une fois (poids ÷ nombre de feuilles) pour connaître ta marque.</p>
    <div class="panel" style="margin-top:14px"><div class="eyebrow" style="margin-bottom:6px">kcal par « enveloppe » · ordres de grandeur selon les marques</div><div class="bars">
      ${WRAPS.map(([l, v, me]) => `<div class="bar-row ${me ? "me" : ""}"><span>${l}</span><div class="bar-track"><div class="bar-fill" style="width:${(v / maxW * 100).toFixed(1)}%"></div></div><span class="v">${me ? "" : "≈ "}${v} kcal</span></div>`).join("")}
    </div></div></div>
  <div class="g-sec"><h3>Les gestes qui changent tout</h3><div class="guide-grid">
    ${GESTURES.map(([ic, h, p]) => `<div class="panel gesture"><div class="ic">${ic}</div><div><h4>${h}</h4><p>${p}</p></div></div>`).join("")}</div></div>
  <div class="g-sec"><h3>Pure Via Pâtisserie, ton sucre</h3><div class="callout">
    <h4>Il remplace le sucre dans toutes les recettes de l'app.</h4>
    <p>Composition : érythritol, sorbitol, gomme d'acacia et glycosides de stéviol (stévia). Environ 30 kcal pour 100 g selon la marque, contre 400 pour le sucre. Il se dose comme le sucre, cuillère pour cuillère. Comme tous les polyols, à forte dose il peut avoir un effet laxatif : reste sur des portions dessert. Pour saupoudrer, la marque fait aussi une « Alternative au sucre glace ».</p></div></div>
  <div class="g-sec" id="installer"><h3>Mets-le sur ton écran d'accueil</h3><p>Il s'ouvre alors comme une appli, en plein écran, et marche sans réseau une fois visité (pratique au sous-sol de Tang Frères).</p>
    <div class="guide-grid" style="margin-top:14px">
      <div class="panel"><h4 style="margin:0">iPhone (Safari)</h4><ol class="steps-sm"><li>Ouvre le site dans Safari.</li><li>Touche le bouton Partager (le carré avec la flèche vers le haut).</li><li>Choisis « Sur l'écran d'accueil », puis « Ajouter ».</li></ol></div>
      <div class="panel"><h4 style="margin:0">Android (Chrome)</h4><ol class="steps-sm"><li>Ouvre le site dans Chrome.</li><li>Touche le menu ⋮ en haut à droite.</li><li>Choisis « Installer l'application » ou « Ajouter à l'écran d'accueil ».</li></ol>
        <button class="btn" id="installBtn" type="button" hidden style="margin-top:12px">Installer maintenant</button></div>
    </div></div>
  <div class="g-sec"><h3>Les échanges light</h3><p>Les remplacements utilisés dans les recettes, à portion égale.</p>
    <div class="panel" style="margin-top:12px">${SWAPS.map(([a, ka, b, kb]) => `<div class="swap"><span class="from">${a}<span class="kc">${ka} kcal</span></span><span class="arrow">−${Math.round((1 - kb / ka) * 100)} %</span><span class="to">${b}<span class="kc">${kb} kcal</span></span></div>`).join("")}</div></div>
  <div class="g-sec"><h3>Où acheter à Paris</h3><p>Les feuilles de riz se trouvent partout, mais les épiceries asiatiques ont les meilleurs prix et toutes les tailles. Horaires et adresses à revérifier avant de te déplacer.</p>
    <div class="guide-grid" style="margin-top:14px">${STORES.map((s, i) => `<div class="panel store"><span class="tag">${esc(s.tag)}</span><h4>${esc(s.n)}</h4>
      <div class="addr">${esc(s.a)}</div><div class="note">${esc(s.sub)}</div><p class="buy">${esc(s.buy)}</p>
      <div class="links">${s.noMap ? "" : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.n + " " + s.a)}" target="_blank" rel="noopener noreferrer">Itinéraire</a><button type="button" data-copy="${esc(s.a)}">Copier l'adresse</button>`}${s.web ? `<a href="${s.web}" target="_blank" rel="noopener noreferrer">Site</a>` : ""}</div></div>`).join("")}</div>
    <div class="guide-grid" style="margin-top:14px">${CHAINS.map(([h, p]) => `<div class="panel store"><h4>${esc(h)}</h4><p class="buy">${esc(p)}</p></div>`).join("")}</div></div>
  <p class="sources">Calories calculées à partir de valeurs moyennes (tables nutritionnelles et étiquettes courantes) : compte ± 10 %. Sources des adresses et produits :
    <a href="https://www.evous.fr/paris/13eme-arrondissement/Guide-Paris-13e/Faire-ses-courses-Paris-13e/Supermarches-Superettes-Epiceries-Paris-13e/Tang-Freres-Paris-13,1116379.html" target="_blank" rel="noopener noreferrer">eVous (Tang Frères)</a>,
    <a href="https://www.evous.fr/paris/Gastronomie/Ou-trouver-des-epiceries-et-supermarches-asiatiques-a-Paris,1174649.html" target="_blank" rel="noopener noreferrer">eVous (épiceries asiatiques)</a>,
    <a href="https://www.pariszigzag.fr/top-redac/epicerie-coreenne-paris/" target="_blank" rel="noopener noreferrer">Paris ZigZag (épiceries coréennes)</a>,
    <a href="https://www.pariszigzag.fr/secret/lieux-insolites/izrael-le-temple-de-lepice-a-paris" target="_blank" rel="noopener noreferrer">Paris ZigZag (Izraël)</a>,
    <a href="https://acceslibre.beta.gouv.fr/app/75-paris/a/cremerie-fromagerie/erp/mon-marche-le-magasin-paris-lecourbe/rpa_pdf" target="_blank" rel="noopener noreferrer">Acceslibre (Mon-marché Lecourbe)</a>,
    <a href="https://www.purevia.fr/products/pure-via-patisserie" target="_blank" rel="noopener noreferrer">Pure Via</a>,
    <a href="https://www.auchan.fr/pure-via-special-patisserie-edulcorant-d-origine-naturelle/pr-C1509349" target="_blank" rel="noopener noreferrer">Auchan</a>,
    <a href="https://www.fatsecret.fr/calories-nutrition/autour-du-riz/feuilles-de-riz/100g" target="_blank" rel="noopener noreferrer">fatsecret (feuilles de riz)</a>.</p>`;
}
$("#guideBox").addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copyText(b.dataset.copy, "Adresse copiée"); });

// ---------- onglets
const VIEWS = { recettes: "#v-recettes", frigo: "#v-frigo", semaine: "#v-semaine", courses: "#v-courses", guide: "#v-guide" };
const rendered = {};
let currentTab = "recettes";
function setHash(h, push) {
  try { if (location.hash !== h) history[push ? "pushState" : "replaceState"](push ? { sheet: 1 } : null, "", h); } catch (e) {}
}
function goTab(tab, opts) {
  if (!VIEWS[tab]) tab = "recettes";
  Object.entries(VIEWS).forEach(([k, sel]) => $(sel).hidden = k !== tab);
  $$("#tabs [data-tab]").forEach(b => b.dataset.tab === tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  if (tab === "frigo") { if (!rendered.frigo) { renderFridgePicker(); rendered.frigo = 1; } renderFridge(); }
  if (tab === "semaine") renderPlan();
  if (tab === "courses") renderCart();
  if (tab === "guide" && !rendered.guide) { renderGuide(); rendered.guide = 1; }
  store.set("tab", tab);
  currentTab = tab;
  if (!opts || !opts.keepHash) setHash("#" + tab, false);
  if (!opts || !opts.keepScroll) window.scrollTo({ top: 0 });
}
$$("#tabs [data-tab]").forEach(b => b.addEventListener("click", () => goTab(b.dataset.tab)));

// ---------- démarrage
renderChips(); refresh(); updateCartDot();
const featured = RECIPES.find(r => r.n === "Pizza de riz chakchouka & œuf coulant") || RECIPES[0];
showPick(featured, "Suggestion du jour");
function route(fromPop) {
  const h = (location.hash || "").replace("#", "");
  if (h.startsWith("recette-") && byId[h.slice(8)]) {
    if (!rendered.boot) goTab(store.get("tab", "recettes"), { keepHash: true });
    openRecipe(h.slice(8), { fromHash: true });
  } else {
    if (!$("#sheet").hidden) closeSheet(true);
    if (VIEWS[h]) { if (h !== currentTab || !rendered.boot) goTab(h, { keepHash: true, keepScroll: !!fromPop && h === currentTab }); }
    else if (!rendered.boot) goTab(store.get("tab", "recettes"));
  }
  rendered.boot = 1;
}
window.addEventListener("popstate", () => route(true));
window.addEventListener("hashchange", () => route(true));
route(false);
paintMe();
if (!ME) openWelcome(false);
else if (store.get("lastVisit", "") !== today()) { store.set("lastVisit", today()); track("visite"); }
flushTrack();

// mode hors ligne (service worker) : le site reste utilisable sans réseau une fois visité
const st = $("#status");
function setStatus(ok, txt) { st.classList.toggle("ok", ok); st.lastElementChild.textContent = txt; }
setStatus(false, navigator.onLine ? "En ligne" : "Hors ligne");
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  try {
    navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => setStatus(true, "Dispo hors ligne")).catch(() => {});
  } catch (e) {}
}
window.addEventListener("offline", () => setStatus(st.classList.contains("ok"), "Hors ligne"));
window.addEventListener("online", () => setStatus(st.classList.contains("ok"), st.classList.contains("ok") ? "Dispo hors ligne" : "En ligne"));

// installation sur Android / Chrome (sur iPhone : bouton Partager de Safari)
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; const b = $("#installBtn"); if (b) b.hidden = false; });
document.addEventListener("click", async e => {
  if (!e.target.closest("#installBtn") || !installEvt) return;
  installEvt.prompt(); try { await installEvt.userChoice; } catch (err) {} installEvt = null; e.target.closest("#installBtn").hidden = true;
});
})();

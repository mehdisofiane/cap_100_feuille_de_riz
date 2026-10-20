/* Illustrations procédurales : une assiette vue de dessus, dessinée à partir des vrais ingrédients de la recette. */
const ART = (() => {
  const GOLD = "url(#gGold)", GOLDL = "url(#gGoldL)", PAPER = "url(#gPaper)";
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const f1 = n => Math.round(n * 10) / 10;
  const isLight = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 215; };

  function blob(cx, cy, r, fill, R, extra = "") {
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, rr = r * (0.75 + R() * 0.45);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    let d = "";
    for (let i = 0; i < n; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % n];
      const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      d += i === 0 ? `M${f1(mx)} ${f1(my)}` : "";
      const p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` Q${f1(p2[0])} ${f1(p2[1])} ${f1((p2[0] + p3[0]) / 2)} ${f1((p2[1] + p3[1]) / 2)}`;
    }
    return `<path d="${d}Z" fill="${fill}" ${extra}/>`;
  }
  const cap = (x, y, w, h, rot, fill, extra = "") =>
    `<rect x="${f1(x - w / 2)}" y="${f1(y - h / 2)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(h / 2)}" fill="${fill}" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" ${extra}/>`;
  const leaf = (x, y, s, rot, col) =>
    `<path d="M0 0 Q${s} ${-s * 0.6} ${s * 2} 0 Q${s} ${s * 0.6} 0 0Z" fill="${col}" transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"/>`;
  function dots(R, n, cx, cy, rad, cols, rmin, rmax) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * rad;
      s += `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d)}" r="${f1(rmin + R() * (rmax - rmin))}" fill="${cols[i % cols.length]}"/>`;
    }
    return s;
  }
  const dust = (R, n, cx, cy, rad) => dots(R, n, cx, cy, rad, ["#ffffff"], 0.5, 1.3).replace(/<circle /g, '<circle opacity=".85" ');
  const bowlDip = (x, y, r, col, R, flecks) =>
    `<circle cx="${x}" cy="${y + 2}" r="${r + 2}" fill="var(--shadow)"/><circle cx="${x}" cy="${y}" r="${r + 2}" fill="var(--plate)" stroke="var(--plate-rim)" stroke-width="1.5"/>` +
    `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="${col}"/>` + (flecks ? dots(R, 6, x, y, r - 4, flecks, 0.6, 1.4) : "");
  const lemon = (x, y, rot) =>
    `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-12 0 A12 12 0 0 1 12 0Z" fill="#f7dd48"/><path d="M-9 0 A9 9 0 0 1 9 0Z" fill="#fbeb8c"/>` +
    `<path d="M0 0 L-6 -6 M0 0 L0 -9 M0 0 L6 -6" stroke="#f7dd48" stroke-width="1.2"/></g>`;

  function crimp(cx, cy, r, bumps, fill, stroke) {
    let d = "";
    for (let i = 0; i <= bumps; i++) {
      const a = (i / bumps) * Math.PI * 2, rr = i % 2 ? r : r - 3.5;
      d += (i ? " L" : "M") + f1(cx + Math.cos(a) * rr) + " " + f1(cy + Math.sin(a) * rr);
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
  function wavyCircle(cx, cy, r, waves, amp, fill, extra = "") {
    let d = "";
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2, rr = r + Math.sin(a * waves) * amp;
      d += (i ? " L" : "M") + f1(cx + Math.cos(a) * rr) + " " + f1(cy + Math.sin(a) * rr);
    }
    return `<path d="${d}Z" fill="${fill}" ${extra}/>`;
  }

  const S = {};
  // ---------- rouleaux frais
  S.roll = (R, c, uid, o) => {
    let s = `<g transform="rotate(-14 100 72)">`;
    for (let i = 0; i < 3; i++) {
      const y = 44 + i * 28, id = `${uid}c${i}`;
      s += `<clipPath id="${id}"><rect x="40" y="${y - 13}" width="120" height="26" rx="13"/></clipPath>`;
      s += `<rect x="41" y="${y - 10}" width="120" height="26" rx="13" fill="var(--shadow)"/>`;
      s += `<g clip-path="url(#${id})"><rect x="40" y="${y - 13}" width="120" height="26" fill="${o.base || "#f4efe1"}"/>`;
      for (let j = 0; j < 9; j++) {
        const col = c[j % c.length];
        s += blob(46 + j * 13 + R() * 6, y + (R() - 0.5) * 10, 6 + R() * 4, col, R);
      }
      if (o.leaf) for (let j = 0; j < 3; j++) s += leaf(50 + j * 34 + R() * 10, y - 4 + R() * 6, 6, R() * 60 - 30, o.leaf);
      s += `</g><rect x="40" y="${y - 13}" width="120" height="26" rx="13" fill="${o.skin || "#fbf7ec"}" opacity="${o.op || 0.5}"/>`;
      s += `<rect x="40" y="${y - 13}" width="120" height="26" rx="13" fill="url(#weave)" opacity=".8"/>`;
      s += `<rect x="40.5" y="${y - 12.5}" width="119" height="25" rx="12.5" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="1.2"/>`;
      s += `<path d="M48 ${y - 7} Q100 ${y - 11} 152 ${y - 7}" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    s += `</g>`;
    if (o.dust) s += dots(R, 40, 100, 72, 50, [o.dust], 0.5, 1.2);
    if (o.dip) s += bowlDip(160, 112, 12, o.dip, R);
    return s;
  };
  S.roll_sweet = (R, c, uid) => S.roll(R, c, uid, { op: 0.42 });
  S.roll_tiramisu = (R, c, uid) => S.roll(R, c.length ? c : ["#f8f8f4"], uid, { skin: "#c49a6c", op: 0.72, dust: "#4a2c16" });

  // ---------- croustillants dorés en boudins
  function sticks(R, n, w, h, spread, cx, cy, rot, fill, blister) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const y = cy + (i - (n - 1) / 2) * spread, x = cx + (R() - 0.5) * 8, r = rot + (R() - 0.5) * 8;
      s += cap(x + 1.5, y + 3, w, h, r, "var(--shadow)");
      s += cap(x, y, w, h, r, fill, `stroke="#b8732a" stroke-width="1" stroke-opacity=".5"`);
      if (blister) {
        let b = "";
        for (let j = 0; j < 9; j++) b += `<circle cx="${f1(x - w / 2 + 6 + R() * (w - 12))}" cy="${f1(y + (R() - 0.5) * (h - 6))}" r="${f1(0.8 + R() * 1.6)}" fill="#fbe7b2" opacity=".75"/>`;
        s += `<g transform="rotate(${f1(r)} ${f1(x)} ${f1(y)})">${b}</g>`;
      }
      s += `<g transform="rotate(${f1(r)} ${f1(x)} ${f1(y)})"><path d="M${f1(x - w / 2 + 8)} ${f1(y - h / 4)} L${f1(x + w / 2 - 8)} ${f1(y - h / 4)}" stroke="#fff3cf" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/></g>`;
    }
    return s;
  }
  S.nem = (R, c, uid) => leaf(30, 60, 22, 20, "#8cc65a") + leaf(36, 86, 18, -10, "#6fb043") +
    sticks(R, 4, 92, 21, 20, 104, 64, -18, GOLD, true) + leaf(140, 32, 6, 40, "#42a046") + leaf(150, 40, 5, -20, "#42a046") + bowlDip(156, 110, 12, "#5a2e14", R);
  S.nem_sweet = (R, c) => sticks(R, 3, 92, 22, 26, 98, 68, -16, GOLD, true) + dust(R, 60, 98, 68, 50) + c.slice(0, 2).map((col, i) => blob(158, 46 + i * 54, 9, col, R)).join("");
  S.cigar = (R, c) => sticks(R, 4, 104, 15, 18, 98, 70, 24, GOLD, true) + dots(R, 14, 100, 72, 46, ["#2d7a31", "#3f9442"], 0.8, 1.6) + lemon(156, 112, -30);
  S.cigar_sweet = (R, c) => sticks(R, 3, 98, 16, 22, 100, 70, -26, GOLD, true) + dust(R, 70, 100, 70, 48) +
    dots(R, 10, 100, 70, 44, c.length ? c : ["#e7cea5"], 1.2, 2.4);
  S.churros = (R, c, uid, o) => {
    let s = "";
    for (let i = 0; i < 5; i++) {
      const x = 74 + (i % 3) * 22, y = 50 + i * 11, r = -30 + R() * 20;
      s += cap(x + 1, y + 3, 82, 14, r, "var(--shadow)") + cap(x, y, 82, 14, r, GOLD);
      s += `<g transform="rotate(${f1(r)} ${x} ${y})">` + [-3, 0, 3].map(d => `<path d="M${x - 34} ${y + d} L${x + 34} ${y + d}" stroke="#a5621f" stroke-width=".8" opacity=".6"/>`).join("") + `</g>`;
    }
    return s + dots(R, 50, 96, 74, 46, ["#8c5424", "#ffffff"], 0.5, 1.2) + bowlDip(156, 106, 13, c[0] && !isLight(c[0]) ? c[0] : "#5c391a", R);
  };

  // ---------- pizza
  S.pizza = (R, c) => {
    let s = `<circle cx="101" cy="75" r="51" fill="var(--shadow)"/><circle cx="100" cy="72" r="51" fill="${GOLD}"/><circle cx="100" cy="72" r="45" fill="#f0c45a"/>`;
    const sauce = c.find(x => x === "#d13030") ? "#d84a32" : (c.find(x => x === "#fbfbf6") ? "#f6f2e6" : "#f2cf6e");
    s += blob(100, 72, 41, sauce, R);
    const tops = c.filter(x => x !== "#d13030" && x !== "#f6c544");
    for (let i = 0; i < 18; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 34, x = 100 + Math.cos(a) * d, y = 72 + Math.sin(a) * d;
      const col = tops[i % Math.max(tops.length, 1)] || "#fbf9f0";
      s += i % 3 === 0 ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 + R() * 3)}" fill="${col}"/>` : blob(x, y, 3 + R() * 4, col, R);
    }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI + 0.3; s += `<path d="M${f1(100 + Math.cos(a) * 50)} ${f1(72 + Math.sin(a) * 50)} L${f1(100 - Math.cos(a) * 50)} ${f1(72 - Math.sin(a) * 50)}" stroke="var(--plate)" stroke-width="1.6" opacity=".8"/>`; }
    return s;
  };

  // ---------- triangles, chaussons
  function tri(x, y, s, rot, fill) {
    const h = s * 0.87;
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M${-s / 2 + 2} ${h / 3 + 3} L${s / 2 + 2} ${h / 3 + 3} L2 ${-2 * h / 3 + 3}Z" fill="var(--shadow)"/>` +
      `<path d="M${-s / 2} ${h / 3} L${s / 2} ${h / 3} L0 ${-2 * h / 3}Z" fill="${fill}" stroke="#b8732a" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M${-s / 4} ${-h / 6} L${s / 4} ${h / 3}" stroke="#c88a3c" stroke-width="1" opacity=".7"/><path d="M${-s / 2 + 8} ${h / 3 - 4} L${s / 2 - 8} ${h / 3 - 4}" stroke="#fff3cf" stroke-width="1.4" opacity=".55"/></g>`;
  }
  S.triangle = (R) => tri(76, 62, 54, -12, GOLD) + tri(118, 56, 50, 18, GOLD) + tri(98, 98, 52, 184, GOLD) + lemon(154, 108, -20) + dots(R, 10, 100, 72, 40, ["#2d7a31"], 0.8, 1.5);
  S.triangle_sweet = (R, c) => tri(80, 64, 48, -10, GOLD) + tri(120, 62, 46, 20, GOLD) + tri(100, 98, 48, 182, GOLD) + dust(R, 60, 100, 76, 46) + dots(R, 12, 100, 76, 40, c.length ? c : ["#e7cea5"], 1, 2.2);
  function halfMoon(x, y, r, rot, fill, fork) {
    let s = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M${-r + 2} 3 A${r} ${r} 0 0 1 ${r + 2} 3Z" fill="var(--shadow)"/>` +
      `<path d="M${-r} 0 A${r} ${r} 0 0 1 ${r} 0Z" fill="${fill}" stroke="#b8732a" stroke-width="1.2"/>`;
    if (fork) for (let i = 1; i < 10; i++) { const a = Math.PI + (i / 10) * Math.PI; s += `<path d="M${f1(Math.cos(a) * (r - 1))} ${f1(Math.sin(a) * (r - 1))} L${f1(Math.cos(a) * (r - 6))} ${f1(Math.sin(a) * (r - 6))}" stroke="#a5621f" stroke-width="1.1" opacity=".7"/>`; }
    return s + `<path d="M${-r + 6} -2 L${r - 6} -2" stroke="#fff3cf" stroke-width="1.4" opacity=".5"/></g>`;
  }
  S.chausson = (R, c) => halfMoon(72, 74, 30, -20, GOLD, true) + halfMoon(126, 66, 30, 25, GOLD, true) + halfMoon(102, 108, 26, 180, GOLD, true) + dots(R, 8, 100, 72, 44, ["#2d7a31"], 0.8, 1.4);
  S.chausson_sweet = (R, c) => halfMoon(78, 70, 32, -18, GOLD, true) + halfMoon(124, 80, 32, 22, GOLD, true) + dust(R, 70, 100, 74, 48) + c.slice(0, 3).map((col, i) => blob(70 + i * 30, 112, 6, col, R)).join("");

  // ---------- raviolis, soupe
  function dumpling(x, y, r, rot, fill, tint) {
    let s = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M${-r + 2} 4 Q2 ${-r * 1.15 + 4} ${r + 2} 4Z" fill="var(--shadow)"/>`;
    s += `<path d="M${-r} 2 Q0 ${-r * 1.15} ${r} 2Z" fill="${tint}" opacity=".55"/><path d="M${-r} 2 Q0 ${-r * 1.15} ${r} 2Z" fill="${fill}" opacity=".78"/>`;
    s += `<path d="M${-r} 2 Q0 ${-r * 1.15} ${r} 2Z" fill="url(#weave)"/><path d="M${-r} 2 L${r} 2" stroke="#d99a45" stroke-width="3" stroke-linecap="round"/>`;
    for (let i = -2; i <= 2; i++) s += `<path d="M${i * r / 3.2} ${-r * 0.42} q2 ${r * 0.18} 0 ${r * 0.36}" stroke="#d8cdb0" stroke-width="1.2" fill="none"/>`;
    return s + `</g>`;
  }
  S.dumpling = (R, c) => {
    const t = c[0] || "#e7cea5";
    return dumpling(70, 60, 24, -15, PAPER, t) + dumpling(118, 52, 23, 12, PAPER, t) + dumpling(92, 92, 25, 4, PAPER, t) + dumpling(140, 88, 20, 30, PAPER, t) +
      bowlDip(52, 108, 11, "#5a2e14", R, ["#dfc389"]) + dots(R, 6, 116, 116, 10, ["#67ae49"], 1, 2);
  };
  S.soup = (R, c) => {
    let s = `<circle cx="101" cy="76" r="56" fill="var(--shadow)"/><circle cx="100" cy="72" r="56" fill="#2f4a3f"/><circle cx="100" cy="72" r="49" fill="#e4b95c"/><circle cx="92" cy="62" r="30" fill="#f2d48a" opacity=".45"/>`;
    s += dumpling(80, 64, 18, -20, PAPER, c[0] || "#e7cea5") + dumpling(116, 60, 17, 25, PAPER, c[0] || "#e7cea5") + dumpling(100, 92, 18, 5, PAPER, c[0] || "#e7cea5");
    for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = R() * 40; s += `<circle cx="${f1(100 + Math.cos(a) * d)}" cy="${f1(72 + Math.sin(a) * d)}" r="2.2" fill="none" stroke="#5aa43c" stroke-width="1.3"/>`; }
    return s + dots(R, 10, 100, 72, 42, ["#c4271b"], 0.6, 1.4);
  };

  // ---------- tacos, quesadilla, wrap
  S.taco = (R, c) => {
    let s = "";
    [[62, 70, -8], [100, 64, 4], [138, 72, 12]].forEach(([x, y, r]) => {
      s += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-22 -8 Q0 50 22 -8Z" fill="var(--shadow)" transform="translate(2 4)"/>`;
      for (let i = 0; i < 9; i++) s += blob(-16 + i * 4 + R() * 3, -10 + R() * 5, 4 + R() * 3, c[i % Math.max(c.length, 1)] || "#e44b3a", R);
      s += `<path d="M-22 -8 Q0 50 22 -8 Q0 30 -22 -8Z" fill="${GOLD}" stroke="#b8732a" stroke-width="1.2"/><path d="M-16 -2 Q0 34 16 -2" stroke="#fff3cf" stroke-width="1.5" fill="none" opacity=".6"/></g>`;
    });
    return s + lemon(150, 114, -15);
  };
  S.quesadilla = (R, c) => {
    let s = "";
    [[64, 70, -20], [104, 56, 30], [128, 98, 150]].forEach(([x, y, r]) => {
      s += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-2 4 L40 -14 A44 44 0 0 1 40 26Z" fill="var(--shadow)"/>`;
      for (let i = 0; i < 6; i++) s += blob(36 + R() * 6, -10 + i * 6, 3.5, c[i % Math.max(c.length, 1)] || "#f4d672", R);
      s += `<path d="M-4 0 L38 -18 A44 44 0 0 1 38 22Z" fill="${GOLD}" stroke="#b8732a" stroke-width="1.2"/>`;
      for (let k = 0; k < 3; k++) s += `<path d="M${6 + k * 10} ${-10 + k} L${14 + k * 10} ${12 - k}" stroke="#9a5a1c" stroke-width="2" opacity=".45" stroke-linecap="round"/>`;
      s += `</g>`;
    });
    return s;
  };
  function swirl(cx, cy, r, c, R) {
    let s = `<circle cx="${cx + 1.5}" cy="${cy + 3}" r="${r}" fill="var(--shadow)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${GOLD}" stroke="#b8732a" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="#f6efd9"/>`;
    for (let i = 0; i < 10; i++) s += blob(cx + (R() - 0.5) * (r - 10) * 1.4, cy + (R() - 0.5) * (r - 10) * 1.4, 4 + R() * 4, c[i % Math.max(c.length, 1)] || "#e44b3a", R);
    s += `<path d="M${cx} ${cy} m-${r - 6} 0 a${r - 6} ${r - 6} 0 1 1 ${2 * (r - 6)} 0" fill="none" stroke="#f3e7c4" stroke-width="2" opacity=".8"/>`;
    return s;
  }
  S.wrap = (R, c) => cap(98, 70, 110, 44, -24, "var(--shadow)") + cap(96, 66, 110, 44, -24, GOLD) + swirl(66, 84, 24, c, R) + swirl(132, 54, 24, c, R);

  // ---------- plats au four
  S.lasagna = (R, c) => {
    let s = `<rect x="38" y="30" width="128" height="88" rx="14" fill="var(--shadow)"/><rect x="34" y="26" width="128" height="88" rx="14" fill="#7e4a2b"/><rect x="42" y="34" width="112" height="72" rx="8" fill="#d0582f"/>`;
    for (let i = 0; i < 22; i++) s += blob(48 + R() * 100, 40 + R() * 60, 4 + R() * 6, i % 3 ? "#f3cf6a" : "#fbf2d6", R);
    s += dots(R, 12, 98, 70, 40, c.filter(x => !isLight(x)).slice(0, 3).concat(["#378d3b"]), 1, 2.2);
    s += `<g><rect x="44" y="76" width="34" height="28" fill="#f6efd9"/>` + [0, 1, 2, 3].map(i => `<rect x="44" y="${78 + i * 7}" width="34" height="3" fill="${i % 2 ? "#c8452a" : c[0] || "#c8452a"}"/>`).join("") + `</g>`;
    return s;
  };
  S.cannelloni = (R, c) => {
    let s = `<rect x="38" y="30" width="128" height="88" rx="14" fill="var(--shadow)"/><rect x="34" y="26" width="128" height="88" rx="14" fill="#6b4a2f"/><rect x="42" y="34" width="112" height="72" rx="8" fill="#c8452a"/>`;
    for (let i = 0; i < 3; i++) { const y = 48 + i * 22; s += cap(98, y, 100, 18, 0, "#f6efd9") + `<ellipse cx="49" cy="${y}" rx="4" ry="8" fill="${c[i % Math.max(c.length, 1)] || "#2d7a31"}"/><ellipse cx="147" cy="${y}" rx="4" ry="8" fill="${c[(i + 1) % Math.max(c.length, 1)] || "#2d7a31"}"/>`; s += blob(98, y + 2, 16, "#d84a32", R, 'opacity=".9"'); }
    for (let i = 0; i < 12; i++) s += blob(52 + R() * 92, 40 + R() * 60, 3 + R() * 4, "#fbf2d6", R);
    return s + dots(R, 8, 98, 70, 40, ["#378d3b"], 1, 2);
  };
  S.tart = (R, c, uid, o = {}) => {
    let s = `<circle cx="102" cy="76" r="52" fill="var(--shadow)"/>` + crimp(100, 72, 52, 40, GOLD, "#b8732a");
    s += `<circle cx="100" cy="72" r="42" fill="${o.fill || "#f2d27a"}"/>`;
    s += dots(R, o.n || 22, 100, 72, 34, o.cols || c, 2.5, 5);
    return s + `<circle cx="88" cy="58" r="16" fill="#fff" opacity=".12"/>`;
  };
  S.tart_sweet = (R, c, uid) => {
    let s = `<circle cx="80" cy="76" r="36" fill="var(--shadow)"/><circle cx="126" cy="70" r="36" fill="var(--shadow)"/>` + crimp(78, 72, 36, 30, GOLD, "#b8732a") + crimp(124, 66, 36, 30, GOLD, "#b8732a");
    [[78, 72], [124, 66]].forEach(([x, y]) => {
      s += `<circle cx="${x}" cy="${y}" r="28" fill="${c.find(isLight) || "#f6efd9"}"/>`;
      for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28; s += `<ellipse cx="${f1(x + Math.cos(a) * 16)}" cy="${f1(y + Math.sin(a) * 16)}" rx="9" ry="4.5" fill="${c.find(z => !isLight(z)) || "#c62a2a"}" transform="rotate(${f1(a * 57.3 + 90)} ${f1(x + Math.cos(a) * 16)} ${f1(y + Math.sin(a) * 16)})" opacity=".92"/>`; }
      s += `<circle cx="${x}" cy="${y}" r="6" fill="${c[1] || "#f7dd48"}"/>`;
    });
    return s + dust(R, 40, 100, 70, 52);
  };
  S.pastilla = (R, c, uid) => {
    let s = `<clipPath id="${uid}p"><circle cx="100" cy="72" r="44"/></clipPath>`;
    s += `<circle cx="102" cy="76" r="50" fill="var(--shadow)"/><circle cx="100" cy="72" r="50" fill="${GOLD}" stroke="#b8732a" stroke-width="1.4"/>`;
    s += `<circle cx="100" cy="72" r="44" fill="#fff8e6" opacity=".55"/>` + dust(R, 140, 100, 72, 42);
    let lines = "";
    for (let i = -3; i <= 3; i++) lines += `<path d="M${100 + i * 16 - 40} 28 L${100 + i * 16 + 40} 116" stroke="#8c5424" stroke-width="2" opacity=".75"/><path d="M${100 + i * 16 + 40} 28 L${100 + i * 16 - 40} 116" stroke="#8c5424" stroke-width="2" opacity=".75"/>`;
    return s + `<g clip-path="url(#${uid}p)">${lines}</g>`;
  };
  S.spiral = (R) => {
    let d = "M100 72", a = 0, r = 2;
    while (r < 46) { a += 0.25; r += 0.62; d += ` L${f1(100 + Math.cos(a) * r)} ${f1(72 + Math.sin(a) * r)}`; }
    return `<circle cx="102" cy="76" r="50" fill="var(--shadow)"/><path d="${d}" fill="none" stroke="#b8732a" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${GOLD}" stroke-width="11" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#fff3cf" stroke-width="2" stroke-linecap="round" opacity=".5"/>` + dots(R, 40, 100, 72, 44, ["#f7f0da"], 0.8, 1.4);
  };

  // ---------- poêle
  S.crepe = (R, c, uid, o = {}) => {
    let s = "";
    [50, 88].forEach((y, i) => {
      s += cap(102, y + 4, 118, 30, -6, "var(--shadow)") + cap(100, y, 118, 30, -6, o.fill || "#f0c75e", `stroke="#c9902f" stroke-width="1.2"`);
      s += `<g transform="rotate(-6 100 ${y})"><ellipse cx="44" cy="${y}" rx="7" ry="13" fill="${c[i % Math.max(c.length, 1)] || "#2d7a31"}"/><ellipse cx="44" cy="${y}" rx="7" ry="13" fill="none" stroke="#e1aa45" stroke-width="3"/>` +
        `<path d="M58 ${y - 6} L148 ${y - 6}" stroke="#fff3cf" stroke-width="2" opacity=".55" stroke-linecap="round"/>` + [70, 96, 122].map(x => `<circle cx="${x}" cy="${y + 4}" r="3" fill="#c98b2f" opacity=".35"/>`).join("") + `</g>`;
    });
    if (o.sweet) s += `<path d="M40 70 C70 40 90 110 120 70 S160 60 165 80" stroke="${c.find(x => !isLight(x)) || "#5c391a"}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>` + dust(R, 40, 100, 70, 52) + c.slice(0, 3).map((col, i) => blob(60 + i * 40, 120, 6, col, R)).join("");
    return s;
  };
  S.crepe_sweet = (R, c, uid) => S.crepe(R, c, uid, { sweet: true, fill: "#e9b65a" });
  S.galette = (R, c) => {
    let s = `<g transform="rotate(45 100 72)"><rect x="56" y="30" width="88" height="88" rx="6" fill="var(--shadow)" transform="translate(3 3)"/><rect x="56" y="28" width="88" height="88" rx="6" fill="${GOLD}" stroke="#b8732a" stroke-width="1.3"/></g>`;
    s += `<rect x="78" y="50" width="44" height="44" rx="4" fill="#f6efd9"/>` + dots(R, 10, 100, 72, 18, c.length ? c : ["#f6c544"], 2.5, 4.5);
    if (c.includes("#f6c544")) s += `<circle cx="100" cy="72" r="9" fill="#ffffff"/><circle cx="100" cy="72" r="5.5" fill="#f6b21f"/>`;
    return s + `<path d="M58 72 L100 30 L142 72 L100 114Z" fill="none" stroke="#c88a3c" stroke-width="1" opacity=".6"/>`;
  };
  S.mhajeb = (R, c, uid, o = {}) => {
    let s = "";
    [[76, 66, -10], [124, 80, 14]].forEach(([x, y, r]) => {
      s += `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-28" y="-26" width="56" height="56" rx="5" fill="var(--shadow)"/><rect x="-30" y="-30" width="60" height="60" rx="5" fill="${GOLD}" stroke="#b8732a" stroke-width="1.2"/>`;
      s += `<path d="M-30 -30 L0 -4 L30 -30 M-30 30 L0 4 L30 30" stroke="#c88a3c" stroke-width="1.2" fill="none" opacity=".7"/>`;
      if (!o.sweet) s += `<path d="M-6 -3 L6 -3 L0 4Z" fill="${c[0] || "#e44b3a"}"/>`;
      s += [[-14, -12], [10, 14], [16, -16]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3" fill="#a8641f" opacity=".35"/>`).join("") + `</g>`;
    });
    if (o.sweet) s += dots(R, 30, 100, 72, 50, ["#e7d8ae", "#fff7d6"], 0.7, 1.4);
    return s;
  };

  // ---------- coréen, nouilles, tenders
  S.tteok = (R, c) => {
    let s = `<circle cx="101" cy="76" r="54" fill="var(--shadow)"/>` + blob(100, 72, 50, "#c8321f", R) + blob(96, 68, 36, "#de4b2a", R, 'opacity=".75"');
    for (let i = 0; i < 13; i++) { const a = R() * 6.28, d = Math.sqrt(R()) * 36; s += cap(100 + Math.cos(a) * d, 72 + Math.sin(a) * d, 24, 11, R() * 180, "#f8eadb", `stroke="#e8a07a" stroke-width="1"`); }
    if (c.includes("#f6c544")) s += `<ellipse cx="120" cy="58" rx="13" ry="10" fill="#fff"/><circle cx="120" cy="58" r="6" fill="#f6b21f"/>`;
    if (c.includes("#fbf9f0")) for (let i = 0; i < 6; i++) s += blob(80 + R() * 40, 56 + R() * 30, 6, "#fbf2d6", R);
    return s + dots(R, 14, 100, 72, 44, ["#67ae49"], 1.3, 2.4) + dots(R, 16, 100, 72, 44, ["#f4ecd4"], 0.6, 1);
  };
  S.noodles = (R, c) => {
    let s = `<circle cx="101" cy="76" r="56" fill="var(--shadow)"/><circle cx="100" cy="72" r="56" fill="#24342d"/><circle cx="100" cy="72" r="48" fill="#d3a455"/>`;
    for (let i = 0; i < 16; i++) {
      const y = 36 + i * 4.8, x0 = 100 - Math.sqrt(Math.max(0, 46 * 46 - (y - 72) ** 2)) + 4, x1 = 200 - x0;
      let d = `M${f1(x0)} ${f1(y)}`; for (let x = x0; x < x1; x += 8) d += ` Q${f1(x + 4)} ${f1(y + (R() - 0.5) * 8)} ${f1(Math.min(x + 8, x1))} ${f1(y + (R() - 0.5) * 3)}`;
      s += `<path d="${d}" stroke="#f6eedb" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".95"/>`;
    }
    for (let i = 0; i < 9; i++) s += blob(70 + R() * 60, 50 + R() * 44, 5 + R() * 3, c[i % Math.max(c.length, 1)] || "#f2896a", R);
    return s + lemon(140, 104, -40) + dots(R, 10, 100, 72, 40, ["#67ae49"], 1, 2);
  };
  S.tender = (R, c) => {
    let s = "";
    for (let i = 0; i < 6; i++) { const x = 58 + (i % 3) * 32 + R() * 6, y = 52 + Math.floor(i / 3) * 34 + R() * 6; s += blob(x + 2, y + 3, 14, "var(--shadow)", R) + blob(x, y, 14, GOLD, R, 'stroke="#b8732a" stroke-width="1"') + dots(R, 5, x, y, 9, ["#fbe7b2"], 0.8, 1.8); }
    return s + bowlDip(160, 106, 13, "#f8f8f4", R, ["#548a2f", "#c0382b"]) + lemon(164, 44, 30);
  };
  S.waffle = (R, c, uid, o = {}) => {
    let s = "";
    [[74, 66, -8], [126, 78, 10]].forEach(([x, y, r]) => {
      s += `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-30" y="-27" width="60" height="60" rx="10" fill="var(--shadow)"/><rect x="-32" y="-30" width="64" height="60" rx="10" fill="${GOLD}" stroke="#b8732a" stroke-width="1.2"/>`;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s += `<rect x="${-26 + i * 13.5}" y="${-24 + j * 12.8}" width="9" height="8.5" rx="2" fill="#b8732a" opacity=".38"/>`;
      s += `</g>`;
    });
    if (o.sweet) s += dust(R, 50, 100, 72, 50) + c.filter(x => !isLight(x)).slice(0, 3).map((col, i) => blob(60 + i * 36, 116, 6, col, R)).join("");
    else s += c.slice(0, 2).map((col, i) => blob(70 + i * 56, 64 + i * 12, 7, col, R, 'opacity=".9"')).join("");
    return s;
  };
  S.waffle_sweet = (R, c, uid) => S.waffle(R, c, uid, { sweet: true });

  // ---------- coupelles, chips, apéro
  S.bowl = (R, c, uid, o = {}) => {
    let s = "";
    [[72, 70, 30], [130, 74, 28]].forEach(([x, y, r]) => {
      s += wavyCircle(x + 2, y + 4, r, 9, 3, "var(--shadow)") + wavyCircle(x, y, r, 9, 3.2, o.shell || "#f7f0dc", 'stroke="#e2c58a" stroke-width="1.3"') + wavyCircle(x, y, r, 9, 3.2, "url(#weave)");
      s += `<circle cx="${x}" cy="${y}" r="${r - 8}" fill="#efe3c3" opacity=".6"/>`;
      for (let i = 0; i < 10; i++) s += blob(x + (R() - 0.5) * r * 1.1, y + (R() - 0.5) * r * 1.1, 4 + R() * 3, c[i % Math.max(c.length, 1)] || "#9bcb63", R);
      if (!o.sweet) s += leaf(x - 8, y - 6, 5, R() * 90, "#42a046");
    });
    if (o.sweet) s += dust(R, 30, 100, 72, 50);
    return s;
  };
  S.bowl_sweet = (R, c, uid) => S.bowl(R, c, uid, { sweet: true });
  S.chips = (R, c, uid, o = {}) => {
    let s = "";
    for (let i = 0; i < 11; i++) {
      const x = 52 + R() * 84, y = 40 + R() * 66, sz = 14 + R() * 8, rot = R() * 360;
      s += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><path d="M${-sz} ${sz * 0.5} Q0 ${sz * 0.9} ${sz} ${sz * 0.5} Q${sz * 0.3} ${-sz * 0.2} 0 ${-sz} Q${-sz * 0.4} ${-sz * 0.2} ${-sz} ${sz * 0.5}Z" fill="var(--shadow)" transform="translate(1.5 2.5)"/>` +
        `<path d="M${-sz} ${sz * 0.5} Q0 ${sz * 0.9} ${sz} ${sz * 0.5} Q${sz * 0.3} ${-sz * 0.2} 0 ${-sz} Q${-sz * 0.4} ${-sz * 0.2} ${-sz} ${sz * 0.5}Z" fill="${o.fill || "#faf3de"}" stroke="#e3c98f" stroke-width="1"/>` +
        dots(R, 5, 0, 0, sz * 0.5, [o.acc, "#ffffff"], 0.5, 1.1) + `</g>`;
    }
    return s + (o.sweet ? "" : bowlDip(160, 106, 14, c[0] && isLight(c[0]) ? c[0] : "#f8f8f4", R, [o.acc]));
  };
  S.chips_sweet = (R, c, uid, o) => {
    let s = "";
    for (let i = 0; i < 7; i++) {
      const x = 56 + (i % 4) * 30 + R() * 8, y = 50 + Math.floor(i / 4) * 40 + R() * 8, r = R() * 40 - 20;
      s += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(r)})"><rect x="-15" y="-11" width="32" height="24" rx="6" fill="var(--shadow)"/><rect x="-16" y="-12" width="32" height="24" rx="6" fill="${GOLDL}" stroke="#d9a650" stroke-width="1"/><rect x="-2" y="-6" width="4" height="12" rx="2" fill="var(--plate)"/></g>`;
    }
    return s + dust(R, 70, 100, 72, 52);
  };
  S.bacon = (R) => {
    let s = "";
    for (let i = 0; i < 5; i++) {
      const y = 40 + i * 16; let d = `M44 ${y}`;
      for (let x = 44; x < 156; x += 14) d += ` Q${x + 7} ${y + (i % 2 ? 7 : -7)} ${x + 14} ${y}`;
      s += `<path d="${d}" transform="translate(1.5 3)" stroke="var(--shadow)" stroke-width="10" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#a4472a" stroke-width="10" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#e39a68" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
    }
    return s;
  };
  S.maki = (R, c) => {
    let s = "";
    for (let i = 0; i < 8; i++) {
      const x = 58 + (i % 4) * 26, y = 54 + Math.floor(i / 4) * 30 + (i % 2) * 3;
      s += `<circle cx="${x + 1.5}" cy="${y + 3}" r="13" fill="var(--shadow)"/><circle cx="${x}" cy="${y}" r="13" fill="#1e3a2c"/><circle cx="${x}" cy="${y}" r="10.5" fill="#f4eee0"/><circle cx="${x}" cy="${y}" r="10.5" fill="url(#weave)"/>`;
      s += blob(x - 3, y - 2, 3.6, c[0] || "#f2895a", R) + blob(x + 3, y + 2, 3.2, c[1] || "#7caf66", R) + blob(x + 2, y - 4, 2.6, c[2] || "#89c13f", R);
    }
    return s + bowlDip(164, 112, 11, "#3d2413", R) + blob(30, 112, 8, "#f2a3a8", R) + leaf(26, 96, 6, 20, "#79b043");
  };

  // ---------- douceurs
  S.mochi = (R, c) => {
    let s = "";
    [[66, 64], [118, 58], [96, 102]].forEach(([x, y], i) => {
      s += `<ellipse cx="${x + 2}" cy="${y + 6}" rx="22" ry="17" fill="var(--shadow)"/><ellipse cx="${x}" cy="${y}" rx="22" ry="19" fill="${c[i % Math.max(c.length, 1)] || "#f8f8f4"}" opacity=".9"/>`;
      s += `<ellipse cx="${x}" cy="${y}" rx="22" ry="19" fill="#fbf8f0" opacity=".66"/><ellipse cx="${x}" cy="${y}" rx="22" ry="19" fill="url(#weave)" opacity=".7"/><ellipse cx="${x - 7}" cy="${y - 7}" rx="8" ry="4" fill="#fff" opacity=".7"/>`;
    });
    s += `<path d="M138 96 A16 16 0 0 1 170 96Z" fill="#fbf8f0"/><path d="M142 96 A12 12 0 0 1 166 96Z" fill="#ffffff"/><circle cx="154" cy="91" r="6" fill="${c[0] || "#e3384f"}"/>`;
    return s + dust(R, 40, 100, 74, 52);
  };
  S.baklava = (R, c) => {
    let s = "";
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      const x = 62 + col * 38 + (row % 2) * 19 - 8, y = 40 + row * 30;
      const d = `M${x} ${y - 16} L${x + 18} ${y} L${x} ${y + 16} L${x - 18} ${y}Z`;
      s += `<path d="${d}" fill="var(--shadow)" transform="translate(1.5 3)"/><path d="${d}" fill="${GOLD}" stroke="#a5621f" stroke-width="1.2"/>`;
      s += `<path d="M${x - 12} ${y} L${x + 12} ${y}" stroke="#c88a3c" stroke-width=".9"/><path d="M${x - 8} ${y + 4} L${x + 8} ${y + 4}" stroke="#c88a3c" stroke-width=".9"/>`;
      s += `<circle cx="${x}" cy="${y - 3}" r="3.4" fill="${c[0] || "#92c46f"}"/>`;
    }
    return s + `<path d="M50 30 Q100 20 150 32" stroke="#fff6dc" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>`;
  };
  S.konafa = (R, c) => {
    let s = `<circle cx="102" cy="76" r="52" fill="var(--shadow)"/><circle cx="100" cy="72" r="52" fill="#3a2a1e"/><circle cx="100" cy="72" r="46" fill="#d77a24"/>`;
    for (let i = 0; i < 140; i++) {
      const a = R() * 6.28, d = 8 + R() * 36, x = 100 + Math.cos(a) * d, y = 72 + Math.sin(a) * d, a2 = a + 1.4 + R();
      s += `<path d="M${f1(x)} ${f1(y)} q${f1(Math.cos(a2) * 7)} ${f1(Math.sin(a2) * 7)} ${f1(Math.cos(a2 + 0.6) * 13)} ${f1(Math.sin(a2 + 0.6) * 13)}" stroke="${["#f2b14d", "#e8952e", "#f7c870"][i % 3]}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
    }
    return s + blob(100, 72, 14, "#fbf3df", R) + dots(R, 22, 100, 72, 16, ["#92c46f", "#6fa04a"], 1, 2.2) + (c.includes("#ffb200") ? blob(100, 72, 7, "#ffb200", R) : "");
  };
  S.millefeuille = (R, c) => {
    const cream = c.find(x => x === "#5c391a" || x === "#3d2622") ? "#b98a5e" : (c.find(x => x === "#e3384f" || x === "#d71a5f") ? "#f7d7d9" : "#f8f1db");
    let s = `<rect x="52" y="44" width="100" height="64" rx="4" fill="var(--shadow)" transform="translate(3 4)"/>`;
    for (let i = 0; i < 3; i++) {
      const y = 98 - i * 26;
      s += `<path d="M50 ${y} q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 L150 ${y + 8} L50 ${y + 8}Z" fill="${GOLDL}" stroke="#d9a650" stroke-width="1"/>`;
      if (i < 2) { s += `<rect x="54" y="${y - 16}" width="92" height="16" rx="6" fill="${cream}"/>`; s += [62, 82, 102, 122, 138].map(x => `<circle cx="${x}" cy="${y - 2}" r="6" fill="${cream}"/>`).join(""); }
    }
    s += dust(R, 60, 100, 46, 40).replace(/cy="(\d+(\.\d+)?)"/g, (m, v) => `cy="${f1(40 + (parseFloat(v) % 8))}"`);
    return s + c.filter(x => !isLight(x)).slice(0, 2).map((col, i) => blob(160 + i * 10, 112 - i * 18, 7, col, R)).join("");
  };
  S.cannoli = (R, c) => {
    let s = "";
    [[70, 58, 28], [104, 78, 28], [136, 96, 28]].forEach(([x, y, r]) => {
      s += cap(x + 2, y + 4, 70, 22, r, "var(--shadow)") + cap(x, y, 70, 22, r, GOLD, `stroke="#a5621f" stroke-width="1"`);
      const dx = Math.cos(r / 57.3) * 35, dy = Math.sin(r / 57.3) * 35;
      [[x - dx, y - dy], [x + dx, y + dy]].forEach(([a, b]) => { s += `<circle cx="${f1(a)}" cy="${f1(b)}" r="10.5" fill="${c.find(isLight) || "#faf7ee"}"/>` + dots(R, 5, a, b, 7, [c.find(z => !isLight(z)) || "#92c46f"], 1, 1.8); });
      for (let k = 0; k < 8; k++) s += `<circle cx="${f1(x - dx * 0.7 + (dx * 1.4 * k) / 7)}" cy="${f1(y - dy * 0.7 + (dy * 1.4 * k) / 7 - 4)}" r="1.6" fill="#fbe7b2" opacity=".8"/>`;
    });
    return s + dust(R, 40, 100, 74, 52);
  };
  S.strudel = (R, c) => {
    let s = cap(92, 62, 128, 40, -8, "var(--shadow)", 'transform="translate(3 4) rotate(-8 92 62)"') + cap(90, 58, 128, 40, -8, GOLD, `stroke="#a5621f" stroke-width="1.2"`);
    s += `<g transform="rotate(-8 90 58)">` + [56, 80, 104, 128].map(x => `<path d="M${x} 46 L${x + 10} 70" stroke="#8c4f1a" stroke-width="2.4" stroke-linecap="round"/>`).join("") + `</g>`;
    [[66, 108], [110, 112]].forEach(([x, y]) => {
      s += `<circle cx="${x + 2}" cy="${y + 3}" r="17" fill="var(--shadow)"/><circle cx="${x}" cy="${y}" r="17" fill="${GOLD}"/><circle cx="${x}" cy="${y}" r="13" fill="${c[0] || "#e5c179"}"/>`;
      s += `<path d="M${x} ${y} m-9 0 a9 9 0 1 1 18 0 a6 6 0 1 1 -12 0 a3 3 0 1 1 6 0" stroke="#f6efd9" stroke-width="1.8" fill="none"/>`;
    });
    return s + dust(R, 50, 96, 60, 56);
  };

  function svg(r, uid) {
    const R = rng(r.id), c = (r.col || []).slice();
    const fn = S[r.sh] || S.roll;
    let body;
    try { body = fn(R, c, uid || ("u" + Math.floor(R() * 1e9)), { acc: r.acc, sweet: r.c === "sucre" }); }
    catch (e) { body = ""; }
    if (r.sh === "chips") body = S.chips(rng(r.id), c, uid, { acc: r.acc });
    if (r.sh === "chips_sweet") body = S.chips_sweet(rng(r.id), c, uid, { acc: r.acc });
    if (r.sh === "mhajeb" && r.c === "sucre") body = S.mhajeb(rng(r.id), c, uid, { sweet: true });
    if (r.sh === "churros" && r.n.startsWith("Chips")) body = S.chips(rng(r.id), c, uid, { acc: r.acc, sweet: true, fill: "#f3dfa8" }) + dust(rng(r.id + "d"), 60, 100, 72, 50) + bowlDip(156, 108, 13, "#f8f8f4", R);
    return `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration : ${r.n.replace(/"/g, "")}">` +
      `<circle cx="101" cy="76" r="66" fill="var(--shadow)"/><circle cx="100" cy="72" r="66" fill="var(--plate)"/><circle cx="100" cy="72" r="56" fill="none" stroke="var(--plate-rim)" stroke-width="1.5"/>` +
      body + `</svg>`;
  }

  // Disque de feuille de riz pour la roue
  function wheel(labels, colors) {
    const n = labels.length, cx = 150, cy = 150, r = 138;
    let s = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="wclip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>`;
    s += `<g clip-path="url(#wclip)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#efe7d2"/>`;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const p = (a) => `${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}`;
      s += `<path d="M${cx} ${cy} L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}Z" fill="${colors[i % colors.length]}" opacity=".5"/>`;
    }
    s += `<rect x="0" y="0" width="300" height="300" fill="url(#weaveBig)"/>`;
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * 360 - 90;
      s += `<g transform="rotate(${f1(a)} ${cx} ${cy})"><text x="${cx + r - 14}" y="${cy + 4}" text-anchor="end" class="wheel-label">${labels[i]}</text></g>`;
      const al = (i / n) * Math.PI * 2 - Math.PI / 2;
      s += `<path d="M${cx} ${cy} L${f1(cx + Math.cos(al) * r)} ${f1(cy + Math.sin(al) * r)}" stroke="#fffaf0" stroke-width="2" opacity=".9"/>`;
    }
    s += `</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#d8cba8" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="#fffaf0" stroke-width="1.5" opacity=".8"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="30" fill="#f7f1e2" stroke="#d8cba8" stroke-width="2"/></svg>`;
    return s;
  }
  return { svg, wheel };
})();

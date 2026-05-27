// 이 파일의 역할: 완성된 작품을 localStorage에 저장하고 갤러리/비교 모달로 보여주기

(function () {
  const STORAGE_KEY = "draw-toast.gallery.v1";
  const MAX_ITEMS = 30;
  const CARD_W = 110, CARD_H = 80;

  const ui = {
    modal: null,
    content: null,
    mode: "grid",          // grid | compare
    compareSlots: [null, null],
  };

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Gallery load failed:", e);
      return [];
    }
  }

  function saveAll(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Gallery save failed:", e);
      if (window.Notify) window.Notify("⚠ 저장 공간 부족 — 오래된 작품을 정리하세요.");
    }
  }

  function save(snapshot) {
    const items = loadAll();
    const entry = {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      nickname: snapshot.nickname || "익명",
      cards: snapshot.cards,
      arrows: snapshot.arrows,
      createdAt: new Date().toISOString(),
    };
    items.unshift(entry);
    while (items.length > MAX_ITEMS) items.pop();
    saveAll(items);
    if (window.Stats) window.Stats.refreshGalleryCount();
    return entry;
  }

  function remove(id) {
    let items = loadAll();
    items = items.filter((it) => it.id !== id);
    saveAll(items);
    if (window.Stats) window.Stats.refreshGalleryCount();
    if (ui.modal && !ui.modal.classList.contains("hidden")) render();
  }

  function clear() {
    if (!confirm("갤러리의 모든 작품을 삭제할까요?")) return;
    saveAll([]);
    if (window.Stats) window.Stats.refreshGalleryCount();
    render();
  }

  function count() {
    return loadAll().length;
  }

  // 카드/화살표 데이터로부터 미리보기 SVG 생성
  function buildPreviewSvg(item) {
    if (!item.cards || item.cards.length === 0) {
      return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><text x="200" y="150" text-anchor="middle" font-family="sans-serif" fill="#999">(빈 작품)</text></svg>`;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    item.cards.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + CARD_W);
      maxY = Math.max(maxY, c.y + CARD_H);
    });
    const pad = 30;
    const vbX = minX - pad, vbY = minY - pad;
    const vbW = (maxX - minX) + pad * 2;
    const vbH = (maxY - minY) + pad * 2;

    const arrowsSvg = (item.arrows || []).map((a) => {
      const from = item.cards.find((c) => c.uid === a.fromUid);
      const to = item.cards.find((c) => c.uid === a.toUid);
      if (!from || !to) return "";
      const fc = { x: from.x + CARD_W / 2, y: from.y + CARD_H / 2 };
      const tc = { x: to.x + CARD_W / 2, y: to.y + CARD_H / 2 };
      const start = edge(fc, tc, { w: CARD_W, h: CARD_H });
      const end = edge(tc, fc, { w: CARD_W, h: CARD_H });
      return `<path d="M${start.x},${start.y} L${end.x},${end.y}" fill="none" stroke="#8b5e34" stroke-width="2" marker-end="url(#ph-arrow)"/>`;
    }).join("");

    const cardsSvg = item.cards.map((c) => `
      <g transform="translate(${c.x},${c.y})">
        <rect width="${CARD_W}" height="${CARD_H}" rx="10" ry="10" fill="#fff" stroke="#e8d6b2" stroke-width="2"/>
        <text x="${CARD_W/2}" y="${CARD_H/2 - 6}" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Segoe UI Symbol, sans-serif">${escapeXml(c.icon)}</text>
        <text x="${CARD_W/2}" y="${CARD_H - 14}" text-anchor="middle" font-size="13" fill="#3a2e22" font-family="Yooshin, sans-serif">${escapeXml(c.label)}</text>
      </g>
    `).join("");

    return `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="ph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#8b5e34"/>
        </marker>
      </defs>
      <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#fdf1d9" opacity="0.3"/>
      ${arrowsSvg}
      ${cardsSvg}
    </svg>`;
  }

  function edge(center, target, box) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    if (dx === 0 && dy === 0) return center;
    const tx = box.w/2 / Math.abs(dx || 1);
    const ty = box.h/2 / Math.abs(dy || 1);
    const t = Math.min(tx, ty);
    return { x: center.x + dx * t, y: center.y + dy * t };
  }

  function escapeXml(s) {
    return String(s).replace(/[<>&"']/g, (c) => ({
      "<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"
    }[c]));
  }

  function open() {
    if (!ui.modal) ui.modal = document.getElementById("gallery-modal");
    if (!ui.content) ui.content = document.getElementById("gallery-content");
    ui.modal.classList.remove("hidden");
    ui.mode = "grid";
    ui.compareSlots = [null, null];
    setActiveModeBtn();
    render();
  }

  function close() {
    if (ui.modal) ui.modal.classList.add("hidden");
  }

  function setActiveModeBtn() {
    document.getElementById("gallery-mode-grid").classList.toggle("active", ui.mode === "grid");
    document.getElementById("gallery-mode-compare").classList.toggle("active", ui.mode === "compare");
  }

  function render() {
    const items = loadAll();
    if (items.length === 0) {
      ui.content.innerHTML = `<div class="gallery-empty">아직 저장된 작품이 없어요.<br/><br/>캔버스에서 토스트를 완성한 뒤 <b>✅ 완성!</b> 버튼을 눌러 추가하세요.</div>`;
      return;
    }
    if (ui.mode === "grid") renderGrid(items);
    else renderCompare(items);
  }

  function renderGrid(items) {
    ui.content.innerHTML = `<div class="gallery-grid">${items.map((it) => itemHtml(it)).join("")}</div>`;
    ui.content.querySelectorAll("[data-act]").forEach((btn) => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      btn.addEventListener("click", () => handleItemAction(id, act));
    });
  }

  function itemHtml(it) {
    const date = new Date(it.createdAt);
    const dateStr = `${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
    return `
      <div class="gallery-item" data-id="${it.id}">
        <div class="gallery-item-preview">${buildPreviewSvg(it)}</div>
        <div class="gallery-item-meta">
          <div class="name">${escapeXml(it.nickname)}</div>
          <div class="small">카드 ${it.cards.length} · 연결 ${(it.arrows||[]).length} · ${dateStr}</div>
        </div>
        <div class="gallery-item-actions">
          <button data-act="png" data-id="${it.id}">💾 PNG</button>
          <button data-act="compare" data-id="${it.id}">⚖ 비교담기</button>
          <button data-act="delete" data-id="${it.id}">🗑</button>
        </div>
      </div>
    `;
  }

  function handleItemAction(id, act) {
    const item = loadAll().find((it) => it.id === id);
    if (!item) return;
    if (act === "png") {
      if (window.Export) window.Export.snapshotToPng(item, `toast_${item.nickname}_${id}.png`);
    } else if (act === "delete") {
      if (confirm(`${item.nickname} 작품을 삭제할까요?`)) remove(id);
    } else if (act === "compare") {
      pushToCompare(item);
    }
  }

  function pushToCompare(item) {
    if (ui.compareSlots[0] && ui.compareSlots[0].id === item.id) { ui.compareSlots[0] = null; }
    else if (ui.compareSlots[1] && ui.compareSlots[1].id === item.id) { ui.compareSlots[1] = null; }
    else if (!ui.compareSlots[0]) ui.compareSlots[0] = item;
    else if (!ui.compareSlots[1]) ui.compareSlots[1] = item;
    else ui.compareSlots = [item, ui.compareSlots[0]];
    ui.mode = "compare";
    setActiveModeBtn();
    render();
  }

  function renderCompare(items) {
    const [a, b] = ui.compareSlots;
    const slotHtml = (slot, idx) => slot ? `
      <div class="compare-slot filled">
        <h4>${escapeXml(slot.nickname)} (카드 ${slot.cards.length} · 연결 ${(slot.arrows||[]).length})</h4>
        <div class="gallery-item-preview">${buildPreviewSvg(slot)}</div>
      </div>
    ` : `<div class="compare-slot">
        <h4>슬롯 ${idx+1}</h4>
        <p style="color:#7a6850;font-size:13px;margin-top:14px;">아래 작품 카드에서 <b>⚖ 비교담기</b>를 눌러 채우세요.</p>
      </div>`;

    const insight = (a && b) ? buildInsight(a, b) : `<div class="compare-insight">두 작품을 모두 선택하면 차이가 한눈에 보입니다.</div>`;

    const allItems = items.map((it) => itemHtml(it)).join("");
    ui.content.innerHTML = `
      <div class="gallery-compare">
        ${slotHtml(a, 0)}
        ${slotHtml(b, 1)}
        ${insight}
      </div>
      <h3 style="margin:18px 0 10px;color:#8b5e34;">📚 전체 작품</h3>
      <div class="gallery-grid">${allItems}</div>
    `;
    ui.content.querySelectorAll("[data-act]").forEach((btn) => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      btn.addEventListener("click", () => handleItemAction(id, act));
    });
  }

  function buildInsight(a, b) {
    const aCats = catSet(a);
    const bCats = catSet(b);
    const aOnly = [...aCats].filter((c) => !bCats.has(c));
    const bOnly = [...bCats].filter((c) => !aCats.has(c));
    const diffCount = Math.abs(a.cards.length - b.cards.length);
    const bigger = a.cards.length > b.cards.length ? a.nickname : b.nickname;

    const lines = [
      `🤯 같은 토스트인데 이렇게 다른 생각! 카드 수 차이 <b>${diffCount}장</b> — ${bigger}가 더 넓게 펼쳤어요.`,
    ];
    if (aOnly.length) lines.push(`<b>${escapeXml(a.nickname)}만 쓴 영역:</b> ${aOnly.map(catLabel).join(", ")}`);
    if (bOnly.length) lines.push(`<b>${escapeXml(b.nickname)}만 쓴 영역:</b> ${bOnly.map(catLabel).join(", ")}`);
    if (aOnly.length === 0 && bOnly.length === 0) lines.push("두 분 모두 비슷한 카테고리에 집중했네요. 그래도 카드 종류와 연결은 다를 거예요!");
    return `<div class="compare-insight">${lines.join("<br/>")}</div>`;
  }

  function catSet(item) {
    const set = new Set();
    item.cards.forEach((c) => {
      const def = (window.CARDS || []).find((d) => d.id === c.cardId);
      if (def) set.add(def.cat);
    });
    return set;
  }

  function catLabel(catId) {
    const cat = (window.CARD_CATEGORIES || []).find((c) => c.id === catId);
    return cat ? cat.label : catId;
  }

  function init() {
    document.getElementById("gallery-close").addEventListener("click", close);
    document.getElementById("gallery-mode-grid").addEventListener("click", () => { ui.mode = "grid"; setActiveModeBtn(); render(); });
    document.getElementById("gallery-mode-compare").addEventListener("click", () => { ui.mode = "compare"; setActiveModeBtn(); render(); });
    document.getElementById("gallery-clear").addEventListener("click", clear);
    document.getElementById("gallery-export-all").addEventListener("click", () => {
      if (window.Export) window.Export.allToPng();
    });
  }

  window.Gallery = { init, open, close, save, remove, clear, count, loadAll, buildPreviewSvg };
})();

// 이 파일의 역할: SVG 캔버스에 카드 추가/드래그/선택/삭제 + 상태 관리(중앙 저장소 역할)

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const CARD_W = 110;
  const CARD_H = 80;

  const state = {
    cards: [],          // { uid, cardId, icon, label, x, y }
    arrows: [],         // { uid, fromUid, toUid }  (arrows.js에서 관리, 여기선 보관만)
    nextUid: 1,
    selectedUid: null,
    drag: null,         // { uid, startX, startY, offsetX, offsetY, moved }
    connectMode: false,
    connectSource: null,
  };

  function el(tag, attrs = {}) {
    const e = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function getSvg() { return document.getElementById("canvas"); }
  function getLayer() { return document.getElementById("cards-layer"); }

  function svgPoint(evt) {
    const svg = getSvg();
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: evt.clientX, y: evt.clientY };
    const tr = pt.matrixTransform(ctm.inverse());
    return { x: tr.x, y: tr.y };
  }

  function addCard(cardDef) {
    const svg = getSvg();
    const rect = svg.getBoundingClientRect();
    // 중앙 부근에 약간 랜덤 오프셋
    const cx = rect.width / 2 - CARD_W / 2 + (Math.random() * 80 - 40);
    const cy = rect.height / 2 - CARD_H / 2 + (Math.random() * 80 - 40);

    const card = {
      uid: state.nextUid++,
      cardId: cardDef.id,
      icon: cardDef.icon,
      label: cardDef.label,
      x: cx,
      y: cy,
    };
    state.cards.push(card);
    renderCard(card);
    onChanged();
  }

  function renderCard(card) {
    const g = el("g", {
      class: "card-node",
      transform: `translate(${card.x},${card.y})`,
      "data-uid": card.uid,
    });
    g.appendChild(el("rect", { width: CARD_W, height: CARD_H, rx: 10, ry: 10 }));
    const iconText = el("text", {
      class: "card-icon",
      x: CARD_W / 2,
      y: CARD_H / 2 - 6,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    iconText.textContent = card.icon;
    g.appendChild(iconText);
    const labelText = el("text", {
      class: "card-label",
      x: CARD_W / 2,
      y: CARD_H - 14,
      "text-anchor": "middle",
    });
    labelText.textContent = card.label;
    g.appendChild(labelText);

    g.addEventListener("mousedown", (e) => onCardMouseDown(e, card.uid));
    g.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (window.Labels) window.Labels.startEdit(card.uid);
    });
    getLayer().appendChild(g);
  }

  function findNode(uid) {
    return getLayer().querySelector(`[data-uid="${uid}"]`);
  }

  function onCardMouseDown(e, uid) {
    e.stopPropagation();
    if (state.connectMode) {
      handleConnectClick(uid);
      return;
    }
    selectCard(uid);
    const card = state.cards.find((c) => c.uid === uid);
    const p = svgPoint(e);
    state.drag = {
      uid,
      offsetX: p.x - card.x,
      offsetY: p.y - card.y,
      moved: false,
    };
    document.body.style.userSelect = "none";
  }

  function onMouseMove(e) {
    if (!state.drag) return;
    const card = state.cards.find((c) => c.uid === state.drag.uid);
    if (!card) return;
    const p = svgPoint(e);
    card.x = p.x - state.drag.offsetX;
    card.y = p.y - state.drag.offsetY;
    const node = findNode(card.uid);
    if (node) {
      node.setAttribute("transform", `translate(${card.x},${card.y})`);
      node.classList.add("dragging");
    }
    state.drag.moved = true;
    if (window.Arrows) window.Arrows.refreshFor(card.uid);
  }

  function onMouseUp() {
    if (state.drag) {
      const node = findNode(state.drag.uid);
      if (node) node.classList.remove("dragging");
      state.drag = null;
      document.body.style.userSelect = "";
    }
  }

  function selectCard(uid) {
    state.selectedUid = uid;
    getLayer().querySelectorAll(".card-node").forEach((n) => n.classList.remove("selected"));
    const node = findNode(uid);
    if (node) node.classList.add("selected");
  }

  function deselectAll() {
    state.selectedUid = null;
    getLayer().querySelectorAll(".card-node").forEach((n) => n.classList.remove("selected"));
  }

  function removeCard(uid) {
    state.cards = state.cards.filter((c) => c.uid !== uid);
    const node = findNode(uid);
    if (node) node.remove();
    if (window.Arrows) window.Arrows.removeByCard(uid);
    if (state.selectedUid === uid) state.selectedUid = null;
    onChanged();
  }

  function clearAll() {
    state.cards = [];
    state.arrows = [];
    state.selectedUid = null;
    state.connectSource = null;
    getLayer().innerHTML = "";
    if (window.Arrows) window.Arrows.clear();
    onChanged();
  }

  function setConnectMode(on) {
    state.connectMode = on;
    state.connectSource = null;
    document.body.classList.toggle("connect-mode", on);
    getLayer().querySelectorAll(".connect-source").forEach((n) => n.classList.remove("connect-source"));
    const btn = document.getElementById("connect-mode-btn");
    if (btn) btn.classList.toggle("on", on);
  }

  function handleConnectClick(uid) {
    if (state.connectSource == null) {
      state.connectSource = uid;
      const node = findNode(uid);
      if (node) node.classList.add("connect-source");
      return;
    }
    if (state.connectSource === uid) {
      state.connectSource = null;
      const node = findNode(uid);
      if (node) node.classList.remove("connect-source");
      return;
    }
    if (window.Arrows) window.Arrows.add(state.connectSource, uid);
    const srcNode = findNode(state.connectSource);
    if (srcNode) srcNode.classList.remove("connect-source");
    state.connectSource = null;
  }

  function updateCardLabel(uid, newLabel) {
    const card = state.cards.find((c) => c.uid === uid);
    if (!card) return;
    card.label = newLabel;
    const node = findNode(uid);
    if (!node) return;
    const labelEl = node.querySelector(".card-label");
    if (labelEl) labelEl.textContent = newLabel;
  }

  function onChanged() {
    const hint = document.getElementById("canvas-empty-hint");
    if (hint) hint.classList.toggle("hidden", state.cards.length > 0);
    if (window.Stats) window.Stats.refresh();
  }

  function getCardPos(uid) {
    const card = state.cards.find((c) => c.uid === uid);
    if (!card) return null;
    return { x: card.x + CARD_W / 2, y: card.y + CARD_H / 2 };
  }

  function getCardBox(uid) {
    const card = state.cards.find((c) => c.uid === uid);
    if (!card) return null;
    return { x: card.x, y: card.y, w: CARD_W, h: CARD_H };
  }

  function getState() {
    return {
      cards: state.cards.map((c) => ({ ...c })),
      arrows: window.Arrows ? window.Arrows.getState() : [],
    };
  }

  function init() {
    const svg = getSvg();
    svg.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("mousedown", (e) => {
      if (e.target === svg || e.target.tagName === "rect" && e.target.parentElement.id === "arrows-layer") {
        deselectAll();
      }
    });
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedUid != null) {
        if (document.activeElement && document.activeElement.tagName === "INPUT") return;
        removeCard(state.selectedUid);
      }
      if (e.key === "Escape") {
        if (state.connectMode) setConnectMode(false);
        deselectAll();
      }
    });
  }

  window.Canvas = {
    init, addCard, removeCard, clearAll, selectCard, setConnectMode,
    updateCardLabel, getCardPos, getCardBox, getState,
    get connectMode() { return state.connectMode; },
    get cards() { return state.cards; },
    CARD_W, CARD_H,
  };
})();

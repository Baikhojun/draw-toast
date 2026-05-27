// 이 파일의 역할: 두 카드 사이 화살표(SVG path) 생성·갱신·삭제 + 카드 이동 추적

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const state = {
    arrows: [],   // { uid, fromUid, toUid }
    nextUid: 1,
  };

  function getLayer() { return document.getElementById("arrows-layer"); }

  function add(fromUid, toUid) {
    if (fromUid === toUid) return;
    const exists = state.arrows.some((a) => a.fromUid === fromUid && a.toUid === toUid);
    if (exists) return;
    const arrow = { uid: state.nextUid++, fromUid, toUid };
    state.arrows.push(arrow);
    renderArrow(arrow);
    if (window.Stats) window.Stats.refresh();
  }

  function renderArrow(arrow) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "arrow-path");
    path.setAttribute("marker-end", "url(#arrowhead)");
    path.setAttribute("data-uid", arrow.uid);
    path.style.cursor = "pointer";
    path.addEventListener("click", (e) => {
      e.stopPropagation();
      remove(arrow.uid);
    });
    getLayer().appendChild(path);
    updateArrowPath(arrow);
  }

  function updateArrowPath(arrow) {
    const from = window.Canvas.getCardPos(arrow.fromUid);
    const toBox = window.Canvas.getCardBox(arrow.toUid);
    const fromBox = window.Canvas.getCardBox(arrow.fromUid);
    if (!from || !toBox || !fromBox) return;
    const toCenter = { x: toBox.x + toBox.w / 2, y: toBox.y + toBox.h / 2 };
    const fromCenter = { x: fromBox.x + fromBox.w / 2, y: fromBox.y + fromBox.h / 2 };

    // 시작점·끝점을 각 카드 박스 가장자리로 보정 (직선의 사각형 경계와 교차)
    const start = boundaryPoint(fromCenter, toCenter, fromBox);
    const end = boundaryPoint(toCenter, fromCenter, toBox);

    const path = getLayer().querySelector(`[data-uid="${arrow.uid}"]`);
    if (path) path.setAttribute("d", `M${start.x},${start.y} L${end.x},${end.y}`);
  }

  // center에서 target 방향으로 box 가장자리까지 가는 점 계산
  function boundaryPoint(center, target, box) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    if (dx === 0 && dy === 0) return center;
    const halfW = box.w / 2;
    const halfH = box.h / 2;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    // 비율 계산: 박스 가장자리에 닿는 t (0~1)
    const tx = adx > 0 ? halfW / adx : Infinity;
    const ty = ady > 0 ? halfH / ady : Infinity;
    const t = Math.min(tx, ty);
    return {
      x: center.x + dx * t,
      y: center.y + dy * t,
    };
  }

  function refreshFor(cardUid) {
    state.arrows
      .filter((a) => a.fromUid === cardUid || a.toUid === cardUid)
      .forEach(updateArrowPath);
  }

  function remove(arrowUid) {
    state.arrows = state.arrows.filter((a) => a.uid !== arrowUid);
    const path = getLayer().querySelector(`[data-uid="${arrowUid}"]`);
    if (path) path.remove();
    if (window.Stats) window.Stats.refresh();
  }

  function removeByCard(cardUid) {
    const affected = state.arrows.filter((a) => a.fromUid === cardUid || a.toUid === cardUid);
    affected.forEach((a) => {
      const path = getLayer().querySelector(`[data-uid="${a.uid}"]`);
      if (path) path.remove();
    });
    state.arrows = state.arrows.filter((a) => a.fromUid !== cardUid && a.toUid !== cardUid);
    if (window.Stats) window.Stats.refresh();
  }

  function clear() {
    state.arrows = [];
    getLayer().innerHTML = "";
    if (window.Stats) window.Stats.refresh();
  }

  function getState() {
    return state.arrows.map((a) => ({ ...a }));
  }

  function count() { return state.arrows.length; }

  window.Arrows = { add, refreshFor, remove, removeByCard, clear, getState, count };
})();

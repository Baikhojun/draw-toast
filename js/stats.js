// 이 파일의 역할: 사이드바 통계(카드 수, 연결 수, 갤러리 수) 실시간 갱신

(function () {
  function refresh() {
    const cards = window.Canvas ? window.Canvas.cards.length : 0;
    const arrows = window.Arrows ? window.Arrows.count() : 0;
    const cEl = document.getElementById("stat-cards");
    const aEl = document.getElementById("stat-arrows");
    if (cEl) cEl.textContent = cards;
    if (aEl) aEl.textContent = arrows;
    refreshGalleryCount();
  }

  function refreshGalleryCount() {
    const n = window.Gallery ? window.Gallery.count() : 0;
    const el = document.getElementById("gallery-count");
    if (el) el.textContent = n;
  }

  window.Stats = { refresh, refreshGalleryCount };
})();

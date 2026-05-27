// 이 파일의 역할: 좌측 카드 팔레트 렌더링 + 카테고리 탭 전환 + 카드 클릭→캔버스 추가

(function () {
  const state = { activeCategory: "ingredient" };

  function renderTabs() {
    const wrap = document.getElementById("palette-tabs");
    wrap.innerHTML = "";
    window.CARD_CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "palette-tab" + (cat.id === state.activeCategory ? " active" : "");
      btn.textContent = cat.label;
      btn.dataset.cat = cat.id;
      btn.addEventListener("click", () => switchCategory(cat.id));
      wrap.appendChild(btn);
    });
  }

  function renderGrid() {
    const grid = document.getElementById("palette-grid");
    grid.innerHTML = "";
    const cards = window.CARDS.filter((c) => c.cat === state.activeCategory);
    cards.forEach((card) => {
      const el = document.createElement("button");
      el.className = "palette-card";
      el.dataset.cardId = card.id;
      el.innerHTML = `<span class="icon">${card.icon}</span><span class="label">${card.label}</span>`;
      el.addEventListener("click", () => {
        if (window.Canvas) window.Canvas.addCard(card);
      });
      grid.appendChild(el);
    });
  }

  function switchCategory(catId) {
    state.activeCategory = catId;
    renderTabs();
    renderGrid();
  }

  function init() {
    renderTabs();
    renderGrid();
  }

  window.Palette = { init };
})();

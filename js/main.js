// 이 파일의 역할: 전체 초기화 + 시작화면 전환 + 헤더 버튼 이벤트 + 완성 흐름 + Toast 알림

(function () {
  const game = {
    nickname: "",
    started: false,
  };

  function showToast(msg, ms = 2200) {
    const el = document.getElementById("toast-notification");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add("hidden"), ms);
  }
  window.Notify = showToast;

  function startGame() {
    const nickInput = document.getElementById("nickname-input");
    const timerSel = document.getElementById("timer-select");
    let nick = (nickInput.value || "").trim();
    if (!nick) nick = "익명_" + Math.floor(Math.random() * 1000);
    game.nickname = nick;
    game.started = true;
    document.getElementById("player-name-display").textContent = `👤 ${nick}`;
    document.getElementById("start-screen").classList.add("hidden");

    const secs = parseInt(timerSel.value, 10);
    window.Timer.setDuration(secs);
    if (secs > 0) window.Timer.start();

    // 폰트 사전 로드 (PNG 변환 시 첫 클릭 지연 방지)
    if (window.Export && window.Export.loadFonts) window.Export.loadFonts();
  }

  function finishWork() {
    const state = window.Canvas.getState();
    if (state.cards.length === 0) {
      showToast("아직 카드를 하나도 안 놓았어요. 한 장이라도 놓아보세요!");
      return;
    }
    const snapshot = {
      nickname: game.nickname,
      cards: state.cards,
      arrows: state.arrows,
    };
    const entry = window.Gallery.save(snapshot);
    const msg = `🎉 ${game.nickname}님의 토스트가 갤러리에 저장됐어요! (카드 ${state.cards.length}장 · 연결 ${state.arrows.length}개)`;
    document.getElementById("finish-message").innerHTML = msg + "<br/><br/>다른 사람의 그림과 비교해보세요!";
    document.getElementById("finish-modal").classList.remove("hidden");
  }

  function bindHeader() {
    document.getElementById("connect-mode-btn").addEventListener("click", () => {
      const next = !window.Canvas.connectMode;
      window.Canvas.setConnectMode(next);
      if (next) showToast("🔗 연결모드 ON — 카드 A 클릭 → 카드 B 클릭");
    });
    document.getElementById("clear-btn").addEventListener("click", () => {
      if (window.Canvas.cards.length === 0) return;
      if (confirm("캔버스를 모두 비울까요?")) window.Canvas.clearAll();
    });
    document.getElementById("finish-btn").addEventListener("click", finishWork);
  }

  function bindFinishModal() {
    document.getElementById("finish-download").addEventListener("click", () => {
      window.Export.currentToPng();
    });
    document.getElementById("finish-continue").addEventListener("click", () => {
      document.getElementById("finish-modal").classList.add("hidden");
    });
    document.getElementById("finish-gallery").addEventListener("click", () => {
      document.getElementById("finish-modal").classList.add("hidden");
      window.Gallery.open();
    });
  }

  function bindSidebar() {
    document.getElementById("save-png-btn").addEventListener("click", () => {
      window.Export.currentToPng();
    });
    document.getElementById("gallery-btn").addEventListener("click", () => {
      window.Gallery.open();
    });
  }

  function bindStartScreen() {
    document.getElementById("start-btn").addEventListener("click", startGame);
    document.getElementById("nickname-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") startGame();
    });
  }

  function init() {
    if (window.Palette) window.Palette.init();
    if (window.Canvas) window.Canvas.init();
    if (window.Timer) window.Timer.init();
    if (window.Gallery) window.Gallery.init();
    if (window.Stats) window.Stats.refresh();
    bindStartScreen();
    bindHeader();
    bindFinishModal();
    bindSidebar();
  }

  window.Game = {
    init,
    getNickname: () => game.nickname,
  };

  document.addEventListener("DOMContentLoaded", init);
})();

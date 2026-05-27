// 이 파일의 역할: 완성된 작품을 분석해 "당신은 ○○형" 해석 + 옆 사람과 비교할 토론 질문 생성

(function () {
  // snapshot { nickname, cards, arrows } → { type, emoji, headline, body, tags, questions }
  function analyze(snapshot) {
    const cards = snapshot.cards || [];
    const arrows = snapshot.arrows || [];
    const totalCards = cards.length;
    const totalArrows = arrows.length;

    // 카테고리별 사용 수 집계
    const counts = { ingredient: 0, tool: 0, people: 0, place: 0, supply: 0, abstract: 0 };
    cards.forEach((c) => {
      const def = (window.CARDS || []).find((d) => d.id === c.cardId);
      if (def && counts[def.cat] !== undefined) counts[def.cat] += 1;
    });
    const usedCats = Object.keys(counts).filter((k) => counts[k] > 0);
    const arrowRatio = totalCards > 0 ? totalArrows / totalCards : 0;

    // 타입 결정 (우선순위 순)
    let type;
    if (totalCards === 0) type = "empty";
    else if (counts.supply >= 2) type = "scale";
    else if (counts.people >= 1 && counts.abstract >= 1) type = "userSystem";
    else if (counts.abstract >= 2) type = "system";
    else if (counts.people >= 1) type = "human";
    else if (totalArrows === 0 && totalCards >= 2) type = "scatter";
    else if (arrowRatio >= 0.7 && totalArrows >= 3) type = "process";
    else if (totalCards >= 8) type = "wide";
    else if (totalCards <= 3) type = "minimal";
    else type = "balanced";

    return { type, ...PROFILE[type], counts, totalCards, totalArrows, arrowRatio, usedCats };
  }

  // 8가지 타입별 친근한 해석 카드
  const PROFILE = {
    scale: {
      emoji: "🌍",
      headline: "스케일/큰그림 보는 분",
      body: "당신은 토스트 한 조각을 보면서 <b>밀밭·공장·트럭</b>까지 떠올린 사람이에요. 단순한 행위 뒤에 <b>거대한 공급망과 시스템</b>이 있다는 걸 자연스럽게 인식하는 스타일입니다. 회의에서도 \"이게 어디서 오는 거지?\"를 자주 묻는 타입일 수 있어요.",
    },
    userSystem: {
      emoji: "🤝",
      headline: "사용자 중심 시스템형",
      body: "<b>사람</b>과 <b>보이지 않는 흐름(전기/시간/온도 등)</b>을 모두 그리신 분이에요. \"누구를 위한 것인가\" + \"그 뒤의 메커니즘은 무엇인가\"를 동시에 보는 균형감을 가졌습니다. 기획·디자인에 자연스럽게 어울리는 사고 스타일입니다.",
    },
    system: {
      emoji: "⚡",
      headline: "시스템 사고형",
      body: "<b>전기, 시간, 온도</b> 같은 <b>보이지 않는 요소</b>를 카드로 꺼낸 사람이에요. 눈에 보이는 사물뿐 아니라 <b>그 뒤를 받치는 흐름</b>까지 함께 보는 시각을 가졌습니다. 문제를 풀 때 \"왜 이게 작동하지?\"부터 묻는 분일 가능성이 높아요.",
    },
    human: {
      emoji: "👤",
      headline: "사람 중심형",
      body: "기계와 재료만이 아니라 <b>나·가족·친구·손·입</b> 같은 사람을 그림에 넣었네요. \"기능\"보다 <b>\"누가 그걸 쓰고 먹는가\"</b>를 중심에 두는 사용자 공감형입니다. 디자인 씽킹의 출발점이 자연스럽게 작동하는 분이에요.",
    },
    process: {
      emoji: "➡️",
      headline: "프로세스/순서 흐름형",
      body: "카드 수에 비해 <b>화살표가 많아요</b>. 무엇이 무엇 다음에 오는지, <b>순서와 인과관계</b>를 분명히 잡는 스타일입니다. 실행·운영에 강한 사고이고, 절차를 명확히 그릴 줄 아는 사람의 특징이에요.",
    },
    wide: {
      emoji: "🗺",
      headline: "넓게 펼치기형",
      body: `카드를 <b>${0}장</b>이나 쓰셨네요! (보통 사람은 5~7장에서 멈춤) 머릿속을 풍부하게 펼치는 스타일이에요. 단, 정보가 많을수록 듣는 사람은 흐름을 따라가기 어려울 수 있으니, <b>핵심 3가지만 강조</b>하는 연습도 해보세요.`,
    },
    scatter: {
      emoji: "🌿",
      headline: "흩어놓기/요소 나열형",
      body: "카드는 놓았지만 <b>화살표를 거의 안 쓰셨네요</b>. 이건 \"순서보다 요소 자체\"를 중요시하는 스타일입니다. 토스트 = \"식빵·버터·잼\"이라는 <b>구성 요소 사고</b>가 강한 분이에요. 흐름을 추가하면 다른 사람에게 설명할 때 더 잘 전달돼요.",
    },
    minimal: {
      emoji: "✨",
      headline: "핵심 집중/단순화형",
      body: "꼭 필요한 것만 골라 단순하게 표현하셨어요. <b>군더더기 없이 본질</b>로 빠르게 가는 스타일입니다. 의사결정이 빠른 장점이 있고, 다른 사람 시야의 \"넓이\"를 듣고 배울 가치가 큽니다.",
    },
    balanced: {
      emoji: "🍞",
      headline: "균형형",
      body: "카드 수도 적당하고 흐름도 어느 정도 있어요. <b>치우치지 않은 안정형</b>입니다. 모든 관점에 열려 있는 만큼, 비교를 통해 본인이 어느 쪽에 더 끌렸는지 발견해보세요.",
    },
    empty: {
      emoji: "🥲",
      headline: "아직 비어있어요",
      body: "카드를 한 장도 놓지 않으셨네요. 일단 마음에 드는 카드를 하나 클릭해보세요!",
    },
  };

  // 토론 질문 풀 — 사용자 타입에 따라 가중치 다르게
  const QUESTION_BANK = [
    { tag: "people", text: "당신은 <b>사람을 그렸나요?</b> 사람을 안 그린 사람과 비교해보면 어떤 차이가 보이나요?" },
    { tag: "supply", text: "<b>식빵이 어디서 왔는지</b>까지 그렸나요? 안 그렸다면 그 이유는요?" },
    { tag: "tool", text: "<b>도구/기계</b>를 몇 개 그렸나요? 다른 사람은 똑같이 토스터를 그렸을까요?" },
    { tag: "abstract", text: "전기·시간·온도 같은 <b>안 보이는 것</b>도 그렸나요? 그게 의미하는 건 무엇일까요?" },
    { tag: "arrow", text: "<b>순서(화살표)</b>가 분명한가요, 흩어져 있나요? 두 방식의 차이는 무엇일까요?" },
    { tag: "count-wide", text: "당신은 카드를 많이 쓰셨네요. 만약 <b>3장만 골라 줄여야 한다면</b>, 어떤 카드만 남길 건가요?" },
    { tag: "count-narrow", text: "카드가 적은 편이에요. <b>한 장만 더 추가한다면</b> 무엇을 추가하시겠어요? 왜요?" },
    { tag: "common", text: "옆 사람의 그림에서 <b>나는 절대 안 떠올렸을 카드</b>는 무엇이었나요?" },
    { tag: "common", text: "<b>나와 옆 사람이 둘 다 그린 카드</b>는 무엇인가요? 그게 왜 \"공통점\"이 됐을까요?" },
    { tag: "common", text: "이 게임에서 <b>나의 그림이 우리 팀의 실제 일과 닮은 점</b>이 있나요?" },
  ];

  function pickQuestions(analysis) {
    const want = [];
    if (analysis.counts.people === 0) want.push("people");
    if (analysis.counts.supply === 0) want.push("supply");
    if (analysis.counts.abstract === 0) want.push("abstract");
    if (analysis.totalArrows === 0) want.push("arrow");
    if (analysis.totalCards >= 8) want.push("count-wide");
    if (analysis.totalCards > 0 && analysis.totalCards <= 3) want.push("count-narrow");

    const targeted = QUESTION_BANK.filter((q) => want.includes(q.tag));
    const common = QUESTION_BANK.filter((q) => q.tag === "common");
    // 우선 타깃 질문 → 부족하면 공통 질문 채움
    const picked = [];
    for (const q of targeted) { if (picked.length < 2) picked.push(q.text); }
    for (const q of common) { if (picked.length < 3) picked.push(q.text); }
    // 그래도 부족하면 (모든 카테고리 다 쓴 풍부한 경우 등) — 다른 질문 채움
    for (const q of QUESTION_BANK) {
      if (picked.length >= 3) break;
      if (!picked.includes(q.text)) picked.push(q.text);
    }
    return picked.slice(0, 3);
  }

  function catChip(catId, count) {
    const cat = (window.CARD_CATEGORIES || []).find((c) => c.id === catId);
    if (!cat) return "";
    return `<span class="cat-chip">${cat.label} × ${count}</span>`;
  }

  function renderInto(container, snapshot) {
    if (!container) return;
    const a = analyze(snapshot);
    if (a.type === "empty") {
      container.innerHTML = `<div class="interpretation-body">${a.body}</div>`;
      return;
    }

    let body = a.body;
    if (a.type === "wide") body = body.replace("<b>0장</b>", `<b>${a.totalCards}장</b>`);

    const chips = Object.entries(a.counts)
      .filter(([, n]) => n > 0)
      .map(([cat, n]) => catChip(cat, n))
      .join("");

    const questions = pickQuestions(a);
    const qHtml = questions.map((q) => `<li>${q}</li>`).join("");

    container.innerHTML = `
      <div class="interpretation-header">
        <span class="interp-emoji">${a.emoji}</span>
        <div>
          <div class="interp-tag">결과 해석</div>
          <div class="interp-headline">당신은 <b>${a.headline}</b>!</div>
        </div>
      </div>
      <div class="interpretation-body">${body}</div>
      <div class="interpretation-stats">
        <div class="stat-row"><span class="k">📦 카드</span> <b>${a.totalCards}장</b></div>
        <div class="stat-row"><span class="k">🔗 연결</span> <b>${a.totalArrows}개</b></div>
        <div class="stat-row chips-row"><span class="k">🃏 카테고리</span> <span class="chips">${chips}</span></div>
      </div>
      <details class="interp-discussion">
        <summary>💬 옆 사람과 비교해볼 점 (토론 질문 3가지)</summary>
        <ol>${qHtml}</ol>
      </details>
      <p class="interp-footnote">💡 정답은 없습니다. 다른 게 보이면 그게 이 게임의 성공이에요.</p>
    `;
  }

  window.Interpret = { analyze, renderInto };
})();

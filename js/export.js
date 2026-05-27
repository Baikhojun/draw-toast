// 이 파일의 역할: SVG → PNG 변환 + 한글 폰트(Yooshin) 임베드 + 다운로드

(function () {
  const CARD_W = 110, CARD_H = 80;
  const fontCache = { medium: null, bold: null };

  async function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  async function loadFonts() {
    if (fontCache.medium && fontCache.bold) return;
    try {
      const [m, b] = await Promise.all([
        fetch("assets/fonts/Yooshin-Medium.ttf").then((r) => r.blob()),
        fetch("assets/fonts/Yooshin-Bold.ttf").then((r) => r.blob()),
      ]);
      fontCache.medium = await blobToBase64(m);
      fontCache.bold = await blobToBase64(b);
    } catch (e) {
      console.warn("폰트 로드 실패 (시스템 폰트로 fallback):", e);
    }
  }

  function fontFaceCss() {
    if (!fontCache.medium || !fontCache.bold) return "";
    return `
      @font-face { font-family: "Yooshin"; font-weight: 400; src: url(data:font/ttf;base64,${fontCache.medium}) format("truetype"); }
      @font-face { font-family: "Yooshin"; font-weight: 700; src: url(data:font/ttf;base64,${fontCache.bold}) format("truetype"); }
    `;
  }

  function escapeXml(s) {
    return String(s).replace(/[<>&"']/g, (c) => ({
      "<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"
    }[c]));
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

  // snapshot { nickname, cards, arrows } → 독립 SVG string
  function buildSvgForExport(snapshot, opts = {}) {
    const cards = snapshot.cards || [];
    const arrows = snapshot.arrows || [];
    if (cards.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#fff8ec"/><text x="300" y="200" text-anchor="middle" font-size="20" fill="#999">(빈 작품)</text></svg>`;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    cards.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + CARD_W);
      maxY = Math.max(maxY, c.y + CARD_H);
    });
    const pad = 40;
    const vbX = minX - pad, vbY = minY - pad - 30;
    const vbW = (maxX - minX) + pad * 2;
    const vbH = (maxY - minY) + pad * 2 + 60;

    const arrowsSvg = arrows.map((a) => {
      const from = cards.find((c) => c.uid === a.fromUid);
      const to = cards.find((c) => c.uid === a.toUid);
      if (!from || !to) return "";
      const fc = { x: from.x + CARD_W/2, y: from.y + CARD_H/2 };
      const tc = { x: to.x + CARD_W/2, y: to.y + CARD_H/2 };
      const s = edge(fc, tc, { w: CARD_W, h: CARD_H });
      const e = edge(tc, fc, { w: CARD_W, h: CARD_H });
      return `<path d="M${s.x},${s.y} L${e.x},${e.y}" fill="none" stroke="#8b5e34" stroke-width="2.5" marker-end="url(#ex-arrow)"/>`;
    }).join("");

    const cardsSvg = cards.map((c) => `
      <g transform="translate(${c.x},${c.y})">
        <rect width="${CARD_W}" height="${CARD_H}" rx="10" ry="10" fill="#ffffff" stroke="#c98b4a" stroke-width="2"/>
        <text x="${CARD_W/2}" y="${CARD_H/2 - 6}" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Segoe UI Symbol, sans-serif">${escapeXml(c.icon)}</text>
        <text x="${CARD_W/2}" y="${CARD_H - 14}" text-anchor="middle" font-size="14" fill="#3a2e22" font-family="Yooshin, sans-serif" font-weight="700">${escapeXml(c.label)}</text>
      </g>
    `).join("");

    const title = opts.title || `🍞 ${snapshot.nickname || "익명"}의 토스트`;
    const subtitle = opts.subtitle || `made with Draw Toast by WhiteJune`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${Math.max(800, vbW)}" height="${Math.max(600, vbH)}">
      <defs>
        <style>${fontFaceCss()}</style>
        <marker id="ex-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="#8b5e34"/>
        </marker>
      </defs>
      <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#fff8ec"/>
      <text x="${vbX + 20}" y="${vbY + 28}" font-family="Yooshin, sans-serif" font-weight="700" font-size="20" fill="#8b5e34">${escapeXml(title)}</text>
      ${arrowsSvg}
      ${cardsSvg}
      <text x="${vbX + vbW - 20}" y="${vbY + vbH - 14}" text-anchor="end" font-family="Yooshin, sans-serif" font-size="11" fill="#7a6850">${escapeXml(subtitle)}</text>
    </svg>`;
  }

  async function svgToPng(svgStr, filename, scale = 2) {
    await loadFonts();
    const finalSvg = svgStr.includes("@font-face") ? svgStr : svgStr.replace("<defs>", `<defs><style>${fontFaceCss()}</style>`);
    const blob = new Blob([finalSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 600;
        const canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff8ec";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return reject(new Error("PNG 변환 실패"));
          downloadBlob(pngBlob, filename);
          resolve();
        }, "image/png");
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(s) {
    return String(s).replace(/[\/\\:*?"<>|]/g, "_");
  }

  async function currentToPng() {
    const nickname = window.Game ? window.Game.getNickname() : "익명";
    const state = window.Canvas.getState();
    const snapshot = { nickname, cards: state.cards, arrows: state.arrows };
    const svg = buildSvgForExport(snapshot);
    const filename = `draw-toast_${safeFilename(nickname)}_${Date.now()}.png`;
    try {
      await svgToPng(svg, filename);
      if (window.Notify) window.Notify("💾 PNG로 저장했어요!");
    } catch (e) {
      console.error(e);
      if (window.Notify) window.Notify("⚠ PNG 변환 실패. 콘솔을 확인하세요.");
    }
  }

  async function snapshotToPng(snapshot, filename) {
    const svg = buildSvgForExport(snapshot);
    try {
      await svgToPng(svg, filename || `toast_${safeFilename(snapshot.nickname)}.png`);
      if (window.Notify) window.Notify("💾 PNG로 저장했어요!");
    } catch (e) {
      console.error(e);
      if (window.Notify) window.Notify("⚠ PNG 변환 실패");
    }
  }

  // 갤러리 전체를 격자로 합쳐서 한 장 PNG
  async function allToPng() {
    const items = window.Gallery.loadAll();
    if (items.length === 0) {
      if (window.Notify) window.Notify("갤러리에 작품이 없어요.");
      return;
    }
    await loadFonts();
    const cols = Math.min(3, items.length);
    const rows = Math.ceil(items.length / cols);
    const cellW = 500, cellH = 380, pad = 30, headerH = 90;
    const totalW = cols * cellW + (cols + 1) * pad;
    const totalH = rows * cellH + (rows + 1) * pad + headerH;

    const cells = items.map((it, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + pad);
      const y = headerH + pad + row * (cellH + pad);
      const inner = window.Gallery.buildPreviewSvg(it);
      // inner SVG에서 <svg ... viewBox="A B C D">...</svg> → 그대로 <svg x= y= width= height= viewBox=...>로 변환
      const vbMatch = inner.match(/viewBox="([^"]+)"/);
      const vb = vbMatch ? vbMatch[1] : "0 0 400 300";
      const innerContent = inner.replace(/<\/?svg[^>]*>/g, "");
      return `
        <g transform="translate(${x},${y})">
          <rect width="${cellW}" height="${cellH - 50}" rx="10" fill="#ffffff" stroke="#e8d6b2" stroke-width="2"/>
          <svg x="6" y="6" width="${cellW - 12}" height="${cellH - 62}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${innerContent}</svg>
          <text x="14" y="${cellH - 22}" font-family="Yooshin, sans-serif" font-weight="700" font-size="18" fill="#8b5e34">${escapeXml(it.nickname)}</text>
          <text x="${cellW - 14}" y="${cellH - 22}" text-anchor="end" font-family="Yooshin, sans-serif" font-size="13" fill="#7a6850">카드 ${it.cards.length} · 연결 ${(it.arrows||[]).length}</text>
        </g>`;
    }).join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
      <defs><style>${fontFaceCss()}</style></defs>
      <rect width="${totalW}" height="${totalH}" fill="#fff8ec"/>
      <text x="${totalW/2}" y="40" text-anchor="middle" font-family="Yooshin, sans-serif" font-weight="700" font-size="28" fill="#8b5e34">🍞 우리들의 토스트 갤러리 — 같은 토스트, 이렇게 다른 생각!</text>
      <text x="${totalW/2}" y="68" text-anchor="middle" font-family="Yooshin, sans-serif" font-size="14" fill="#7a6850">made with Draw Toast by WhiteJune · 작품 ${items.length}개</text>
      ${cells}
    </svg>`;

    try {
      await svgToPng(svg, `draw-toast_갤러리_${Date.now()}.png`, 1.5);
      if (window.Notify) window.Notify("📦 갤러리 전체를 PNG로 저장했어요!");
    } catch (e) {
      console.error(e);
      if (window.Notify) window.Notify("⚠ 갤러리 PNG 변환 실패");
    }
  }

  window.Export = { currentToPng, snapshotToPng, allToPng, loadFonts };
})();

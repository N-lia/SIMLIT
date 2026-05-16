import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './FBDSimulation.css';

export default function FBDSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    const canvas = $("stage");
    const ctx = canvas.getContext("2d");
    const hud = $("hud");
    const labelInput = $("label");
    const magSlider = $("magnitude");
    const angSlider = $("angle");
    const magVal = $("magVal");
    const angVal = $("angVal");
    const showGrid = $("showGrid");
    const showComponents = $("showComponents");
    const showNet = $("showNet");

    const PRESETS = [
      { name: "Weight", label: "W", mag: 4, angle: 270, color: "#ffb86c" },
      { name: "Normal", label: "N", mag: 3.5, angle: 90, color: "#7ee787" },
      { name: "Friction", label: "f", mag: 1.5, angle: 180, color: "#ff7b72" },
      { name: "Applied", label: "F", mag: 2.5, angle: 0, color: "#5eb8ff" },
      { name: "Tension", label: "T", mag: 3, angle: 45, color: "#bd93f9" },
      { name: "Drag", label: "D", mag: 1.2, angle: 180, color: "#94a3b8" },
    ];

    let forces = [];
    let selectedId = null;
    let uid = 1;
    let canvasDpr = 1;
    const pxPerUnit = 28;
    const headLen = 14;
    const hitPad = 14;
    const BODY_RW_BASE = 52;
    const BODY_RH_BASE = 36;
    const MASS_REF_KG = 2;

    function bodySizePx() {
      const m = Math.max(0.2, parseFloat(massKgEl.value) || MASS_REF_KG);
      let s = Math.sqrt(m / MASS_REF_KG);
      s = Math.max(0.5, Math.min(2.5, s));
      const rw = BODY_RW_BASE * s;
      const rh = BODY_RH_BASE * s;
      const rr = Math.max(4, Math.min(14, 8 * s));
      return { rw, rh, rr, s };
    }

    function edgePad() {
      const { rw, rh } = bodySizePx();
      return Math.max(24, Math.max(rw, rh) / 2 + 14);
    }

    let bodyX = 0, bodyY = 0, originX = 0, originY = 0;
    let velX = 0, velY = 0;
    let playing = false;
    let rafId = 0;
    let lastTick = null;
    let simTime = 0;
    let hasSized = false;

    const btnPlay = $("btnPlay");
    const btnResetMotion = $("btnResetMotion");
    const massKgEl = $("massKg");
    const massVal = $("massVal");
    const animSpeedEl = $("animSpeed");
    const speedVal = $("speedVal");
    const pxPerMeterEl = $("pxPerMeter");
    const ppmVal = $("ppmVal");
    const calcRoot = $("calcRoot");

    function addForce(partial) {
      const f = {
        id: uid++,
        label: partial.label || "F",
        magnitude: partial.magnitude ?? 3,
        angleDeg: partial.angleDeg ?? 0,
        color: partial.color || "#5eb8ff",
      };
      forces.push(f);
      selectForce(f.id);
      syncFormFromSelection();
      redraw();
      return f;
    }

    function vecFromPolar(mag, angleDeg) {
      const r = Math.PI / 180 * angleDeg;
      return { x: mag * Math.cos(r), y: -mag * Math.sin(r) };
    }

    function polarFromVec(x, y) {
      const mag = Math.hypot(x, y);
      let deg = (Math.atan2(-y, x) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      return { mag, deg };
    }

    function logicalSize() {
      return { w: canvas.width / canvasDpr, h: canvas.height / canvasDpr };
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function ktex(tex, displayMode) {
      if (!katex) return "<code>" + escapeHtml(tex) + "</code>";
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode: !!displayMode, strict: "ignore" });
      } catch (_) {
        return "<code>" + escapeHtml(tex) + "</code>";
      }
    }

    function placeBodyCenter() {
      const { w, h } = logicalSize();
      bodyX = w * 0.5;
      bodyY = h * 0.48;
    }

    function clampBody() {
      const { w, h } = logicalSize();
      const pad = edgePad();
      if (bodyX < pad) { bodyX = pad; velX *= -0.2; }
      else if (bodyX > w - pad) { bodyX = w - pad; velX *= -0.2; }
      if (bodyY < pad) { bodyY = pad; velY *= -0.2; }
      else if (bodyY > h - pad) { bodyY = h - pad; velY *= -0.2; }
    }

    function clampBodyPositionOnly() {
      const { w, h } = logicalSize();
      const pad = edgePad();
      bodyX = Math.max(pad, Math.min(w - pad, bodyX));
      bodyY = Math.max(pad, Math.min(h - pad, bodyY));
    }

    function hitTestBody(canvasX, canvasY) {
      const c = getBodyCenter();
      const { rw, rh } = bodySizePx();
      const pad = 10;
      const hw = rw / 2 + pad;
      const hh = rh / 2 + pad;
      return Math.abs(canvasX - c.x) <= hw && Math.abs(canvasY - c.y) <= hh;
    }

    function getBodyCenter() { return { x: bodyX, y: bodyY }; }

    function clientToCanvas(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const { w, h } = logicalSize();
      return {
        x: ((clientX - rect.left) / rect.width) * w,
        y: ((clientY - rect.top) / rect.height) * h,
      };
    }

    function endPoint(force) {
      const c = getBodyCenter();
      const v = vecFromPolar(force.magnitude * pxPerUnit, force.angleDeg);
      return { x: c.x + v.x, y: c.y + v.y };
    }

    function distToSegment(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      if (len2 < 1e-6) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * dx + (py - y1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const qx = x1 + t * dx, qy = y1 + t * dy;
      return Math.hypot(px - qx, py - qy);
    }

    function pickForce(clientX, clientY) {
      const { x, y } = clientToCanvas(clientX, clientY);
      const c = getBodyCenter();
      let best = null, bestD = Infinity;
      for (let i = forces.length - 1; i >= 0; i--) {
        const f = forces[i];
        const tip = endPoint(f);
        const shaft = distToSegment(x, y, c.x, c.y, tip.x, tip.y);
        const dTip = Math.hypot(x - tip.x, y - tip.y);
        const d = Math.min(shaft, dTip);
        if (d < bestD && d < hitPad + headLen * 0.5) {
          bestD = d; best = f;
        }
      }
      return best ? { force: best, x, y } : null;
    }

    function netVector() {
      let sx = 0, sy = 0;
      for (const f of forces) {
        const v = vecFromPolar(f.magnitude * pxPerUnit, f.angleDeg);
        sx += v.x; sy += v.y;
      }
      const p = polarFromVec(sx, sy);
      return { sx, sy, mag: p.mag, deg: p.deg };
    }

    function forceComponentsPhys(f) {
      const r = (Math.PI / 180) * f.angleDeg;
      return { fx: f.magnitude * Math.cos(r), fy: f.magnitude * Math.sin(r) };
    }

    function sumForcesPhys() {
      let fx = 0, fy = 0;
      for (const f of forces) {
        const p = forceComponentsPhys(f);
        fx += p.fx; fy += p.fy;
      }
      return { fx, fy };
    }

    function resize() {
      const wrap = canvas.parentElement;
      canvasDpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.floor(w * canvasDpr);
      canvas.height = Math.floor(h * canvasDpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
      if (!hasSized) {
        hasSized = true;
        placeBodyCenter();
        originX = bodyX; originY = bodyY;
      } else {
        clampBody();
      }
      redraw();
    }

    function drawGrid(c, w, h) {
      ctx.save();
      ctx.strokeStyle = "rgba(139, 156, 179, 0.12)";
      ctx.lineWidth = 1;
      const step = 32;
      for (let gx = (c.x % step); gx < w; gx += step) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = (c.y % step); gy < h; gy += step) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }
      ctx.restore();
    }

    function drawArrow(x0, y0, x1, y1, color, lineWidth, dash) {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      ctx.save();
      ctx.strokeStyle = color; ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.setLineDash([]);
      const ah = headLen;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ah * Math.cos(ang - 0.45), y1 - ah * Math.sin(ang - 0.45));
      ctx.lineTo(x1 - ah * Math.cos(ang + 0.45), y1 - ah * Math.sin(ang + 0.45));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    function drawBody(c) {
      const { rw, rh, rr, s } = bodySizePx();
      const x = c.x - rw / 2, y = c.y - rh / 2;
      ctx.save();
      ctx.fillStyle = "#2d3a4d";
      ctx.strokeStyle = "#5eb8ff";
      ctx.lineWidth = Math.max(1.5, Math.min(2.8, 1.6 + 0.2 * s));
      ctx.beginPath();
      ctx.moveTo(x + rr, y); ctx.lineTo(x + rw - rr, y);
      ctx.quadraticCurveTo(x + rw, y, x + rw, y + rr); ctx.lineTo(x + rw, y + rh - rr);
      ctx.quadraticCurveTo(x + rw, y + rh, x + rw - rr, y + rh); ctx.lineTo(x + rr, y + rh);
      ctx.quadraticCurveTo(x, y + rh, x, y + rh - rr); ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#8b9cb3";
      const fs = Math.round(Math.min(22, Math.max(11, 13 * Math.sqrt(s))));
      ctx.font = "600 " + fs + "px system-ui,sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("m", c.x, c.y);
      ctx.restore();
    }

    function drawComponentTicks(c, tip, color) {
      ctx.save();
      ctx.strokeStyle = color; ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(tip.x, c.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = color;
      ctx.font = "600 11px system-ui,sans-serif";
      ctx.fillText("Fx", tip.x, c.y + (tip.y < c.y ? 14 : -14));
      ctx.fillText("Fy", tip.x + (tip.x < c.x ? -18 : 18), tip.y);
      ctx.restore();
    }

    function redraw() {
      const { w, h } = logicalSize();
      ctx.clearRect(0, 0, w, h);
      const c = getBodyCenter();
      if (showGrid.checked) drawGrid(c, w, h);

      for (const f of forces) {
        const tip = endPoint(f);
        const lw = f.id === selectedId ? 3.2 : 2.2;
        drawArrow(c.x, c.y, tip.x, tip.y, f.color, lw);
        if (showComponents.checked) drawComponentTicks(c, tip, f.color);
        ctx.save();
        ctx.fillStyle = "#e8eef5"; ctx.font = "600 13px system-ui,sans-serif";
        const midx = (c.x + tip.x) / 2, midy = (c.y + tip.y) / 2;
        const ox = tip.x >= c.x ? 8 : -8, oy = tip.y >= c.y ? 14 : -10;
        ctx.textAlign = "center";
        ctx.fillText(f.label, midx + ox, midy + oy);
        ctx.restore();
      }

      if (showNet.checked && forces.length) {
        const n = netVector();
        if (n.mag > 2) {
          const tip = { x: c.x + n.sx, y: c.y + n.sy };
          drawArrow(c.x, c.y, tip.x, tip.y, "#f472b6", 2.5, [6, 6]);
          ctx.save();
          ctx.fillStyle = "#f472b6"; ctx.font = "600 12px system-ui,sans-serif";
          ctx.textAlign = "center"; ctx.fillText("R", tip.x + 10, tip.y - 12);
          ctx.restore();
        }
      }

      drawBody(c);
      updateHud();
      renderCalculations();
    }

    function fmt(n, d) { return !Number.isFinite(n) ? "—" : n.toFixed(d); }

    function renderCalculations() {
      const m = Math.max(0.2, parseFloat(massKgEl.value) || 2);
      const ppm = Math.max(10, parseFloat(pxPerMeterEl.value) || 48);
      const netF = sumForcesPhys();
      const rN = Math.hypot(netF.fx, netF.fy);
      let thR = (Math.atan2(netF.fy, netF.fx) * 180) / Math.PI;
      if (thR < 0) thR += 360;
      const ax = netF.fx / m, ay = netF.fy / m;
      const aMag = Math.hypot(ax, ay);
      const vxM = velX / ppm, vyM = -(velY / ppm);
      const dispX = (bodyX - originX) / ppm, dispY = -((bodyY - originY) / ppm);
      
      const rows = forces.length === 0
        ? '<tr><td colspan="5">No forces yet. Add vectors above.</td></tr>'
        : forces.map((f) => {
            const p = forceComponentsPhys(f);
            return `<tr><td>${escapeHtml(f.label)}</td><td>${fmt(f.magnitude, 2)}</td><td>${Math.round(f.angleDeg)}</td><td>${fmt(p.fx, 2)}</td><td>${fmt(p.fy, 2)}</td></tr>`;
          }).join("");

      const intro = `<p class="calc-intro">${ktex("F_x = |F|\\cos\\theta,\\quad F_y = |F|\\sin\\theta \\quad \\text{(}\\theta\\text{ from }+x\\text{ ccw, }+y\\text{ up)}")}</p>`;
      const thead = `<thead><tr><th>Label</th><th>${ktex("|F|~\\mathrm{(N)}")}</th><th>${ktex("\\theta\\ \\mathrm{(^{\\circ})}")}</th><th>${ktex("F_x~\\mathrm{(N)}")}</th><th>${ktex("F_y~\\mathrm{(N)}")}</th></tr></thead>`;
      const sumRow = `<tr><th colspan="2">${ktex("\\sum \\mathbf{F}")}</th><th></th><td>${fmt(netF.fx, 2)}</td><td>${fmt(netF.fy, 2)}</td></tr>`;
      const angleK = forces.length ? Math.round(thR) + "^\\circ" : "\\text{—}";
      const netBlock = `<p class="formula"><strong>Net force</strong> ${ktex(`|\\mathbf{R}| = \\sqrt{(\\sum F_x)^2 + (\\sum F_y)^2} = ${fmt(rN, 3)}\\,\\mathrm{N}, \\quad \\angle\\mathbf{R} = ${angleK}`)}</p>`;
      const newtonBlock = `<p class="formula">${ktex("\\sum\\mathbf{F} = m\\mathbf{a}")} ${ktex(`a_x = \\frac{\\sum F_x}{m} = ${fmt(ax, 3)}\\,\\mathrm{m\\cdot s^{-2}},\\quad a_y = ${fmt(ay, 3)}\\,\\mathrm{m\\cdot s^{-2}}`)} ${ktex(`|\\mathbf{a}| = ${fmt(aMag, 3)}\\,\\mathrm{m\\cdot s^{-2}},\\quad m = ${fmt(m, 2)}\\,\\mathrm{kg}`)}</p>`;
      const motionBlock = `<p class="formula">${ktex(`\\text{Scale: }1\\,\\mathrm{m} = ${ppm}\\,\\mathrm{px}.\\quad \\mathbf{v} \\approx \\langle ${fmt(vxM, 3)},${fmt(vyM, 3)}\\rangle\\,\\mathrm{m/s}`)} ${ktex(`\\Delta\\mathbf{r} \\approx \\langle ${fmt(dispX, 3)},${fmt(dispY, 3)}\\rangle\\,\\mathrm{m}`)} ${ktex(`t = ${fmt(simTime, 2)}\\,\\mathrm{s}`)} <span class="run-state">${playing ? "Running" : "Paused"}</span></p>`;
      
      calcRoot.innerHTML = intro + '<table class="calc-table">' + thead + "<tbody>" + rows + sumRow + "</tbody></table>" + netBlock + newtonBlock + motionBlock;
    }

    function updateHud() {
      const n = forces.length ? netVector() : { mag: 0, deg: 0 };
      const angleChip = forces.length ? ktex("\\angle\\mathbf{R} = " + Math.round(n.deg) + "^\\circ") : ktex("\\angle\\mathbf{R} = \\text{—}");
      hud.innerHTML = (playing ? '<span class="chip">▶ <strong>Playing</strong></span>' : "") +
        `<span class="chip">${ktex("t = " + fmt(simTime, 2) + "\\,\\mathrm{s}")}</span>` +
        `<span class="chip">Forces: <strong>${forces.length}</strong></span>` +
        `<span class="chip">${ktex("|\\mathbf{R}| = " + (n.mag / pxPerUnit).toFixed(2) + "\\,\\mathrm{N}")}</span>` +
        `<span class="chip">${angleChip}</span>`;
    }

    function stopAnim() {
      playing = false;
      btnPlay.textContent = "Play";
      btnPlay.classList.remove("playing");
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      lastTick = null;
    }

    function tick(now) {
      if (!playing) return;
      if (lastTick === null) lastTick = now;
      const mult = parseFloat(animSpeedEl.value) || 1;
      let dt = ((now - lastTick) / 1000) * mult;
      lastTick = now;
      dt = Math.min(0.05, Math.max(0, dt));
      const netF = sumForcesPhys();
      const m = Math.max(0.2, parseFloat(massKgEl.value) || 2);
      const ppm = Math.max(10, parseFloat(pxPerMeterEl.value) || 48);
      const ax = (netF.fx / m) * ppm, ay = -(netF.fy / m) * ppm;
      velX += ax * dt; velY += ay * dt;
      bodyX += velX * dt; bodyY += velY * dt;
      clampBody(); simTime += dt; redraw();
      if (playing) rafId = requestAnimationFrame(tick);
    }

    function resetMotion() {
      stopAnim();
      velX = 0; velY = 0; simTime = 0;
      placeBodyCenter(); originX = bodyX; originY = bodyY;
      redraw();
    }

    function selectForce(id) {
      selectedId = id; redraw();
    }

    function syncFormFromSelection() {
      const f = forces.find((x) => x.id === selectedId);
      if (!f) { labelInput.value = ""; return; }
      labelInput.value = f.label;
      magSlider.value = String(f.magnitude);
      angSlider.value = String(Math.round(f.angleDeg));
      magVal.textContent = Number(f.magnitude).toFixed(1);
      angVal.textContent = String(Math.round(f.angleDeg));
    }

    function applyFormToSelection() {
      const f = forces.find((x) => x.id === selectedId);
      if (!f) return;
      f.label = labelInput.value.trim() || "F";
      f.magnitude = Math.max(0.1, Math.min(12, parseFloat(magSlider.value) || 0));
      f.angleDeg = ((parseFloat(angSlider.value) || 0) % 360 + 360) % 360;
      magVal.textContent = f.magnitude.toFixed(1);
      angVal.textContent = String(Math.round(f.angleDeg));
      redraw();
    }

    const presetsEl = $("presets");
    presetsEl.innerHTML = '';
    PRESETS.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "preset"; b.textContent = p.name;
      b.addEventListener("click", () => {
        labelInput.value = p.label; magSlider.value = String(p.mag); angSlider.value = String(p.angle);
        magVal.textContent = String(p.mag); angVal.textContent = String(p.angle);
        addForce({ label: p.label, magnitude: p.mag, angleDeg: p.angle, color: p.color });
      });
      presetsEl.appendChild(b);
    });

    magSlider.addEventListener("input", () => { magVal.textContent = parseFloat(magSlider.value).toFixed(1); applyFormToSelection(); });
    angSlider.addEventListener("input", () => { angVal.textContent = angSlider.value; applyFormToSelection(); });
    labelInput.addEventListener("input", applyFormToSelection);

    $("addForce").addEventListener("click", () => {
      addForce({ label: labelInput.value.trim() || "F", magnitude: parseFloat(magSlider.value) || 3, angleDeg: parseFloat(angSlider.value) || 0, color: "#5eb8ff" });
    });

    $("dupForce").addEventListener("click", () => {
      const f = forces.find((x) => x.id === selectedId);
      if (!f) return;
      addForce({ label: f.label + "′", magnitude: f.magnitude, angleDeg: f.angleDeg, color: f.color });
    });

    $("delForce").addEventListener("click", () => {
      forces = forces.filter((x) => x.id !== selectedId);
      selectedId = forces.length ? forces[forces.length - 1].id : null;
      syncFormFromSelection(); redraw();
    });

    $("clearAll").addEventListener("click", () => {
      forces = []; selectedId = null;
      syncFormFromSelection(); redraw();
    });

    [showGrid, showComponents, showNet].forEach((el) => el.addEventListener("change", redraw));

    btnPlay.addEventListener("click", () => {
      if (playing) { stopAnim(); } else {
        playing = true; btnPlay.textContent = "Pause"; btnPlay.classList.add("playing");
        lastTick = null; rafId = requestAnimationFrame(tick);
      }
      redraw();
    });

    btnResetMotion.addEventListener("click", resetMotion);

    massKgEl.addEventListener("input", () => { massVal.textContent = parseFloat(massKgEl.value).toFixed(1); clampBodyPositionOnly(); redraw(); });
    animSpeedEl.addEventListener("input", () => { speedVal.textContent = parseFloat(animSpeedEl.value).toFixed(2); redraw(); });
    pxPerMeterEl.addEventListener("input", () => { ppmVal.textContent = pxPerMeterEl.value; redraw(); });

    let drag = null;
    function pointerDown(e) {
      const pick = pickForce(e.clientX, e.clientY);
      if (pick) {
        if (playing) stopAnim();
        selectForce(pick.force.id); syncFormFromSelection();
        canvas.classList.add("dragging");
        drag = { kind: "force", id: pick.force.id, pointerId: e.pointerId };
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      } else {
        const pt = clientToCanvas(e.clientX, e.clientY);
        if (hitTestBody(pt.x, pt.y)) {
          if (playing) stopAnim();
          velX = 0; velY = 0; selectedId = null; syncFormFromSelection();
          canvas.classList.add("dragging-body");
          drag = { kind: "body", pointerId: e.pointerId, grabX: pt.x - bodyX, grabY: pt.y - bodyY };
          try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
          redraw();
        } else {
          selectedId = null; syncFormFromSelection(); redraw();
        }
      }
    }
    function pointerMove(e) {
      if (!drag) return;
      if (drag.kind === "body") {
        const { x, y } = clientToCanvas(e.clientX, e.clientY);
        bodyX = x - drag.grabX; bodyY = y - drag.grabY;
        clampBodyPositionOnly(); redraw(); return;
      }
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      const c = getBodyCenter();
      const f = forces.find((q) => q.id === drag.id);
      if (!f) return;
      const pol = polarFromVec(x - c.x, y - c.y);
      f.magnitude = Math.max(0.1, Math.min(12, pol.mag / pxPerUnit));
      f.angleDeg = pol.deg;
      magSlider.value = String(f.magnitude); angSlider.value = String(Math.round(f.angleDeg));
      magVal.textContent = f.magnitude.toFixed(1); angVal.textContent = String(Math.round(f.angleDeg));
      redraw();
    }
    function pointerUp(e) {
      if (drag && drag.kind === "body") clampBodyPositionOnly();
      if (drag && e && typeof e.pointerId === "number") {
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      drag = null;
      canvas.classList.remove("dragging"); canvas.classList.remove("dragging-body");
    }

    canvas.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);

    window.addEventListener("resize", resize);
    
    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement);
    }
    
    resize();
    resetMotion();
    addForce({ label: "W", magnitude: 4, angleDeg: 270, color: "#ffb86c" });
    addForce({ label: "N", magnitude: 3.5, angleDeg: 90, color: "#7ee787" });

    const hintMma = $("hint-mma");
    if (hintMma) {
      hintMma.innerHTML = ktex("\\displaystyle \\sum \\mathbf{F} = m\\mathbf{a}");
    }

    return () => {
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fbd-wrapper" ref={rootRef}>
      <div className="stage-wrap">
        <div className="arena-shell">
          <div className="arena" id="arena">
            <canvas id="stage" aria-label="Free body diagram canvas"></canvas>
            <div className="hud" id="hud"></div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="presets" id="presets"></div>
        <div className="row" style={{marginTop: '0.75rem'}}>
          <label className="grow" style={{flex: '2 1 160px'}}>
            Label
            <input type="text" id="label" maxLength="24" placeholder="e.g. Weight" autoComplete="off" />
          </label>
        </div>
        <div className="row">
          <label className="grow">
            Magnitude <span id="magVal">3</span>
            <input type="range" id="magnitude" min="0.5" max="8" step="0.1" defaultValue="3" />
          </label>
        </div>
        <div className="row">
          <label className="grow">
            Angle ° <span id="angVal">270</span> <small style={{opacity: 0.7}}>(0° right, 90° up)</small>
            <input type="range" id="angle" min="0" max="359" step="1" defaultValue="270" />
          </label>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary grow" id="addForce">Add force</button>
          <button type="button" className="btn btn-ghost" id="dupForce">Duplicate</button>
        </div>
        <div className="row">
          <button type="button" className="btn btn-danger" id="delForce">Remove selected</button>
          <button type="button" className="btn btn-ghost" id="clearAll">Clear all</button>
        </div>
        <div className="toggles">
          <label><input type="checkbox" id="showGrid" /> Grid</label>
          <label><input type="checkbox" id="showComponents" /> Components (Fx, Fy)</label>
          <label><input type="checkbox" id="showNet" defaultChecked /> Net force</label>
        </div>
        <h2 className="seg-title" style={{marginTop: '0.85rem'}}>Motion</h2>
        <div className="row">
          <button type="button" className="btn btn-primary grow" id="btnPlay">Play</button>
          <button type="button" className="btn btn-ghost" id="btnResetMotion">Reset motion</button>
        </div>
        <div className="row">
          <label className="grow">
            Mass <span className="mono" id="massVal">2.0</span> kg
            <input type="range" id="massKg" min="0.5" max="20" step="0.1" defaultValue="2" />
          </label>
        </div>
        <div className="row">
          <label className="grow">
            Time scale <span className="mono" id="speedVal">1.0</span>×
            <input type="range" id="animSpeed" min="0.25" max="3" step="0.05" defaultValue="1" />
          </label>
        </div>
        <div className="row">
          <label className="grow">
            1 m on screen ≈ <span className="mono" id="ppmVal">48</span> px
            <input type="range" id="pxPerMeter" min="20" max="120" step="1" defaultValue="48" />
          </label>
        </div>
        <details className="calc-details" id="calcDetails" open>
          <summary>Calculations</summary>
          <div className="calc-body" id="calcRoot"></div>
        </details>
        <p className="hint"><span id="hint-mma"></span> — force magnitudes are in <strong>N</strong>; +y is up. Drag the <strong>block</strong> in the arena or an arrowhead to edit. Pause playback while editing to avoid drift.</p>
      </div>
    </div>
  );
}

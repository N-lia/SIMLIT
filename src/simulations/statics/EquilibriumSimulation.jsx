import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './EquilibriumSimulation.css';

export default function EquilibriumSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    const EPS = 0.12;
    const canvas = $("stage");
    const ctx = canvas.getContext("2d");
    const hud = $("hud");
    const labelInput = $("label");
    const magSlider = $("magnitude");
    const angSlider = $("angle");
    const magVal = $("magVal");
    const angVal = $("angVal");
    const calcRoot = $("calcRoot");

    let forces = [];
    let selectedId = null;
    let uid = 1;
    let canvasDpr = 1;
    const pxPerUnit = 26;
    const headLen = 13;
    const hitPad = 14;

    const SCENARIOS = [
      {
        name: "Balanced horizontal",
        forces: [
          { label: "F₁", magnitude: 4, angleDeg: 0, color: "#5eb8ff" },
          { label: "F₂", magnitude: 4, angleDeg: 180, color: "#ffb86c" },
        ],
      },
      {
        name: "Weight & normal",
        forces: [
          { label: "W", magnitude: 5, angleDeg: 270, color: "#ffb86c" },
          { label: "N", magnitude: 4.5, angleDeg: 90, color: "#7ee787" },
        ],
      },
      {
        name: "Three at 120°",
        forces: [
          { label: "A", magnitude: 3, angleDeg: 0, color: "#5eb8ff" },
          { label: "B", magnitude: 3, angleDeg: 120, color: "#bd93f9" },
          { label: "C", magnitude: 3, angleDeg: 240, color: "#ff7b72" },
        ],
      },
      {
        name: "L-shape (break it)",
        forces: [
          { label: "F_x", magnitude: 4, angleDeg: 0, color: "#5eb8ff" },
          { label: "F_y", magnitude: 3, angleDeg: 270, color: "#7ee787" },
        ],
      },
    ];

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

    function vecFromPolar(mag, angleDeg) {
      const r = (Math.PI / 180) * angleDeg;
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

    function getCenter() {
      const { w, h } = logicalSize();
      return { x: w * 0.5, y: h * 0.5 };
    }

    function clientToCanvas(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const { w, h } = logicalSize();
      return {
        x: ((clientX - rect.left) / rect.width) * w,
        y: ((clientY - rect.top) / rect.height) * h,
      };
    }

    function endPoint(force) {
      const c = getCenter();
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
      const c = getCenter();
      let best = null;
      let bestD = Infinity;
      for (let i = forces.length - 1; i >= 0; i--) {
        const f = forces[i];
        const tip = endPoint(f);
        const shaft = distToSegment(x, y, c.x, c.y, tip.x, tip.y);
        const dTip = Math.hypot(x - tip.x, y - tip.y);
        const d = Math.min(shaft, dTip);
        if (d < bestD && d < hitPad + headLen * 0.5) {
          bestD = d;
          best = f;
        }
      }
      return best;
    }

    function sumComponentsPhys() {
      let fx = 0, fy = 0;
      for (const f of forces) {
        const rad = (Math.PI / 180) * f.angleDeg;
        fx += f.magnitude * Math.cos(rad);
        fy += f.magnitude * Math.sin(rad);
      }
      return { fx, fy };
    }

    function netCanvas() {
      let sx = 0, sy = 0;
      for (const f of forces) {
        const v = vecFromPolar(f.magnitude * pxPerUnit, f.angleDeg);
        sx += v.x;
        sy += v.y;
      }
      return { sx, sy, mag: Math.hypot(sx, sy) };
    }

    function inEquilibrium() {
      const { fx, fy } = sumComponentsPhys();
      return Math.hypot(fx, fy) <= EPS;
    }

    function fmt(n, d) {
      if (!Number.isFinite(n)) return "—";
      return n.toFixed(d);
    }

    function loadScenario(sc) {
      forces = [];
      let nid = 1;
      sc.forces.forEach((p) => {
        forces.push({
          id: nid++,
          label: p.label,
          magnitude: p.magnitude,
          angleDeg: p.angleDeg,
          color: p.color,
        });
      });
      uid = nid;
      selectedId = forces.length ? forces[0].id : null;
      syncForm();
      redraw();
    }

    function addForce(partial) {
      const f = {
        id: uid++,
        label: partial.label || "F",
        magnitude: partial.magnitude ?? 2,
        angleDeg: partial.angleDeg ?? 0,
        color: partial.color || "#5eb8ff",
      };
      forces.push(f);
      selectedId = f.id;
      syncForm();
      redraw();
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
      redraw();
    }

    function drawArrow(x0, y0, x1, y1, color, lw, dash) {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lw;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      const ah = headLen;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ah * Math.cos(ang - 0.45), y1 - ah * Math.sin(ang - 0.45));
      ctx.lineTo(x1 - ah * Math.cos(ang + 0.45), y1 - ah * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawParticle(c) {
      const r = 11;
      ctx.save();
      ctx.fillStyle = inEquilibrium() ? "#1e3d2f" : "#2d3a4d";
      ctx.strokeStyle = inEquilibrium() ? "#7ee787" : "#5eb8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8b9cb3";
      ctx.font = "600 11px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("•", c.x, c.y);
      ctx.restore();
    }

    function redraw() {
      const { w, h } = logicalSize();
      ctx.clearRect(0, 0, w, h);
      const c = getCenter();
      const eq = inEquilibrium();

      ctx.save();
      ctx.strokeStyle = "rgba(139, 156, 179, 0.1)";
      ctx.lineWidth = 1;
      const step = 28;
      for (let gx = 0; gx < w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.restore();

      if (eq) {
        ctx.save();
        ctx.strokeStyle = "rgba(126, 231, 135, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const f of forces) {
        const tip = endPoint(f);
        const lw = f.id === selectedId ? 3 : 2;
        drawArrow(c.x, c.y, tip.x, tip.y, f.color, lw);
        ctx.save();
        ctx.fillStyle = "#e8eef5";
        ctx.font = "600 12px system-ui,sans-serif";
        const midx = (c.x + tip.x) / 2, midy = (c.y + tip.y) / 2;
        const ox = tip.x >= c.x ? 7 : -7, oy = tip.y >= c.y ? 12 : -8;
        ctx.textAlign = "center";
        ctx.fillText(f.label, midx + ox, midy + oy);
        ctx.restore();
      }

      const n = netCanvas();
      if (!eq && forces.length && n.mag > 1.5) {
        const tip = { x: c.x + n.sx, y: c.y + n.sy };
        drawArrow(c.x, c.y, tip.x, tip.y, "#f472b6", 2.2, [5, 5]);
        ctx.save();
        ctx.fillStyle = "#f472b6";
        ctx.font = "600 11px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("R", tip.x + 8, tip.y - 10);
        ctx.restore();
      }

      drawParticle(c);
      updateHud();
      renderCalc();
    }

    function updateHud() {
      const { fx, fy } = sumComponentsPhys();
      const r = Math.hypot(fx, fy);
      const ok = inEquilibrium();
      const chipClass = ok ? "chip ok" : "chip bad";
      const status = ok ? "Equilibrium" : "Not balanced";
      hud.innerHTML =
        '<span class="' + chipClass + '"><strong>' + status + "</strong></span>" +
        `<span class="chip">${ktex("|\\mathbf{R}| = " + fmt(r, 3) + "\\,\\mathrm{N}")}</span>` +
        `<span class="chip">${ktex("\\sum F_x = " + fmt(fx, 2) + "\\,\\mathrm{N}")}</span>` +
        `<span class="chip">${ktex("\\sum F_y = " + fmt(fy, 2) + "\\,\\mathrm{N}")}</span>`;
    }

    function renderCalc() {
      const { fx, fy } = sumComponentsPhys();
      const r = Math.hypot(fx, fy);
      const ok = inEquilibrium();
      const rows = forces.length === 0
          ? '<tr><td colspan="5">Add forces or pick a scenario.</td></tr>'
          : forces.map((f) => {
                const rad = (Math.PI / 180) * f.angleDeg;
                const px = f.magnitude * Math.cos(rad);
                const py = f.magnitude * Math.sin(rad);
                return `<tr><td>${escapeHtml(f.label)}</td><td>${fmt(f.magnitude, 2)}</td><td>${Math.round(f.angleDeg)}</td><td>${fmt(px, 2)}</td><td>${fmt(py, 2)}</td></tr>`;
              }).join("");
      const thead = `<thead><tr><th>Label</th><th>${ktex("|F|")}</th><th>${ktex("\\theta")}</th><th>${ktex("F_x")}</th><th>${ktex("F_y")}</th></tr></thead>`;
      const sumRow = `<tr><th colspan="2">${ktex("\\sum")}</th><th></th><td>${fmt(fx, 2)}</td><td>${fmt(fy, 2)}</td></tr>`;
      
      calcRoot.innerHTML =
        `<p>${ktex("\\text{Translational equilibrium: } \\sum \\mathbf{F} = \\mathbf{0} \\Leftrightarrow \\sum F_x = 0,\\ \\sum F_y = 0.")}</p>` +
        `<p>${ktex("\\text{Numerical tolerance: } |\\mathbf{R}| = \\sqrt{(\\sum F_x)^2 + (\\sum F_y)^2} \\le " + fmt(EPS, 2) + "\\,\\mathrm{N}.")}</p>` +
        `<p class="formula"><strong>Status:</strong> ${ok ? ktex("\\sum\\mathbf{F} \\approx \\mathbf{0}\\ \\text{(balanced)}") : ktex("|\\mathbf{R}| = " + fmt(r, 3) + "\\,\\mathrm{N} > " + fmt(EPS, 2) + "\\,\\mathrm{N}")}</p>` +
        `<table>${thead}<tbody>${rows}${sumRow}</tbody></table>` +
        `<p>${ktex("\\mathbf{R} = \\sum_i \\mathbf{F}_i, \\quad R_x = " + fmt(fx, 3) + "\\,\\mathrm{N},\\ R_y = " + fmt(fy, 3) + "\\,\\mathrm{N}")}</p>`;
    }

    function syncForm() {
      const f = forces.find((x) => x.id === selectedId);
      if (!f) {
        labelInput.value = "";
        return;
      }
      labelInput.value = f.label;
      magSlider.value = String(f.magnitude);
      angSlider.value = String(Math.round(f.angleDeg));
      magVal.textContent = Number(f.magnitude).toFixed(2);
      angVal.textContent = String(Math.round(f.angleDeg));
    }

    function applyForm() {
      const f = forces.find((x) => x.id === selectedId);
      if (!f) return;
      f.label = labelInput.value.trim() || "F";
      f.magnitude = Math.max(0, Math.min(10, parseFloat(magSlider.value) || 0));
      f.angleDeg = ((parseFloat(angSlider.value) || 0) % 360 + 360) % 360;
      magVal.textContent = f.magnitude.toFixed(2);
      angVal.textContent = String(Math.round(f.angleDeg));
      redraw();
    }

    const presetsEl = $("presets");
    presetsEl.innerHTML = ''; // clear if HMR
    SCENARIOS.forEach((sc) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "preset";
      b.textContent = sc.name;
      b.addEventListener("click", () => loadScenario(sc));
      presetsEl.appendChild(b);
    });

    magSlider.addEventListener("input", () => {
      magVal.textContent = parseFloat(magSlider.value).toFixed(2);
      applyForm();
    });
    angSlider.addEventListener("input", () => {
      angVal.textContent = angSlider.value;
      applyForm();
    });
    labelInput.addEventListener("input", applyForm);

    $("addForce").addEventListener("click", () => {
      addForce({
        label: labelInput.value.trim() || "F",
        magnitude: parseFloat(magSlider.value) || 2,
        angleDeg: parseFloat(angSlider.value) || 0,
        color: "#94a3b8",
      });
    });
    $("dupForce").addEventListener("click", () => {
      const f = forces.find((x) => x.id === selectedId);
      if (!f) return;
      addForce({
        label: f.label + "′",
        magnitude: f.magnitude,
        angleDeg: f.angleDeg,
        color: f.color,
      });
    });
    $("delForce").addEventListener("click", () => {
      forces = forces.filter((x) => x.id !== selectedId);
      selectedId = forces.length ? forces[forces.length - 1].id : null;
      syncForm();
      redraw();
    });
    $("clearAll").addEventListener("click", () => {
      forces = [];
      selectedId = null;
      syncForm();
      redraw();
    });

    let drag = null;
    function pointerDown(e) {
      const pick = pickForce(e.clientX, e.clientY);
      if (pick) {
        selectedId = pick.id;
        syncForm();
        canvas.classList.add("dragging");
        drag = { id: pick.id, pointerId: e.pointerId };
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      } else {
        selectedId = null;
        syncForm();
        redraw();
      }
    }
    function pointerMove(e) {
      if (!drag) return;
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      const c = getCenter();
      const f = forces.find((q) => q.id === drag.id);
      if (!f) return;
      const pol = polarFromVec(x - c.x, y - c.y);
      f.magnitude = Math.max(0, Math.min(10, pol.mag / pxPerUnit));
      f.angleDeg = pol.deg;
      magSlider.value = String(f.magnitude);
      angSlider.value = String(Math.round(f.angleDeg));
      magVal.textContent = f.magnitude.toFixed(2);
      angVal.textContent = String(Math.round(f.angleDeg));
      redraw();
    }
    function pointerUp(e) {
      if (drag && e && typeof e.pointerId === "number") {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      drag = null;
      canvas.classList.remove("dragging");
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
    const hintEl = $("hint-eq");
    if (hintEl) {
      hintEl.innerHTML = ktex("|\\mathbf{R}| \\le " + fmt(EPS, 2) + "\\,\\mathrm{N}");
    }
    loadScenario(SCENARIOS[0]);

    return () => {
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
    };

  }, []);

  return (
    <div className="eq-wrapper" ref={rootRef}>
      <div className="stage-wrap">
        <div className="arena-shell">
          <div className="arena" id="arena">
            <canvas id="stage" aria-label="Equilibrium of forces canvas"></canvas>
            <div className="hud" id="hud"></div>
          </div>
        </div>
      </div>
      <div className="panel">
        <h2 className="seg-title" style={{marginTop: 0}}>Scenarios</h2>
        <div className="presets" id="presets"></div>
        <h2 className="seg-title">Selected force</h2>
        <div className="row">
          <label className="grow" style={{flex: '2 1 160px'}}>
            Label
            <input type="text" id="label" maxLength="20" placeholder="e.g. T" autoComplete="off" />
          </label>
        </div>
        <div className="row">
          <label className="grow">
            Magnitude (N) <span id="magVal">3</span>
            <input type="range" id="magnitude" min="0" max="10" step="0.05" defaultValue="3" />
          </label>
        </div>
        <div className="row">
          <label className="grow">
            Angle ° <span id="angVal">0</span>
            <input type="range" id="angle" min="0" max="359" step="1" defaultValue="0" />
          </label>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary grow" id="addForce">Add force</button>
          <button type="button" className="btn btn-ghost" id="dupForce">Duplicate</button>
        </div>
        <div className="row">
          <button type="button" className="btn btn-danger" id="delForce">Remove</button>
          <button type="button" className="btn btn-ghost" id="clearAll">Clear all</button>
        </div>
        <details className="calc-details" id="calcDetails" open>
          <summary>Conditions &amp; calculations</summary>
          <div className="calc-body" id="calcRoot"></div>
        </details>
        <p className="hint">Forces are in newtons (N). Equilibrium when <span id="hint-eq"></span>. Drag an arrowhead to edit; tap empty space to deselect.</p>
      </div>
    </div>
  );
}

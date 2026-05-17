import { render, useState, useEffect, useRef } from '/src/utils/react-lite.js';
import './BeamSimulation.css';

export default function BeamSimulation() {
  const rootRef = useRef(null);

  // State mapping
  const [loads, setLoads] = useState([{ type: 'point', P: 8, a: 3, id: 0 }]);
  const [beamType, setBeamType] = useState('simply');
  const [L, setL] = useState(6.0);
  const [E_GPa, setE_GPa] = useState(200);
  const [yield_MPa, setYield_MPa] = useState(250);
  const [sectionType, setSectionType] = useState('rect');
  
  // Section params
  const [bRect, setBRect] = useState(80);
  const [hRect, setHRect] = useState(150);
  const [circleDia, setCircleDia] = useState(100);
  const [ibeamH, setIbeamH] = useState(200);

  const [nextLoadId, setNextLoadId] = useState(1);
  const [dragTarget, setDragTarget] = useState(null);

  const beamCanvasRef = useRef(null);
  const shearCanvasRef = useRef(null);
  const momentCanvasRef = useRef(null);
  const deflCanvasRef = useRef(null);
  const stressCanvasRef = useRef(null);
  
  const stateRef = useRef({ loads, beamType, L, E_GPa, yield_MPa, sectionType, bRect, hRect, circleDia, ibeamH, dragTarget });

  useEffect(() => {
    stateRef.current = { loads, beamType, L, E_GPa, yield_MPa, sectionType, bRect, hRect, circleDia, ibeamH, dragTarget };
    updateAnalysisAndDraw();
  }, [loads, beamType, L, E_GPa, yield_MPa, sectionType, bRect, hRect, circleDia, ibeamH]);

  const addPointLoad = () => {
    setLoads([...loads, { type: 'point', P: 8, a: L/2, id: nextLoadId }]);
    setNextLoadId(prev => prev + 1);
  };

  const addUDL = () => {
    setLoads([...loads, { type: 'udl', w: 3, xStart: 0, xEnd: L, id: nextLoadId }]);
    setNextLoadId(prev => prev + 1);
  };

  const clearLoads = () => {
    setLoads([]);
  };

  const updateLoad = (id, field, value) => {
    setLoads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLoad = (id) => {
    setLoads(prev => prev.filter(l => l.id !== id));
  };

  function getSection() {
    let sec = { type: sectionType, I: 0, ymax: 0 };
    if (sectionType === "rect") {
      let b = bRect / 1000, h = hRect / 1000;
      sec = { type: "rect", b, h, I: b * Math.pow(h, 3) / 12, ymax: h / 2 };
    } else if (sectionType === "circle") {
      let d = circleDia / 1000;
      sec = { type: "circle", d, I: Math.PI * Math.pow(d, 4) / 64, ymax: d / 2 };
    } else if (sectionType === "ibeam") {
      let h = ibeamH / 1000; let bf = 0.2; let tf = 0.015; let tw = 0.009;
      let I = (bf * Math.pow(h, 3) - (bf - tw) * Math.pow(h - 2 * tf, 3)) / 12;
      sec = { type: "ibeam", h, I, ymax: h / 2 };
    }
    return sec;
  }

  function getSingleLoadContrib(load, currentBeamType, currentL, EI) {
    if (load.type === "point") {
      let P = load.P * 1000; // N
      let a = load.a;
      let b = currentL - a;
      if (currentBeamType === "simply") {
        let R1 = P * b / currentL;
        let V = (x) => (x < a) ? R1 : R1 - P;
        let M = (x) => (x < a) ? R1 * x : R1 * x - P * (x - a);
        let y = (x) => {
          if (x <= a) return (P * b * x / (6 * EI * currentL)) * (currentL * currentL - b * b - x * x);
          else return (P * b / (6 * EI * currentL)) * (currentL / b * Math.pow(x - a, 3) + (currentL * currentL - b * b) * x - x * x * x);
        };
        return { V, M, y };
      } else if (currentBeamType === "cantilever") {
        let V = (x) => (x < a) ? -P : 0;
        let M = (x) => (x < a) ? -P * (a - x) : 0;
        let y = (x) => {
          if (x <= a) return (-P * x * x / (6 * EI)) * (3 * a - x);
          else return (-P * a * a / (6 * EI)) * (3 * x - a);
        };
        return { V, M, y };
      } else if (currentBeamType === "fixed") {
        let a1 = a, b1 = currentL - a;
        let R1 = P * b1 * b1 * (3 * a1 + b1) / (Math.pow(currentL, 3));
        let M1 = -P * a1 * b1 * b1 / (currentL * currentL);
        let V = (x) => (x < a1) ? R1 : R1 - P;
        let M = (x) => (x < a1) ? M1 + R1 * x : M1 + R1 * x - P * (x - a1);
        return { V, M, y: null };
      }
    } else if (load.type === "udl") {
      let w = load.w * 1000; // N/m
      let x1 = load.xStart, x2 = load.xEnd;
      let len = x2 - x1;
      if (currentBeamType === "simply") {
        let total = w * len;
        let centroid = x1 + len / 2;
        let R1 = total * (currentL - centroid) / currentL;
        let V = (x) => {
          let v = R1;
          if (x > x1) v -= w * Math.min(len, Math.max(0, x - x1));
          return v;
        };
        let M = (x) => {
          let m = R1 * x;
          if (x > x1) {
            let lx = Math.min(len, Math.max(0, x - x1));
            m -= w * lx * lx / 2;
          }
          return m;
        };
        return { V, M, y: null };
      } else if (currentBeamType === "cantilever") {
        let total = w * len;
        let centroid = x1 + len / 2;
        let V = (x) => {
          if (x < x1) return 0;
          else if (x > x2) return -total;
          else return -w * (x - x1);
        };
        let M = (x) => {
          if (x < x1) return 0;
          else if (x > x2) return -total * (x - centroid);
          else return -w * (x - x1) * (x - x1) / 2;
        };
        return { V, M, y: null };
      }
    }
    return { V: () => 0, M: () => 0, y: null };
  }

  function computeFullResponse(nPoints = 250, sec) {
    const s = stateRef.current;
    const EI = s.E_GPa * 1e9 * sec.I;
    let x = Array.from({ length: nPoints }, (_, i) => i / (nPoints - 1) * s.L);
    let V_arr = new Array(nPoints).fill(0);
    let M_arr = new Array(nPoints).fill(0);

    for (let load of s.loads) {
      let { V, M } = getSingleLoadContrib(load, s.beamType, s.L, EI);
      for (let i = 0; i < nPoints; i++) {
        let xi = x[i];
        let vv = V(xi);
        let mm = M(xi);
        if (isFinite(vv)) V_arr[i] += vv / 1000; // kN
        if (isFinite(mm)) M_arr[i] += mm / 1000; // kN·m
      }
    }

    let slope = new Array(nPoints).fill(0);
    let defl = new Array(nPoints).fill(0);
    let dx = s.L / (nPoints - 1);
    for (let i = 1; i < nPoints; i++) {
      let avgM = (M_arr[i - 1] + M_arr[i]) / 2 * 1000; // N·m
      slope[i] = slope[i - 1] + avgM / EI * dx;
    }
    for (let i = 1; i < nPoints; i++) {
      let avgSlope = (slope[i - 1] + slope[i]) / 2;
      defl[i] = defl[i - 1] + avgSlope * dx;
    }

    if (s.beamType === "simply") {
      let y0 = defl[0], yL = defl[nPoints - 1];
      let A = (yL - y0) / s.L;
      for (let i = 0; i < nPoints; i++) defl[i] -= (y0 + A * x[i]);
    } else if (s.beamType === "cantilever") {
      let y0 = defl[0];
      for (let i = 0; i < nPoints; i++) defl[i] -= y0;
      let slope0 = slope[0];
      for (let i = 0; i < nPoints; i++) slope[i] -= slope0;
    } else if (s.beamType === "fixed") {
      let y0 = defl[0], yL = defl[nPoints - 1];
      let A = (yL - y0) / s.L;
      for (let i = 0; i < nPoints; i++) defl[i] -= (y0 + A * x[i]);
    }
    return { x, V_arr, M_arr, defl };
  }

  function drawBeamAndLoads(ctx, w, h, x_vals, defl) {
    const s = stateRef.current;
    ctx.clearRect(0, 0, w, h);
    let yBase = h / 2;
    let marginX = 40;
    let scaleX = (w - 2 * marginX) / s.L;
    let scaleYdef = 400; // exaggeration
    
    // Support drawing
    ctx.beginPath();
    ctx.moveTo(marginX, yBase);
    ctx.lineTo(marginX + s.L * scaleX, yBase);
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Deformed shape
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < x_vals.length; i++) {
      let xp = marginX + x_vals[i] * scaleX;
      let yp = yBase - defl[i] * scaleYdef;
      if (first) { ctx.moveTo(xp, yp); first = false; }
      else ctx.lineTo(xp, yp);
    }
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Supports
    ctx.fillStyle = "#475569";
    if (s.beamType === "simply") {
      ctx.fillRect(marginX - 6, yBase - 8, 12, 16);
      ctx.fillRect(marginX + s.L * scaleX - 6, yBase - 8, 12, 16);
    } else if (s.beamType === "cantilever") {
      ctx.fillRect(marginX - 10, yBase - 15, 20, 30);
    } else if (s.beamType === "fixed") {
      ctx.fillRect(marginX - 10, yBase - 15, 20, 30);
      ctx.fillRect(marginX + s.L * scaleX - 10, yBase - 15, 20, 30);
    }
    
    // Loads
    for (let load of s.loads) {
      if (load.type === "point") {
        let xPos = marginX + load.a * scaleX;
        ctx.beginPath();
        ctx.arc(xPos, yBase - 12, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "#f97316";
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 9px 'Segoe UI'";
        ctx.fillText(`${load.P} kN`, xPos - 8, yBase - 8);
      }
    }
  }

  function drawDiagram(ctx, w, h, x_vals, values, label, color, zeroLine) {
    const s = stateRef.current;
    ctx.clearRect(0, 0, w, h);
    let minVal = Math.min(...values, 0);
    let maxVal = Math.max(...values, 0);
    let range = Math.max(0.01, maxVal - minVal);
    let margin = { left: 45, right: 25, top: 15, bottom: 25 };
    let graphW = w - margin.left - margin.right;
    let graphH = h - margin.top - margin.bottom;
    let scaleX = graphW / s.L;
    let scaleY = graphH / range;
    
    function xPx(x) { return margin.left + x * scaleX; }
    function yPx(val) { return margin.top + graphH - (val - minVal) * scaleY; }
    
    // Axes
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphH);
    ctx.lineTo(margin.left + graphW, margin.top + graphH);
    ctx.strokeStyle = "#64748b";
    ctx.stroke();
    
    if (zeroLine) {
      let y0 = yPx(0);
      ctx.beginPath(); ctx.moveTo(margin.left, y0); ctx.lineTo(margin.left + graphW, y0);
      ctx.strokeStyle = "#94a3b8"; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
    
    ctx.beginPath();
    for (let i = 0; i < x_vals.length; i++) {
      let x = xPx(x_vals[i]);
      let y = yPx(values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    ctx.fillStyle = "#1e293b";
    ctx.font = "10px 'Segoe UI'";
    ctx.fillText(label, w - 80, 20);
  }

  function drawStressDistribution(ctx, w, h, M_max_kNm, sec) {
    ctx.clearRect(0, 0, w, h);
    let M = M_max_kNm * 1000;
    let ymax = sec.ymax;
    let I = sec.I;
    let centerY = h / 2;
    let scaleYpx = (h - 40) / (2 * ymax);
    let widthBar = 100;
    let left = w / 2 - widthBar / 2;
    let top = centerY - ymax * scaleYpx;
    let bot = centerY + ymax * scaleYpx;
    
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(left, top, widthBar, bot - top);
    ctx.strokeRect(left, top, widthBar, bot - top);
    
    if (I > 0) {
      for (let y = top; y <= bot; y++) {
        let y_local = (centerY - y) / scaleYpx;
        let sigma = M * y_local / I / 1e6;
        let intensity = Math.min(1, Math.abs(sigma) / 200);
        let r = sigma > 0 ? 200 : 80;
        let b = sigma < 0 ? 200 : 80;
        ctx.fillStyle = `rgba(${r}, 50, ${b}, ${0.3 + intensity * 0.5})`;
        ctx.fillRect(left, y, widthBar, 1);
      }
    }
    
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 10px 'Segoe UI'";
    const maxS = I > 0 ? (M * ymax / I / 1e6).toFixed(1) : 0;
    ctx.fillText(`max σ = ${maxS} MPa`, w / 2 - 60, 20);
    ctx.fillText("Tension +", w / 2 + 60, centerY - 15);
    ctx.fillText("Compression -", w / 2 + 60, centerY + 20);
  }

  const updateAnalysisAndDraw = () => {
    const sec = getSection();
    const { x, V_arr, M_arr, defl } = computeFullResponse(300, sec);
    let maxM_kNm = Math.max(...M_arr.map(Math.abs));
    let maxStressMPa = sec.I > 0 ? (maxM_kNm * 1000 * sec.ymax) / sec.I / 1e6 : 0;
    let maxDefl_mm = Math.min(...defl) * 1000 * -1;
    let fos = yield_MPa / (Math.abs(maxStressMPa) + 1e-9);
    
    let failed = false;
    let failMsg = "";
    if (maxStressMPa > yield_MPa) { failed = true; failMsg = ` YIELD FAILURE (${maxStressMPa.toFixed(1)} > ${yield_MPa} MPa)`; }
    let deflLimit = stateRef.current.L * 1000 / 250;
    if (maxDefl_mm > deflLimit) { failed = true; failMsg += ` | Excessive deflection ${maxDefl_mm.toFixed(1)} mm > ${deflLimit.toFixed(1)} mm`; }
    if (!failed) failMsg = " Intact | FOS = " + fos.toFixed(2);
    
    const failEl = rootRef.current?.querySelector('#liveFailureMsg');
    if (failEl) failEl.innerHTML = failMsg;
    const maxD = rootRef.current?.querySelector('#maxDefl');
    if (maxD) maxD.innerHTML = maxDefl_mm.toFixed(1) + " mm";
    const maxS = rootRef.current?.querySelector('#maxStress');
    if (maxS) maxS.innerHTML = maxStressMPa.toFixed(1) + " MPa";
    const sf = rootRef.current?.querySelector('#safetyFactor');
    if (sf) sf.innerHTML = fos.toFixed(2);

    // Draw
    if (beamCanvasRef.current) drawBeamAndLoads(beamCanvasRef.current.getContext('2d'), beamCanvasRef.current.width, beamCanvasRef.current.height, x, defl);
    if (shearCanvasRef.current) drawDiagram(shearCanvasRef.current.getContext('2d'), shearCanvasRef.current.width, shearCanvasRef.current.height, x, V_arr, "Shear V (kN)", "#dc2626", true);
    if (momentCanvasRef.current) drawDiagram(momentCanvasRef.current.getContext('2d'), momentCanvasRef.current.width, momentCanvasRef.current.height, x, M_arr, "Moment M (kN·m)", "#f59e0b", true);
    if (deflCanvasRef.current) drawDiagram(deflCanvasRef.current.getContext('2d'), deflCanvasRef.current.width, deflCanvasRef.current.height, x, defl.map(v => v * 1000), "Deflection (mm)", "#10b981", false);
    if (stressCanvasRef.current) drawStressDistribution(stressCanvasRef.current.getContext('2d'), stressCanvasRef.current.width, stressCanvasRef.current.height, maxM_kNm, sec);
  };

  useEffect(() => {
    const handleResize = () => updateAnalysisAndDraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBeamPointerDown = (e) => {
    const canvas = beamCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleXbeam = canvas.width / rect.width;
    let mouseX = (e.clientX - rect.left) * scaleXbeam;
    let marginX = 40;
    let scaleX = (canvas.width - 2 * marginX) / L;
    
    for (let load of loads) {
      if (load.type !== "point") continue;
      let xPos = marginX + load.a * scaleX;
      if (Math.abs(mouseX - xPos) < 15) {
        setDragTarget(load.id);
        canvas.setPointerCapture?.(e.pointerId);
        break;
      }
    }
  };

  const handleWindowPointerMove = (e) => {
    if (stateRef.current.dragTarget === null) return;
    const canvas = beamCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleXbeam = canvas.width / rect.width;
    let mouseX = (e.clientX - rect.left) * scaleXbeam;
    let marginX = 40;
    let scaleX = (canvas.width - 2 * marginX) / stateRef.current.L;
    let newA = (mouseX - marginX) / scaleX;
    newA = Math.min(stateRef.current.L, Math.max(0, newA));
    
    setLoads(prev => prev.map(l => l.id === stateRef.current.dragTarget ? { ...l, a: parseFloat(newA.toFixed(2)) } : l));
  };

  const handleWindowPointerUp = (e) => {
    if (stateRef.current.dragTarget !== null) {
      beamCanvasRef.current?.releasePointerCapture?.(e.pointerId);
      setDragTarget(null);
    }
  };

  useEffect(() => {
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, []);

  const section = getSection();

  return (
    <div className="beam-wrapper" ref={rootRef}>
      <div className="sim-card">
        <div className="header">
          <h1> Ultimate Beam Bending Simulator <small>live shear · moment · deflection · stress</small></h1>
          <div className="sub"> Interactive loads · real‑time failure & deformation · drag load position → instant update</div>
        </div>
        
        <div className="flex-dashboard">
          <div className="controls">
            <div className="ctrl-group">
              <label> Beam configuration</label>
              <select value={beamType} onChange={e => setBeamType(e.target.value)} style={{ width: '100%', padding: '6px' }}>
                <option value="simply"> Simply supported</option>
                <option value="cantilever"> Cantilever (fixed left)</option>
                <option value="fixed"> Fixed‑fixed</option>
              </select>
              <div className="param-row" style={{ marginTop: '8px' }}>
                <span>Length L (m):</span>
                <input type="range" min="1" max="12" step="0.1" value={L} onChange={e => setL(Number(e.target.value))} />
                <span className="num-input">{L.toFixed(1)}</span>
              </div>
            </div>

            <div className="ctrl-group">
              <label> Material & cross‑section</label>
              <div className="param-row">
                <span>E (GPa):</span><input type="number" value={E_GPa} onChange={e => setE_GPa(Number(e.target.value))} step="5" style={{ width: '80px' }} className="num-input" />
                <span>σ_y (MPa):</span><input type="number" value={yield_MPa} onChange={e => setYield_MPa(Number(e.target.value))} step="10" style={{ width: '80px' }} className="num-input" />
              </div>
              <select value={sectionType} onChange={e => setSectionType(e.target.value)} style={{ width: '100%', marginTop: '6px', padding: '6px' }}>
                <option value="rect"> Rectangle (b x h)</option>
                <option value="circle"> Circle (diameter)</option>
                <option value="ibeam"> I‑beam (HEB)</option>
              </select>
              <div style={{ marginTop: '6px' }}>
                {sectionType === 'rect' && (
                  <div className="param-row">
                    <span>b (mm):</span><input type="number" value={bRect} onChange={e => setBRect(Number(e.target.value))} step="5" className="num-input" style={{ width: '70px' }} /> 
                    <span>h (mm):</span><input type="number" value={hRect} onChange={e => setHRect(Number(e.target.value))} step="5" className="num-input" style={{ width: '70px' }} />
                  </div>
                )}
                {sectionType === 'circle' && (
                  <div className="param-row">
                    <span>dia (mm):</span><input type="number" value={circleDia} onChange={e => setCircleDia(Number(e.target.value))} step="5" className="num-input" style={{ width: '70px' }} />
                  </div>
                )}
                {sectionType === 'ibeam' && (
                  <div className="param-row">
                    <span>h (mm):</span><input type="number" value={ibeamH} onChange={e => setIbeamH(Number(e.target.value))} step="10" className="num-input" style={{ width: '70px' }} />
                  </div>
                )}
              </div>
              <div className="badge" style={{ marginTop: '8px', textAlign: 'center' }}>I = {(section.I * 1e8).toFixed(1)} cm⁴</div>
            </div>

            <div className="ctrl-group">
              <label> Loads (superposition)</label>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {loads.map(load => (
                  <div key={load.id} className="load-item">
                    {load.type === 'point' ? (
                      <>
                        <span style={{ fontWeight: 'bold' }}> Point</span>
                        <input type="number" value={load.P} onChange={e => updateLoad(load.id, 'P', Number(e.target.value))} step="1" /> kN
                        <span>@ x=</span>
                        <input type="number" value={load.a} onChange={e => updateLoad(load.id, 'a', Number(e.target.value))} step="0.2" /> m
                      </>
                    ) : (
                      <>
                        <span style={{ fontWeight: 'bold' }}> UDL</span>
                        <input type="number" value={load.w} onChange={e => updateLoad(load.id, 'w', Number(e.target.value))} step="0.5" /> kN/m
                        <span>from</span><input type="number" value={load.xStart} onChange={e => updateLoad(load.id, 'xStart', Number(e.target.value))} step="0.5" />
                        <span>to</span><input type="number" value={load.xEnd} onChange={e => updateLoad(load.id, 'xEnd', Number(e.target.value))} step="0.5" />
                      </>
                    )}
                    <button className="removeLoadBtn" onClick={() => removeLoad(load.id)}></button>
                  </div>
                ))}
              </div>
              <div className="param-row" style={{ marginTop: '8px' }}>
                <button onClick={addPointLoad}> Point load</button>
                <button onClick={addUDL}> UDL</button>
                <button onClick={clearLoads} className="secondary">Clear all</button>
              </div>
              <div className="warning-card" id="liveFailureMsg">
                 Intact
              </div>
            </div>

            <div className="stress-dist">
              <strong> Max values</strong><br />
              Deflection: <span id="maxDefl" className="badge">-- mm</span><br />
              Bending stress: <span id="maxStress" className="badge">-- MPa</span><br />
              Safety factor: <span id="safetyFactor" className="badge">--</span>
            </div>
          </div>

          <div className="visualization">
            <canvas ref={beamCanvasRef} onPointerDown={handleBeamPointerDown} width="800" height="180" style={{ aspectRatio: '800/180', cursor: dragTarget !== null ? 'grabbing' : 'pointer', touchAction: 'none' }}></canvas>
            <canvas ref={shearCanvasRef} width="800" height="150" style={{ aspectRatio: '800/150' }}></canvas>
            <canvas ref={momentCanvasRef} width="800" height="150" style={{ aspectRatio: '800/150' }}></canvas>
            <canvas ref={deflCanvasRef} width="800" height="150" style={{ aspectRatio: '800/150' }}></canvas>
            
            <div className="legend">
              <span> Deformed shape (exaggerated)</span>
              <span> Shear Force (kN)</span>
              <span> Bending Moment (kN·m)</span>
              <span> Deflection (mm)</span>
            </div>
            
            <canvas ref={stressCanvasRef} width="600" height="120" style={{ width: '100%', background: '#fefce8', borderRadius: '1rem' }}></canvas>
            <div className="legend"> Stress distribution σ = M·y / I (tension + compression)</div>
            <div style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '6px' }}> Tip: drag the point load circles on the beam to change position interactively!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountBeamSimulation(container) {
  const app = render(BeamSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

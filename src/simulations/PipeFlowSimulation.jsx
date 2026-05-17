import { render, useEffect, useRef } from '/src/utils/react-lite.js';
import './PipeFlowSimulation.css';

export default function PipeFlowSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // --- DOM elements ---
    const lengthSlider = $("length");
    const diamSlider = $("diam");
    const roughSlider = $("rough");
    const flowVal = $("flowVal");
    const bendsSlider = $("bends");
    const valveSlider = $("valve");
    const viscSlider = $("visc");
    const pumpSlider = $("pumpPower");
    const warningDiv = $("failureWarning");
    const reSpan = $("reDisplay");
    const outletSpan = $("outletPress");

    const pipeCanvas = $("pipeCanvas");
    const ctxPipe = pipeCanvas.getContext('2d');
    const curveCanvas = $("curveCanvas");
    const ctxCurve = curveCanvas.getContext('2d');

    let width = 800, heightPipe = 440;
    let animFrame;
    let particles = [];

    // Physical constants
    const g = 9.81;
    const rho = 998;      // kg/m³ (water)
    const vaporPressureKPa = 2.34;   // kPa abs ~ cavitation threshold (gauge ~ -99 kPa)
    const atmPressureKPa = 101.3;
    
    // Helper: update numeric displays
    function bindEvents() {
        const sliders = [lengthSlider, diamSlider, roughSlider, bendsSlider, valveSlider, viscSlider, pumpSlider];
        sliders.forEach(s => {
            s.addEventListener('input', () => {
                const valSpan = $(s.id + 'Val');
                if (valSpan) valSpan.innerText = s.value;
                updateAll();
            });
        });
    }

    // Colebrook-White friction factor (iterative)
    function frictionFactor(Re, epsD) {
        if (Re <= 0) return 0.02;
        if (Re <= 2000) return 64 / Re; // laminar
        // turbulent: Colebrook approx
        let f = 0.02;
        for (let i = 0; i < 8; i++) {
            const a = -2.0 * Math.log10(epsD / 3.7 + 2.51 / (Re * Math.sqrt(f)));
            f = Math.pow(1 / a, 2);
        }
        return Math.max(0.008, f);
    }

    // Minor loss coefficients
    function minorLossCoeff(bends, valveOpening) {
        const K_bend = bends * 0.45;      // each 90° bend K≈0.45
        const K_valve = valveOpening > 0.01
            ? Math.min(40, 4.5 * Math.pow(1 - valveOpening, 1.5) + 0.2)
            : 100;
        return K_bend + K_valve;
    }

    function computeHydraulics() {
        const L = parseFloat(lengthSlider.value);
        const D_mm = parseFloat(diamSlider.value);
        const D = D_mm / 1000;        // m
        const eps_mm = parseFloat(roughSlider.value);
        const eps = eps_mm / 1000;     // m
        const nu_cSt = parseFloat(viscSlider.value);
        const nu = nu_cSt * 1e-6;       // m²/s
        const bends = parseInt(bendsSlider.value);
        const valveOpen = parseFloat(valveSlider.value);
        const pumpPower = parseFloat(pumpSlider.value); // W

        // Solve for operating flow rate Q matching system curve and supply
        const A = Math.PI * D * D / 4;
        const supplyHead = (180 * 1000) / (rho * g);
        let low = 0.0001; 
        let high = 1.0; // up to 3600 m3/h
        let midQ = 0;
        for (let iter = 0; iter < 45; iter++) {
            midQ = (low + high) / 2;
            let V_test = midQ / A;
            let Re_test = V_test * D / nu;
            let f_test = frictionFactor(Re_test, eps / D);
            let K_test = minorLossCoeff(bends, valveOpen);
            let H_sys = (f_test * L / D + K_test) * V_test * V_test / (2 * g);
            let H_pump = 0;
            if (pumpPower > 0) {
                H_pump = (pumpPower * 0.65) / (rho * g * midQ);
                if (H_pump > 120) H_pump = 120;
            }
            if (H_sys > supplyHead + H_pump) high = midQ;
            else low = midQ;
        }
        const Q = midQ;
        const Q_m3h = Q * 3600;

        if (flowVal) flowVal.innerText = Q_m3h.toFixed(1);

        // area & velocity
        const V = Q / A;
        const Re = V * D / nu;
        let flowRegime = "Laminar";
        if (Re > 4000) flowRegime = "Turbulent";
        else if (Re > 2000) flowRegime = "Transitional";
        
        const epsD = eps / D;
        const f = frictionFactor(Re, epsD);
        // Darcy friction head loss
        const h_friction = f * (L / D) * (V * V) / (2 * g);
        // minor losses
        const K_minor = minorLossCoeff(bends, valveOpen);
        const h_minor = K_minor * (V * V) / (2 * g);
        const totalHeadLoss = h_friction + h_minor;   // meters
        
        // inlet pressure (at pipe start) from pump or default tank pressure
        let effectivePumpHead = 0;
        if (pumpPower > 0 && Q > 0.0001) {
            const eff = 0.65; // efficiency
            effectivePumpHead = Math.min(120, (pumpPower * eff) / (rho * g * Q));
        }
        // starting pressure: typical supply pressure (200 kPa gauge) + pump head (converted)
        const supplyPressure_kPa = 180;   // kPa gauge from reservoir
        const pumpDeltaP = effectivePumpHead * rho * g / 1000;
        let inletPressure_kPa = supplyPressure_kPa + pumpDeltaP;
        if (inletPressure_kPa < 20) inletPressure_kPa = 20;
        
        // outlet pressure (gauge)
        let outletPressure_kPa = inletPressure_kPa - (totalHeadLoss * rho * g / 1000);
        let cavitationRisk = false;
        let warningMsg;
        if (outletPressure_kPa < 5.0) {
            cavitationRisk = true;
            warningMsg = " CRITICAL: Very high head loss! Outlet pressure near zero → CAVITATION risk! Increase diameter or reduce flow.";
            if (outletPressure_kPa < -20) outletPressure_kPa = -20;
        } else if (outletPressure_kPa < 15) {
            warningMsg = " Low outlet pressure, risk of insufficient flow / cavitation near fittings.";
        } else if (V > 7.0) {
            warningMsg = " Very high velocity (>7 m/s) → Excessive head loss! Increase diameter.";
        } else {
            warningMsg = " System operating within reasonable range.";
        }
        if (outletPressure_kPa < vaporPressureKPa - atmPressureKPa) cavitationRisk = true;
        
        const pressureDropTotal = (inletPressure_kPa - outletPressure_kPa);
        const pressureProfile = (pos) => inletPressure_kPa - pressureDropTotal * pos;
        
        return {
            L, D_mm, D, Q_m3h, Q, V, Re, flowRegime, f, epsD, totalHeadLoss,
            h_friction, h_minor, K_minor, inletPressure_kPa, outletPressure_kPa,
            pressureProfile, cavitationRisk, warningMsg, pumpHead_m: effectivePumpHead,
            pumpPowerActual: pumpPower, bends, valveOpen
        };
    }
    
    function initParticles() {
        particles = [];
        for (let i = 0; i < 28; i++) {
            particles.push({ x: Math.random(), yOffset: (Math.random() * 0.6 + 0.2), speedFactor: 0.5 + Math.random() * 0.8 });
        }
    }
    
    function updateParticles(flowVel) {
        const speedNorm = Math.min(1.2, flowVel / 6.0);
        for (let p of particles) {
            p.x += 0.008 * (0.5 + speedNorm * 1.2);
            if (p.x > 1.05) p.x = -0.05;
        }
    }
    
    function drawPipe(hyd) {
        if (!ctxPipe) return;
        ctxPipe.clearRect(0, 0, width, heightPipe);
        const vel = hyd.V;
        const inletP = hyd.inletPressure_kPa;
        const outletP = hyd.outletPressure_kPa;
        const cav = hyd.cavitationRisk;
        const numBends = hyd.bends;
        
        const marginX = 70;
        const startX = marginX, endX = width - marginX;
        const visualHeight = 15 + (hyd.D_mm / 300) * 35; // slightly thinner max
        const centerY = 160;
        
        // Generate path
        let pts = [{x: startX, y: centerY}];
        if (numBends === 0) {
            pts.push({x: endX, y: centerY});
        } else {
            let currentX = startX, currentY = centerY;
            let numXSegs = Math.floor(numBends / 2) + 1;
            let xStep = (endX - startX) / numXSegs;
            let yAmplitude = 80;
            for (let i = 0; i < numBends; i++) {
                if (i % 2 === 0) {
                    currentX += xStep;
                    pts.push({x: currentX, y: currentY});
                } else {
                    let sign = (Math.floor((i-1) / 2) % 2 === 0) ? 1 : -1;
                    currentY += sign * yAmplitude;
                    pts.push({x: currentX, y: currentY});
                }
            }
            if (numBends % 2 === 0) {
                pts.push({x: endX, y: currentY});
            } else {
                let sign = (Math.floor((numBends-1) / 2) % 2 === 0) ? 1 : -1;
                currentY += sign * yAmplitude;
                pts.push({x: currentX, y: currentY});
            }
        }
        
        let pathLen = 0;
        let segments = [];
        for(let i = 0; i < pts.length - 1; i++) {
            let dx = pts[i+1].x - pts[i].x;
            let dy = pts[i+1].y - pts[i].y;
            let len = Math.hypot(dx, dy);
            segments.push({ p0: pts[i], p1: pts[i+1], len, cumLen: pathLen, dx: dx/len, dy: dy/len });
            pathLen += len;
        }
        
        function getPos(dist) {
            if (dist <= 0) return {x: pts[0].x, y: pts[0].y, nx: 0, ny: 1, dirX: 1, dirY: 0};
            if (dist >= pathLen) {
                let last = segments[segments.length-1];
                return {x: last.p1.x, y: last.p1.y, nx: -last.dy, ny: last.dx, dirX: last.dx, dirY: last.dy};
            }
            for (let seg of segments) {
                if (dist >= seg.cumLen && dist <= seg.cumLen + seg.len) {
                    let t = dist - seg.cumLen;
                    return { x: seg.p0.x + seg.dx * t, y: seg.p0.y + seg.dy * t, nx: -seg.dy, ny: seg.dx, dirX: seg.dx, dirY: seg.dy };
                }
            }
            return {x: 0, y: 0, nx: 0, ny: 1, dirX: 1, dirY: 0};
        }

        // Draw Pipe Outline
        ctxPipe.lineCap = "round";
        ctxPipe.lineJoin = "round";
        ctxPipe.beginPath();
        ctxPipe.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctxPipe.lineTo(pts[i].x, pts[i].y);
        ctxPipe.strokeStyle = "#1e293b";
        ctxPipe.lineWidth = visualHeight + 4;
        ctxPipe.stroke();

        // Draw Pipe Gradient
        const step = 2;
        for (let d = 0; d <= pathLen; d += step) {
            let t = d / pathLen;
            let press = inletP * (1 - t) + outletP * t;
            let intensity = Math.min(1, Math.max(0, (press - 20) / 200));
            let r = 80 + (1 - intensity) * 175;
            let gCol = 80 + intensity * 175;
            ctxPipe.fillStyle = `rgb(${Math.min(255,r)}, ${Math.min(255,gCol)}, 70)`;
            let pos = getPos(d);
            ctxPipe.beginPath();
            ctxPipe.arc(pos.x, pos.y, visualHeight/2, 0, 2*Math.PI);
            ctxPipe.fill();
        }

        // Valve calculation
        let vPos = getPos(pathLen / 2);
        let blockRatio = 1 - hyd.valveOpen;
        let blockW = 16;
        let totalH = visualHeight + 4;
        let blockH = totalH * blockRatio / 2;
        
        // Particles
        for (let p of particles) {
            let dist = p.x * pathLen;
            let pos = getPos(dist);
            let crossOffset = (p.yOffset - 0.5) * (visualHeight - 8); 
            let px = pos.x + pos.nx * crossOffset;
            let py = pos.y + pos.ny * crossOffset;
            
            let isBehindValve = false;
            if (Math.abs(dist - pathLen/2) < 12) {
                if (Math.abs(crossOffset) > (visualHeight/2) - blockH) isBehindValve = true;
            }
            
            if (!isBehindValve) {
                ctxPipe.beginPath();
                ctxPipe.arc(px, py, 4, 0, 2*Math.PI);
                ctxPipe.fillStyle = "#facc15";
                ctxPipe.shadowBlur = 6;
                ctxPipe.fill();
                ctxPipe.fillStyle = "#000000";
                ctxPipe.beginPath();
                ctxPipe.arc(px, py, 1.5, 0, 2*Math.PI);
                ctxPipe.fill();
            }
        }
        ctxPipe.shadowBlur = 0;

        // Draw Valve Graphics
        ctxPipe.save();
        ctxPipe.translate(vPos.x, vPos.y);
        ctxPipe.rotate(Math.atan2(vPos.dirY, vPos.dirX));
        ctxPipe.fillStyle = "#64748b";
        ctxPipe.fillRect(-blockW/2, -totalH/2, blockW, blockH);
        ctxPipe.fillRect(-blockW/2, totalH/2 - blockH, blockW, blockH);
        ctxPipe.fillStyle = "#b91c1c";
        ctxPipe.fillRect(-4, -totalH/2 - 20, 8, 20);
        ctxPipe.beginPath();
        ctxPipe.arc(0, -totalH/2 - 20, 10, 0, 2*Math.PI);
        ctxPipe.fill();
        ctxPipe.fillStyle = "#fff";
        ctxPipe.font = "bold 9px sans-serif";
        ctxPipe.fillText("V", -3, -totalH/2 - 17);
        ctxPipe.restore();
        
        // Texts
        ctxPipe.font = "bold 12px 'Segoe UI'";
        ctxPipe.fillStyle = "#0f172a";
        ctxPipe.fillText("INLET", pts[0].x - 40, pts[0].y + 35);
        ctxPipe.fillText("OUTLET", pts[pts.length-1].x + 10, pts[pts.length-1].y + 35);
        ctxPipe.fillStyle = "#047857";
        ctxPipe.fillText(`${inletP.toFixed(1)} kPa`, pts[0].x - 10, pts[0].y - visualHeight/2 - 15);
        ctxPipe.fillStyle = outletP < 20 ? "#b91c1c" : "#0f5f8a";
        ctxPipe.fillText(`${Math.max(0,outletP).toFixed(1)} kPa`, pts[pts.length-1].x - 30, pts[pts.length-1].y - visualHeight/2 - 15);
        
        ctxPipe.fillStyle = "#2563eb";
        ctxPipe.font = "italic 11px";
        ctxPipe.fillText(`Velocity = ${vel.toFixed(2)} m/s`, width/2 - 40, 20);
        
        ctxPipe.fillStyle = "#d97706";
        ctxPipe.fillText(`Head loss = ${hyd.totalHeadLoss.toFixed(1)} m  (friction ${hyd.h_friction.toFixed(1)}m + minor ${hyd.h_minor.toFixed(1)}m)`, startX+20, heightPipe - 15);
        
        const reColor = hyd.Re < 2000 ? "#3b82f6" : hyd.Re < 4000 ? "#f59e0b" : "#dc2626";
        ctxPipe.fillStyle = reColor;
        ctxPipe.fillRect(width - 150, 15, 12, 12);
        ctxPipe.fillStyle = "#1e293b";
        ctxPipe.fillText(`Re = ${Math.round(hyd.Re)} (${hyd.flowRegime})`, width - 130, 25);
        
        if (cav) {
            ctxPipe.fillStyle = "#ef4444";
            ctxPipe.font = "bold 12px";
            ctxPipe.fillText(" CAVITATION WARNING! Pressure too low", startX+20, 40);
        }
    }
    
    function drawCurves(hyd) {
        if (!ctxCurve) return;
        ctxCurve.clearRect(0, 0, 800, 200);
        const points = [];
        const D_m = hyd.D;
        const L = hyd.L;
        const bends = parseInt(bendsSlider.value);
        const valveOpen = parseFloat(valveSlider.value);
        const eps = parseFloat(roughSlider.value)/1000;
        const nu = parseFloat(viscSlider.value)*1e-6;
        
        const pumpPower = parseFloat(pumpSlider.value);
        const eff = 0.65;
        
        for (let i = 0; i <= 100; i++) {
            let Q_m3h = (i / 100) * 130;
            let Q_m3s = Q_m3h / 3600;
            let A = Math.PI * D_m * D_m / 4;
            let V = Q_m3s / A;
            if (!isFinite(V)) V = 0;
            let Re = V * D_m / nu;
            let epsD = eps / D_m;
            let f = frictionFactor(Re, epsD);
            let h_f = f * (L / D_m) * (V * V) / (2 * g);
            let K_min = minorLossCoeff(bends, valveOpen);
            let h_min = K_min * (V * V) / (2 * g);
            let headLoss = h_f + h_min;
            if (!isFinite(headLoss)) headLoss = 0;
            points.push({ Q: Q_m3h, H_sys: headLoss });
        }
        
        let pumpPoints = [];
        for (let i = 0; i <= 100; i++) {
            let Q_m3h = (i / 100) * 130;
            let Q_m3s = Q_m3h / 3600;
            let H_pump;
            if (pumpPower > 0 && Q_m3s > 0.001) {
                H_pump = (pumpPower * eff) / (rho * g * Q_m3s);
                if (H_pump > 80) H_pump = 80;
            } else H_pump = 0;
            if (Q_m3h < 0.5) H_pump = Math.min(45, H_pump + 8);
            pumpPoints.push({ Q: Q_m3h, H_pump: H_pump });
        }
        
        ctxCurve.beginPath();
        ctxCurve.strokeStyle = "#333";
        ctxCurve.lineWidth = 1;
        ctxCurve.moveTo(60, 20);
        ctxCurve.lineTo(60, 170);
        ctxCurve.lineTo(760, 170);
        ctxCurve.stroke();
        ctxCurve.fillStyle = "#1e293b";
        ctxCurve.fillText("Head (m)", 20, 95);
        ctxCurve.fillText("Flow Q (m³/h)", 360, 190);
        
        ctxCurve.beginPath();
        let first = true;
        for (let p of points) {
            let x = 60 + (p.Q / 130) * 700;
            let y = 170 - (p.H_sys / 55) * 150;
            if (x > 760) break;
            if (first) { ctxCurve.moveTo(x, y); first = false; }
            else ctxCurve.lineTo(x, y);
        }
        ctxCurve.strokeStyle = "#2563eb";
        ctxCurve.lineWidth = 2.5;
        ctxCurve.stroke();
        
        ctxCurve.beginPath();
        first = true;
        for (let p of pumpPoints) {
            let x = 60 + (p.Q / 130) * 700;
            let y = 170 - (p.H_pump / 55) * 150;
            if (x > 760) break;
            if (first) { ctxCurve.moveTo(x, y); first = false; }
            else ctxCurve.lineTo(x, y);
        }
        ctxCurve.strokeStyle = "#f97316";
        ctxCurve.lineWidth = 2.5;
        ctxCurve.stroke();
        
        let opQ = hyd.Q_m3h;
        let opH_sys = hyd.totalHeadLoss;
        let xOp = 60 + (opQ / 130) * 700;
        let yOp = 170 - (opH_sys / 55) * 150;
        ctxCurve.beginPath();
        ctxCurve.arc(xOp, yOp, 6, 0, 2*Math.PI);
        ctxCurve.fillStyle = "#facc15";
        ctxCurve.fill();
        ctxCurve.fillStyle = "#000";
        ctxCurve.fillText(" Operating", xOp-20, yOp-6);
        
        ctxCurve.fillStyle = "#1e40af";
        ctxCurve.fillText("System curve", 650, 40);
        ctxCurve.fillStyle = "#c2410c";
        ctxCurve.fillText("Pump curve", 650, 60);
    }
    
    function animate() {
        const hyd = computeHydraulics();
        updateParticles(hyd.V);
        drawPipe(hyd);
        drawCurves(hyd);
        
        if (reSpan) reSpan.innerText = `${Math.round(hyd.Re)} (${hyd.flowRegime})`;
        if (outletSpan) outletSpan.innerText = `${Math.max(0, hyd.outletPressure_kPa).toFixed(1)} kPa`;
        
        if (warningDiv) {
            if (hyd.cavitationRisk || hyd.outletPressure_kPa < 8) {
                warningDiv.innerHTML = " FAILURE MODE: Extreme head loss / Cavitation risk!  Increase diameter, reduce flow, or add pump.";
                warningDiv.style.background = "#fee2e2";
                warningDiv.style.borderLeftColor = "#dc2626";
            } else if (hyd.V > 6.5) {
                warningDiv.innerHTML = " Very high velocity & head loss! Pipe too narrow  pressure drops sharply. Increase diameter.";
                warningDiv.style.background = "#fff3e3";
                warningDiv.style.borderLeftColor = "#f97316";
            } else {
                warningDiv.innerHTML = hyd.warningMsg;
                warningDiv.style.background = "#e6f7ec";
                warningDiv.style.borderLeftColor = "#22c55e";
            }
        }
        animFrame = requestAnimationFrame(animate);
    }
    
    function updateAll() {
        const hyd = computeHydraulics();
        if (reSpan) reSpan.innerText = `${Math.round(hyd.Re)} (${hyd.flowRegime})`;
        if (outletSpan) outletSpan.innerText = `${Math.max(0, hyd.outletPressure_kPa).toFixed(1)} kPa`;
        drawPipe(hyd);
        drawCurves(hyd);
    }
    
    function handleCanvasSize() {
        const container = pipeCanvas.parentElement;
        const w = container.clientWidth;
        if (w > 100) {
            pipeCanvas.style.width = `${Math.min(800, w)}px`;
            curveCanvas.style.width = `${Math.min(800, w)}px`;
        }
        updateAll();
    }
    
    window.addEventListener('resize', handleCanvasSize);
    bindEvents();
    initParticles();
    handleCanvasSize();
    animFrame = requestAnimationFrame(animate);
    
    const allInputs = [lengthSlider, diamSlider, roughSlider, bendsSlider, valveSlider, viscSlider, pumpSlider];
    const inputHandler = () => updateAll();
    allInputs.forEach(inp => inp.addEventListener('input', inputHandler));

    return () => {
      window.removeEventListener('resize', handleCanvasSize);
      allInputs.forEach(inp => inp.removeEventListener('input', inputHandler));
      cancelAnimationFrame(animFrame);
    };

  }, []);

  return (
    <div className="pipe-wrapper" ref={rootRef}>
      <div className="sim-container">
        <h1> Pipe Flow &amp; Head Loss Simulator <small>Darcy-Weisbach + Minor Losses</small></h1>
        <div className="sub"> Real pipes lose pressure due to friction, bends, length &amp; roughness — see why narrow pipes fail.</div>

        <div className="dashboard">
          <div className="controls-panel">
            <div className="control-group">
              <label> Pipe Length (m)</label>
              <input type="range" id="length" min="5" max="200" step="1" defaultValue="80" />
              <span id="lengthVal" className="num-input">80</span>
            </div>
            <div className="control-group">
              <label> Pipe Diameter (mm)</label>
              <input type="range" id="diam" min="15" max="300" step="2" defaultValue="75" />
              <span id="diamVal" className="num-input">75</span>
              <span style={{fontSize: '0.7rem', display: 'block', marginTop: '4px'}}>( too narrow → catastrophic loss)</span>
            </div>
            <div className="control-group">
              <label> Roughness ε (mm)</label>
              <input type="range" id="rough" min="0.01" max="3.0" step="0.01" defaultValue="0.25" />
              <span id="roughVal" className="num-input">0.25</span>
            </div>
            <div className="control-group" style={{background: '#e0f2fe', padding: '12px', borderRadius: '12px', border: '1px solid #bae6fd'}}>
              <label style={{color: '#0369a1'}}> Flow Rate Q (m³/h) [Calculated]</label>
              <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#0284c7', marginTop: '6px', textAlign: 'center'}}>
                <span id="flowVal">--</span> <span style={{fontSize: '0.9rem', fontWeight: 'normal'}}>m³/h</span>
              </div>
            </div>
            <div className="control-group">
              <label> Number of bends (90°)</label>
              <input type="range" id="bends" min="0" max="12" step="1" defaultValue="4" />
              <span id="bendsVal" className="num-input">4</span>
            </div>
            <div className="control-group">
              <label> Valve opening (0=closed, 1=full)</label>
              <input type="range" id="valve" min="0.1" max="1.0" step="0.02" defaultValue="0.75" />
              <span id="valveVal" className="num-input">0.75</span>
            </div>
            <div className="control-group">
              <label> Fluid Viscosity ν (cSt)</label>
              <input type="range" id="visc" min="0.5" max="100" step="0.5" defaultValue="1.0" />
              <span id="viscVal" className="num-input">1.0</span>
              <span style={{fontSize: '0.7rem', display: 'block', marginTop: '4px'}}>(1 cSt = water @20°C)</span>
            </div>
            <div className="control-group">
              <label> Pump Power (W) [optional]</label>
              <input type="range" id="pumpPower" min="0" max="5000" step="25" defaultValue="1200" />
              <span id="pumpVal" className="num-input">1200</span>
            </div>
            <div className="warning-badge" id="failureWarning">
               System operating normally
            </div>
          </div>

          <div className="viz-panel">
            <canvas id="pipeCanvas" width="800" height="440" style={{width: '100%', height: 'auto', aspectRatio: '800/440'}}></canvas>
            <div className="legend">
              <span> Pressure profile (green = high, red = low)</span>
              <span> Particles = flow velocity</span>
              <span> <strong>Reynolds:</strong> <span id="reDisplay" className="reynolds">---</span></span>
              <span> Outlet pressure: <strong id="outletPress">--</strong> kPa</span>
            </div>
            <canvas id="curveCanvas" width="800" height="200" style={{width: '100%', height: 'auto', marginTop: '12px'}}></canvas>
            <div style={{fontSize: '0.7rem', textAlign: 'center', marginTop: '6px'}}>
               System curve (blue) vs Pump curve (orange) — operating point 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountPipeFlowSimulation(container) {
  const app = render(PipeFlowSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

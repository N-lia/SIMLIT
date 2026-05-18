import { render, useState, useEffect, useRef } from '/src/utils/react-lite.js';
import KaTeX, { renderKaTeXString } from '../../KaTeX';
import './DcMotorSimulation.css';

export default function DcMotorSimulation() {
  const motorCRef = useRef(null);
  const tsCRef = useRef(null);
  const ripCRef = useRef(null);

  const [params, setParams] = useState({
    V: 12, T_load: 0.2, cooling: 40, B: 0.8
  });
  
  const [faults, setFaults] = useState({
    badComm: false, shortCircuit: false, reversePolarity: false
  });

  const ui = {
    mRpm: useRef(null), mTq: useRef(null), mI: useRef(null), mEff: useRef(null),
    tempNum: useRef(null), tempBar: useRef(null), faultBar: useRef(null), telem: useRef(null)
  };

  const stateRef = useRef({
    omega: 0, theta: 0, current: 0, backEmf: 0, temperature: 20, _Te: 0, _eff: 0,
    R: 1.8, J: 0.006, b_fric: 0.012, N: 80, A: 0.004,
    lastT: 0, reqId: null
  });

  const RIP_LEN = 240;
  const ripBufRef = useRef(new Float32Array(RIP_LEN));
  const ripIdxRef = useRef(0);

  const pRef = useRef(params);
  const fRef = useRef(faults);
  useEffect(() => { pRef.current = params; }, [params]);
  useEffect(() => { fRef.current = faults; }, [faults]);

  const updateParam = (k, v) => setParams(p => ({...p, [k]: v}));
  
  const toggleFault = (k) => {
    setFaults(f => {
      let newF = {...f, [k]: !f[k]};
      if (k === 'badComm') newF.shortCircuit = false;
      if (k === 'shortCircuit') newF.badComm = false;
      return newF;
    });
  };

  const clearFaults = () => {
    setFaults({ badComm: false, shortCircuit: false, reversePolarity: false });
    stateRef.current.temperature = 20;
  };

  // Utilities
  const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const color_mix = (hex, alpha) => hex + Math.round(alpha * 255).toString(16).padStart(2, '0');

  useEffect(() => {
    const handleResize = () => {
      if(motorCRef.current && tsCRef.current && ripCRef.current) {
        const mw = motorCRef.current.parentElement.clientWidth;
        motorCRef.current.width  = mw;
        motorCRef.current.height = Math.round(mw * 0.56);

        const cw = tsCRef.current.parentElement.clientWidth - 28;
        tsCRef.current.width  = Math.max(100, cw); tsCRef.current.height  = 150;
        ripCRef.current.width = Math.max(100, cw); ripCRef.current.height = 150;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const physicsStep = (dt) => {
      const p = pRef.current;
      const f = fRef.current;
      const S = stateRef.current;
      const ripBuf = ripBufRef.current;

      if (dt > 0.04) dt = 0.04;
      const Ke = S.N * p.B * S.A;
      const Kt = S.N * p.B * S.A;
      const Veff = f.shortCircuit ? 0 : (f.reversePolarity ? -p.V : p.V);
      
      S.backEmf = Ke * S.omega;
      S.current = Math.max(0, (Veff - S.backEmf) / S.R);

      let Te;
      if (f.badComm) {
        const phase = (S.theta % (Math.PI / 3)) / (Math.PI / 3);
        Te = Kt * S.current * (0.4 + 0.6 * Math.abs(Math.sin(phase * Math.PI)));
      } else {
        Te = Kt * S.current;
      }

      const Tf   = S.b_fric * S.omega;
      const Tnet = Te - p.T_load - Tf;
      S.omega    = Math.max(0, S.omega + (Tnet / S.J) * dt);
      S.theta   += S.omega * dt;

      const Qin  = S.current * S.current * S.R * dt;
      const Qout = (p.cooling / 100) * 4.5 * dt;
      S.temperature = Math.max(20, S.temperature + Qin - Qout);

      const Pmech = Te * S.omega;
      const Pin   = Math.abs(Veff) * S.current;
      S._Te  = Te;
      S._eff = Pin > 0.05 ? Math.min(99, (Pmech / Pin) * 100) : 0;

      ripBuf[ripIdxRef.current % RIP_LEN] = Te;
      ripIdxRef.current++;
    };

    const drawMotor = () => {
      const canvas = motorCRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const dark = isDark();
      const S = stateRef.current;

      const C = {
        housing:        dark ? '#1a1c22' : '#e9edf2',
        housingStroke:  dark ? '#2e3140' : '#c8cdd6',
        poleN:          dark ? '#1e0a0a' : '#fee2e2',
        poleNStroke:    dark ? '#7f1d1d' : '#fca5a5',
        poleS:          dark ? '#0a0e1e' : '#dbeafe',
        poleSStroke:    dark ? '#1e3a5f' : '#93c5fd',
        poleText:       dark ? '#f8d5d5' : '#991b1b',
        poleSText:      dark ? '#c7dcf8' : '#1e40af',
        rotor:          dark ? '#0f1218' : '#f8fafc',
        rotorStroke:    dark ? '#2a2e3a' : '#e2e8f0',
        slot:           dark ? '#1e2230' : '#e2e8f0',
        slotActive:     dark ? 'rgba(251,191,36,0.55)' : 'rgba(202,138,4,0.45)',
        conductorA:     dark ? '#fbbf24' : '#b45309',
        conductorB:     dark ? '#60a5fa' : '#2563eb',
        flux:           dark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)',
        force:          dark ? '#34d399' : '#047857',
        comm:           dark ? '#78350f' : '#92400e',
        commInner:      dark ? '#0f1218' : '#f1f5f9',
        brush:          dark ? '#374151' : '#94a3b8',
        shaft:          dark ? '#1f2937' : '#cbd5e1',
      };

      const motorR  = Math.min(W, H) * 0.40;
      const poleR1  = motorR * 0.71;
      const poleR2  = motorR * 0.97;
      const rotorR  = motorR * 0.52;
      const poleAng = Math.PI * 0.50;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, motorR, 0, Math.PI * 2);
      ctx.fillStyle   = C.housing;
      ctx.strokeStyle = C.housingStroke;
      ctx.lineWidth   = 1;
      ctx.fill();
      ctx.stroke();

      ctx.save();
      for (let i = 0; i < 7; i++) {
        const t    = i / 6;
        const yOff = (t - 0.5) * motorR * 1.05;
        const ctrl = yOff * 0.1;
        ctx.beginPath();
        ctx.moveTo(-motorR * 0.60, yOff);
        ctx.quadraticCurveTo(0, yOff + ctrl, motorR * 0.60, yOff);
        ctx.strokeStyle = C.flux;
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([3, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      const drawPole = (startA, endA, fill, stroke, label, textCol) => {
        ctx.beginPath();
        ctx.arc(0, 0, poleR2, startA, endA);
        ctx.arc(0, 0, poleR1, endA, startA, true);
        ctx.closePath();
        ctx.fillStyle   = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth   = 0.5;
        ctx.fill();
        ctx.stroke();
        const midA = (startA + endA) / 2;
        const lr   = (poleR1 + poleR2) / 2;
        ctx.font     = 'bold 12px system-ui';
        ctx.fillStyle = textCol;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lr * Math.cos(midA), lr * Math.sin(midA));
      };
      drawPole(-poleAng / 2, poleAng / 2, C.poleN, C.poleNStroke, 'N', C.poleText);
      drawPole(Math.PI - poleAng / 2, Math.PI + poleAng / 2, C.poleS, C.poleSStroke, 'S', C.poleSText);

      ctx.beginPath();
      ctx.arc(0, 0, rotorR, 0, Math.PI * 2);
      ctx.fillStyle   = C.rotor;
      ctx.strokeStyle = C.rotorStroke;
      ctx.lineWidth   = 0.5;
      ctx.fill();
      ctx.stroke();

      const nSlots = 6;
      for (let i = 0; i < nSlots; i++) {
        const slotA = S.theta + (i / nSlots) * Math.PI * 2;
        const sw    = 0.14;
        ctx.beginPath();
        ctx.arc(0, 0, rotorR,         slotA - sw, slotA + sw);
        ctx.arc(0, 0, rotorR * 0.55,  slotA + sw, slotA - sw, true);
        ctx.closePath();
        const isActive = (i === 0 || i === 3);
        ctx.fillStyle = isActive && S.current > 0.05 ? C.slotActive : C.slot;
        ctx.fill();
      }

      const coilR = rotorR * 0.78;
      const c1x   = coilR * Math.cos(S.theta);
      const c1y   = coilR * Math.sin(S.theta);
      const c2x   = coilR * Math.cos(S.theta + Math.PI);
      const c2y   = coilR * Math.sin(S.theta + Math.PI);
      const condR = rotorR * 0.085;

      ctx.beginPath(); ctx.arc(c1x, c1y, condR, 0, Math.PI * 2);
      ctx.fillStyle = C.conductorA; ctx.fill();
      ctx.beginPath(); ctx.arc(c2x, c2y, condR, 0, Math.PI * 2);
      ctx.fillStyle = C.conductorB; ctx.fill();

      if (S.current > 0.1) {
        const sym = (Math.sin(S.theta) > 0) ? 1 : -1;
        const drawCurrentSym = (x, y, dir) => {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth   = 1.5;
          if (dir > 0) {
            ctx.beginPath(); ctx.arc(x, y, condR * 0.38, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          } else {
            const cr = condR * 0.42;
            ctx.beginPath(); ctx.moveTo(x - cr, y - cr); ctx.lineTo(x + cr, y + cr); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + cr, y - cr); ctx.lineTo(x - cr, y + cr); ctx.stroke();
          }
        };
        drawCurrentSym(c1x, c1y,  sym);
        drawCurrentSym(c2x, c2y, -sym);
      }

      const fMag = Math.min(rotorR * 0.45, S.current * rotorR * 0.15);
      if (fMag > 3) {
        const perpX = -Math.sin(S.theta);
        const perpY =  Math.cos(S.theta);
        const arrow = (x, y, dx, dy) => {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy);
          ctx.strokeStyle = C.force; ctx.lineWidth = 1.8; ctx.stroke();
          const a = Math.atan2(dy, dx);
          const hs = 6;
          ctx.beginPath();
          ctx.moveTo(x + dx, y + dy);
          ctx.lineTo(x + dx - hs * Math.cos(a - 0.45), y + dy - hs * Math.sin(a - 0.45));
          ctx.lineTo(x + dx - hs * Math.cos(a + 0.45), y + dy - hs * Math.sin(a + 0.45));
          ctx.closePath(); ctx.fillStyle = C.force; ctx.fill();
        };
        arrow(c1x, c1y,  perpX * fMag,  perpY * fMag);
        arrow(c2x, c2y, -perpX * fMag, -perpY * fMag);
      }

      const commR = rotorR * 0.30;
      ctx.beginPath(); ctx.arc(0, 0, commR, 0, Math.PI * 2);
      ctx.fillStyle = C.comm; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, commR * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = C.commInner; ctx.fill();
      for (let i = 0; i < 4; i++) {
        const sa = S.theta + i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(commR * 0.70 * Math.cos(sa), commR * 0.70 * Math.sin(sa));
        ctx.lineTo(commR       * Math.cos(sa), commR       * Math.sin(sa));
        ctx.strokeStyle = C.commInner; ctx.lineWidth = 1.5; ctx.stroke();
      }

      ctx.fillStyle = C.brush;
      const bh = commR * 0.3, bw = commR * 0.45;
      ctx.fillRect(-bw / 2,  commR * 1.1,         bw, bh);
      ctx.fillRect(-bw / 2, -commR * 1.1 - bh,    bw, bh);

      ctx.beginPath(); ctx.arc(0, 0, rotorR * 0.075, 0, Math.PI * 2);
      ctx.fillStyle = C.shaft; ctx.fill();

      ctx.restore();
    };

    const drawTSCurve = () => {
      const canvas = tsCRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const pad = { l: 40, r: 14, t: 12, b: 30 };
      const pw  = W - pad.l - pad.r;
      const ph  = H - pad.t - pad.b;
      const dark = isDark();

      const gridC  = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      const textC  = dark ? '#545e6f' : '#8b93a4';
      const lineC  = dark ? '#60a5fa' : '#2563eb';
      const loadC  = dark ? 'rgba(251,191,36,0.45)' : 'rgba(217,119,6,0.45)';
      const pointC = dark ? '#fbbf24' : '#d97706';

      const p = pRef.current;
      const S = stateRef.current;
      const f = fRef.current;

      const Ke = S.N * p.B * S.A;
      const Kt = S.N * p.B * S.A;
      const Veff  = f.reversePolarity ? -p.V : p.V;
      const omega0 = Veff / (Ke + 1e-6);           
      const Tstall = Kt * Veff / S.R;              
      const maxW   = Math.max(Math.abs(omega0) * 1.12, 5);
      const maxT   = Math.max(Math.abs(Tstall) * 1.12, 0.3);

      ctx.strokeStyle = gridC; ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i / 4) * ph;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
        const x = pad.l + (i / 4) * pw;
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke();
      }

      const x0 = pad.l;
      const y0 = pad.t + ph - Math.min(1, Math.abs(Tstall) / maxT) * ph;
      const x1 = pad.l + Math.min(1, Math.abs(omega0) / maxW) * pw;
      const y1 = pad.t + ph;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.strokeStyle = lineC; ctx.lineWidth = 1.5; ctx.stroke();

      if (p.T_load < maxT) {
        const lY = pad.t + ph - (p.T_load / maxT) * ph;
        ctx.beginPath(); ctx.moveTo(pad.l, lY); ctx.lineTo(pad.l + pw, lY);
        ctx.strokeStyle = loadC; ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      }

      const opW  = Math.abs(omega0) * (1 - p.T_load / (Math.abs(Tstall) + 1e-4));
      const opX  = pad.l + Math.max(0, Math.min(1, opW / maxW)) * pw;
      const opY  = pad.t + ph - Math.min(1, p.T_load / maxT) * ph;
      ctx.beginPath(); ctx.arc(opX, opY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = pointC; ctx.fill();
      ctx.beginPath(); ctx.arc(opX, opY, 8, 0, Math.PI * 2);
      ctx.strokeStyle = color_mix(pointC, 0.3); ctx.lineWidth = 1; ctx.stroke();

      ctx.font = '10px system-ui'; ctx.fillStyle = textC;
      ctx.textAlign = 'center';
      ctx.fillText('Speed  →', pad.l + pw / 2, H - 4);
      ctx.save(); ctx.translate(11, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('Torque  →', 0, 0); ctx.restore();
      ctx.textAlign = 'right';
      ctx.fillText(maxT.toFixed(2), pad.l - 3, pad.t + 10);
      ctx.fillText('0', pad.l - 3, pad.t + ph + 4);
    };

    const drawRipple = () => {
      const canvas = ripCRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const pad  = { l: 40, r: 14, t: 12, b: 30 };
      const pw   = W - pad.l - pad.r;
      const ph   = H - pad.t - pad.b;
      const dark = isDark();

      const gridC = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      const textC = dark ? '#545e6f' : '#8b93a4';
      const lineC = dark ? '#fb923c' : '#c2410c';
      
      const ripBuf = ripBufRef.current;

      ctx.strokeStyle = gridC; ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i / 4) * ph;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
      }

      let maxV = 0.01;
      for (let i = 0; i < RIP_LEN; i++) if (Math.abs(ripBuf[i]) > maxV) maxV = Math.abs(ripBuf[i]);

      ctx.beginPath();
      let first = true;
      for (let i = 0; i < RIP_LEN; i++) {
        const di = (ripIdxRef.current + i) % RIP_LEN;
        const x  = pad.l + (i / (RIP_LEN - 1)) * pw;
        const y  = pad.t + ph - (Math.abs(ripBuf[di]) / maxV) * ph;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        first = false;
      }
      ctx.strokeStyle = lineC; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.font = '10px system-ui'; ctx.fillStyle = textC;
      ctx.textAlign = 'center';
      ctx.fillText('Time  →', pad.l + pw / 2, H - 4);
      ctx.save(); ctx.translate(11, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('Torque', 0, 0); ctx.restore();
      ctx.textAlign = 'right';
      ctx.fillText(maxV.toFixed(3), pad.l - 3, pad.t + 10);
    };

    const updateUI = () => {
      const p = pRef.current;
      const f = fRef.current;
      const S = stateRef.current;

      if(ui.mRpm.current) ui.mRpm.current.textContent = (S.omega * 9.549).toFixed(0);
      if(ui.mTq.current) ui.mTq.current.textContent = S._Te.toFixed(3);
      if(ui.mI.current) ui.mI.current.textContent = S.current.toFixed(2);
      if(ui.mEff.current) ui.mEff.current.textContent = S._eff.toFixed(1);

      const tpct = Math.min(100, (S.temperature - 20) / 120 * 100);
      if(ui.tempNum.current) ui.tempNum.current.textContent = S.temperature.toFixed(0) + '°C';
      if(ui.tempBar.current) {
        ui.tempBar.current.style.width = tpct + '%';
        ui.tempBar.current.style.background = tpct < 40 ? 'var(--good)' : tpct < 70 ? 'var(--warn)' : 'var(--danger)';
      }

      if(ui.faultBar.current) {
        const fb = ui.faultBar.current;
        if (S.temperature >= 140) {
          fb.className = 'fault-bar danger'; fb.textContent = 'Thermal failure — motor seized. Reset to continue.';
          S.omega = 0;
        } else if (f.shortCircuit) {
          fb.className = 'fault-bar danger'; fb.textContent = 'Short circuit — uncontrolled stator current';
        } else if (f.badComm) {
          fb.className = 'fault-bar warn';  fb.textContent = 'Bad commutation — torque oscillates between segments';
        } else if (f.reversePolarity) {
          fb.className = 'fault-bar warn';  fb.textContent = 'Reverse polarity — counter-rotation tendency';
        } else {
          fb.className = 'fault-bar';       fb.textContent = 'Normal operation';
        }
      }

      if(ui.telem.current) {
        ui.telem.current.innerHTML = renderKaTeXString(`V=${p.V.toFixed(1)}\\,\\mathrm{V}\\quad I=${S.current.toFixed(2)}\\,\\mathrm{A}\\quad \\varepsilon=${S.backEmf.toFixed(2)}\\,\\mathrm{V}\\quad \\omega=${(S.omega * 9.549).toFixed(0)}\\,\\mathrm{rpm}`);
      }
    };

    const loop = (now) => {
      const s = stateRef.current;
      const dt = Math.min(0.04, (now - s.lastT) / 1000);
      if (dt > 0.001) {
        physicsStep(dt);
        drawMotor();
        drawTSCurve();
        drawRipple();
        updateUI();
        s.lastT = now;
      }
      s.reqId = requestAnimationFrame(loop);
    };
    stateRef.current.reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(stateRef.current.reqId);
  }, []);

  return (
    <div className="dc-motor-container">
      <div className="app">
        <div className="header">
          <h1>DC Motor Studio</h1>
          <span>real-time physics · torque–speed analysis · commutation model</span>
        </div>

        <div className="main-row">
          <div className="card motor-wrap">
            <canvas ref={motorCRef} id="motorC" width="640" height="380"></canvas>
            <div className="telem" ref={ui.telem}></div>
          </div>

          <div className="right-col">
            <div className="params">
              <div className="panel-title">Parameters</div>

              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">Supply voltage <KaTeX math="V" /></span>
                  <span className="param-val">{params.V.toFixed(1)} V</span>
                </div>
                <input type="range" min="0" max="24" step="0.1" value={params.V} onChange={e => updateParam('V', +e.target.value)} />
              </div>

              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">Load torque <KaTeX math="T_{load}" /></span>
                  <span className="param-val">{params.T_load.toFixed(2)} Nm</span>
                </div>
                <input type="range" min="0" max="3" step="0.01" value={params.T_load} onChange={e => updateParam('T_load', +e.target.value)} />
              </div>

              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">Cooling</span>
                  <span className="param-val">{params.cooling.toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={params.cooling} onChange={e => updateParam('cooling', +e.target.value)} />
              </div>

              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">Field strength <KaTeX math="B" /></span>
                  <span className="param-val">{params.B.toFixed(2)} T</span>
                </div>
                <input type="range" min="0" max="1.5" step="0.01" value={params.B} onChange={e => updateParam('B', +e.target.value)} />
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <div className="metric-label">Speed</div>
                <div className="metric-val"><span ref={ui.mRpm}>0</span><span className="metric-unit">rpm</span></div>
              </div>
              <div className="metric">
                <div className="metric-label">Torque</div>
                <div className="metric-val"><span ref={ui.mTq}>0.000</span><span className="metric-unit">Nm</span></div>
              </div>
              <div className="metric">
                <div className="metric-label">Current</div>
                <div className="metric-val"><span ref={ui.mI}>0.00</span><span className="metric-unit">A</span></div>
              </div>
              <div className="metric">
                <div className="metric-label">Efficiency</div>
                <div className="metric-val"><span ref={ui.mEff}>0.0</span><span className="metric-unit">%</span></div>
              </div>
            </div>

            <div className="temp-card">
              <div className="temp-head">
                <span className="temp-label">Temperature</span>
                <span className="temp-num" ref={ui.tempNum}>20°C</span>
              </div>
              <div className="temp-track">
                <div className="temp-fill" ref={ui.tempBar} style={{width:'0%'}}></div>
              </div>
            </div>

            <div className="fault-bar" ref={ui.faultBar}>Normal operation</div>

            <div className="btn-row">
              <button className={faults.badComm ? 'active' : ''} onClick={() => toggleFault('badComm')}>Bad commutation</button>
              <button className={faults.shortCircuit ? 'active-danger' : ''} onClick={() => toggleFault('shortCircuit')}>Short circuit</button>
              <button className={faults.reversePolarity ? 'active' : ''} onClick={() => toggleFault('reversePolarity')}>Reverse polarity</button>
              <button className="reset" onClick={clearFaults}>Reset</button>
            </div>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-card">
            <div className="chart-label">Torque–speed curve <KaTeX math="T(\\omega)" /> &amp; operating point</div>
            <canvas ref={tsCRef} id="tsC" width="400" height="150"></canvas>
          </div>
          <div className="chart-card">
            <div className="chart-label">Torque ripple (commutation history)</div>
            <canvas ref={ripCRef} id="ripC" width="400" height="150"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountDcMotorSimulation(container) {
  const app = render(DcMotorSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

import { render, useState, useEffect, useRef } from '/src/utils/react-lite.js';
import KaTeX from '../../KaTeX';
import './DoublePendulumSimulation.css';

export default function DoublePendulumSimulation() {
  const mainCRef = useRef(null);
  const poincCRef = useRef(null);
  const energyCRef = useRef(null);

  const [params, setParams] = useState({
    th1Init: 120, th2Init: -20, m1: 1.0, m2: 1.0, L1: 1.0, L2: 1.0, g: 9.81, damp: 0
  });

  const [toggles, setToggles] = useState({
    showFan: true, showTrails: true, showPoinc: true, showEnergy: true
  });

  const uiRef = {
    energyOut: useRef(null), driftOut: useRef(null), omegaOut: useRef(null),
    timeOut: useRef(null), lyapBadge: useRef(null), statusBar: useRef(null)
  };

  const stateRef = useRef({
    states: [],
    trails: [],
    poincPts: [],
    lastTh1: [],
    energyHistory: [],
    simTime: 0,
    E0: 0,
    lyapSum: 0,
    lyapCount: 0,
    lyapEst: 0,
    reqId: null,
    lastFrame: 0
  });

  const N_FAN = 12;
  const TRAIL_LEN = 320;
  const FAN_EPS = 2e-4;
  const E_HIST_LEN = 400;
  const DT = 0.003;
  const STEPS_PER_FRAME = 6;

  const pRef = useRef(params);
  const tRef = useRef(toggles);
  useEffect(() => { pRef.current = params; }, [params]);
  useEffect(() => { tRef.current = toggles; }, [toggles]);

  const updateParam = (k, v) => {
    setParams(p => ({...p, [k]: v}));
    initSim({...pRef.current, [k]: v}); // pass latest immediately
  };
  const toggleBtn = (k) => setToggles(t => ({...t, [k]: !t[k]}));

  const derivatives = (state, P) => {
    const [th1, w1, th2, w2] = state;
    const { m1, m2, L1, L2, g, damp } = P;
    const dth = th1 - th2;
    const M = m1 + m2;
    const den1 = (M * L1) - (m2 * L1 * Math.cos(dth) * Math.cos(dth));
    const den2 = (L2 / L1) * den1;

    const num1 = (m2 * L1 * w1 * w1 * Math.sin(dth) * Math.cos(dth))
               + (m2 * g  * Math.sin(th2) * Math.cos(dth))
               + (m2 * L2 * w2 * w2 * Math.sin(dth))
               - (M  * g  * Math.sin(th1))
               - (damp * w1);
    const dw1 = num1 / den1;

    const num2 = -(m2 * L2 * w2 * w2 * Math.sin(dth) * Math.cos(dth))
                + (M  * g  * Math.sin(th1) * Math.cos(dth))
                - (M  * L1 * w1 * w1 * Math.sin(dth))
                - (M  * g  * Math.sin(th2))
                - (damp * w2);
    const dw2 = num2 / den2;

    return [w1, dw1, w2, dw2];
  };

  const rk4 = (state, dt, P) => {
    const k1 = derivatives(state, P);
    const s2 = state.map((s, i) => s + 0.5 * dt * k1[i]);
    const k2 = derivatives(s2, P);
    const s3 = state.map((s, i) => s + 0.5 * dt * k2[i]);
    const k3 = derivatives(s3, P);
    const s4 = state.map((s, i) => s + dt * k3[i]);
    const k4 = derivatives(s4, P);
    return state.map((s, i) => s + (dt / 6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
  };

  const energy = (state, P) => {
    const [th1, w1, th2, w2] = state;
    const { m1, m2, L1, L2, g } = P;
    const y1 = -L1 * Math.cos(th1);
    const vx1 = L1 * w1 * Math.cos(th1);
    const vy1 = L1 * w1 * Math.sin(th1);
    const vx2 = vx1 + L2 * w2 * Math.cos(th2);
    const vy2 = vy1 + L2 * w2 * Math.sin(th2);
    const KE = 0.5 * m1 * (vx1*vx1 + vy1*vy1) + 0.5 * m2 * (vx2*vx2 + vy2*vy2);
    const PE = m1 * g * (y1 + L1 + L2) + m2 * g * ((y1 - L2 * Math.cos(th2)) + L1 + L2);
    return { KE, PE, E: KE + PE };
  };

  const initSim = (p) => {
    const s = stateRef.current;
    s.states = []; s.trails = []; s.poincPts = []; s.lastTh1 = [];
    s.energyHistory = []; s.simTime = 0;
    s.lyapSum = 0; s.lyapCount = 0; s.lyapEst = 0;

    const t1 = p.th1Init * Math.PI / 180;
    const t2 = p.th2Init * Math.PI / 180;

    for (let i = 0; i < N_FAN; i++) {
      const eps = i * FAN_EPS;
      s.states.push([t1, 0, t2 + eps, 0]);
      s.trails.push([]);
      s.lastTh1.push(t1);
    }
    const e = energy(s.states[0], p);
    s.E0 = e.E;

    if (uiRef.lyapBadge.current) uiRef.lyapBadge.current.textContent = 'λ ≈ —';
  };

  const setSmallAngle = () => {
    setParams(p => {
      const newP = {...p, th1Init: 15, th2Init: -10};
      initSim(newP);
      return newP;
    });
  };

  const fanColor = (i, alpha) => {
    const t = i / (N_FAN - 1);
    let r, g, b;
    if (t < 0.5) {
      const s = t * 2;
      r = Math.round(57  + s * (255 - 57));
      g = Math.round(255 - s * (255 - 184));
      b = Math.round(138 - s * 138);
    } else {
      const s = (t - 0.5) * 2;
      r = 255;
      g = Math.round(184 - s * (184 - 77));
      b = Math.round(0   + s * 77);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };

  useEffect(() => {
    const handleResize = () => {
      if (mainCRef.current) {
        const mw = mainCRef.current.parentElement.clientWidth;
        mainCRef.current.width = mw; mainCRef.current.height = Math.round(mw * 0.64);
      }
      if (poincCRef.current && energyCRef.current) {
        const pw = poincCRef.current.parentElement.clientWidth - 28;
        poincCRef.current.width = Math.max(100, pw); poincCRef.current.height = 200;
        energyCRef.current.width = Math.max(100, pw); energyCRef.current.height = 200;
      }
      const s = stateRef.current;
      for (let i = 0; i < N_FAN; i++) {
        if(s.trails[i]) s.trails[i] = [];
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    initSim(pRef.current);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const bobPos = (state, scale, ox, oy, p) => {
      const [th1,,th2] = state;
      const x1 = ox + scale * p.L1 * Math.sin(th1);
      const y1 = oy + scale * p.L1 * Math.cos(th1);
      const x2 = x1 + scale * p.L2 * Math.sin(th2);
      const y2 = y1 + scale * p.L2 * Math.cos(th2);
      return { x1, y1, x2, y2 };
    };

    const phaseSeparation = (s) => {
      if (s.states.length < 2) return 0;
      const s0 = s.states[0], sN = s.states[N_FAN - 1];
      const dth1 = s0[0] - sN[0], dth2 = s0[2] - sN[2];
      const dom1 = s0[1] - sN[1], dom2 = s0[3] - sN[3];
      return Math.sqrt(dth1*dth1 + dth2*dth2 + dom1*dom1 + dom2*dom2) / (N_FAN * FAN_EPS) * FAN_EPS * 1000;
    };

    const drawMain = (s, p, t) => {
      const mainC = mainCRef.current;
      if (!mainC) return;
      const ctx = mainC.getContext('2d');
      const W = mainC.width, H = mainC.height;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(37,35,31,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const ox = W * 0.5;
      const oy = H * 0.28;
      const scale = Math.min(W, H) * 0.22;

      ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(47,93,136,0.18)'; ctx.fill();
      ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI*2);
      ctx.fillStyle = '#25231f'; ctx.fill();

      if(s.states.length === 0) return;
      const mainState = s.states[0];
      const mp = bobPos(mainState, scale, ox, oy, p);

      if (t.showTrails) {
        for (let i = 0; i < N_FAN; i++) {
          const trail = s.trails[i];
          if (!trail || trail.length < 2) continue;
          const show = t.showFan || i === 0;
          if (!show) continue;
          ctx.beginPath();
          for (let j = 0; j < trail.length; j++) {
            if (j === 0) ctx.moveTo(trail[j].x, trail[j].y);
            else ctx.lineTo(trail[j].x, trail[j].y);
          }
          ctx.strokeStyle = t.showFan ? fanColor(i, 0.45) : 'rgba(76,122,60,0.48)';
          ctx.lineWidth   = t.showFan ? (i === 0 ? 1.2 : 0.6) : 1.2;
          ctx.stroke();
        }
      }

      if (t.showFan) {
        for (let i = 1; i < N_FAN; i++) {
          const lp = bobPos(s.states[i], scale, ox, oy, p);
          ctx.strokeStyle = fanColor(i, 0.18);
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(lp.x1, lp.y1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(lp.x1, lp.y1); ctx.lineTo(lp.x2, lp.y2); ctx.stroke();
          ctx.beginPath(); ctx.arc(lp.x2, lp.y2, 4, 0, Math.PI*2);
          ctx.fillStyle = fanColor(i, 0.5); ctx.fill();
        }
      }

      ctx.lineWidth   = 1.5;
      ctx.strokeStyle = 'rgba(37,35,31,0.5)';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(mp.x1, mp.y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mp.x1, mp.y1); ctx.lineTo(mp.x2, mp.y2); ctx.stroke();

      const r1 = Math.max(6, Math.min(16, p.m1 * 7));
      const grad1 = ctx.createRadialGradient(mp.x1-r1*0.3, mp.y1-r1*0.3, 1, mp.x1, mp.y1, r1);
      grad1.addColorStop(0, '#fff4df');
      grad1.addColorStop(1, 'rgba(47,93,136,0.72)');
      ctx.beginPath(); ctx.arc(mp.x1, mp.y1, r1, 0, Math.PI*2);
      ctx.fillStyle = grad1; ctx.fill();
      ctx.strokeStyle = 'rgba(47,93,136,0.45)'; ctx.lineWidth = 1; ctx.stroke();

      const r2 = Math.max(6, Math.min(16, p.m2 * 7));
      const grad2 = ctx.createRadialGradient(mp.x2-r2*0.3, mp.y2-r2*0.3, 1, mp.x2, mp.y2, r2);
      grad2.addColorStop(0, '#fff4df');
      grad2.addColorStop(1, 'rgba(76,122,60,0.72)');
      ctx.beginPath(); ctx.arc(mp.x2, mp.y2, r2, 0, Math.PI*2);
      ctx.fillStyle = grad2; ctx.fill();
      ctx.strokeStyle = 'rgba(76,122,60,0.48)'; ctx.lineWidth = 1; ctx.stroke();

      ctx.beginPath(); ctx.arc(mp.x2, mp.y2, r2+5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(76,122,60,0.08)'; ctx.fill();

      if (t.showFan && s.states.length > 1) {
        const last = s.states[N_FAN-1];
        const lp = bobPos(last, scale, ox, oy, p);
        const dx = lp.x2 - mp.x2, dy = lp.y2 - mp.y2;
        const sep = Math.sqrt(dx*dx + dy*dy);
        if (sep > 2) {
          ctx.beginPath();
          ctx.moveTo(mp.x2, mp.y2);
          ctx.lineTo(lp.x2, lp.y2);
          ctx.strokeStyle = `rgba(169,64,47,${Math.min(0.8, sep/80)})`;
          ctx.lineWidth = 1; ctx.setLineDash([3,4]); ctx.stroke(); ctx.setLineDash([]);
        }
      }

      ctx.font = '11px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(58,69,85,0.8)';
      ctx.fillText(`t = ${s.simTime.toFixed(2)}s`, 14, H - 28);
      ctx.fillText(`E = ${s.E0.toFixed(3)} J`, 14, H - 14);
    };

    const drawPoincare = (s, t) => {
      const poincC = poincCRef.current;
      if (!poincC) return;
      const ctx = poincC.getContext('2d');
      const W = poincC.width, H = poincC.height;
      if (!t.showPoinc) { ctx.clearRect(0,0,W,H); return; }

      ctx.clearRect(0, 0, W, H);
      const pad = { l: 30, r: 10, t: 10, b: 24 };
      const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

      ctx.strokeStyle = 'rgba(37,35,31,0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i / 4) * ph;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+pw, y); ctx.stroke();
        const x = pad.l + (i / 4) * pw;
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t+ph); ctx.stroke();
      }

      ctx.font = '9px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(58,69,85,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText('θ₂', pad.l + pw/2, H - 4);
      ctx.save(); ctx.translate(10, pad.t + ph/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('ω₂', 0, 0); ctx.restore();

      if (s.poincPts.length < 2) {
        ctx.fillStyle = 'rgba(58,69,85,0.5)';
        ctx.textAlign = 'center';
        ctx.font = '10px IBM Plex Mono, monospace';
        ctx.fillText('waiting for θ₁ = 0 crossings…', pad.l + pw/2, pad.t + ph/2);
        return;
      }

      let minTh = Infinity, maxTh = -Infinity, minOm = Infinity, maxOm = -Infinity;
      for (const p of s.poincPts) {
        if (p.th2 < minTh) minTh = p.th2; if (p.th2 > maxTh) maxTh = p.th2;
        if (p.om2 < minOm) minOm = p.om2; if (p.om2 > maxOm) maxOm = p.om2;
      }
      const thSpan = maxTh - minTh || 0.1;
      const omSpan = maxOm - minOm || 0.1;

      for (let j = 0; j < s.poincPts.length; j++) {
        const { th2, om2, chaos } = s.poincPts[j];
        const px = pad.l + ((th2 - minTh) / thSpan) * pw;
        const py = pad.t + ph - ((om2 - minOm) / omSpan) * ph;
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI*2);
        ctx.fillStyle = chaos ? 'rgba(169,64,47,0.8)' : 'rgba(216,180,92,0.78)';
        ctx.fill();
      }

      ctx.font = '9px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(58,69,85,0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(`${s.poincPts.length} pts`, pad.l + pw - 2, pad.t + 10);
    };

    const drawEnergyChart = (s, t) => {
      const energyC = energyCRef.current;
      if (!energyC) return;
      const ctx = energyC.getContext('2d');
      const W = energyC.width, H = energyC.height;
      if (!t.showEnergy) { ctx.clearRect(0,0,W,H); return; }

      ctx.clearRect(0, 0, W, H);
      const pad = { l: 30, r: 10, t: 10, b: 24 };
      const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

      ctx.strokeStyle = 'rgba(37,35,31,0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i/4)*ph;
        ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+pw,y); ctx.stroke();
      }

      if (s.energyHistory.length < 2) return;

      const minE = Math.min(...s.energyHistory.map(e => Math.min(e.ke, e.pe)));
      const maxE = Math.max(...s.energyHistory.map(e => Math.max(e.ke, e.pe, e.e)));
      const span = maxE - minE || 0.1;

      const plotLine = (arr, color) => {
        ctx.beginPath();
        for (let i = 0; i < arr.length; i++) {
          const xp = pad.l + (i / (arr.length - 1)) * pw;
          const yp = pad.t + ph - ((arr[i] - minE) / span) * ph;
          i === 0 ? ctx.moveTo(xp, yp) : ctx.lineTo(xp, yp);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
      };

      plotLine(s.energyHistory.map(e => e.ke), 'rgba(47,93,136,0.75)');
      plotLine(s.energyHistory.map(e => e.pe), 'rgba(76,122,60,0.65)');
      plotLine(s.energyHistory.map(e => e.e),  'rgba(138,101,0,0.9)');

      ctx.font = '9px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(47,93,136,0.85)';   ctx.fillText('KE', pad.l+4, pad.t+12);
      ctx.fillStyle = 'rgba(76,122,60,0.85)';  ctx.fillText('PE', pad.l+28, pad.t+12);
      ctx.fillStyle = 'rgba(138,101,0,0.9)';  ctx.fillText('E',  pad.l+52, pad.t+12);

      const refY = pad.t + ph - ((s.E0 - minE) / span) * ph;
      ctx.beginPath(); ctx.moveTo(pad.l, refY); ctx.lineTo(pad.l+pw, refY);
      ctx.strokeStyle = 'rgba(37,35,31,0.14)'; ctx.lineWidth = 0.8;
      ctx.setLineDash([4,6]); ctx.stroke(); ctx.setLineDash([]);
    };

    const updateReadouts = (s, p, e, drift) => {
      if(uiRef.energyOut.current) uiRef.energyOut.current.textContent = e.E.toFixed(3) + ' J';
      if(uiRef.driftOut.current) {
        uiRef.driftOut.current.textContent = drift.toFixed(4) + '%';
        uiRef.driftOut.current.className = 'readout-val' + (drift > 0.05 ? ' red' : drift > 0.005 ? ' amber' : '');
      }
      if(uiRef.omegaOut.current) uiRef.omegaOut.current.textContent = s.states[0][3].toFixed(2);
      if(uiRef.timeOut.current) uiRef.timeOut.current.textContent = s.simTime.toFixed(1) + ' s';

      if (s.lyapCount > 10) {
        s.lyapEst = s.lyapSum / s.lyapCount;
        if(uiRef.lyapBadge.current) uiRef.lyapBadge.current.textContent = `λ ≈ ${s.lyapEst.toFixed(3)}`;
      }

      const statusEl = uiRef.statusBar.current;
      if (statusEl) {
        const sep = phaseSeparation(s);
        if (sep > 80) {
          statusEl.className = 'status chaos';
          statusEl.textContent = 'CHAOTIC — pendulums fully decorrelated · sensitive dependence confirmed';
        } else if (sep > 20) {
          statusEl.className = 'status onset';
          statusEl.textContent = 'Chaos onset — exponential divergence in progress';
        } else {
          statusEl.className = 'status ordered';
          statusEl.textContent = 'Ordered — trajectories still correlated (increase angle for chaos)';
        }
      }
    };

    const loop = (now) => {
      const s = stateRef.current;
      const p = pRef.current;
      const t = tRef.current;

      const dtReal = Math.min(0.05, (now - s.lastFrame) / 1000);
      if (dtReal > 0.008) {
        s.lastFrame = now;

        for (let step = 0; step < STEPS_PER_FRAME; step++) {
          for (let i = 0; i < N_FAN; i++) {
            if (s.states[i]) s.states[i] = rk4(s.states[i], DT, p);
          }
          s.simTime += DT;

          for (let i = 0; i < N_FAN; i++) {
            const prev = s.lastTh1[i];
            const curr = s.states[i] ? s.states[i][0] : 0;
            if (i === 0 && prev < 0 && curr >= 0) {
              const chaos = phaseSeparation(s) > 30;
              s.poincPts.push({ th2: s.states[0][2], om2: s.states[0][3], chaos });
              if (s.poincPts.length > 1200) s.poincPts.shift();
            }
            s.lastTh1[i] = curr;
          }

          if (s.states.length > 1) {
            const s0 = s.states[0], s1 = s.states[1];
            const sep = Math.sqrt(
              Math.pow(s0[0]-s1[0],2) + Math.pow(s0[2]-s1[2],2) +
              Math.pow(s0[1]-s1[1],2) + Math.pow(s0[3]-s1[3],2)
            );
            if (sep > 1e-12 && sep < 10) {
              s.lyapSum += Math.log(sep / FAN_EPS) / s.simTime;
              s.lyapCount++;
            }
          }
        }

        for (let i = 0; i < N_FAN; i++) {
          if (!t.showTrails) { s.trails[i] = []; continue; }
          if (!t.showFan && i !== 0) continue;
          if (!s.states[i]) continue;
          
          const mainC = mainCRef.current;
          if (mainC) {
            const W = mainC.width, H = mainC.height;
            const ox = W * 0.5, oy = H * 0.28;
            const scale = Math.min(W, H) * 0.22;
            const pos = bobPos(s.states[i], scale, ox, oy, p);
            s.trails[i].push({ x: pos.x2, y: pos.y2 });
            if (s.trails[i].length > TRAIL_LEN) s.trails[i].shift();
          }
        }

        if(s.states[0]) {
            const e = energy(s.states[0], p);
            const drift = s.E0 !== 0 ? Math.abs((e.E - s.E0) / s.E0) * 100 : 0;
            s.energyHistory.push({ ke: e.KE, pe: e.PE, e: e.E });
            if (s.energyHistory.length > E_HIST_LEN) s.energyHistory.shift();

            drawMain(s, p, t);
            if (t.showPoinc)  drawPoincare(s, t);
            if (t.showEnergy) drawEnergyChart(s, t);
            updateReadouts(s, p, e, drift);
        }
      }

      s.reqId = requestAnimationFrame(loop);
    };
    
    stateRef.current.reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(stateRef.current.reqId);
  }, []);

  return (
    <div className="double-pendulum-container">
      <div className="header">
        <div className="header-left">
          <span className="logo">Double Pendulum</span>
          <span className="subtitle">chaos onset · Lyapunov divergence · Poincaré section</span>
        </div>
        <div className="lyapunov-badge" ref={uiRef.lyapBadge}>λ ≈ —</div>
      </div>

      <div className="app">
        <div className="main-grid">
          <div className="canvas-panel">
            <canvas ref={mainCRef} id="mainCanvas" width="700" height="480"></canvas>
            <div className="panel-tag">SIMULATION — <span>RK4</span> INTEGRATOR</div>
            <div className="scanlines"></div>
          </div>

          <div className="right-col">
            <div className="ctrl-panel">
              <div className="section-title">Initial Conditions</div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="\theta_1" /> — upper angle</span>
                  <span className="param-val">{params.th1Init}°</span>
                </div>
                <input type="range" min="-175" max="175" step="1" value={params.th1Init} onChange={e => updateParam('th1Init', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="\theta_2" /> — lower angle</span>
                  <span className="param-val">{params.th2Init}°</span>
                </div>
                <input type="range" min="-175" max="175" step="1" value={params.th2Init} onChange={e => updateParam('th2Init', +e.target.value)} />
              </div>

              <div className="sep"></div>
              <div className="section-title">Physical Parameters</div>

              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="m_1" /> — upper mass</span>
                  <span className="param-val">{params.m1.toFixed(2)} kg</span>
                </div>
                <input type="range" min="0.2" max="4" step="0.05" value={params.m1} onChange={e => updateParam('m1', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="m_2" /> — lower mass</span>
                  <span className="param-val">{params.m2.toFixed(2)} kg</span>
                </div>
                <input type="range" min="0.2" max="4" step="0.05" value={params.m2} onChange={e => updateParam('m2', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="L_1" /> — upper length</span>
                  <span className="param-val">{params.L1.toFixed(2)} m</span>
                </div>
                <input type="range" min="0.3" max="2" step="0.05" value={params.L1} onChange={e => updateParam('L1', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="L_2" /> — lower length</span>
                  <span className="param-val">{params.L2.toFixed(2)} m</span>
                </div>
                <input type="range" min="0.3" max="2" step="0.05" value={params.L2} onChange={e => updateParam('L2', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label"><KaTeX math="g" /> — gravity</span>
                  <span className="param-val">{params.g.toFixed(2)} m/s²</span>
                </div>
                <input type="range" min="0.5" max="25" step="0.1" value={params.g} onChange={e => updateParam('g', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">damping</span>
                  <span className="param-val">{params.damp.toFixed(3)}</span>
                </div>
                <input type="range" min="0" max="0.5" step="0.005" value={params.damp} onChange={e => updateParam('damp', +e.target.value)} />
              </div>
            </div>

            <div className="readout-grid">
              <div className="readout">
                <div className="readout-label">Energy</div>
                <div className="readout-val amber" ref={uiRef.energyOut}>0.00 J</div>
              </div>
              <div className="readout">
                <div className="readout-label"><KaTeX math="E" /> drift</div>
                <div className="readout-val" ref={uiRef.driftOut}>0.000%</div>
              </div>
              <div className="readout">
                <div className="readout-label"><KaTeX math="\omega_2" /> (rad/s)</div>
                <div className="readout-val green" ref={uiRef.omegaOut}>0.00</div>
              </div>
              <div className="readout">
                <div className="readout-label">Sim time</div>
                <div className="readout-val cyan" ref={uiRef.timeOut}>0.0 s</div>
              </div>
            </div>

            <div className="ctrl-panel" style={{gap:'10px'}}>
              <div className="section-title">View Modes</div>
              <div className="mode-grid">
                <button className={toggles.showFan ? 'on' : ''} onClick={() => toggleBtn('showFan')}>⊕ Chaos fan</button>
                <button className={toggles.showTrails ? 'on' : ''} onClick={() => toggleBtn('showTrails')}>⟳ Trails</button>
                <button className={toggles.showPoinc ? 'on-amber' : ''} onClick={() => toggleBtn('showPoinc')}>◈ Poincaré</button>
                <button className={toggles.showEnergy ? 'on-cyan' : ''} onClick={() => toggleBtn('showEnergy')}>≋ Energy plot</button>
                <button className="full" onClick={() => initSim(params)}>↺ Reset simulation</button>
                <button className="full" onClick={setSmallAngle}>⟳ Small-angle regime (near-integrable)</button>
              </div>
            </div>

            <div className="status ordered" ref={uiRef.statusBar}>
              Ordered — pendulum below chaos threshold
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="chart-panel">
            <div className="chart-title">Poincaré Section — <span><KaTeX math="\theta_1=0" /> crossings</span></div>
            <canvas ref={poincCRef} width="400" height="200"></canvas>
            <div className="scanlines"></div>
          </div>
          <div className="chart-panel">
            <div className="chart-title">Energy history — <span>KE · PE · Total</span></div>
            <canvas ref={energyCRef} width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountDoublePendulumSimulation(container) {
  const app = render(DoublePendulumSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

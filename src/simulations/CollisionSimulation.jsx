import { render, useState, useEffect, useRef } from '/src/utils/react-lite.js';
import './CollisionSimulation.css';

export default function CollisionSimulation() {
  const simCRef = useRef(null);
  const keChartCRef = useRef(null);
  const pChartCRef = useRef(null);
  const heatChartCRef = useRef(null);

  const [params, setParams] = useState({
    restitution: 1.0, gravity: 0, newRadius: 22, newMass: 1.0
  });

  const [toggles, setToggles] = useState({
    showVel: true, showMom: true, showCoM: true, showTrail: true, showLabel: false
  });

  const uiRef = {
    keOut: useRef(null), heatOut: useRef(null), pmagOut: useRef(null),
    pdriftOut: useRef(null), collOut: useRef(null), bodyOut: useRef(null),
    statusBar: useRef(null), consBadge: useRef(null), dragHint: useRef(null)
  };

  const stateRef = useRef({
    balls: [],
    totalHeat: 0,
    collisionCount: 0,
    p0: null,
    simTime: 0,
    keHistory: [],
    pHistory: [],
    heatHistory: [],
    colorIdx: 0,
    dragging: false,
    dragStart: null,
    dragCurrent: null,
    reqId: null,
    lastNow: 0,
    histTimer: 0,
    frameCount: 0
  });

  const pRef = useRef(params);
  const tRef = useRef(toggles);
  useEffect(() => { pRef.current = params; }, [params]);
  useEffect(() => { tRef.current = toggles; }, [toggles]);

  const updateParam = (k, v) => setParams(p => ({...p, [k]: v}));
  const toggleBtn = (k) => setToggles(t => ({...t, [k]: !t[k]}));

  const BALL_PALETTE = [
    '#00d4ff','#39ff8a','#ffb830','#ff5050',
    '#b78cff','#ff8c69','#5de8ff','#aeff75',
    '#ffd580','#ff8fa3','#c0f0ff','#e0d4ff'
  ];

  class Ball {
    constructor(x, y, r, m, vx, vy, cIdx) {
      this.x = x; this.y = y;
      this.r = r; this.m = m;
      this.vx = vx; this.vy = vy;
      this.color = BALL_PALETTE[cIdx % BALL_PALETTE.length];
      this.trail = [];
      this.flashTime = 0;
    }
    get speed()  { return Math.sqrt(this.vx*this.vx + this.vy*this.vy); }
    get ke()     { return 0.5 * this.m * (this.vx*this.vx + this.vy*this.vy); }
    get px()     { return this.m * this.vx; }
    get py()     { return this.m * this.vy; }
  }

  const clearBalls = () => {
    const s = stateRef.current;
    s.balls = []; s.totalHeat = 0; s.collisionCount = 0;
    s.p0 = null; s.simTime = 0;
    s.keHistory = []; s.pHistory = []; s.heatHistory = [];
    s.colorIdx = 0;
  };

  const presetElastic = () => {
    clearBalls();
    const W = simCRef.current ? simCRef.current.width : 720;
    const H = simCRef.current ? simCRef.current.height : 500;
    const cy = H * 0.5;
    const s = stateRef.current;
    s.balls.push(new Ball(W*0.2, cy, 28, 1.0, 280, 0, s.colorIdx++));
    s.balls.push(new Ball(W*0.75, cy, 28, 1.0, -280, 0, s.colorIdx++));
    setParams(p => ({...p, restitution: 1.0}));
  };

  const presetInelastic = () => {
    clearBalls();
    const W = simCRef.current ? simCRef.current.width : 720;
    const H = simCRef.current ? simCRef.current.height : 500;
    const cy = H * 0.5;
    const s = stateRef.current;
    s.balls.push(new Ball(W*0.2, cy, 28, 1.0, 260, 0, s.colorIdx++));
    s.balls.push(new Ball(W*0.75, cy, 28, 1.0, -260, 0, s.colorIdx++));
    setParams(p => ({...p, restitution: 0.0}));
  };

  const presetNewton = () => {
    clearBalls();
    const W = simCRef.current ? simCRef.current.width : 720;
    const H = simCRef.current ? simCRef.current.height : 500;
    const r = 22, gap = 0, cy = H * 0.52;
    const totalW = 5 * (r*2 + gap) - gap;
    const startX = W/2 - totalW/2 + r;
    const s = stateRef.current;
    for (let i = 0; i < 5; i++) {
      s.balls.push(new Ball(startX + i*(r*2 + gap), cy, r, 1.0, 0, 0, s.colorIdx++));
    }
    s.balls[0].x -= r * 3;
    s.balls[0].vx = 350;
    setParams(p => ({...p, restitution: 1.0}));
  };

  const presetOblique = () => {
    clearBalls();
    const W = simCRef.current ? simCRef.current.width : 720;
    const H = simCRef.current ? simCRef.current.height : 500;
    const s = stateRef.current;
    s.balls.push(new Ball(W*0.18, H*0.38, 26, 1.0, 300, 80, s.colorIdx++));
    s.balls.push(new Ball(W*0.72, H*0.55, 26, 1.0, -260, -60, s.colorIdx++));
    setParams(p => ({...p, restitution: 0.85}));
  };

  const presetMassive = () => {
    clearBalls();
    const W = simCRef.current ? simCRef.current.width : 720;
    const H = simCRef.current ? simCRef.current.height : 500;
    const cy = H * 0.5;
    const s = stateRef.current;
    s.balls.push(new Ball(W*0.18, cy, 44, 10.0, 200, 0, s.colorIdx++));
    s.balls.push(new Ball(W*0.78, cy, 14, 1.0, -200, 0, s.colorIdx++));
    setParams(p => ({...p, restitution: 1.0}));
  };

  const toggleGravity = () => {
    setParams(p => ({...p, gravity: p.gravity > 0 ? 0 : 300}));
  };

  useEffect(() => {
    const handleResize = () => {
      if (simCRef.current && keChartCRef.current) {
        const mw = simCRef.current.parentElement.clientWidth;
        simCRef.current.width = mw;
        simCRef.current.height = Math.round(mw * 0.62);
        const cw = keChartCRef.current.parentElement.clientWidth - 26;
        keChartCRef.current.width = Math.max(100, cw); keChartCRef.current.height = 130;
        pChartCRef.current.width = Math.max(100, cw); pChartCRef.current.height = 130;
        heatChartCRef.current.width = Math.max(100, cw); heatChartCRef.current.height = 130;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    presetElastic();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    const simC = simCRef.current;

    const canvasPos = (e) => {
      const rect = simC.getBoundingClientRect();
      const sx = simC.width / rect.width;
      const sy = simC.height / rect.height;
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - rect.left)*sx, y: (src.clientY - rect.top)*sy };
    };

    const onDown = (e) => {
      s.dragging = true;
      s.dragStart = canvasPos(e);
      s.dragCurrent = { ...s.dragStart };
      if(uiRef.dragHint.current) uiRef.dragHint.current.style.opacity = '0';
    };
    const onMove = (e) => { if (s.dragging) s.dragCurrent = canvasPos(e); };
    const onUp = (e) => {
      if (!s.dragging) return;
      s.dragging = false;
      const pos = canvasPos(e);
      const dx = (s.dragStart.x - pos.x) * 1.2;
      const dy = (s.dragStart.y - pos.y) * 1.2;
      s.balls.push(new Ball(s.dragStart.x, s.dragStart.y, pRef.current.newRadius, pRef.current.newMass, dx, dy, s.colorIdx++));
      s.dragStart = null; s.dragCurrent = null;
    };
    const onLeave = () => { s.dragging = false; s.dragStart = null; };

    simC.addEventListener('mousedown', onDown);
    simC.addEventListener('mousemove', onMove);
    simC.addEventListener('mouseup', onUp);
    simC.addEventListener('mouseleave', onLeave);
    simC.addEventListener('touchstart', (e)=>{e.preventDefault(); onDown(e);}, {passive:false});
    simC.addEventListener('touchmove', (e)=>{e.preventDefault(); onMove(e);}, {passive:false});
    simC.addEventListener('touchend', (e)=>{e.preventDefault(); onUp(e);}, {passive:false});

    const SIM_DT = 1/120;
    const STEPS_FRAME = 2;
    const HIST = 300;
    const NEIGHBOR_OFFSETS = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0], [0,  0], [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];

    const resolveCollision = (a, b) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist === 0) return;

      const nx = dx / dist, ny = dy / dist;
      const overlap = (a.r + b.r) - dist;
      if (overlap <= 0) return;

      const totalM = a.m + b.m;
      const corrA = overlap * (b.m / totalM);
      const corrB = overlap * (a.m / totalM);
      a.x -= nx * corrA; a.y -= ny * corrA;
      b.x += nx * corrB; b.y += ny * corrB;

      const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
      const relVn = dvx*nx + dvy*ny;
      if (relVn > 0) return;

      const e = pRef.current.restitution;
      const j = -(1 + e) * relVn / (1/a.m + 1/b.m);
      a.vx += (j / a.m) * nx;  a.vy += (j / a.m) * ny;
      b.vx -= (j / b.m) * nx;  b.vy -= (j / b.m) * ny;

      a.flashTime = 0.18; b.flashTime = 0.18;
      s.collisionCount++;
    };

    const stepPhysics = (dt) => {
      const W = simC.width, H = simC.height;
      for (const b of s.balls) {
        b.vy += pRef.current.gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * pRef.current.restitution; }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * pRef.current.restitution; }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * pRef.current.restitution; }
        if (b.y + b.r > H) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * pRef.current.restitution; }

        if (b.flashTime > 0) b.flashTime -= dt;

        if (tRef.current.showTrail) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 80) b.trail.shift();
        } else {
          b.trail = [];
        }
      }

      const maxRadius = s.balls.reduce((max, b) => Math.max(max, b.r), 1);
      const cellSize = Math.max(maxRadius * 2, 32);
      const grid = new Map();
      for (let i = 0; i < s.balls.length; i++) {
        const b = s.balls[i];
        const cx = Math.floor(b.x / cellSize);
        const cy = Math.floor(b.y / cellSize);
        const key = `${cx},${cy}`;
        const bucket = grid.get(key);
        if (bucket) bucket.push(i);
        else grid.set(key, [i]);
      }

      const testedPairs = new Set();
      for (let i = 0; i < s.balls.length; i++) {
        const a = s.balls[i];
        const cx = Math.floor(a.x / cellSize);
        const cy = Math.floor(a.y / cellSize);

        for (const [ox, oy] of NEIGHBOR_OFFSETS) {
          const bucket = grid.get(`${cx + ox},${cy + oy}`);
          if (!bucket) continue;

          for (const j of bucket) {
            if (j <= i) continue;
            const pairKey = `${i}:${j}`;
            if (testedPairs.has(pairKey)) continue;
            testedPairs.add(pairKey);

            const b = s.balls[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            if ((dx*dx + dy*dy) < (a.r + b.r)*(a.r + b.r)) {
              const keBefore = a.ke + b.ke;
              resolveCollision(a, b);
              const heat = Math.max(0, keBefore - (a.ke + b.ke));
              s.totalHeat += heat;
            }
          }
        }
      }
      s.simTime += dt;
    };

    const draw = () => {
      const W = simC.width, H = simC.height;
      const ctx = simC.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      const totalMomentum = () => {
        let px = 0, py = 0;
        for (const b of s.balls) { px += b.px; py += b.py; }
        return { px, py, mag: Math.sqrt(px*px + py*py) };
      };

      const centreOfMass = () => {
        if (s.balls.length === 0) return null;
        let mx = 0, my = 0, totalM = 0;
        for (const b of s.balls) { mx += b.m * b.x; my += b.m * b.y; totalM += b.m; }
        return { x: mx/totalM, y: my/totalM };
      };

      const hexAlpha = (hex, a) => {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
      };

      const drawArrow = (x, y, dx, dy, color, width) => {
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 1) return;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+dx, y+dy);
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
        const ang = Math.atan2(dy, dx);
        const hs = Math.max(5, Math.min(10, len*0.25));
        ctx.beginPath();
        ctx.moveTo(x+dx, y+dy);
        ctx.lineTo(x+dx - hs*Math.cos(ang-0.42), y+dy - hs*Math.sin(ang-0.42));
        ctx.lineTo(x+dx - hs*Math.cos(ang+0.42), y+dy - hs*Math.sin(ang+0.42));
        ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      };

      const com = centreOfMass();
      if (tRef.current.showCoM && com) {
        ctx.strokeStyle = 'rgba(255,184,48,0.5)'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(com.x - 20, com.y); ctx.lineTo(com.x + 20, com.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(com.x, com.y - 20); ctx.lineTo(com.x, com.y + 20); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(com.x, com.y, 5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,184,48,0.8)'; ctx.fill();

        const pm = totalMomentum();
        if (tRef.current.showMom && pm.mag > 0.5) {
          const scale = Math.min(80, 40 / (pm.mag || 1));
          drawArrow(com.x, com.y, pm.px * scale, pm.py * scale, 'rgba(255,184,48,0.9)', 2);
        }
      }

      if (tRef.current.showTrail) {
        for (const b of s.balls) {
          if (b.trail.length < 2) continue;
          ctx.beginPath();
          for (let i = 0; i < b.trail.length; i++) {
            if (i === 0) ctx.moveTo(b.trail[i].x, b.trail[i].y);
            else ctx.lineTo(b.trail[i].x, b.trail[i].y);
          }
          ctx.strokeStyle = hexAlpha(b.color, 0.3);
          ctx.lineWidth = 1.2; ctx.stroke();
        }
      }

      for (const b of s.balls) {
        if (b.flashTime > 0) {
          const glowA = b.flashTime / 0.18;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 8, 0, Math.PI*2);
          ctx.fillStyle = hexAlpha(b.color, glowA * 0.25); ctx.fill();
        }

        const grad = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.35, 1, b.x, b.y, b.r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, b.color);
        grad.addColorStop(1, hexAlpha(b.color, 0.4));
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.strokeStyle = hexAlpha(b.color, 0.4); ctx.lineWidth = 0.8; ctx.stroke();

        if (tRef.current.showVel) {
          drawArrow(b.x, b.y, b.vx*0.12*b.r*0.8, b.vy*0.12*b.r*0.8, 'rgba(255,255,255,0.7)', 1.2);
        }

        if (tRef.current.showMom) {
          drawArrow(b.x, b.y, b.px*0.06*b.r*0.8, b.py*0.06*b.r*0.8, hexAlpha(b.color, 0.85), 1.8);
        }

        if (tRef.current.showLabel) {
          ctx.font = '10px IBM Plex Mono, monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.textAlign = 'center';
          ctx.fillText(`m=${b.m.toFixed(1)} v=${b.speed.toFixed(0)}`, b.x, b.y + b.r + 13);
        }
      }

      if (s.dragging && s.dragStart && s.dragCurrent) {
        const dx = s.dragStart.x - s.dragCurrent.x;
        const dy = s.dragStart.y - s.dragCurrent.y;
        ctx.beginPath(); ctx.arc(s.dragStart.x, s.dragStart.y, pRef.current.newRadius, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(0,212,255,0.5)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
        drawArrow(s.dragStart.x, s.dragStart.y, dx * 0.5, dy * 0.5, 'rgba(0,212,255,0.7)', 1.5);
        ctx.font = '10px IBM Plex Mono, monospace';
        ctx.fillStyle = 'rgba(0,212,255,0.6)';
        ctx.textAlign = 'left';
        ctx.fillText(`v≈${Math.sqrt(dx*dx+dy*dy).toFixed(0)}`, s.dragStart.x + pRef.current.newRadius + 6, s.dragStart.y - 4);
      }

      ctx.font = '10px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(50,61,74,0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(`t = ${s.simTime.toFixed(1)}s`, 12, H - 26);
      ctx.fillText(`n = ${s.balls.length}  collisions = ${s.collisionCount}`, 12, H - 13);
    };

    const updateReadouts = () => {
      s.frameCount++;
      if (s.frameCount % 3 !== 0) return;

      const totalKE = s.balls.reduce((acc, b) => acc + b.ke, 0);
      let px = 0, py = 0;
      for (const b of s.balls) { px += b.px; py += b.py; }
      const pmag = Math.sqrt(px*px + py*py);

      if(uiRef.keOut.current) uiRef.keOut.current.textContent = totalKE.toFixed(2) + ' J';
      if(uiRef.heatOut.current) uiRef.heatOut.current.textContent = s.totalHeat.toFixed(3) + ' J';
      if(uiRef.pmagOut.current) uiRef.pmagOut.current.textContent = pmag.toFixed(2);
      if(uiRef.collOut.current) uiRef.collOut.current.textContent = s.collisionCount;
      if(uiRef.bodyOut.current) uiRef.bodyOut.current.textContent = s.balls.length;

      if (s.p0 === null && pmag > 0.5) s.p0 = pmag;
      if (s.p0 !== null && s.p0 > 0) {
        const drift = Math.abs((pmag - s.p0) / s.p0) * 100;
        if(uiRef.pdriftOut.current) {
          uiRef.pdriftOut.current.textContent = drift.toFixed(3) + '%';
          uiRef.pdriftOut.current.className = 'r-val' + (drift > 0.5 ? ' r' : drift > 0.05 ? ' a' : ' g');
        }
        if(uiRef.consBadge.current) {
          uiRef.consBadge.current.textContent = drift < 0.1 ? 'Σp conserved ' : `Σp drift ${drift.toFixed(2)}%`;
          uiRef.consBadge.current.style.color = drift < 0.1 ? 'var(--phosphor)' : 'var(--amber)';
        }
      }

      const sb = uiRef.statusBar.current;
      if(sb) {
        const e = pRef.current.restitution;
        if (e >= 0.99) {
          sb.className = 'status ok';
          sb.textContent = 'Elastic (e=1) — kinetic energy fully conserved';
        } else if (e <= 0.01) {
          sb.className = 'status bad';
          sb.textContent = 'Perfectly inelastic — maximum KE → heat conversion';
        } else {
          sb.className = 'status warn';
          sb.textContent = `Partially inelastic (e=${e.toFixed(2)}) — ${((1-e*e)*100).toFixed(0)}% KE lost per collision`;
        }
      }
    };

    const drawLineChart = (c, ctxC, data, color) => {
      const W = c.width, H = c.height;
      ctxC.clearRect(0, 0, W, H);
      const pad = { l:28, r:8, t:8, b:20 };
      const pw = W-pad.l-pad.r, ph = H-pad.t-pad.b;

      ctxC.strokeStyle = 'rgba(255,255,255,0.04)'; ctxC.lineWidth = 0.5;
      for (let i=0; i<=4; i++) {
        const y = pad.t+(i/4)*ph;
        ctxC.beginPath(); ctxC.moveTo(pad.l,y); ctxC.lineTo(pad.l+pw,y); ctxC.stroke();
      }

      if (data.length < 2) return;
      const maxV = Math.max(...data, 0.01);
      const minV = Math.min(...data);
      const span = maxV - minV || 0.01;

      ctxC.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = pad.l + (i/(data.length-1))*pw;
        const y = pad.t + ph - ((data[i] - minV)/span)*ph;
        i===0 ? ctxC.moveTo(x,y) : ctxC.lineTo(x,y);
      }
      ctxC.strokeStyle = color; ctxC.lineWidth = 1.5; ctxC.stroke();

      ctxC.lineTo(pad.l+pw, pad.t+ph); ctxC.lineTo(pad.l, pad.t+ph); ctxC.closePath();
      ctxC.fillStyle = color.replace('0.85','0.08').replace('0.8','0.08').replace(')',',0.08)').replace('rgb','rgba');
      ctxC.fill();

      ctxC.font = '9px IBM Plex Mono, monospace';
      ctxC.fillStyle = 'rgba(50,61,74,0.9)';
      ctxC.textAlign = 'right';
      ctxC.fillText(maxV.toFixed(1), pad.l-2, pad.t+8);
      ctxC.fillText('0', pad.l-2, pad.t+ph+2);
    };

    const loop = (now) => {
      const dtReal = Math.min(0.05, (now - s.lastNow)/1000);
      if (dtReal > 0.004) {
        s.lastNow = now;
        for (let i = 0; i < STEPS_FRAME; i++) stepPhysics(SIM_DT);
        draw();
        updateReadouts();
        s.histTimer += dtReal;
        if (s.histTimer > 0.05) {
          const totalKE = s.balls.reduce((acc, b) => acc + b.ke, 0);
          let px = 0, py = 0;
          for (const b of s.balls) { px += b.px; py += b.py; }
          const pmag = Math.sqrt(px*px + py*py);
          
          s.keHistory.push(totalKE);
          s.pHistory.push(pmag);
          s.heatHistory.push(s.totalHeat);
          if (s.keHistory.length > HIST) s.keHistory.shift();
          if (s.pHistory.length > HIST) s.pHistory.shift();
          if (s.heatHistory.length > HIST) s.heatHistory.shift();
          
          if(keChartCRef.current) drawLineChart(keChartCRef.current, keChartCRef.current.getContext('2d'), s.keHistory, 'rgba(255,184,48,0.85)', 'KE');
          if(pChartCRef.current) drawLineChart(pChartCRef.current, pChartCRef.current.getContext('2d'), s.pHistory, 'rgba(57,255,138,0.85)', '|p|');
          if(heatChartCRef.current) drawLineChart(heatChartCRef.current, heatChartCRef.current.getContext('2d'), s.heatHistory, 'rgba(255,80,80,0.8)', 'heat');
          s.histTimer = 0;
        }
      }
      s.reqId = requestAnimationFrame(loop);
    };
    s.reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.reqId);
  }, []);

  return (
    <div className="collision-sim-container">
      <div className="hdr">
        <div className="hdr-left">
          <span className="logo">Collision Sandbox</span>
          <span className="sub">impulse-based resolver · elastic / inelastic · CoM invariant</span>
        </div>
        <div className="conservation-badge" ref={uiRef.consBadge}>Σp conserved</div>
      </div>

      <div className="app">
        <div className="main-grid">
          <div className="sim-wrap" id="simWrap">
            <canvas ref={simCRef} id="simC" width="720" height="500"></canvas>
            <div className="sim-tag">SANDBOX — <span>IMPULSE</span> RESOLVER</div>
            <div className="scanlines"></div>
            <div className="drag-hint" ref={uiRef.dragHint}>drag to spawn · click to add ball</div>
          </div>

          <div className="right-col">
            <div className="ctrl">
              <div className="sec-title">Physics</div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">restitution (e)</span>
                  <span className="param-val">{params.restitution.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={params.restitution} onChange={e => updateParam('restitution', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">gravity</span>
                  <span className="param-val">{params.gravity.toFixed(0)}</span>
                </div>
                <input type="range" min="0" max="800" step="10" value={params.gravity} onChange={e => updateParam('gravity', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">new ball radius</span>
                  <span className="param-val">{params.newRadius} px</span>
                </div>
                <input type="range" min="8" max="60" step="1" value={params.newRadius} onChange={e => updateParam('newRadius', +e.target.value)} />
              </div>
              <div className="param-row">
                <div className="param-head">
                  <span className="param-label">new ball mass</span>
                  <span className="param-val">{params.newMass.toFixed(1)} kg</span>
                </div>
                <input type="range" min="0.2" max="8" step="0.1" value={params.newMass} onChange={e => updateParam('newMass', +e.target.value)} />
              </div>
            </div>

            <div className="readout-grid">
              <div className="readout"><div className="r-label">Total KE</div><div className="r-val a" ref={uiRef.keOut}>0.00 J</div></div>
              <div className="readout"><div className="r-label">Heat gen.</div><div className="r-val r" ref={uiRef.heatOut}>0.00 J</div></div>
              <div className="readout"><div className="r-label">|Σp|</div><div className="r-val g" ref={uiRef.pmagOut}>0.00</div></div>
              <div className="readout"><div className="r-label">Σp drift</div><div className="r-val" ref={uiRef.pdriftOut}>—</div></div>
              <div className="readout"><div className="r-label">Collisions</div><div className="r-val v" ref={uiRef.collOut}>0</div></div>
              <div className="readout"><div className="r-label">Bodies</div><div className="r-val c" ref={uiRef.bodyOut}>0</div></div>
            </div>

            <div className="ctrl" style={{gap: '9px'}}>
              <div className="sec-title">Overlays</div>
              <div className="btn-grid">
                <button className={toggles.showVel ? 'on-c' : ''} onClick={() => toggleBtn('showVel')}>⟶ Velocity</button>
                <button className={toggles.showMom ? 'on-g' : ''} onClick={() => toggleBtn('showMom')}>⇒ Momentum p⃗</button>
                <button className={toggles.showCoM ? 'on-a' : ''} onClick={() => toggleBtn('showCoM')}>◎ Centre of mass</button>
                <button className={toggles.showTrail ? 'on-v' : ''} onClick={() => toggleBtn('showTrail')}>⟳ Trails</button>
                <button className={toggles.showLabel ? 'on-c' : ''} onClick={() => toggleBtn('showLabel')}>ⓘ Labels</button>
                <button className={params.gravity > 0 ? 'on-a' : ''} onClick={toggleGravity}>{params.gravity > 0 ? '↓ Gravity on' : '↓ Gravity off'}</button>
              </div>
              <div style={{height: '0.5px', background: 'var(--border)'}}></div>
              <div className="sec-title">Presets</div>
              <div className="btn-grid">
                <button className="full on-g" onClick={presetElastic}>1:1 Head-on elastic</button>
                <button className="full" onClick={presetInelastic}>1:1 Perfectly inelastic</button>
                <button className="full" onClick={presetNewton}>Newton's cradle (5)</button>
                <button className="full" onClick={presetOblique}>Oblique 2-body</button>
                <button className="full" onClick={presetMassive}>Heavy vs light (10:1)</button>
                <button className="full on-r" onClick={clearBalls}> Clear all</button>
              </div>
            </div>

            <div className="status ok" ref={uiRef.statusBar}>
              Elastic — KE fully conserved across collisions
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="chart-card">
            <div className="chart-title">Kinetic energy — <span>vs time</span></div>
            <canvas ref={keChartCRef} className="chart" width="300" height="130"></canvas>
          </div>
          <div className="chart-card">
            <div className="chart-title">Total momentum — <span>|Σp| should be flat</span></div>
            <canvas ref={pChartCRef} className="chart" width="300" height="130"></canvas>
          </div>
          <div className="chart-card">
            <div className="chart-title">Heat generated — <span>inelastic loss</span></div>
            <canvas ref={heatChartCRef} className="chart" width="300" height="130"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountCollisionSimulation(container) {
  const app = render(CollisionSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

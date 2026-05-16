import React, { useEffect, useRef, useState } from 'react';
import './NewtonsLawSimulation.css';

export default function NewtonsLawSimulation() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  
  // App state
  const [mode, setMode] = useState('calcF'); // calcF: F=ma (solve F), calcA: a=F/m (solve a)
  const [mass, setMass] = useState(10); // kg
  const [acceleration, setAcceleration] = useState(5); // m/s²
  const [force, setForce] = useState(50); // N
  
  // Physics simulation state (for continuous motion)
  const simState = useRef({
    x: 100,
    velocity: 0,
    lastTime: 0
  });

  // Calculate dependent variable when inputs change
  useEffect(() => {
    if (mode === 'calcF') {
      setForce(mass * acceleration);
    } else {
      setAcceleration(mass > 0 ? force / mass : 0);
    }
  }, [mass, acceleration, force, mode]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const draw = (timestamp) => {
      const dt = simState.current.lastTime ? (timestamp - simState.current.lastTime) / 1000 : 0;
      simState.current.lastTime = timestamp;

      const W = canvas.width;
      const H = canvas.height;

      // Update physics (simple wrap-around with constant velocity/acceleration visual)
      // If a = 0, constant velocity. If a > 0, it speeds up but we just reset it to look like continuous pulling
      simState.current.velocity += acceleration * dt;
      // Cap visual velocity so it doesn't get ridiculously fast on screen
      const visualVel = Math.min(Math.max(simState.current.velocity, -200), 200) * 10;
      simState.current.x += visualVel * dt;
      
      if (simState.current.x > W + 100) {
        simState.current.x = -100; // wrap around
        simState.current.velocity = 0; // reset speed for effect
      } else if (simState.current.x < -100) {
        simState.current.x = W + 100;
        simState.current.velocity = 0;
      }

      ctx.clearRect(0, 0, W, H);

      // Draw background
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, W, H);
      
      // Draw grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for(let i=0; i<W; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for(let i=0; i<H; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Draw ground
      const groundY = H - 60;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, groundY, W, 60);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

      // Block properties
      // visual size scales with mass (cube root so it doesn't get too huge)
      const baseSize = 40;
      const blockSize = baseSize * Math.pow(mass / 10, 0.4); 
      const bx = simState.current.x;
      const by = groundY - blockSize;

      // Draw Force Arrow
      if (Math.abs(force) > 0.1) {
        const arrowLen = Math.min(Math.max(Math.abs(force) * 1.5, 40), 200);
        const dir = force > 0 ? 1 : -1;
        const startX = force > 0 ? bx - 10 : bx + blockSize + 10;
        const endX = startX + dir * arrowLen;
        const arrY = by + blockSize / 2;

        ctx.strokeStyle = '#f43f5e'; // red for force
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(startX, arrY); ctx.lineTo(endX, arrY); ctx.stroke();
        
        // arrow head
        ctx.beginPath();
        ctx.moveTo(endX, arrY);
        ctx.lineTo(endX - dir*12, arrY - 8);
        ctx.lineTo(endX - dir*12, arrY + 8);
        ctx.fillStyle = '#f43f5e';
        ctx.fill();

        // label
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 16px "Segoe UI"';
        ctx.fillText(`F = ${force.toFixed(1)} N`, Math.min(startX, endX) + Math.abs(arrowLen)/2 - 30, arrY - 15);
      }

      // Draw Block
      ctx.fillStyle = '#3b82f6'; // blue for mass
      ctx.fillRect(bx, by, blockSize, blockSize);
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, blockSize, blockSize);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI"';
      ctx.fillText(`${mass.toFixed(1)} kg`, bx + blockSize/2 - 25, by + blockSize/2 + 6);

      // Draw Acceleration Indicator
      if (Math.abs(acceleration) > 0.1) {
        const accY = by - 30;
        const accDir = acceleration > 0 ? 1 : -1;
        const aLen = Math.min(Math.abs(acceleration) * 5 + 20, 80);
        ctx.strokeStyle = '#10b981'; // green for accel
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(bx + blockSize/2, accY); ctx.lineTo(bx + blockSize/2 + accDir * aLen, accY); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(bx + blockSize/2 + accDir * aLen, accY);
        ctx.lineTo(bx + blockSize/2 + accDir * aLen - accDir*8, accY - 6);
        ctx.lineTo(bx + blockSize/2 + accDir * aLen - accDir*8, accY + 6);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 14px "Segoe UI"';
        ctx.fillText(`a = ${acceleration.toFixed(1)} m/s²`, bx + blockSize/2 - 20, accY - 10);
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };
    
    draw(performance.now());
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [mass, acceleration, force]);

  return (
    <div className="newton-wrapper" ref={rootRef}>
      <div className="sim-card">
        <h1>🍎 Newton's 2nd Law Simulator <small>F = ma Interactive</small></h1>
        <div className="sub">Input your parameters to dynamically visualize the relationship between Force, Mass, and Acceleration.</div>

        <div className="flex-dashboard">
          <div className="controls">
            <div className="mode-tabs">
              <button className={`mode-btn ${mode === 'calcF' ? 'active' : ''}`} onClick={() => setMode('calcF')}>Solve for Force (F)</button>
              <button className={`mode-btn ${mode === 'calcA' ? 'active' : ''}`} onClick={() => setMode('calcA')}>Solve for Accel (a)</button>
            </div>

            <div className="control-group">
              <label><span style={{color:'#3b82f6'}}>🟦 Mass (m)</span></label>
              <input type="range" min="1" max="100" step="1" value={mass} onChange={(e) => setMass(Number(e.target.value))} />
              <div className="param-row">
                <input type="number" className="num-input" value={mass} onChange={(e) => setMass(Number(e.target.value))} />
                <span>kg</span>
              </div>
            </div>

            {mode === 'calcF' ? (
              <div className="control-group">
                <label><span style={{color:'#10b981'}}>⏩ Acceleration (a)</span></label>
                <input type="range" min="-20" max="20" step="0.5" value={acceleration} onChange={(e) => setAcceleration(Number(e.target.value))} />
                <div className="param-row">
                  <input type="number" className="num-input" value={acceleration} onChange={(e) => setAcceleration(Number(e.target.value))} />
                  <span>m/s²</span>
                </div>
              </div>
            ) : (
              <div className="control-group">
                <label><span style={{color:'#f43f5e'}}>➡️ Force (F)</span></label>
                <input type="range" min="-1000" max="1000" step="10" value={force} onChange={(e) => setForce(Number(e.target.value))} />
                <div className="param-row">
                  <input type="number" className="num-input" value={force} onChange={(e) => setForce(Number(e.target.value))} />
                  <span>N</span>
                </div>
              </div>
            )}

            <div className="formula-box">
              {mode === 'calcF' ? (
                <>
                  <span className="var-f">F</span> = <span className="var-m">{mass}</span> × <span className="var-a">{acceleration}</span> = <span className="var-f">{force.toFixed(1)} N</span>
                </>
              ) : (
                <>
                  <span className="var-a">a</span> = <span className="var-f">{force}</span> / <span className="var-m">{mass}</span> = <span className="var-a">{acceleration.toFixed(2)} m/s²</span>
                </>
              )}
            </div>
            
            <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '1rem', textAlign: 'center'}}>
              Notice how increasing mass decreases acceleration for a constant force.
            </div>
          </div>

          <div className="visualization">
            <canvas ref={canvasRef} width="600" height="350" style={{width: '100%', aspectRatio: '600/350', flex: 1}}></canvas>
            <div style={{background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', color: '#334155', border: '1px solid #e2e8f0'}}>
              <strong>Visualizer:</strong> The block size represents mass, the red arrow represents the net force applied, and the green dashed arrow represents the resulting acceleration vector. The block speeds up across the screen according to the kinematic equations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

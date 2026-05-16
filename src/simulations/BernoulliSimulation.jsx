import { render, useEffect, useRef } from '/src/utils/react-lite.js';
import KaTeX from './KaTeX';
import './BernoulliSimulation.css';

export default function BernoulliSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // ---- DOM elements ----
    const densitySlider = $("density");
    const densityVal = $("densityVal");
    const dASlider = $("dA"), dBslider = $("dB"), dCslider = $("dC");
    const dA_val = $("dA_val"), dB_val = $("dB_val"), dC_val = $("dC_val");
    const zASlider = $("zA"), zBSlider = $("zB"), zCSlider = $("zC");
    const zA_val = $("zA_val"), zB_val = $("zB_val"), zC_val = $("zC_val");
    const vInSlider = $("vIn"), vIn_val = $("vIn_val");
    const pInSlider = $("pIn"), pIn_val = $("pIn_val");
    const radioFrictionless = root.querySelector('input[value="frictionless"]');
    const radioReal = root.querySelector('input[value="real"]');
    const jetSpan = $("jetSpeedDisplay");

    const canvas = $("simCanvas");
    const ctx = canvas.getContext('2d');
    let width = 850, height = 520;

    // loss coefficients for real mode (minor losses due to diameter changes + friction)
    const K_AB = 0.28;
    const K_BC = 0.28;
    const g = 9.81;

    // helper: update numeric displays
    function bindSliders() {
      densitySlider.oninput = () => { densityVal.innerText = densitySlider.value; updateSim(); };
      dASlider.oninput = () => { dA_val.innerText = parseFloat(dASlider.value).toFixed(3); updateSim(); };
      dBslider.oninput = () => { dB_val.innerText = parseFloat(dBslider.value).toFixed(3); updateSim(); };
      dCslider.oninput = () => { dC_val.innerText = parseFloat(dCslider.value).toFixed(3); updateSim(); };
      zASlider.oninput = () => { zA_val.innerText = parseFloat(zASlider.value).toFixed(2); updateSim(); };
      zBSlider.oninput = () => { zB_val.innerText = parseFloat(zBSlider.value).toFixed(2); updateSim(); };
      zCSlider.oninput = () => { zC_val.innerText = parseFloat(zCSlider.value).toFixed(2); updateSim(); };
      vInSlider.oninput = () => { vIn_val.innerText = parseFloat(vInSlider.value).toFixed(2); updateSim(); };
      pInSlider.oninput = () => { pIn_val.innerText = pInSlider.value; updateSim(); };
      radioFrictionless.onchange = () => updateSim();
      radioReal.onchange = () => updateSim();
    }

    // get flow data: velocities, pressures, energy components
    function computeFlow() {
      const rho = parseFloat(densitySlider.value);
      const dA = parseFloat(dASlider.value);
      const dB = parseFloat(dBslider.value);
      const dC = parseFloat(dCslider.value);
      const zA = parseFloat(zASlider.value);
      const zB = parseFloat(zBSlider.value);
      const zC = parseFloat(zCSlider.value);
      const vA_in = parseFloat(vInSlider.value);
      const P_A_kPa = parseFloat(pInSlider.value);
      const P_A = P_A_kPa * 1000;   // Pa (gauge)
      const isReal = radioReal.checked;

      // Areas
      const A_A = Math.PI * (dA/2)**2;
      const A_B = Math.PI * (dB/2)**2;
      const A_C = Math.PI * (dC/2)**2;

      // Continuity (incompressible)
      const Q = A_A * vA_in;
      const vB = Q / A_B;
      const vC = Q / A_C;

      // Total head at inlet (energy per unit weight)
      let H_A = P_A/(rho*g) + (vA_in*vA_in)/(2*g) + zA;

      let P_B, P_C;
      let headB, headC;

      if (!isReal) {
        // frictionless: total head constant
        let H_const = H_A;
        // pressure B
        let headB_ideal = H_const - (vB*vB)/(2*g) - zB;
        let headC_ideal = H_const - (vC*vC)/(2*g) - zC;
        P_B = rho * g * headB_ideal;
        P_C = rho * g * headC_ideal;
        headB = headB_ideal;
        headC = headC_ideal;
      } else {
        // Real losses: head loss per segment based on velocity head
        let hL_AB = K_AB * (vA_in*vA_in)/(2*g);
        let H_B = H_A - hL_AB;
        let hL_BC = K_BC * (vB*vB)/(2*g);
        let H_C = H_B - hL_BC;
        headB = H_B;
        headC = H_C;
        P_B = rho * g * (H_B - (vB*vB)/(2*g) - zB);
        P_C = rho * g * (H_C - (vC*vC)/(2*g) - zC);
      }

      // ensure pressures not absurdly negative for display, but keep actual physics
      // Store pressures in kPa for gauges
      const pressures_kPa = [P_A/1000, P_B/1000, P_C/1000];
      // Specific energies (J/kg = m²/s²)
      const pressureEnergy = [P_A/rho, P_B/rho, P_C/rho];
      const kineticEnergy = [0.5*vA_in*vA_in, 0.5*vB*vB, 0.5*vC*vC];
      const potentialEnergy = [g*zA, g*zB, g*zC];
      const totalSpecific = pressureEnergy.map((p,i) => p + kineticEnergy[i] + potentialEnergy[i]);

      return {
        velocities: [vA_in, vB, vC],
        pressures_kPa: pressures_kPa,
        pressureEnergy, kineticEnergy, potentialEnergy, totalSpecific,
        diameters: [dA, dB, dC],
        elevations: [zA, zB, zC],
        rho, Q, vExit: vC,
        isReal,
        headAtSections: [H_A, isReal ? headB : H_A, isReal ? headC : H_A]  // for reference
      };
    }

    // DRAW EVERYTHING : pipe shape, velocity arrows, pressure gauges, bar chart
    function drawSimulation(data) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.font = "12px 'Segoe UI', system-ui";
      ctx.lineWidth = 1.8;
      
      const { velocities, pressures_kPa, pressureEnergy, kineticEnergy, potentialEnergy, diameters, elevations, vExit, isReal } = data;
      
      // ----- 1. draw pipe as variable shape & 3 sections (x positions)
      const xPos = [180, 430, 680];   // section A, B, C
      const pipeTopPoints = [], pipeBottomPoints = [];
      const scaleDia = 180;   // pixels per meter diameter
      const scaleHeight = 35;  // pixels per meter elevation shift
      
      // mid baseline reference Y
      const baseY = 220;
      
      // compute center Y for each section based on elevation
      const centerY = elevations.map(z => baseY - z * scaleHeight);
      const halfHeights = diameters.map(d => (d * scaleDia)/2);
      
      // draw pipe body
      for (let i = 0; i < xPos.length; i++) {
        const x = xPos[i];
        const yc = centerY[i];
        const hh = halfHeights[i];
        pipeTopPoints.push({x, y: yc - hh});
        pipeBottomPoints.push({x, y: yc + hh});
      }
      
      // interpolate between sections
      ctx.beginPath();
      ctx.moveTo(pipeTopPoints[0].x, pipeTopPoints[0].y);
      for (let i = 1; i < pipeTopPoints.length; i++) {
        ctx.lineTo(pipeTopPoints[i].x, pipeTopPoints[i].y);
      }
      for (let i = pipeBottomPoints.length-1; i >= 0; i--) {
        ctx.lineTo(pipeBottomPoints[i].x, pipeBottomPoints[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = "#eef4ffcc";
      ctx.fill();
      ctx.strokeStyle = "#1e4a76";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // draw upper and lower lines thicker
      ctx.beginPath();
      ctx.moveTo(pipeTopPoints[0].x, pipeTopPoints[0].y);
      for (let i=1;i<pipeTopPoints.length;i++) ctx.lineTo(pipeTopPoints[i].x, pipeTopPoints[i].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pipeBottomPoints[0].x, pipeBottomPoints[0].y);
      for (let i=1;i<pipeBottomPoints.length;i++) ctx.lineTo(pipeBottomPoints[i].x, pipeBottomPoints[i].y);
      ctx.stroke();
      
      // draw connector lines (horizontal guides)
      for (let i=0;i<xPos.length;i++) {
        ctx.beginPath();
        ctx.arc(xPos[i], centerY[i], 3, 0, 2*Math.PI);
        ctx.fillStyle = "#0c4a6e";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px 'Segoe UI'";
        ctx.fillText(["A","B","C"][i], xPos[i]-5, centerY[i]-8);
      }
      
      // ----- 2. Velocity Arrows
      const maxV = Math.max(...velocities, 0.1);
      for (let i=0; i<velocities.length; i++) {
        let v = velocities[i];
        let arrowLen = 15 + (v / maxV) * 45; // 15..60 px
        let arrowStartX = xPos[i] + 15;
        let arrowStartY = centerY[i] - halfHeights[i] - 12;
        let arrowEndX = arrowStartX + arrowLen;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowStartY);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#dc2626";
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowEndX-7, arrowStartY-3);
        ctx.lineTo(arrowEndX, arrowStartY);
        ctx.lineTo(arrowEndX-7, arrowStartY+3);
        ctx.fillStyle = "#dc2626";
        ctx.fill();
        ctx.fillStyle = "#b91c1c";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`${v.toFixed(1)} m/s`, arrowStartX, arrowStartY-5);
      }
      
      // ----- 3. Pressure Gauges
      for (let i=0; i<3; i++) {
        const P_kPa = pressures_kPa[i];
        const xg = xPos[i] - 30;
        const yg = centerY[i] + halfHeights[i] + 18;
        // gauge background
        ctx.fillStyle = "#f1f5f9";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(xg+20, yg, 18, 18, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // needle angle based on pressure
        let angle = -Math.PI/2 + (Math.min(400, Math.max(0, P_kPa)) / 400) * Math.PI;
        let needleLen = 12;
        let needleX = xg+20 + Math.cos(angle)*needleLen;
        let needleY = yg + Math.sin(angle)*needleLen;
        ctx.beginPath();
        ctx.moveTo(xg+20, yg);
        ctx.lineTo(needleX, needleY);
        ctx.strokeStyle = "#e11d48";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 10px 'Segoe UI'";
        ctx.fillText(`${Math.round(P_kPa)} kPa`, xg+10, yg+22);
        ctx.fillStyle = "#075985";
        ctx.font = "italic 9px";
        ctx.fillText("P", xg+15, yg-4);
      }
      
      // ----- 4. ENERGY BAR CHART
      const barStartX = 60;
      const barWidth = 150;
      const barTopY = 380;
      const maxEnergy = Math.max(...pressureEnergy, ...kineticEnergy, ...potentialEnergy, 50);
      const scaleEnergy = 130 / maxEnergy;  // max bar height 130px
      
      const sections = ['A', 'B', 'C'];
      for (let i = 0; i < 3; i++) {
        let xBar = barStartX + i * (barWidth + 20);
        let pE = pressureEnergy[i];
        let kE = kineticEnergy[i];
        let potE = potentialEnergy[i];
        let p_h = pE * scaleEnergy;
        let k_h = kE * scaleEnergy;
        let po_h = potE * scaleEnergy;
        // background
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(xBar, barTopY, barWidth, 130);
        // pressure energy
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(xBar, barTopY + 130 - p_h, barWidth, p_h);
        // kinetic
        ctx.fillStyle = "#10b981";
        ctx.fillRect(xBar, barTopY + 130 - p_h - k_h, barWidth, k_h);
        // potential
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(xBar, barTopY + 130 - p_h - k_h - po_h, barWidth, po_h);
        ctx.strokeStyle = "#1e293b";
        ctx.strokeRect(xBar, barTopY, barWidth, 130);
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px 'Segoe UI'";
        ctx.fillText(`Section ${sections[i]}`, xBar+8, barTopY-6);
        ctx.font = "9px monospace";
        ctx.fillStyle = "#334155";
        ctx.fillText(`P/ρ: ${(pE).toFixed(0)} J/kg`, xBar+5, barTopY+18);
        ctx.fillStyle = "#2b6e4f";
        ctx.fillText(`½v²: ${(kE).toFixed(0)} J/kg`, xBar+5, barTopY+35);
        ctx.fillStyle = "#b45309";
        ctx.fillText(`g·z: ${(potE).toFixed(0)} J/kg`, xBar+5, barTopY+52);
        // total
        let total = pE+kE+potE;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 9px";
        ctx.fillText(`E_total = ${total.toFixed(0)}`, xBar+5, barTopY+125);
      }
      
      // draw dashed lines to indicate total energy
      if (!isReal) {
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(barStartX-10, barTopY+130 - (data.totalSpecific[0]*scaleEnergy));
        ctx.lineTo(barStartX+3*barWidth+60, barTopY+130 - (data.totalSpecific[0]*scaleEnergy));
        ctx.strokeStyle = "#2563eb";
        ctx.stroke();
        ctx.fillStyle = "#1e40af";
        ctx.font = "italic 10px";
        ctx.fillText("⚡ constant total energy (frictionless)", barStartX+20, barTopY+130 - (data.totalSpecific[0]*scaleEnergy)-4);
        ctx.setLineDash([]);
      } else {
        ctx.setLineDash([4, 6]);
        for(let i=0;i<2;i++) {
          let total_i = data.totalSpecific[i];
          let yLine = barTopY+130 - (total_i*scaleEnergy);
          if(yLine>barTopY && yLine<barTopY+130){
            ctx.beginPath();
            ctx.moveTo(barStartX + i*(barWidth+20)-5, yLine);
            ctx.lineTo(barStartX + i*(barWidth+20)+barWidth+5, yLine);
            ctx.strokeStyle = "#d97706";
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
        ctx.fillStyle = "#92400e";
        ctx.font = "italic 9px";
        ctx.fillText("⬇ total energy decays (real losses)", barStartX+15, barTopY-14);
      }
      
      // display outlet jet speed
      if (jetSpan) {
        jetSpan.innerHTML = `💧 Jet exit speed: ${vExit.toFixed(2)} m/s`;
      }
      
      // dynamic annotations
      ctx.font = "500 10px 'Segoe UI'";
      ctx.fillStyle = "#075985";
      if(velocities[1] > velocities[0] && pressures_kPa[1] < pressures_kPa[0]) {
        ctx.fillText("✓ Higher velocity → LOWER pressure !", xPos[1]-65, centerY[1]-halfHeights[1]-18);
      }
      
      // small note
      ctx.font = "8px monospace";
      ctx.fillStyle = "#2c3e66";
      ctx.fillText("Bernoulli: Pressure ↓ when velocity ↑ (area↓)", width-210, height-12);
    }
    
    function updateSim() {
      const flowData = computeFlow();
      drawSimulation(flowData);
    }
    
    function handleResize() {
      const container = canvas.parentElement;
      const containerWidth = container.clientWidth;
      const ratio = 850/520;
      if(containerWidth < 850) {
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerWidth/ratio}px`;
      } else {
        canvas.style.width = `850px`;
        canvas.style.height = `520px`;
      }
      updateSim();
    }
    
    window.addEventListener('resize', handleResize);
    bindSliders();
    updateSim();
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="bernoulli-wrapper" ref={rootRef}>
      <div className="sim-card">
        <h1>🌀 Bernoulli Flow Simulator <small>energy trading along a streamline</small></h1>
        <div className="sub">
          <KaTeX math="P + \frac{1}{2}\rho v^2 + \rho g h = \text{constant}" />
        </div>

        <div className="dashboard">
          {/* CONTROLS PANEL */}
          <div className="controls">
            <div className="control-group">
              <label>⚙️ Fluid Density ρ (kg/m³)</label>
              <input type="range" id="density" min="400" max="1400" step="10" defaultValue="1000" />
              <span id="densityVal" className="numeric-input" style={{display: 'inline-block', width: '70px', marginLeft: '8px'}}>1000</span>
            </div>

            <div className="control-group">
              <label>📏 Pipe Diameters (m)</label>
              <div className="param-row">
                <div className="param">🔵 A: <input type="range" id="dA" min="0.03" max="0.2" step="0.002" defaultValue="0.10" /><span id="dA_val" className="numeric-input">0.10</span></div>
                <div className="param">🟢 B: <input type="range" id="dB" min="0.02" max="0.18" step="0.002" defaultValue="0.05" /><span id="dB_val" className="numeric-input">0.05</span></div>
                <div className="param">🟠 C: <input type="range" id="dC" min="0.03" max="0.2" step="0.002" defaultValue="0.08" /><span id="dC_val" className="numeric-input">0.08</span></div>
              </div>
            </div>

            <div className="control-group">
              <label>⛰️ Elevation (m) at sections</label>
              <div className="param-row">
                <div className="param">📍 A: <input type="range" id="zA" min="-0.5" max="2.0" step="0.05" defaultValue="0.0" /><span id="zA_val" className="numeric-input">0.0</span></div>
                <div className="param">📍 B: <input type="range" id="zB" min="-0.5" max="2.0" step="0.05" defaultValue="0.6" /><span id="zB_val" className="numeric-input">0.6</span></div>
                <div className="param">📍 C: <input type="range" id="zC" min="-0.5" max="2.0" step="0.05" defaultValue="0.2" /><span id="zC_val" className="numeric-input">0.2</span></div>
              </div>
            </div>

            <div className="control-group">
              <label>💨 Inlet conditions (Section A)</label>
              <div className="param-row">
                <div className="param">Velocity v_A (m/s): <input type="range" id="vIn" min="0.5" max="8.0" step="0.1" defaultValue="2.5" /><span id="vIn_val" className="numeric-input">2.5</span></div>
                <div className="param">Pressure P_A (kPa): <input type="range" id="pIn" min="50" max="400" step="5" defaultValue="150" /><span id="pIn_val" className="numeric-input">150</span></div>
              </div>
            </div>

            <div className="control-group">
              <div className="toggle-switch">
                <label>🌀 Flow regime:</label>
                <label style={{background: '#cbd5e1', padding: '2px 12px', borderRadius: '30px'}}>
                  <input type="radio" name="lossMode" value="frictionless" defaultChecked /> Frictionless
                </label>
                <label style={{background: '#cbd5e1', padding: '2px 12px', borderRadius: '30px'}}>
                  <input type="radio" name="lossMode" value="real" /> Real losses
                </label>
              </div>
              <div style={{fontSize: '0.7rem', marginTop: '6px', color: '#475569'}}>⚠️ Real mode: head losses (K≈0.28 per segment) reduce total pressure</div>
            </div>
            <div className="misconception">
              💡 <strong>Key insight / misconception fix:</strong> <em>"Higher speed → higher pressure"</em> is FALSE!<br/>
              Watch at narrow section B: <strong>velocity ↑ , pressure ↓</strong> (Bernoulli effect). Energy shifts between kinetic, pressure & potential.
            </div>
          </div>

          {/* VISUALIZATION AREA */}
          <div className="visualization">
            <div className="canvas-container">
              <canvas id="simCanvas" width="850" height="520" style={{width: '100%', height: 'auto', maxWidth: '850px', aspectRatio: '850/520'}}></canvas>
              <div className="legend">
                <span style={{color: '#0f5f8a'}}>⬤ Pressure gauge</span>
                <span>🡆 Velocity arrows (size = speed)</span>
                <span>📊 Energy per mass: <span style={{background: '#3b82f6', padding: '0 6px', borderRadius: '20px', color: 'white'}}>P/ρ</span> <span style={{background: '#10b981', padding: '0 6px', borderRadius: '20px', color: 'white'}}>½v²</span> <span style={{background: '#f59e0b', padding: '0 6px', borderRadius: '20px', color: 'white'}}>g·z</span></span>
                <span className="outlet-speed" id="jetSpeedDisplay">💧 Jet exit: -- m/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountBernoulliSimulation(container) {
  const app = render(BernoulliSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

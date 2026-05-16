import React, { useEffect, useRef } from 'react';
import './HydrostaticSimulation.css';

export default function HydrostaticSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // DOM elements
    const tankCanvas = $("tankCanvas");
    const ctxTank = tankCanvas.getContext('2d');
    const graphCanvas = $("pressureGraphCanvas");
    const ctxGraph = graphCanvas.getContext('2d');

    // sliders & displays
    const depthTotalSlider = $("depthTotal");
    const depthValSpan = $("depthVal");
    const widthGateSlider = $("widthGate");
    const widthValSpan = $("widthVal");
    const heightGateSlider = $("heightGate");
    const heightValSpan = $("heightVal");
    const topDepthSlider = $("topDepth");
    const topDepthValSpan = $("topDepthVal");
    const angleSlider = $("angleGate");
    const angleValSpan = $("angleVal");
    const customRhoSlider = $("customRho");
    const rhoDisplaySpan = $("rhoDisplay");
    const forceSpan = $("forceDisplay");

    const misconceptionBtn = $("showMisconceptionBtn");
    const misconceptionMsgDiv = $("misconceptionMsg");

    // constants
    const g = 9.81;
    const atmPressurePa = 101325;   // Pa

    let currentRho = 1000;   // kg/m³
    
    // helper to get current density
    function updateDensity() {
        const checkedFluid = root.querySelector('input[name="fluid"]:checked');
        if (!checkedFluid) return currentRho;
        let selectedFluid = checkedFluid.value;
        if (selectedFluid === 'water') currentRho = 1000;
        else if (selectedFluid === 'oil') currentRho = 850;
        else if (selectedFluid === 'mercury') currentRho = 13546;
        
        if (selectedFluid === 'custom') {
            currentRho = parseFloat(customRhoSlider.value);
        } else {
            customRhoSlider.disabled = true;
            customRhoSlider.value = currentRho;
        }
        if (rhoDisplaySpan) rhoDisplaySpan.innerText = currentRho;
        return currentRho;
    }

    // enable custom density
    function enableCustom() {
        let customRadio = $("customFluidRadio");
        if (!customRadio) {
            const fluidDiv = $("fluidGroup");
            const customLabel = document.createElement('label');
            customLabel.innerHTML = '<input type="radio" name="fluid" value="custom" id="customFluidRadio"> 🧪 Custom ρ';
            fluidDiv.appendChild(customLabel);
            const newRadio = customLabel.querySelector('input');
            newRadio.addEventListener('change', () => {
                customRhoSlider.disabled = false;
                updateDensity();
                updateAll();
            });
        }
        const customRad = root.querySelector('input[name="fluid"][value="custom"]');
        if (customRad && customRad.checked) {
            customRhoSlider.disabled = false;
        } else {
            customRhoSlider.disabled = true;
        }
    }

    // compute hydrostatic data
    function computeHydro() {
        const H_total = parseFloat(depthTotalSlider.value);   // liquid depth (m)
        const b = parseFloat(widthGateSlider.value);          // gate width (m)
        const h_gate = parseFloat(heightGateSlider.value);     // gate height (m)
        const topEdgeDepth = parseFloat(topDepthSlider.value); // depth to top of gate (m)
        const angleDeg = parseFloat(angleSlider.value);
        const angleRad = angleDeg * Math.PI / 180;
        
        const atmChecked = root.querySelector('input[name="atm"]:checked');
        const includeAtm = atmChecked && atmChecked.value === 'include';
        const rho = currentRho;
        
        // pressure at surface
        const P0 = includeAtm ? atmPressurePa : 0;
        
        // pressure at bottom
        const P_bottom = P0 + rho * g * H_total;
        
        // vertical projection depth of top edge and bottom edge of gate
        let topY = topEdgeDepth;
        let bottomY = topEdgeDepth + h_gate;
        // clamp to liquid surface & bottom
        if (topY < 0) topY = 0;
        if (bottomY > H_total) bottomY = H_total;
        const effectiveHeight = Math.max(0, bottomY - topY);
        
        let force = 0;
        let centerOfPressureFromTop_m = 0;
        let hydrostaticForce_kN = 0;
        
        if (effectiveHeight > 0 && b > 0) {
            const centroidDepth = topY + effectiveHeight / 2;
            const P_centroid = P0 + rho * g * centroidDepth;
            const area = b * effectiveHeight;
            const totalForce_N = P_centroid * area;
            hydrostaticForce_kN = totalForce_N / 1000;
            force = hydrostaticForce_kN;
            
            const tiltFactor = Math.cos(angleRad);
            let heightAlongPlane = effectiveHeight;
            if (angleDeg > 0 && angleDeg < 90) {
                heightAlongPlane = effectiveHeight / Math.sin(angleRad);
                if (!isFinite(heightAlongPlane)) heightAlongPlane = effectiveHeight;
            }
            const centroidAlongPlane = (heightAlongPlane / 2);
            const Ixx = (b * Math.pow(heightAlongPlane, 3)) / 12;
            const A_plane = b * heightAlongPlane;
            const y_c_plane = centroidAlongPlane;  // from top edge
            let y_cp_offset = y_c_plane + Ixx / (y_c_plane * A_plane);
            centerOfPressureFromTop_m = y_cp_offset;
            if (angleDeg === 90) centerOfPressureFromTop_m = effectiveHeight/2; // horizontal plate
        }
        
        const pressures = [];
        const depths = [];
        for (let i = 0; i <= 50; i++) {
            let h = (i / 50) * H_total;
            let p = P0 + rho * g * h;
            pressures.push(p);
            depths.push(h);
        }
        
        return {
            H_total, b, h_gate, topEdgeDepth, angleDeg, effectiveHeight,
            includeAtm, rho, P0, P_bottom, hydrostaticForce_kN, force_kN: hydrostaticForce_kN,
            centerOfPressure_m: centerOfPressureFromTop_m,
            pressures, depths, topY, bottomY
        };
    }
    
    function drawTank(hyd) {
        if (!ctxTank) return;
        const canvasW = tankCanvas.width = 800;
        const canvasH = tankCanvas.height = 420;
        ctxTank.clearRect(0, 0, canvasW, canvasH);
        
        const H = hyd.H_total;
        const topEdge = hyd.topEdgeDepth;
        const gateH = hyd.h_gate;
        const effH = hyd.effectiveHeight;
        const angle = hyd.angleDeg;
        
        const tankLeft = 140;
        const tankRight = 540;
        const tankWidthPx = tankRight - tankLeft;
        const bottomY_px = 360;
        const topSurfaceY_px = bottomY_px - (H * 60);
        const waterTopY = Math.max(25, topSurfaceY_px);
        const waterBottomY = bottomY_px;
        
        for (let y = waterTopY; y <= waterBottomY; y++) {
            let depthFromSurface = (waterBottomY - y) / 60;
            if (depthFromSurface < 0) depthFromSurface = 0;
            let pressureVal = hyd.P0 + hyd.rho * g * depthFromSurface;
            let maxP = hyd.P0 + hyd.rho * g * H;
            let intensity = (pressureVal - hyd.P0) / (maxP - hyd.P0 + 0.001);
            let r = 30 + intensity * 200;
            let gCol = 30 + intensity * 100;
            let bCol = 220 - intensity * 150;
            ctxTank.fillStyle = `rgb(${Math.min(255, r)}, ${Math.min(200, gCol)}, ${Math.min(255, bCol)})`;
            ctxTank.fillRect(tankLeft, y, tankWidthPx, 1);
        }
        ctxTank.strokeStyle = "#1e3a5f";
        ctxTank.lineWidth = 2.5;
        ctxTank.strokeRect(tankLeft, waterTopY, tankWidthPx, waterBottomY - waterTopY);
        
        for (let i = 1; i <= 6; i++) {
            let depthM = (i / 6) * H;
            let yArrow = waterBottomY - depthM * 60;
            if (yArrow > waterTopY && yArrow < waterBottomY) {
                let press = hyd.P0 + hyd.rho * g * depthM;
                let len = Math.min(32, 12 + press / 20000);
                ctxTank.beginPath();
                ctxTank.moveTo(tankLeft - 12, yArrow);
                ctxTank.lineTo(tankLeft - 12 - len, yArrow);
                ctxTank.lineWidth = 2;
                ctxTank.strokeStyle = "#b91c1c";
                ctxTank.stroke();
                ctxTank.fillStyle = "#b91c1c";
                ctxTank.font = "bold 10px 'Segoe UI'";
                ctxTank.fillText(`${Math.round(press/1000)} kPa`, tankLeft-45, yArrow+3);
            }
        }
        
        let gateTopY = waterBottomY - hyd.topEdgeDepth * 60;
        let gateBottomY = waterBottomY - (hyd.topEdgeDepth + gateH) * 60;
        if (hyd.topEdgeDepth < 0) gateTopY = waterBottomY;
        if (hyd.topEdgeDepth + gateH > H) gateBottomY = waterTopY;
        const gateHeightPx = Math.abs(gateBottomY - gateTopY);
        const gateWidthPx = hyd.b * 45;
        const gateLeft = tankLeft + (tankWidthPx/2) - gateWidthPx/2;
        ctxTank.fillStyle = "rgba(200, 180, 100, 0.5)";
        ctxTank.fillRect(gateLeft, gateTopY, gateWidthPx, gateHeightPx);
        ctxTank.strokeStyle = "#b45309";
        ctxTank.lineWidth = 2;
        ctxTank.strokeRect(gateLeft, gateTopY, gateWidthPx, gateHeightPx);
        
        if (hyd.effectiveHeight > 0) {
            let cpOffsetM = hyd.centerOfPressure_m;
            let cpDepthFromTop = hyd.topEdgeDepth + cpOffsetM;
            if (cpDepthFromTop > hyd.H_total) cpDepthFromTop = hyd.H_total;
            let cpY = waterBottomY - cpDepthFromTop * 60;
            ctxTank.beginPath();
            ctxTank.arc(gateLeft + gateWidthPx/2, cpY, 8, 0, 2*Math.PI);
            ctxTank.fillStyle = "#facc15";
            ctxTank.shadowBlur = 6;
            ctxTank.fill();
            ctxTank.fillStyle = "#000";
            ctxTank.font = "bold 10px 'Segoe UI'";
            ctxTank.fillText("CP", gateLeft+gateWidthPx/2-6, cpY-3);
            ctxTank.shadowBlur = 0;
        }
        
        if (forceSpan) forceSpan.innerText = `Force: ${hyd.force_kN.toFixed(1)} kN`;
        
        ctxTank.fillStyle = "#0f172a";
        ctxTank.font = "12px 'Segoe UI'";
        ctxTank.fillText(`Liquid depth H = ${H.toFixed(2)} m`, tankLeft+10, waterTopY-8);
        ctxTank.fillText(`ρ = ${hyd.rho} kg/m³`, tankLeft+10, waterTopY-24);
        if (hyd.includeAtm) ctxTank.fillText(`P_atm = 101.3 kPa`, tankRight-110, waterTopY-8);
    }
    
    function drawPressureGraph(hyd) {
        if (!ctxGraph) return;
        const w = 800, h = 180;
        graphCanvas.width = w;
        graphCanvas.height = h;
        ctxGraph.clearRect(0, 0, w, h);
        ctxGraph.fillStyle = "#fef9e8";
        ctxGraph.fillRect(0, 0, w, h);
        
        const maxPress = Math.max(...hyd.pressures) / 1000;
        const maxDepth = hyd.H_total;
        
        ctxGraph.beginPath();
        ctxGraph.moveTo(70, 20);
        ctxGraph.lineTo(70, h-30);
        ctxGraph.lineTo(w-30, h-30);
        ctxGraph.strokeStyle = "#2c3e66";
        ctxGraph.stroke();
        ctxGraph.fillStyle = "#1e293b";
        ctxGraph.font = "11px 'Segoe UI'";
        ctxGraph.fillText("Pressure (kPa)", 25, 60);
        ctxGraph.fillText("Depth (m)", w/2, h-10);
        
        ctxGraph.beginPath();
        let first = true;
        for (let i = 0; i < hyd.pressures.length; i++) {
            let press_kPa = hyd.pressures[i]/1000;
            let depth = hyd.depths[i];
            let x = 70 + (depth / maxDepth) * (w-100);
            let y = (h-30) - (press_kPa / (maxPress+5)) * (h-50);
            if (first) { ctxGraph.moveTo(x, y); first = false; }
            else ctxGraph.lineTo(x, y);
        }
        ctxGraph.strokeStyle = "#d97706";
        ctxGraph.lineWidth = 3;
        ctxGraph.stroke();
        ctxGraph.fillStyle = "#b45309";
        ctxGraph.font = "bold 10px 'Segoe UI'";
        ctxGraph.fillText(`P = ${hyd.P0/1000} + ${hyd.rho*g/1000}·h`, 120, 40);
        
        let bottomPress_kPa = hyd.P_bottom/1000;
        let xBottom = 70 + (maxDepth / maxDepth)*(w-100);
        let yBottom = (h-30) - (bottomPress_kPa / (maxPress+5)) * (h-50);
        ctxGraph.beginPath();
        ctxGraph.arc(xBottom, yBottom, 5, 0, 2*Math.PI);
        ctxGraph.fillStyle = "#ef4444";
        ctxGraph.fill();
    }
    
    function showMisconception() {
        const H = parseFloat(depthTotalSlider.value);
        const rho = currentRho;
        const atmChecked = root.querySelector('input[name="atm"]:checked');
        const includeAtm = atmChecked && atmChecked.value === 'include';
        const P0 = includeAtm ? atmPressurePa : 0;
        const P_bottom = P0 + rho * g * H;
        if (misconceptionMsgDiv) {
            misconceptionMsgDiv.innerHTML = `🔬 MISCONCEPTION BUSTER: Two different-shaped containers (wide & narrow) both filled to depth ${H.toFixed(2)} m. <br> ✅ Bottom pressure = ${(P_bottom/1000).toFixed(1)} kPa in BOTH containers. Pressure does NOT depend on shape! 💡`;
            misconceptionMsgDiv.style.background = "#e0f2fe";
            misconceptionMsgDiv.style.borderLeftColor = "#0284c7";
        }
    }
    
    function updateAll() {
        updateDensity();
        const hyd = computeHydro();
        drawTank(hyd);
        drawPressureGraph(hyd);
        if (forceSpan) forceSpan.innerText = `Force: ${hyd.force_kN.toFixed(1)} kN`;
    }
    
    function bindAll() {
        const sliders = [
            { el: depthTotalSlider, valEl: depthValSpan },
            { el: widthGateSlider, valEl: widthValSpan },
            { el: heightGateSlider, valEl: heightValSpan },
            { el: topDepthSlider, valEl: topDepthValSpan }
        ];

        sliders.forEach(s => {
            s.el.addEventListener('input', () => {
                if (s.valEl) s.valEl.innerText = parseFloat(s.el.value).toFixed(2);
                updateAll();
            });
        });

        angleSlider.addEventListener('input', () => {
            if (angleValSpan) angleValSpan.innerText = angleSlider.value + "°";
            updateAll();
        });

        customRhoSlider.addEventListener('input', () => {
            const checkedFluid = root.querySelector('input[name="fluid"]:checked');
            if (checkedFluid && checkedFluid.value === 'custom') {
                currentRho = parseFloat(customRhoSlider.value);
                if (rhoDisplaySpan) rhoDisplaySpan.innerText = currentRho;
                updateAll();
            }
        });

        const fluidRadios = root.querySelectorAll('input[name="fluid"]');
        fluidRadios.forEach(r => r.addEventListener('change', () => {
            updateDensity();
            updateAll();
        }));

        const atmRadios = root.querySelectorAll('input[name="atm"]');
        atmRadios.forEach(r => r.addEventListener('change', () => updateAll()));
        
        misconceptionBtn.addEventListener('click', showMisconception);
    }
    
    enableCustom();
    bindAll();
    updateAll();
    
    function handleResize() {
        const container = tankCanvas.parentElement;
        const w = container.clientWidth;
        if (w > 100) {
            tankCanvas.style.width = `${Math.min(800, w)}px`;
            graphCanvas.style.width = `${Math.min(800, w)}px`;
        }
        updateAll();
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
        window.removeEventListener('resize', handleResize);
    };

  }, []);

  return (
    <div className="hydrostatic-wrapper" ref={rootRef}>
      <div className="sim-card">
        <h1>🌊 Hydrostatic Pressure Simulator <small>P = P₀ + ρ·g·h | Force on submerged surfaces</small></h1>
        <div className="sub">📐 Pressure depends ONLY on depth &amp; density — NOT on container shape!</div>

        <div className="flex-dashboard">
          <div className="controls">
            <div className="control-group">
              <label>💧 Fluid type &amp; density</label>
              <div className="fluid-select" id="fluidGroup">
                <label><input type="radio" name="fluid" value="water" defaultChecked /> 💧 Water (ρ=1000 kg/m³)</label>
                <label><input type="radio" name="fluid" value="oil" /> 🛢️ Oil (ρ=850 kg/m³)</label>
                <label><input type="radio" name="fluid" value="mercury" /> ⚡ Mercury (ρ=13546 kg/m³)</label>
              </div>
              <div className="param-row" style={{marginTop: '8px'}}>
                <div className="param">
                  Custom ρ (kg/m³): <input type="range" id="customRho" min="200" max="20000" step="10" defaultValue="1000" disabled />
                </div>
                <span id="rhoDisplay" className="num-input">1000</span>
              </div>
            </div>

            <div className="control-group">
              <label>📏 Liquid depth H (m)</label>
              <input type="range" id="depthTotal" min="0.2" max="5.0" step="0.02" defaultValue="2.4" />
              <span id="depthVal" className="num-input">2.40</span>
            </div>

            <div className="control-group">
              <label>🎯 Submerged rectangular gate</label>
              <div className="param-row">
                <div className="param">Gate width (m): <input type="range" id="widthGate" min="0.3" max="3.0" step="0.05" defaultValue="1.2" /><span id="widthVal" className="num-input">1.20</span></div>
                <div className="param">Gate height (m): <input type="range" id="heightGate" min="0.2" max="2.5" step="0.05" defaultValue="1.0" /><span id="heightVal" className="num-input">1.00</span></div>
              </div>
              <div className="param-row">
                <div className="param">Depth to top edge (m): <input type="range" id="topDepth" min="0" max="4.0" step="0.05" defaultValue="0.6" /><span id="topDepthVal" className="num-input">0.60</span></div>
                <div className="param">Tilt angle (deg): <input type="range" id="angleGate" min="0" max="90" step="5" defaultValue="0" /><span id="angleVal" className="num-input">0°</span></div>
              </div>
              <div style={{fontSize: '0.7rem', marginTop: '4px'}}>↺ 0° = vertical, 90° = horizontal (fully submerged)</div>
            </div>

            <div className="control-group">
              <label>🌍 Atmospheric pressure</label>
              <div className="toggle-switch">
                <label><input type="radio" name="atm" value="include" defaultChecked /> Include P_atm (101.3 kPa)</label>
                <label><input type="radio" name="atm" value="exclude" /> Exclude (gauge pressure)</label>
              </div>
            </div>

            <div className="control-group">
              <label>🧪 Misconception test: two tanks, same H</label>
              <button id="showMisconceptionBtn" style={{background: '#0f5f8a', border: 'none', padding: '6px 12px', borderRadius: '40px', color: 'white', cursor: 'pointer', fontWeight: 600}}>🔍 Compare Bottom Pressures</button>
              <div id="misconceptionMsg" className="warning-note" style={{marginTop: '8px'}}>💡 Click to prove: pressure at bottom depends only on depth, not container shape!</div>
            </div>
          </div>

          <div className="visualization">
            <canvas id="tankCanvas" width="800" height="420" style={{width: '100%', aspectRatio: '800/420'}}></canvas>
            <div className="legend-row">
              <span>🎨 Color = pressure (blue low → red high)</span>
              <span>⬆️ Pressure arrows (length ∝ pressure)</span>
              <span>📐 Gate: <span id="forceDisplay" className="force-badge">Force: -- kN</span></span>
              <span>🎯 Center of pressure marker 🟡</span>
            </div>
            <canvas id="pressureGraphCanvas" width="800" height="180" style={{width: '100%', marginTop: '10px'}}></canvas>
            <div className="legend-row" style={{justifyContent: 'center'}}>
              <span>📈 Pressure vs Depth (linear: P = P₀ + ρgh)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

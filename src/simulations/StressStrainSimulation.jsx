import { render, useEffect, useRef } from '/src/utils/react-lite.js';
import './StressStrainSimulation.css';

export default function StressStrainSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // ----- MATERIAL DATABASE
    const refCurves = {
        steel: [[0,0], [0.0015, 250e6], [0.02, 350e6], [0.12, 500e6], [0.18, 400e6], [0.22, 320e6]],
        aluminum: [[0,0], [0.0035, 180e6], [0.08, 310e6], [0.12, 250e6], [0.15, 200e6]],
        copper: [[0,0], [0.002, 70e6], [0.05, 220e6], [0.35, 250e6], [0.45, 200e6]],
        rubber: [[0,0], [0.5, 2e6], [2.5, 8e6], [4.5, 15e6], [6.0, 12e6]],
        brittle: [[0,0], [0.0008, 35e6], [0.0012, 28e6], [0.0015, 5e6]]
    };
    
    let currentMat = "steel";
    let tempFactor = 1.0;
    let rateFactor = 1.0;
    let force = 0;          // N
    let area_mm2 = 50;
    let fractured = false;
    
    let loadingPath = [];    
    
    // DOM elements
    const stressCanvas = $('stressStrainCanvas');
    const ctxStress = stressCanvas.getContext('2d');
    const specimenCanvas = $('specimenCanvas');
    const ctxSpec = specimenCanvas.getContext('2d');
    const forceSlider = $('forceSlider');
    const forceValueSpan = $('forceValue');
    const lengthInput = $('length');
    const areaInput = $('area');
    const tempSlider = $('tempSlider');
    const tempValSpan = $('tempVal');
    const rateSlider = $('rateSlider');
    const rateValSpan = $('rateVal');
    const failureDiv = $('failureWarning');
    const readoutSpan = $('stressStrainReadout');
    
    let canvasWidth = 750, canvasHeight = 320;
    let specimenWidth = 600, specimenHeight = 90;
    
    function getModifiedCurve() {
        let base = refCurves[currentMat].map(p => [p[0], p[1]]);
        let tempStrMod = Math.pow(tempFactor, -0.7);
        let rateStrMod = Math.pow(rateFactor, 0.15);
        let strengthMod = rateStrMod * tempStrMod;
        let strainMod = Math.pow(tempFactor, -0.3);
        let modCurve = base.map(p => [p[0] * strainMod, p[1] * strengthMod]);
        for (let i=1; i<modCurve.length; i++) if(modCurve[i][1] < modCurve[i-1][1]) modCurve[i][1] = modCurve[i-1][1]*0.98;
        return modCurve;
    }
    
    function getStrainFromStress(stressPa, curve) {
        if (stressPa <= 0) return 0;
        let last = curve[0];
        for (let i=1; i<curve.length; i++) {
            let p = curve[i];
            if (stressPa <= p[1]) {
                if (p[1] - last[1] < 1e-6) return last[0];
                let t = (stressPa - last[1]) / (p[1] - last[1]);
                return last[0] + t * (p[0] - last[0]);
            }
            last = p;
        }
        return curve[curve.length-1][0];
    }
    
    function getUltimateStress(curve) { return Math.max(...curve.map(p=>p[1])); }
    function getFractureStrain(curve) { return curve[curve.length-1][0]; }
    
    function updateFromForce() {
        const area_m2 = area_mm2 / 1e6;
        const stress = force / area_m2;
        const refCurve = getModifiedCurve();
        const maxStressRef = getUltimateStress(refCurve);
        const fractureStrainRef = getFractureStrain(refCurve);
        
        let newStrain;
        const newFractured = stress >= maxStressRef && force > 0;
        
        if (newFractured) {
            newStrain = fractureStrainRef;
        } else {
            let currentMaxPoint = loadingPath.length ? loadingPath[loadingPath.length-1] : null;
            if (currentMaxPoint && stress < currentMaxPoint.stress && currentMaxPoint.strain > 0.002) {
                let E_initial = (refCurve[1][1] - refCurve[0][1]) / (refCurve[1][0] - refCurve[0][0]);
                let elasticStrain = stress / E_initial;
                let plasticStrain = currentMaxPoint.strain - (currentMaxPoint.stress / E_initial);
                newStrain = elasticStrain + plasticStrain;
                if (newStrain < 0) newStrain = 0;
            } else {
                newStrain = getStrainFromStress(stress, refCurve);
            }
        }
        
        fractured = newFractured;
        if (!fractured) {
            if (loadingPath.length === 0 || Math.abs(loadingPath[loadingPath.length-1].stress - stress) > 1e3) {
                loadingPath.push({stress: stress, strain: newStrain});
                if (loadingPath.length > 300) loadingPath.shift();
            }
        } else {
            loadingPath.push({stress: stress, strain: newStrain});
        }
        
        let stressMpa = (stress / 1e6).toFixed(2);
        let strainVal = newStrain.toFixed(5);
        let E_inst = (stress / (newStrain+1e-9)) / 1e9;
        
        if (readoutSpan) readoutSpan.innerHTML = `σ = ${stressMpa} MPa | ε = ${strainVal} | E_sec = ${E_inst.toFixed(1)} GPa`;
        if (failureDiv) {
            if (fractured) failureDiv.innerHTML = " FRACTURE! Specimen broken. Reset force.";
            else if (stress > 0.9*maxStressRef) failureDiv.innerHTML = " Approaching UTS - imminent failure";
            else failureDiv.innerHTML = " Intact";
        }
        
        drawStressStrainCurve(refCurve);
        drawSpecimen(newStrain);
    }
    
    function drawStressStrainCurve(refCurve) {
        if (!ctxStress) return;
        ctxStress.clearRect(0, 0, canvasWidth, canvasHeight);
        const maxStrain = Math.max(refCurve[refCurve.length-1][0], 0.02) * 1.05;
        const maxStress = Math.max(...refCurve.map(p=>p[1]), 10e6) * 1.05;
        const margin = { left: 55, right: 25, top: 20, bottom: 35 };
        const graphW = canvasWidth - margin.left - margin.right;
        const graphH = canvasHeight - margin.top - margin.bottom;
        
        function strainX(s) { return margin.left + (s / maxStrain) * graphW; }
        function stressY(s) { return margin.top + graphH - (s / maxStress) * graphH; }
        
        ctxStress.beginPath();
        ctxStress.moveTo(margin.left, margin.top);
        ctxStress.lineTo(margin.left, canvasHeight-margin.bottom);
        ctxStress.lineTo(canvasWidth-margin.right, canvasHeight-margin.bottom);
        ctxStress.strokeStyle = "#334155";
        ctxStress.stroke();
        ctxStress.fillStyle = "#1e293b";
        ctxStress.font = "10px sans-serif";
        ctxStress.fillText("Strain ε (mm/mm)", canvasWidth/2-40, canvasHeight-8);
        ctxStress.save();
        ctxStress.translate(18, canvasHeight/2);
        ctxStress.rotate(-Math.PI/2);
        ctxStress.fillText("Stress σ (MPa)", -20, 0);
        ctxStress.restore();
        
        ctxStress.beginPath();
        let first = true;
        for (let p of refCurve) {
            let x = strainX(p[0]), y = stressY(p[1]);
            if (first) { ctxStress.moveTo(x,y); first=false; }
            else ctxStress.lineTo(x,y);
        }
        ctxStress.setLineDash([8,6]);
        ctxStress.strokeStyle = "#64748b";
        ctxStress.lineWidth = 2;
        ctxStress.stroke();
        ctxStress.setLineDash([]);
        
        if (loadingPath.length > 1) {
            ctxStress.beginPath();
            for (let i=0; i<loadingPath.length; i++) {
                let pt = loadingPath[i];
                let x = strainX(pt.strain);
                let y = stressY(pt.stress);
                if (i===0) ctxStress.moveTo(x,y);
                else ctxStress.lineTo(x,y);
            }
            ctxStress.strokeStyle = "#3b82f6";
            ctxStress.lineWidth = 2.5;
            ctxStress.stroke();
        }
        
        let yieldPoint = null, utsPoint = null, fracturePoint = null;
        for (let i=1; i<refCurve.length; i++) {
            if (refCurve[i][0] >= 0.002 && !yieldPoint) yieldPoint = refCurve[i];
            if (refCurve[i][1] === Math.max(...refCurve.map(p=>p[1]))) utsPoint = refCurve[i];
            if (i === refCurve.length-1) fracturePoint = refCurve[i];
        }
        const marker = (pt, label, color) => {
            if(!pt) return;
            let x = strainX(pt[0]), y = stressY(pt[1]);
            ctxStress.beginPath(); ctxStress.arc(x,y,5,0,2*Math.PI); ctxStress.fillStyle=color; ctxStress.fill();
            ctxStress.fillStyle="#0f172a"; ctxStress.font="bold 9px sans-serif"; ctxStress.fillText(label, x+5, y-3);
        };
        marker(yieldPoint, "Yield", "#f59e0b");
        marker(utsPoint, "UTS", "#ef4444");
        marker(fracturePoint, "Fracture", "#000000");
        
        if (loadingPath.length) {
            let last = loadingPath[loadingPath.length-1];
            let x = strainX(last.strain), y = stressY(last.stress);
            ctxStress.beginPath(); ctxStress.arc(x,y,7,0,2*Math.PI); ctxStress.fillStyle="#3b82f6"; ctxStress.fill();
            ctxStress.fillStyle="white"; ctxStress.font="bold 11px sans-serif"; ctxStress.fillText("●", x-2.5, y+2.5);
        }
    }
    
    function drawSpecimen(strain) {
        if (!ctxSpec) return;
        ctxSpec.clearRect(0,0,specimenWidth,specimenHeight);
        let originalLen = 200;
        let delta = strain * originalLen * 6;
        let newLen = Math.min(originalLen + delta, specimenWidth-60);
        if (newLen < 20) newLen = 20;
        let yC = specimenHeight/2;
        let barH = 30;
        ctxSpec.fillStyle = "#6b7280";
        ctxSpec.fillRect(25, yC-barH/2, 12, barH);
        ctxSpec.fillRect(specimenWidth-37, yC-barH/2, 12, barH);
        ctxSpec.fillStyle = fractured ? "#b91c1c" : "#facc15";
        ctxSpec.fillRect(37, yC-barH/2-4, newLen, barH+8);
        ctxSpec.fillStyle = fractured ? "#7f1d1d" : "#d97706";
        ctxSpec.fillRect(37, yC-barH/2-2, newLen, barH+4);
        ctxSpec.fillStyle = "#0f172a";
        ctxSpec.font = "bold 9px monospace";
        ctxSpec.fillText(`ε = ${(strain*100).toFixed(2)}%`, 37+newLen/2-35, yC+18);
        if(fractured) {
            ctxSpec.fillStyle="#dc2626"; ctxSpec.font="bold 12px sans-serif"; ctxSpec.fillText(" BROKEN", 37+newLen/2-30, yC-12);
        }
    }
    
    function setForceFromSlider(value) {
        force = parseFloat(value);
        if(forceSlider) forceSlider.value = force;
        if(forceValueSpan) forceValueSpan.innerText = force.toFixed(0) + " N";
        updateFromForce();
    }
    
    function resetSim() {
        force = 0;
        loadingPath = [];
        fractured = false;
        setForceFromSlider(0);
    }
    
    function autoLoadToUTS() {
        let ref = getModifiedCurve();
        let utsStress = Math.max(...ref.map(p=>p[1]));
        let area_m2 = area_mm2 / 1e6;
        let targetForce = utsStress * area_m2 * 0.98;
        setForceFromSlider(targetForce);
    }
    
    function handleCanvasClick(e) {
        const rect = stressCanvas.getBoundingClientRect();
        const scaleX = stressCanvas.width / rect.width;
        const scaleY = stressCanvas.height / rect.height;
        let mouseX = (e.clientX - rect.left) * scaleX;
        let mouseY = (e.clientY - rect.top) * scaleY;
        const refCurve = getModifiedCurve();
        const maxStress = Math.max(...refCurve.map(p=>p[1]))*1.05;
        const margin = { left: 55, right: 25, top: 20, bottom: 35 };
        const graphH = canvasHeight - margin.top - margin.bottom;
        if (mouseX >= margin.left && mouseX <= canvasWidth-margin.right && mouseY >= margin.top && mouseY <= canvasHeight-margin.bottom) {
            let stressClicked = (canvasHeight-margin.bottom - mouseY) / graphH * maxStress;
            let area_m2 = area_mm2/1e6;
            let forceNew = stressClicked * area_m2;
            forceNew = Math.min(forceNew, 25000);
            setForceFromSlider(forceNew);
        }
    }
    
    const handlers = {
        forceChange: (e) => setForceFromSlider(e.target.value),
        resetClick: resetSim,
        autoClick: autoLoadToUTS,
        lenChange: () => { area_mm2 = parseFloat(areaInput.value); resetSim(); },
        areaChange: () => { area_mm2 = parseFloat(areaInput.value); resetSim(); },
        tempChange: () => { tempFactor = parseFloat(tempSlider.value); tempValSpan.innerText = tempFactor.toFixed(2); resetSim(); },
        rateChange: () => { rateFactor = parseFloat(rateSlider.value); rateValSpan.innerText = rateFactor.toFixed(2); resetSim(); }
    };
    
    forceSlider?.addEventListener('input', handlers.forceChange);
    $('resetForceBtn')?.addEventListener('click', handlers.resetClick);
    $('autoLoadBtn')?.addEventListener('click', handlers.autoClick);
    lengthInput?.addEventListener('change', handlers.lenChange);
    areaInput?.addEventListener('change', handlers.areaChange);
    tempSlider?.addEventListener('input', handlers.tempChange);
    rateSlider?.addEventListener('input', handlers.rateChange);
    
    root.querySelectorAll('.material-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            root.querySelectorAll('.material-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentMat = btn.dataset.mat;
            resetSim();
        });
    });
    stressCanvas?.addEventListener('click', handleCanvasClick);
    
    function resizeAll() {
        const container = stressCanvas.parentElement;
        const w = container.clientWidth;
        if (w > 100) {
            stressCanvas.width = w;
            canvasWidth = w;
            stressCanvas.height = 320;
            canvasHeight = 320;
            updateFromForce();
        }
        const specContainer = specimenCanvas.parentElement;
        const sw = specContainer.clientWidth;
        specimenCanvas.width = Math.min(600, sw);
        specimenWidth = specimenCanvas.width;
        drawSpecimen(loadingPath.length ? loadingPath[loadingPath.length-1].strain : 0);
    }
    
    window.addEventListener('resize', resizeAll);
    resizeAll();
    resetSim();

    return () => {
        window.removeEventListener('resize', resizeAll);
        forceSlider?.removeEventListener('input', handlers.forceChange);
        $('resetForceBtn')?.removeEventListener('click', handlers.resetClick);
        $('autoLoadBtn')?.removeEventListener('click', handlers.autoClick);
        lengthInput?.removeEventListener('change', handlers.lenChange);
        areaInput?.removeEventListener('change', handlers.areaChange);
        tempSlider?.removeEventListener('input', handlers.tempChange);
        rateSlider?.removeEventListener('input', handlers.rateChange);
        stressCanvas?.removeEventListener('click', handleCanvasClick);
    };
  }, []);

  return (
    <div className="stress-wrapper" ref={rootRef}>
      <div className="sim-card">
        <h1> Advanced Stress–Strain Simulator <small>Elastic + Plastic | Unload/Reload | Temp &amp; Rate Effects</small></h1>
        <div className="sub"> Apply force, watch the curve build — unload from plastic region to see permanent set and hysteresis.</div>

        <div className="flex-dashboard">
          <div className="controls">
            <div className="control-group">
              <label> Material</label>
              <div className="material-buttons" id="materialGroup">
                <button data-mat="steel" className="material-btn active">Steel</button>
                <button data-mat="aluminum" className="material-btn">Aluminum</button>
                <button data-mat="copper" className="material-btn">Copper</button>
                <button data-mat="rubber" className="material-btn">Rubber</button>
                <button data-mat="brittle" className="material-btn">Brittle (Ceramic)</button>
              </div>
            </div>

            <div className="control-group">
              <label> Specimen: L₀ (mm) / A (mm²)</label>
              <div className="param-row">
                <input type="number" id="length" defaultValue="100" step="5" className="num-input" />
                <input type="number" id="area" defaultValue="50" step="5" className="num-input" />
              </div>
            </div>

            <div className="control-group">
              <label> Tensile force (N)</label>
              <input type="range" id="forceSlider" min="0" max="25000" step="50" defaultValue="0" />
              <div className="param-row">
                <span id="forceValue" className="num-input">0 N</span>
                <button id="resetForceBtn" className="small">Reset</button>
                <button id="autoLoadBtn" className="small">Auto-load to UTS</button>
              </div>
            </div>

            <div className="control-group">
              <label> Temperature effect (modifier)</label>
              <input type="range" id="tempSlider" min="0.5" max="1.5" step="0.01" defaultValue="1.0" />
              <span id="tempVal" className="num-input">1.00</span>
              <div style={{fontSize: '0.65rem'}}>&lt;1 = weaker/brittle, &gt;1 = softer</div>
            </div>

            <div className="control-group">
              <label>⏱ Strain rate effect (speed)</label>
              <input type="range" id="rateSlider" min="0.2" max="2.5" step="0.05" defaultValue="1.0" />
              <span id="rateVal" className="num-input">1.00</span>
              <div style={{fontSize: '0.65rem'}}>Higher rate → slightly higher strength</div>
            </div>

            <div className="control-group">
              <div className="warning" id="failureWarning"> Intact</div>
              <div id="stressStrainReadout" style={{marginTop: '8px', fontSize: '0.75rem', background: '#eef2ff', padding: '6px', borderRadius: '20px', textAlign: 'center'}}>
                σ = 0.00 MPa | ε = 0.0000 | E = --- GPa
              </div>
              <div id="hintText" style={{fontSize: '0.7rem', marginTop: '6px'}}> Click on graph to set stress target</div>
            </div>
          </div>

          <div className="visualization">
            <canvas id="stressStrainCanvas" width="750" height="320" style={{width: '100%', aspectRatio: '750/320'}}></canvas>
            <div className="legend">
              <span> Full material curve (reference)</span>
              <span> Current loading path</span>
              <span> Unloading / reloading (hysteresis)</span>
              <span> Yield • UTS • Fracture</span>
            </div>
            <div className="specimen-container">
              <canvas id="specimenCanvas" width="600" height="90" style={{width: '100%', background: '#fef3c7', borderRadius: '40px'}}></canvas>
              <div> Elongation (exaggerated) | Permanent set after yield</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountStressStrainSimulation(container) {
  const app = render(StressStrainSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

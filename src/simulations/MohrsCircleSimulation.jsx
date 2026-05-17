import { render, useEffect, useRef } from '/src/utils/react-lite.js';
import './MohrsCircleSimulation.css';

export default function MohrsCircleSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // DOM elements
    const sigmaxSlider = $('sigmax');
    const sigmaySlider = $('sigmay');
    const tauxySlider = $('tauxy');
    const thetaSlider = $('theta');
    const sigmaxVal = $('sigmaxVal');
    const sigmayVal = $('sigmayVal');
    const tauxyVal = $('tauxyVal');
    const thetaVal = $('thetaVal');
    const resetTheta = $('resetThetaBtn');
    const toggleExample = $('toggleExampleBtn');
    const principalDisplay = $('principalDisplay');
    const rotatedDisplay = $('rotatedDisplay');
    const mohrCanvas = $('mohrCanvas');
    const ctxMohr = mohrCanvas.getContext('2d');
    const elementCanvas = $('elementCanvas');
    const ctxElem = elementCanvas.getContext('2d');

    let widthMohr = 650, heightMohr = 400;
    let widthElem = 600, heightElem = 300;

    // state
    let sigmax = 80, sigmay = 30, tauxy = 40;
    let thetaDeg = 0;   // rotation angle

    function computeCircleParams() {
        const avg = (sigmax + sigmay) / 2;
        const diff = (sigmax - sigmay) / 2;
        const radius = Math.hypot(diff, tauxy);
        const sigma1 = avg + radius;
        const sigma2 = avg - radius;
        const tauMax = radius;
        let thetaP_rad = 0.5 * Math.atan2(tauxy, diff);
        let thetaP_deg = thetaP_rad * 180 / Math.PI;
        return { avg, diff, radius, sigma1, sigma2, tauMax, thetaP_deg };
    }

    function getRotatedStresses(thetaDeg) {
        const rad = thetaDeg * Math.PI / 180;
        const cos2 = Math.cos(2*rad);
        const sin2 = Math.sin(2*rad);
        const avg = (sigmax + sigmay) / 2;
        const diff = (sigmax - sigmay) / 2;
        const sigmax_prime = avg + diff * cos2 + tauxy * sin2;
        const sigmay_prime = avg - diff * cos2 - tauxy * sin2;
        const tauxy_prime = -diff * sin2 + tauxy * cos2;
        return { sigmax_prime, sigmay_prime, tauxy_prime };
    }

    function update() {
        if (!sigmaxSlider) return;
        sigmax = parseFloat(sigmaxSlider.value);
        sigmay = parseFloat(sigmaySlider.value);
        tauxy = parseFloat(tauxySlider.value);
        thetaDeg = parseFloat(thetaSlider.value);
        
        if (sigmaxVal) sigmaxVal.innerText = sigmax;
        if (sigmayVal) sigmayVal.innerText = sigmay;
        if (tauxyVal) tauxyVal.innerText = tauxy;
        if (thetaVal) thetaVal.innerText = thetaDeg + "°";
        
        const { sigma1, sigma2, tauMax, avg, radius, thetaP_deg } = computeCircleParams();
        const rotated = getRotatedStresses(thetaDeg);
        
        if (principalDisplay) principalDisplay.innerHTML = `σ₁ = ${sigma1.toFixed(1)} MPa &nbsp; σ₂ = ${sigma2.toFixed(1)} MPa<br/>τ_max = ${tauMax.toFixed(1)} MPa &nbsp; | &nbsp; θₚ = ${thetaP_deg.toFixed(1)}°`;
        if (rotatedDisplay) rotatedDisplay.innerHTML = `σₓ' = ${rotated.sigmax_prime.toFixed(1)} MPa &nbsp; σᵧ' = ${rotated.sigmay_prime.toFixed(1)} MPa &nbsp; τ_xy' = ${rotated.tauxy_prime.toFixed(1)} MPa`;
        
        drawMohrCircle(avg, radius, sigma1, sigma2, tauMax, thetaP_deg);
        drawStressElement(thetaDeg, rotated);
    }

    function drawMohrCircle(center, radius, sigma1, sigma2, tauMax) {
        if (!ctxMohr) return;
        ctxMohr.clearRect(0, 0, widthMohr, heightMohr);
        const margin = { left: 70, right: 30, top: 30, bottom: 40 };
        const wGraph = widthMohr - margin.left - margin.right;
        const hGraph = heightMohr - margin.top - margin.bottom;
        
        let minStress = Math.min(sigma2, center - radius, 0, sigmax, sigmay) - 10;
        let maxStress = Math.max(sigma1, center + radius, 0, sigmax, sigmay) + 10;
        let maxShear = Math.max(tauMax, Math.abs(tauxy), 10) + 5;
        const stressRange = maxStress - minStress;
        const shearMaxVis = maxShear;
        
        function sigmaToX(sigma) { return margin.left + (sigma - minStress) / stressRange * wGraph; }
        function tauToY(tau) { return margin.top + hGraph - (tau + shearMaxVis) / (2*shearMaxVis) * hGraph; }
        
        ctxMohr.beginPath();
        ctxMohr.moveTo(margin.left, margin.top + hGraph/2);
        ctxMohr.lineTo(widthMohr - margin.right, margin.top + hGraph/2);
        ctxMohr.moveTo(margin.left, margin.top);
        ctxMohr.lineTo(margin.left, margin.top + hGraph);
        ctxMohr.strokeStyle = "#334155";
        ctxMohr.stroke();
        ctxMohr.fillStyle = "#1e293b";
        ctxMohr.font = "10px 'Segoe UI'";
        ctxMohr.fillText("σ (MPa)", widthMohr - 30, margin.top + hGraph/2 - 5);
        ctxMohr.fillText("τ (MPa)", margin.left - 20, margin.top + 15);
        
        const cx = sigmaToX(center);
        const cy = tauToY(0);
        const rPx = (radius / stressRange) * wGraph;
        ctxMohr.beginPath();
        ctxMohr.arc(cx, cy, rPx, 0, 2*Math.PI);
        ctxMohr.strokeStyle = "#3b82f6";
        ctxMohr.lineWidth = 2.5;
        ctxMohr.stroke();
        ctxMohr.fillStyle = "rgba(59,130,246,0.1)";
        ctxMohr.fill();
        
        const x1 = sigmaToX(sigma1), x2 = sigmaToX(sigma2);
        ctxMohr.beginPath(); ctxMohr.arc(x1, cy, 6, 0, 2*Math.PI); ctxMohr.fillStyle = "#ef4444"; ctxMohr.fill();
        ctxMohr.beginPath(); ctxMohr.arc(x2, cy, 6, 0, 2*Math.PI); ctxMohr.fillStyle = "#ef4444"; ctxMohr.fill();
        ctxMohr.fillStyle = "#b91c1c"; ctxMohr.fillText("σ₁", x1-12, cy-4); ctxMohr.fillText("σ₂", x2-12, cy-4);
        
        const xCenter = sigmaToX(center);
        const yTop = tauToY(tauMax), yBottom = tauToY(-tauMax);
        ctxMohr.beginPath(); ctxMohr.arc(xCenter, yTop, 6, 0, 2*Math.PI); ctxMohr.fillStyle = "#10b981"; ctxMohr.fill();
        ctxMohr.beginPath(); ctxMohr.arc(xCenter, yBottom, 6, 0, 2*Math.PI); ctxMohr.fillStyle = "#10b981"; ctxMohr.fill();
        ctxMohr.fillStyle = "#047857"; ctxMohr.fillText("τ_max", xCenter+5, yTop-4);
        
        const currX = sigmaToX(sigmax);
        const currY = tauToY(tauxy);
        ctxMohr.beginPath(); ctxMohr.arc(currX, currY, 8, 0, 2*Math.PI); ctxMohr.fillStyle = "#facc15"; ctxMohr.fill();
        ctxMohr.fillStyle = "#b45309"; ctxMohr.fillText("(σₓ,τ_xy)", currX+6, currY-5);
        
        const rotated = getRotatedStresses(thetaDeg);
        const rotX = sigmaToX(rotated.sigmax_prime);
        const rotY = tauToY(rotated.tauxy_prime);
        ctxMohr.beginPath(); ctxMohr.arc(rotX, rotY, 7, 0, 2*Math.PI); ctxMohr.fillStyle = "#a855f7"; ctxMohr.fill();
        ctxMohr.fillStyle = "#6b21a5"; ctxMohr.fillText(`θ=${thetaDeg}°`, rotX+5, rotY-5);
        
        ctxMohr.beginPath(); ctxMohr.moveTo(cx, cy); ctxMohr.lineTo(currX, currY); ctxMohr.strokeStyle = "#94a3b8"; ctxMohr.setLineDash([5,5]); ctxMohr.stroke();
        ctxMohr.beginPath(); ctxMohr.moveTo(cx, cy); ctxMohr.lineTo(rotX, rotY); ctxMohr.stroke();
        ctxMohr.setLineDash([]);
        ctxMohr.fillStyle = "#1f2937"; ctxMohr.font = "italic 9px sans-serif"; ctxMohr.fillText(`2θ = ${(2*thetaDeg).toFixed(0)}°`, (cx+currX)/2, (cy+currY)/2-8);
        
        ctxMohr.fillStyle = "#475569";
        ctxMohr.fillText(`C = (${center.toFixed(1)}, 0)`, cx-25, cy-6);
    }
    
    function drawStressElement(thetaDeg, rotated) {
        if (!ctxElem) return;
        ctxElem.clearRect(0, 0, widthElem, heightElem);
        const centerX = widthElem/2, centerY = heightElem/2;
        const size = 100; // half side
        const rad = thetaDeg * Math.PI / 180;
        const cosT = Math.cos(rad), sinT = Math.sin(rad);
        
        const corners = [[-size, -size], [size, -size], [size, size], [-size, size]];
        const rotatedCorners = corners.map(p => {
            let x = p[0]*cosT - p[1]*sinT + centerX;
            let y = p[0]*sinT + p[1]*cosT + centerY;
            return [x, y];
        });
        
        ctxElem.beginPath();
        ctxElem.moveTo(rotatedCorners[0][0], rotatedCorners[0][1]);
        for(let i=1;i<4;i++) ctxElem.lineTo(rotatedCorners[i][0], rotatedCorners[i][1]);
        ctxElem.closePath();
        ctxElem.strokeStyle = "#0f172a";
        ctxElem.lineWidth = 2;
        ctxElem.stroke();
        ctxElem.fillStyle = "rgba(241,245,249,0.5)";
        ctxElem.fill();
        
        const rightFace = [(rotatedCorners[1][0]+rotatedCorners[2][0])/2, (rotatedCorners[1][1]+rotatedCorners[2][1])/2];
        const leftFace = [(rotatedCorners[0][0]+rotatedCorners[3][0])/2, (rotatedCorners[0][1]+rotatedCorners[3][1])/2];
        const topFace = [(rotatedCorners[0][0]+rotatedCorners[1][0])/2, (rotatedCorners[0][1]+rotatedCorners[1][1])/2];
        const bottomFace = [(rotatedCorners[3][0]+rotatedCorners[2][0])/2, (rotatedCorners[3][1]+rotatedCorners[2][1])/2];
        
        const rightNormVec = [rotatedCorners[1][0] - centerX, rotatedCorners[1][1] - centerY]; 
        const leftNormVec = [rotatedCorners[0][0] - centerX, rotatedCorners[0][1] - centerY];
        const topNormVec = [rotatedCorners[0][0] - centerX, rotatedCorners[0][1] - centerY];
        const bottomNormVec = [rotatedCorners[3][0] - centerX, rotatedCorners[3][1] - centerY];
        
        function drawNormalArrow(faceCenter, outwardVec, stressVal) {
            let angle = Math.atan2(outwardVec[1], outwardVec[0]);
            let dirX = Math.cos(angle), dirY = Math.sin(angle);
            let len = 25 + Math.min(45, Math.abs(stressVal)/4);
            let startX = faceCenter[0], startY = faceCenter[1];
            let endX = startX + dirX * len, endY = startY + dirY * len;
            if (stressVal < 0) { endX = startX - dirX * len; endY = startY - dirY * len; }
            ctxElem.beginPath();
            ctxElem.moveTo(startX, startY);
            ctxElem.lineTo(endX, endY);
            ctxElem.strokeStyle = stressVal >=0 ? "#2563eb" : "#dc2626";
            ctxElem.lineWidth = 3;
            ctxElem.stroke();
            
            let backAngle = Math.atan2(endY-startY, endX-startX);
            let arrowX = endX, arrowY = endY;
            ctxElem.beginPath();
            ctxElem.moveTo(arrowX, arrowY);
            ctxElem.lineTo(arrowX-8*Math.cos(backAngle-0.8), arrowY-8*Math.sin(backAngle-0.8));
            ctxElem.lineTo(arrowX-8*Math.cos(backAngle+0.8), arrowY-8*Math.sin(backAngle+0.8));
            ctxElem.fillStyle = stressVal >=0 ? "#2563eb" : "#dc2626";
            ctxElem.fill();
            ctxElem.fillStyle = "#0f172a";
            ctxElem.font = "bold 11px sans-serif";
            ctxElem.fillText(`${Math.abs(stressVal).toFixed(0)} MPa`, (startX+endX)/2-15, (startY+endY)/2-8);
        }
        
        function drawShearArrows(faceCenter, faceDir, shearVal) {
            let angle = Math.atan2(faceDir[1], faceDir[0]);
            let perpX = -Math.sin(angle), perpY = Math.cos(angle);
            let offset = 18;
            let start = [faceCenter[0] - perpX*offset, faceCenter[1] - perpY*offset];
            let end = [faceCenter[0] + perpX*offset, faceCenter[1] + perpY*offset];
            ctxElem.beginPath();
            ctxElem.moveTo(start[0], start[1]);
            ctxElem.lineTo(end[0], end[1]);
            ctxElem.strokeStyle = "#f97316";
            ctxElem.lineWidth = 2;
            ctxElem.stroke();
            
            let dir = [end[0]-start[0], end[1]-start[1]];
            let lenDir = Math.hypot(dir[0], dir[1]);
            if(lenDir>0.01) { dir[0]/=lenDir; dir[1]/=lenDir; }
            let arrowSize = 8;
            let arrowEnd = [end[0]-dir[0]*arrowSize, end[1]-dir[1]*arrowSize];
            ctxElem.beginPath(); ctxElem.moveTo(end[0], end[1]); ctxElem.lineTo(arrowEnd[0]-dir[1]*5, arrowEnd[1]+dir[0]*5); ctxElem.lineTo(arrowEnd[0]+dir[1]*5, arrowEnd[1]-dir[0]*5); ctxElem.fillStyle = "#f97316"; ctxElem.fill();
            let startArrow = [start[0]+dir[0]*arrowSize, start[1]+dir[1]*arrowSize];
            ctxElem.beginPath(); ctxElem.moveTo(start[0], start[1]); ctxElem.lineTo(startArrow[0]-dir[1]*5, startArrow[1]+dir[0]*5); ctxElem.lineTo(startArrow[0]+dir[1]*5, startArrow[1]-dir[0]*5); ctxElem.fill();
            ctxElem.fillStyle = "#c2410c";
            ctxElem.fillText(`${Math.abs(shearVal).toFixed(0)}`, (start[0]+end[0])/2-8, (start[1]+end[1])/2-6);
        }
        
        let rightDir = [rotatedCorners[1][0]-rotatedCorners[0][0], rotatedCorners[1][1]-rotatedCorners[0][1]];
        drawNormalArrow(rightFace, rightNormVec, rotated.sigmax_prime);
        let rightTangent = [rightDir[0], rightDir[1]];
        drawShearArrows(rightFace, rightTangent, rotated.tauxy_prime);
        
        let leftDir = [rotatedCorners[0][0]-rotatedCorners[3][0], rotatedCorners[0][1]-rotatedCorners[3][1]];
        drawNormalArrow(leftFace, leftNormVec, rotated.sigmax_prime);
        drawShearArrows(leftFace, leftDir, -rotated.tauxy_prime);
        
        drawNormalArrow(topFace, topNormVec, rotated.sigmay_prime);
        let topTangent = [rotatedCorners[1][0]-rotatedCorners[0][0], rotatedCorners[1][1]-rotatedCorners[0][1]];
        drawShearArrows(topFace, topTangent, -rotated.tauxy_prime);
        
        let bottomDir = [rotatedCorners[2][0]-rotatedCorners[3][0], rotatedCorners[2][1]-rotatedCorners[3][1]];
        drawNormalArrow(bottomFace, bottomNormVec, rotated.sigmay_prime);
        drawShearArrows(bottomFace, bottomDir, rotated.tauxy_prime);
        
        ctxElem.fillStyle = "#0f172a";
        ctxElem.font = "italic 10px sans-serif";
        ctxElem.fillText(`θ = ${thetaDeg}°`, centerX-30, centerY+size+35);
    }
    
    function resetRotation() { 
        if (thetaSlider) thetaSlider.value = 0; 
        update(); 
    }
    
    function loadFailureExample() {
        if (sigmaxSlider) sigmaxSlider.value = -50;
        if (sigmaySlider) sigmaySlider.value = 20;
        if (tauxySlider) tauxySlider.value = -80;
        if (thetaSlider) thetaSlider.value = 0;
        update();
        const msgDiv = $('misconceptionMsg');
        if (msgDiv) {
            msgDiv.innerHTML = " <strong>Failure mode demonstration:</strong> Wrong sign convention (e.g., assuming compression as positive) would flip the circle's quadrant. Here σₓ = -50 MPa (compression), large negative shear. Mohr's circle still gives correct principal stresses: always use tension positive!";
            msgDiv.style.background = "#fee2e2";
            setTimeout(() => {
                msgDiv.style.background = "#fff7e5";
                msgDiv.innerHTML = " <strong>Key insight:</strong> Rotating the element changes the apparent stresses, but principal stresses (where τ=0) are invariant — they are the extremes on Mohr’s circle.";
            }, 5000);
        }
    }
    
    function resizeCanvases() {
        const mohrContainer = mohrCanvas?.parentElement;
        if (mohrContainer) {
            const wMohr = mohrContainer.clientWidth;
            if(wMohr > 100) { mohrCanvas.width = wMohr; widthMohr = wMohr; mohrCanvas.height = 400; heightMohr = 400; update(); }
        }
        const elemContainer = elementCanvas?.parentElement;
        if (elemContainer) {
            const wElem = elemContainer.clientWidth;
            if(wElem > 100) { elementCanvas.width = wElem; widthElem = wElem; elementCanvas.height = 300; heightElem = 300; update(); }
        }
    }
    
    const handlers = { update, resetRotation, loadFailureExample, resizeCanvases };
    
    sigmaxSlider?.addEventListener('input', handlers.update);
    sigmaySlider?.addEventListener('input', handlers.update);
    tauxySlider?.addEventListener('input', handlers.update);
    thetaSlider?.addEventListener('input', handlers.update);
    resetTheta?.addEventListener('click', handlers.resetRotation);
    toggleExample?.addEventListener('click', handlers.loadFailureExample);
    window.addEventListener('resize', handlers.resizeCanvases);
    
    resizeCanvases();
    update();

    return () => {
        window.removeEventListener('resize', handlers.resizeCanvases);
        sigmaxSlider?.removeEventListener('input', handlers.update);
        sigmaySlider?.removeEventListener('input', handlers.update);
        tauxySlider?.removeEventListener('input', handlers.update);
        thetaSlider?.removeEventListener('input', handlers.update);
        resetTheta?.removeEventListener('click', handlers.resetRotation);
        toggleExample?.removeEventListener('click', handlers.loadFailureExample);
    };
  }, []);

  return (
    <div className="mohr-wrapper" ref={rootRef}>
      <div className="sim-card">
        <h1> Mohr's Circle Simulator <small>σ₁, σ₂, τ_max | Plane Stress Transformation</small></h1>
        <div className="sub"> Rotate the element → see how stresses change, but principal stresses &amp; max shear are invariant.</div>

        <div className="flex-dashboard">
          <div className="controls">
            <div className="control-group">
              <label> Normal stress σₓ (MPa)</label>
              <input type="range" id="sigmax" min="-100" max="200" step="1" defaultValue="80" />
              <div className="param-row"><span id="sigmaxVal" className="num-input">80</span> <span style={{fontSize: '0.7rem'}}>(+ tension, - compression)</span></div>
            </div>
            <div className="control-group">
              <label> Normal stress σᵧ (MPa)</label>
              <input type="range" id="sigmay" min="-100" max="200" step="1" defaultValue="30" />
              <div className="param-row"><span id="sigmayVal" className="num-input">30</span></div>
            </div>
            <div className="control-group">
              <label> Shear stress τ_xy (MPa)</label>
              <input type="range" id="tauxy" min="-100" max="100" step="1" defaultValue="40" />
              <div className="param-row"><span id="tauxyVal" className="num-input">40</span> <span style={{fontSize: '0.7rem'}}>(positive as shown)</span></div>
            </div>
            <div className="control-group">
              <label> Element rotation angle θ (degrees)</label>
              <input type="range" id="theta" min="-90" max="90" step="1" defaultValue="0" />
              <div className="param-row"><span id="thetaVal" className="num-input">0°</span> <button id="resetThetaBtn">Reset</button></div>
            </div>
            <div className="control-group">
              <label> Sign convention: tension positive</label>
              <div style={{fontSize: '0.7rem'}}>(σ positive → right/up, negative → left/down)</div>
              <button id="toggleExampleBtn" style={{marginTop: '6px', background: '#475569'}}> Load failure case (wrong sign)</button>
            </div>
            <div className="stress-value" id="principalDisplay">
              σ₁ = -- MPa, σ₂ = -- MPa<br />
              τ_max = -- MPa
            </div>
            <div className="stress-value" id="rotatedDisplay">
              σₓ' = --, σᵧ' = --, τ_xy' = --
            </div>
            <div className="warning-note" id="misconceptionMsg">
               <strong>Key insight:</strong> Rotating the element changes the apparent stresses, but the principal stresses (where τ=0) are invariant — they are the extremes on Mohr’s circle.
            </div>
          </div>

          <div className="visualization">
            <canvas id="mohrCanvas" width="650" height="400" style={{width: '100%', aspectRatio: '650/400'}}></canvas>
            <div className="legend">
              <span> Mohr's Circle</span>
              <span> Principal stresses (σ₁, σ₂)</span>
              <span> Max shear (τ_max)</span>
              <span> Current stress state (σₓ, τ_xy) &amp; rotation</span>
            </div>
            <canvas id="elementCanvas" width="600" height="300" style={{width: '100%', aspectRatio: '600/300'}}></canvas>
            <div className="legend" style={{marginBottom: 0}}>
              <span> Stress element (rotated by θ)</span>
              <span>⬅ Normal stress → arrows</span>
              <span>↕ Shear stress arrows</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function mountMohrsCircleSimulation(container) {
  const app = render(MohrsCircleSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

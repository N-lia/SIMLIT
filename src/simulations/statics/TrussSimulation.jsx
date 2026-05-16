import React, { useEffect, useRef } from 'react';
import './TrussSimulation.css';

export default function TrussSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // DATA STRUCTURES
    let nodes = [];          // {x, y, rx, ry, fx, fy, dofX, dofY}
    let members = [];        // {i, j, L, A, E, force, stress, failed, failReason}
    let analysisValid = false;
    let displacements = [];

    // UI state
    let currentMode = "addJoint";   // addJoint, addMember, addLoad, addSupport, delete
    let selectedNodeForMember = null;
    let canvas = $("trussCanvas");
    let ctx = canvas.getContext('2d');
    let width = 900, height = 520;

    // World coordinates
    let worldMinX = 0, worldMaxX = 18, worldMinY = 0, worldMaxY = 11;
    
    const materials = {
        steel: { E: 200e9, yield: 250e6, name: "Steel" },
        aluminum: { E: 70e9, yield: 150e6, name: "Aluminum" },
        timber: { E: 10e9, yield: 30e6, name: "Timber" }
    };

    function getMaterial() { return materials[$('materialSelect').value]; }
    function getArea() { return parseFloat($('areaInput').value) * 1e-4; } // m²

    function worldToScreen(x,y) {
        let sx = 70 + (x - worldMinX) / (worldMaxX - worldMinX) * (width - 140);
        let sy = 40 + (y - worldMinY) / (worldMaxY - worldMinY) * (height - 80);
        return { x: sx, y: sy };
    }
    
    function screenToWorld(sx, sy) {
        let x = worldMinX + (sx - 70) / (width - 140) * (worldMaxX - worldMinX);
        let y = worldMinY + (sy - 40) / (height - 80) * (worldMaxY - worldMinY);
        return { x: Math.min(worldMaxX, Math.max(worldMinX, x)), y: Math.min(worldMaxY, Math.max(worldMinY, y)) };
    }

    function findNodeAtPixel(px, py, tol=12) {
        for (let i=0; i<nodes.length; i++) {
            let scr = worldToScreen(nodes[i].x, nodes[i].y);
            let dx = scr.x - px, dy = scr.y - py;
            if (Math.hypot(dx, dy) < tol) return i;
        }
        return -1;
    }

    function buildAndSolve() {
        const nNodes = nodes.length;
        if (nNodes === 0 || members.length === 0) {
            analysisValid = false;
            return;
        }
        
        let dofCounter = 0;
        for (let i=0; i<nNodes; i++) {
            nodes[i].dofX = dofCounter++;
            nodes[i].dofY = dofCounter++;
        }
        const totalDof = dofCounter;
        
        let K = Array(totalDof).fill().map(() => Array(totalDof).fill(0));
        let F = Array(totalDof).fill(0);
        const A = getArea();
        const mat = getMaterial();
        const E = mat.E;
        
        for (let m of members) {
            const n1 = nodes[m.i];
            const n2 = nodes[m.j];
            const dx = n2.x - n1.x, dy = n2.y - n1.y;
            const L = Math.hypot(dx, dy);
            m.L = L;
            if (L < 1e-6) continue;
            
            const cos = dx/L, sin = dy/L;
            const k = A * E / L;
            const ke_local = [
                [ k, 0, -k, 0],
                [ 0, 0,  0, 0],
                [-k, 0,  k, 0],
                [ 0, 0,  0, 0]
            ];
            
            const T = [
                [cos, sin, 0, 0],
                [-sin, cos, 0, 0],
                [0, 0, cos, sin],
                [0, 0, -sin, cos]
            ];
            
            let ke_global = Array(4).fill().map(() => Array(4).fill(0));
            for (let i=0;i<4;i++)
                for (let j=0;j<4;j++)
                    for (let p=0;p<4;p++)
                        for (let q=0;q<4;q++)
                            ke_global[i][j] += T[p][i] * ke_local[p][q] * T[q][j];
                            
            const dofs = [n1.dofX, n1.dofY, n2.dofX, n2.dofY];
            for (let a=0;a<4;a++)
                for (let b=0;b<4;b++)
                    K[dofs[a]][dofs[b]] += ke_global[a][b];
        }
        
        for (let i=0; i<nNodes; i++) {
            const node = nodes[i];
            F[node.dofX] += node.fx;
            F[node.dofY] += node.fy;
            if (node.rx) {
                for (let j=0; j<totalDof; j++) K[node.dofX][j] = (j === node.dofX) ? 1 : 0;
                F[node.dofX] = 0;
            }
            if (node.ry) {
                for (let j=0; j<totalDof; j++) K[node.dofY][j] = (j === node.dofY) ? 1 : 0;
                F[node.dofY] = 0;
            }
        }
        
        let A_mat = K.map(row => [...row]);
        let b = [...F];
        const n = totalDof;
        try {
            for (let i=0; i<n; i++) {
                let maxRow = i;
                for (let k=i+1; k<n; k++) if (Math.abs(A_mat[k][i]) > Math.abs(A_mat[maxRow][i])) maxRow = k;
                if (maxRow !== i) {
                    [A_mat[i], A_mat[maxRow]] = [A_mat[maxRow], A_mat[i]];
                    [b[i], b[maxRow]] = [b[maxRow], b[i]];
                }
                if (Math.abs(A_mat[i][i]) < 1e-12) continue;
                for (let k=i+1; k<n; k++) {
                    let factor = A_mat[k][i] / A_mat[i][i];
                    for (let j=i; j<n; j++) A_mat[k][j] -= factor * A_mat[i][j];
                    b[k] -= factor * b[i];
                }
            }
            let x = new Array(n).fill(0);
            for (let i=n-1; i>=0; i--) {
                let sum = 0;
                for (let j=i+1; j<n; j++) sum += A_mat[i][j] * x[j];
                if (Math.abs(A_mat[i][i]) > 1e-10) x[i] = (b[i] - sum) / A_mat[i][i];
                else x[i] = 0;
            }
            displacements = x;
            
            for (let m of members) {
                const n1 = nodes[m.i], n2 = nodes[m.j];
                const dx = n2.x - n1.x, dy = n2.y - n1.y;
                const L = m.L;
                if(L < 1e-6) continue;
                const cos = dx/L, sin = dy/L;
                const u1 = displacements[n1.dofX], v1 = displacements[n1.dofY];
                const u2 = displacements[n2.dofX], v2 = displacements[n2.dofY];
                const axialStrain = ((u2-u1)*cos + (v2-v1)*sin) / L;
                const force = A * E * axialStrain;
                m.force = force;
                m.stress = force / A;
            }
            analysisValid = true;
        } catch(e) { 
            analysisValid = false; 
            console.warn("Analysis failed:", e); 
        }
    }

    function detectFailures() {
        const mat = getMaterial();
        const yieldStress = mat.yield;
        const A_val = getArea();
        for (let m of members) {
            m.failed = false;
            m.failReason = "";
            if (Math.abs(m.stress) > yieldStress) {
                m.failed = true;
                m.failReason = "Yielding";
            }
            if (m.force < 0 && !m.failed) {
                const L = m.L;
                const r_min = Math.sqrt(A_val / 15);
                const slenderness = L / (r_min + 1e-6);
                const E = mat.E;
                const sigma_crit = Math.PI*Math.PI*E / (slenderness*slenderness);
                if (sigma_crit < Math.abs(m.stress) && m.stress < 0) {
                    m.failed = true;
                    m.failReason = "Buckling";
                }
            }
        }
    }

    function updateAnalysis() {
        buildAndSolve();
        detectFailures();
        drawCanvas();
        updateUI();
    }

    function updateUI() {
        const memberTable = $("memberTable");
        const statusMsg = $("statusMsg");
        const failureList = $("failureList");

        if (!analysisValid) {
            if(memberTable) memberTable.innerHTML = "<span style='color:red'>⚠️ Unstable or unsolvable truss (mechanism)</span>";
            if(statusMsg) statusMsg.innerHTML = "⚠️ Mechanism / insufficient supports";
            if(failureList) failureList.innerHTML = "Add supports or diagonal members";
            return;
        }
        
        let html = "<table style='width:100%; font-size:0.7rem'><tr><th>#</th><th>Force (kN)</th><th>Stress (MPa)</th><th>Status</th></tr>";
        members.forEach((m, idx) => {
            let forceKN = (m.force/1000).toFixed(1);
            let stressMPA = (m.stress/1e6).toFixed(1);
            let color = m.force > 0 ? "#2563eb" : (m.force < 0 ? "#dc2626" : "#555");
            let status = m.failed ? `❌ ${m.failReason}` : "OK";
            html += `<tr><td>${idx+1}</td><td style="color:${color}">${forceKN}</td><td>${stressMPA}</td><td>${status}</td></tr>`;
        });
        html += "</table>";
        
        if (memberTable) memberTable.innerHTML = html;
        
        let failedMembers = members.filter(m=>m.failed);
        let failText = failedMembers.map(m=>`Member ${members.indexOf(m)+1} (${m.failReason})`).join(", ");
        if (failureList) {
            if (failText) failureList.innerHTML = `⚠️ Failure: ${failText}`;
            else failureList.innerHTML = "✅ No failures";
        }
        
        let minFOS = 1e9;
        members.forEach(m => { 
            if(!m.failed && Math.abs(m.stress)>0) minFOS = Math.min(minFOS, getMaterial().yield / Math.abs(m.stress)); 
        });
        let fosMsg = minFOS < 100 ? `FOS = ${minFOS.toFixed(1)}` : "FOS > 10";
        if (statusMsg) statusMsg.innerHTML = `✅ Stable | ${fosMsg}`;
    }

    function drawCanvas() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 0.5;
        for (let i=0; i<width; i+=30) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
        for (let i=0; i<height; i+=30) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }
        
        members.forEach(m => {
            const p1 = worldToScreen(nodes[m.i].x, nodes[m.i].y);
            const p2 = worldToScreen(nodes[m.j].x, nodes[m.j].y);
            let color = "#94a3b8";
            if (analysisValid && m.force) {
                if (m.force > 0) color = "#3b82f6";
                else if (m.force < 0) color = "#ef4444";
            }
            if (m.failed) color = "#f97316";
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 6;
            ctx.strokeStyle = color;
            ctx.stroke();
            
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = "#1e293b";
            ctx.stroke();
            
            if (analysisValid && Math.abs(m.force) > 200) {
                let mx = (p1.x+p2.x)/2, my = (p1.y+p2.y)/2;
                ctx.fillStyle = "#0f172a";
                ctx.font = "bold 9px monospace";
                ctx.fillText(`${(m.force/1000).toFixed(0)} kN`, mx-10, my-5);
            }
        });
        
        nodes.forEach((node) => {
            let p = worldToScreen(node.x, node.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, 2*Math.PI);
            ctx.fillStyle = "#1e293b";
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.arc(p.x, p.y, 4, 0, 2*Math.PI);
            ctx.fill();
            
            if (node.fx !== 0 || node.fy !== 0) {
                let fx = node.fx, fy = node.fy;
                let angle = Math.atan2(fy, fx);
                let len = Math.min(22, Math.hypot(fx,fy)/300);
                let endX = p.x + Math.cos(angle)*len, endY = p.y + Math.sin(angle)*len;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = "#eab308";
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.fillStyle = "#ca8a04";
                ctx.font = "bold 9px 'Segoe UI'";
                ctx.fillText(`${Math.abs((node.fx+node.fy)/1000).toFixed(0)} kN`, p.x+5, p.y-8);
            }
            
            if (node.rx && node.ry) {
                ctx.fillStyle = "#a855f7";
                ctx.beginPath(); ctx.rect(p.x-12, p.y-10, 24, 10); ctx.fill();
            } else if (node.ry) {
                ctx.fillStyle = "#a855f7";
                ctx.beginPath(); ctx.rect(p.x-9, p.y-6, 18, 6); ctx.fill();
            }
        });
        
        if (analysisValid && displacements.some(d=>Math.abs(d)>1e-6)) {
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = "#059669";
            ctx.lineWidth = 1.8;
            ctx.setLineDash([6,6]);
            members.forEach(m => {
                let n1 = nodes[m.i], n2 = nodes[m.j];
                let dx1 = displacements[n1.dofX]*15, dy1 = displacements[n1.dofY]*15;
                let dx2 = displacements[n2.dofX]*15, dy2 = displacements[n2.dofY]*15;
                let p1 = worldToScreen(n1.x+dx1, n1.y+dy1);
                let p2 = worldToScreen(n2.x+dx2, n2.y+dy2);
                ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const ax = px - x1, ay = py - y1;
        const bx = x2 - x1, by = y2 - y1;
        const dot = ax*bx + ay*by;
        const len2 = bx*bx + by*by;
        if (len2 === 0) return Math.hypot(ax, ay);
        let t = dot / len2;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        const projX = x1 + t*bx, projY = y1 + t*by;
        return Math.hypot(px-projX, py-projY);
    }

    function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let mouseX = (e.clientX - rect.left) * scaleX;
        let mouseY = (e.clientY - rect.top) * scaleY;
        let world = screenToWorld(mouseX, mouseY);

        if (currentMode === "addJoint") {
            nodes.push({ x: world.x, y: world.y, rx: false, ry: false, fx: 0, fy: 0, dofX:0, dofY:0 });
            updateAnalysis();
        }
        else if (currentMode === "addMember") {
            let nodeIdx = findNodeAtPixel(mouseX, mouseY);
            if (nodeIdx !== -1) {
                if (selectedNodeForMember === null) {
                    selectedNodeForMember = nodeIdx;
                } else if (selectedNodeForMember !== nodeIdx) {
                    let exists = members.some(m => (m.i === selectedNodeForMember && m.j === nodeIdx) || (m.i === nodeIdx && m.j === selectedNodeForMember));
                    if (!exists) {
                        members.push({ i: selectedNodeForMember, j: nodeIdx, L: 0, A: getArea(), E: getMaterial().E, force:0, stress:0, failed:false });
                        updateAnalysis();
                    }
                    selectedNodeForMember = null;
                }
            }
        }
        else if (currentMode === "addLoad") {
            let nodeIdx = findNodeAtPixel(mouseX, mouseY);
            if (nodeIdx !== -1) {
                let loadVal = prompt("Vertical load (N) positive downward:", "-5000");
                if (loadVal !== null) {
                    nodes[nodeIdx].fy += parseFloat(loadVal);
                    updateAnalysis();
                }
            }
        }
        else if (currentMode === "addSupport") {
            let nodeIdx = findNodeAtPixel(mouseX, mouseY);
            if (nodeIdx !== -1) {
                let type = prompt("Support type: pin (both fixed) / roller (vertical only)", "pin");
                if (type === "pin") { nodes[nodeIdx].rx = true; nodes[nodeIdx].ry = true; }
                else if (type === "roller") { nodes[nodeIdx].rx = false; nodes[nodeIdx].ry = true; }
                updateAnalysis();
            }
        }
        else if (currentMode === "delete") {
            let nodeIdx = findNodeAtPixel(mouseX, mouseY);
            if (nodeIdx !== -1) {
                nodes.splice(nodeIdx, 1);
                members = members.filter(m => m.i !== nodeIdx && m.j !== nodeIdx);
                for (let m of members) {
                    if (m.i > nodeIdx) m.i--;
                    if (m.j > nodeIdx) m.j--;
                }
                updateAnalysis();
            } else {
                for (let i=0; i<members.length; i++) {
                    let m = members[i];
                    let p1 = worldToScreen(nodes[m.i].x, nodes[m.i].y);
                    let p2 = worldToScreen(nodes[m.j].x, nodes[m.j].y);
                    let dist = pointToSegmentDistance(mouseX, mouseY, p1.x, p1.y, p2.x, p2.y);
                    if (dist < 8) {
                        members.splice(i,1);
                        updateAnalysis();
                        break;
                    }
                }
            }
        }
    }

    function loadTemplate(type) {
        nodes = [];
        members = [];
        if (type === "triangle") {
            nodes.push({x:2, y:1, rx:true, ry:true, fx:0, fy:0});
            nodes.push({x:10, y:1, rx:false, ry:true, fx:0, fy:0});
            nodes.push({x:6, y:6, rx:false, ry:false, fx:0, fy:-8000});
            members.push({i:0,j:1}, {i:1,j:2}, {i:2,j:0});
        }
        else if (type === "warren") {
            for (let i=0;i<=4;i++) nodes.push({x: i*3.5, y:0, rx: (i===0), ry: (i===0), fx:0, fy:0});
            for (let i=0;i<4;i++) nodes.push({x: i*3.5+1.75, y:2.5, rx:false, ry:false, fx:0, fy:0});
            nodes[4].rx = false; nodes[4].ry = true; // roller
            for (let i=0;i<4;i++) members.push({i:i, j:i+1});
            for (let i=0;i<3;i++) members.push({i:5+i, j:6+i});
            for (let i=0;i<4;i++) {
                members.push({i:i, j:5+i});
                members.push({i:i+1, j:5+i});
            }
            nodes[5].fy = -12000;
        }
        else if (type === "pratt") {
            // Simplified pratt setup, similar to warren initially
            for (let i=0;i<=4;i++) nodes.push({x: i*3.5, y:0, rx: (i===0), ry: (i===0), fx:0, fy:0});
            for (let i=0;i<=4;i++) nodes.push({x: i*3.5, y:3.0, rx:false, ry:false, fx:0, fy:0});
            nodes[4].rx = false; nodes[4].ry = true; 
            for (let i=0;i<4;i++) members.push({i:i, j:i+1});
            for (let i=0;i<4;i++) members.push({i:5+i, j:6+i});
            for (let i=0;i<=4;i++) members.push({i:i, j:5+i});
            // diagonals
            members.push({i:0, j:6});
            members.push({i:1, j:7});
            members.push({i:3, j:8});
            members.push({i:4, j:9});
            nodes[7].fy = -15000;
        }
        else if (type === "rectangle") {
            nodes.push({x:3, y:1, rx:true, ry:true, fx:0, fy:0});
            nodes.push({x:12, y:1, rx:false, ry:true, fx:0, fy:0});
            nodes.push({x:12, y:5, rx:false, ry:false, fx:0, fy:-5000});
            nodes.push({x:3, y:5, rx:false, ry:false, fx:0, fy:0});
            members.push({i:0,j:1}, {i:1,j:2}, {i:2,j:3}, {i:3,j:0}); 
        }
        members.forEach(m => { m.A = getArea(); m.E = getMaterial().E; });
        updateAnalysis();
    }

    function setMode(mode) {
        currentMode = mode;
        selectedNodeForMember = null;
        root.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
        let btnId = { addJoint:'modeJointBtn', addMember:'modeMemberBtn', addLoad:'modeLoadBtn', addSupport:'modeSupportBtn', delete:'deleteBtn' }[mode];
        if(btnId) $(btnId).classList.add('active');
    }

    const handlers = {
        jointBtn: () => setMode('addJoint'),
        memberBtn: () => setMode('addMember'),
        loadBtn: () => setMode('addLoad'),
        supportBtn: () => setMode('addSupport'),
        delBtn: () => setMode('delete'),
        loadTpl: () => loadTemplate($('templateSelect').value),
        matSel: () => updateAnalysis(),
        areaInp: () => updateAnalysis(),
    };

    $('modeJointBtn').addEventListener('click', handlers.jointBtn);
    $('modeMemberBtn').addEventListener('click', handlers.memberBtn);
    $('modeLoadBtn').addEventListener('click', handlers.loadBtn);
    $('modeSupportBtn').addEventListener('click', handlers.supportBtn);
    $('deleteBtn').addEventListener('click', handlers.delBtn);
    $('loadTemplateBtn').addEventListener('click', handlers.loadTpl);
    $('materialSelect').addEventListener('change', handlers.matSel);
    $('areaInput').addEventListener('input', handlers.areaInp);
    
    canvas.addEventListener('click', handleCanvasClick);
    
    function handleResize() {
        const container = canvas.parentElement;
        width = container.clientWidth;
        height = container.clientHeight || 520;
        canvas.width = width;
        canvas.height = height;
        drawCanvas();
    }
    
    window.addEventListener('resize', handleResize);
    
    // Initial startup
    loadTemplate("warren");
    setMode('addJoint');
    handleResize();

    return () => {
        // Cleanup
        window.removeEventListener('resize', handleResize);
        $('modeJointBtn')?.removeEventListener('click', handlers.jointBtn);
        $('modeMemberBtn')?.removeEventListener('click', handlers.memberBtn);
        $('modeLoadBtn')?.removeEventListener('click', handlers.loadBtn);
        $('modeSupportBtn')?.removeEventListener('click', handlers.supportBtn);
        $('deleteBtn')?.removeEventListener('click', handlers.delBtn);
        $('loadTemplateBtn')?.removeEventListener('click', handlers.loadTpl);
        $('materialSelect')?.removeEventListener('change', handlers.matSel);
        $('areaInput')?.removeEventListener('input', handlers.areaInp);
        canvas?.removeEventListener('click', handleCanvasClick);
    };
  }, []);

  return (
    <div className="truss-wrapper" ref={rootRef}>
      <div className="sim-wrapper">
        <h1>📐 Truss Simulator 2.0 <small>Direct Stiffness | Real-time Force Distribution</small></h1>
        <div className="flex-row">
          <div className="canvas-panel">
            <canvas id="trussCanvas" width="900" height="520" style={{width: '100%', aspectRatio: '900/520'}}></canvas>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem'}}>
              <span><span className="force-color" style={{background: '#3b82f6'}}></span> Tension (blue)</span>
              <span><span className="force-color" style={{background: '#ef4444'}}></span> Compression (red)</span>
              <span><span className="force-color" style={{background: '#94a3b8'}}></span> Zero-force</span>
              <span>🟡 Load arrow</span>
              <span>🟣 Support</span>
              <span>💀 Failure</span>
            </div>
          </div>
          <div className="controls-panel">
            <div className="toolbar">
              <button id="modeJointBtn">➕ Joint</button>
              <button id="modeMemberBtn">🔗 Member</button>
              <button id="modeLoadBtn">⚡ Load</button>
              <button id="modeSupportBtn">🪑 Support</button>
              <button id="deleteBtn">🗑️ Delete</button>
            </div>
            <div className="param-group">
              <label>📐 Templates</label>
              <select id="templateSelect" defaultValue="warren">
                <option value="triangle">🔺 Simple triangle</option>
                <option value="warren">🌉 Warren truss</option>
                <option value="pratt">🚆 Pratt truss</option>
                <option value="rectangle">⬜ Rectangle (unstable)</option>
              </select>
              <button id="loadTemplateBtn" style={{marginTop: '6px', width: '100%'}}>Load template</button>
            </div>
            <div className="param-group">
              <label>🏗️ Material &amp; section</label>
              <select id="materialSelect" defaultValue="steel">
                <option value="steel">Steel (E=200 GPa)</option>
                <option value="aluminum">Aluminum (E=70 GPa)</option>
                <option value="timber">Timber (E=10 GPa)</option>
              </select>
              <label style={{marginTop: '6px'}}>A (cm²) <input type="number" id="areaInput" defaultValue="5.0" step="0.5" /></label>
            </div>
            <div className="param-group">
              <label>📊 Member forces &amp; status</label>
              <div id="memberTable" className="member-table">Waiting for analysis...</div>
              <div className="status" id="statusMsg">✅ Ready</div>
              <div id="failureList" style={{fontSize: '0.7rem', marginTop: '6px'}}></div>
            </div>
            <div style={{fontSize: '0.7rem', background: '#eef2ff', padding: '6px', borderRadius: '12px', color: '#1e40af'}}>
              💡 <strong>Live demo:</strong> Add load, delete a member → force redistributes instantly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

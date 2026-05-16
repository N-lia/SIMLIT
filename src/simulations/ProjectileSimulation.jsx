import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './ProjectileSimulation.css';

// --- Physics & Math Utilities ---
function airDensity(alt) {
    return 1.225 * Math.exp(-alt / 8000); // kg/m³
}

function derivatives(state, windSpd, dens, CdA, massVal, gVal) {
    let [x, y, vx, vy] = state;
    let v_rel_x = vx - windSpd;
    let v_rel_y = vy;
    let v_rel = Math.hypot(v_rel_x, v_rel_y);
    let dragForce = 0.5 * dens * CdA * v_rel * v_rel;
    let ax = 0, ay = -gVal;
    if(dragForce > 0 && v_rel > 0.01) {
        ax -= dragForce * v_rel_x / v_rel / massVal;
        ay -= dragForce * v_rel_y / v_rel / massVal;
    }
    return [vx, vy, ax, ay];
}

function rk4Step(state, dt, windSpd, dens, CdA, massVal, gVal) {
    let k1 = derivatives(state, windSpd, dens, CdA, massVal, gVal);
    let state2 = state.map((v,i) => v + 0.5*dt*k1[i]);
    let k2 = derivatives(state2, windSpd, dens, CdA, massVal, gVal);
    let state3 = state.map((v,i) => v + 0.5*dt*k2[i]);
    let k3 = derivatives(state3, windSpd, dens, CdA, massVal, gVal);
    let state4 = state.map((v,i) => v + dt*k3[i]);
    let k4 = derivatives(state4, windSpd, dens, CdA, massVal, gVal);
    return state.map((v,i) => v + dt/6*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
}

function computeTrajectory(v0, angleDeg, y0, g, dragEnabled, mass, Cd, areaRef, wind, slopeDeg, altitude) {
    let rad = angleDeg * Math.PI/180;
    let vx0 = v0 * Math.cos(rad);
    let vy0 = v0 * Math.sin(rad);
    let state = [0, y0, vx0, vy0];
    let points = [{x:0, y:y0}];
    let t = 0, dt = 0.01;
    let maxSteps = 5000;
    let dens = airDensity(altitude);
    let CdA = dragEnabled ? Cd * areaRef : 0;
    let massEff = dragEnabled ? mass : 1e9;
    
    for(let step=0; step<maxSteps; step++) {
        state = rk4Step(state, dt, wind, dens, CdA, massEff, g);
        let x = state[0], y = state[1];
        points.push({x: Math.max(0,x), y});
        t += dt;
        let groundY = Math.tan(slopeDeg * Math.PI/180) * x;
        if(y <= groundY && step>10) break;
        if(x > 500 || y < -50) break;
    }
    
    let impactIdx = points.length-1;
    let range = points[impactIdx].x;
    let maxHeight = Math.max(...points.map(p=>p.y));
    let totalTime = t;
    let apexIndex = points.reduce((iMax, p, i, arr) => p.y > arr[iMax].y ? i : iMax, 0);
    
    let times = [], xs = [], ys = [];
    let nSteps = Math.min(200, points.length);
    for(let i=0; i<nSteps; i++) {
        let frac = i/(nSteps-1);
        let idx = Math.floor(frac * (points.length-1));
        times.push(frac * totalTime);
        xs.push(points[idx].x);
        ys.push(points[idx].y);
    }
    
    return { points, range, maxHeight, totalTime, apexIndex, times, xs, ys };
}

function groundYFn(x, slopeDeg) {
    return Math.tan(slopeDeg * Math.PI/180) * x;
}

function getValueAtTime(t, tArr, valArr) {
    if(t<=tArr[0]) return valArr[0];
    for(let i=1;i<tArr.length;i++) if(t<=tArr[i]) {
        let frac = (t-tArr[i-1])/(tArr[i]-tArr[i-1]);
        return valArr[i-1] + frac*(valArr[i]-valArr[i-1]);
    }
    return valArr[valArr.length-1];
}

// --- Main Component ---
export default function ProjectileSimulation() {
    const canvasRef = useRef(null);
    const xgraphRef = useRef(null);
    const ygraphRef = useRef(null);
    
    const [params, setParams] = useState({
        v0: 25, angleDeg: 45, y0: 0,
        g: 9.81, gravityPreset: 'earth', customG: 9.81,
        dragEnabled: false, mass: 1.0, Cd: 0.5, areaRef: 0.01, wind: 0,
        targetX: 60, slopeDeg: 0, altitude: 0, objectType: 'custom'
    });
    
    const [measurePoint, setMeasurePoint] = useState(null);
    const [hitInfo, setHitInfo] = useState({ hit: false, missDist: 0 });
    
    const animState = useRef({ id: null, time: 0, isAnimating: false, lastTimestamp: null });
    const dragState = useRef({ mode: null, startX: 0, startAngle: 0, startTarget: 0 });
    const stateRef = useRef({ params, trajData: null });
    
    const updateParam = (key, val) => setParams(prev => ({...prev, [key]: val}));

    // Compute physics
    const trajData = useMemo(() => {
        return computeTrajectory(
            params.v0, params.angleDeg, params.y0, params.g,
            params.dragEnabled, params.mass, params.Cd, params.areaRef,
            params.wind, params.slopeDeg, params.altitude
        );
    }, [params]);

    // Keep ref updated for dragging
    useEffect(() => {
        stateRef.current = { params, trajData };
        let dist = Math.abs(trajData.range - params.targetX);
        setHitInfo({ hit: dist < 1.2, missDist: dist });
    }, [params, trajData]);

    // Draw functions
    const drawVisuals = useCallback((animX = null, animY = null, showVector = true, animTimeVal = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { points, range, maxHeight, apexIndex } = trajData;
        const { y0, targetX, angleDeg, dragEnabled, v0, g, slopeDeg } = params;

        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0,0,w,h);
        let maxX = Math.max(range+5, targetX+10, 20);
        maxX = Math.min(350, maxX+15);
        let maxY = Math.max(y0+2, maxHeight+2, 5);
        let minY = -2;
        let xScale = (w-80) / maxX;
        let yScale = (h-70) / (maxY - minY);
        function toScreen(x,y) { return { x: 40 + x*xScale, y: h-40 - (y - minY)*yScale }; }
        
        // ground
        let gndStart = toScreen(0, groundYFn(0, slopeDeg));
        let gndEnd = toScreen(maxX, groundYFn(maxX, slopeDeg));
        ctx.beginPath(); ctx.moveTo(gndStart.x, gndStart.y); ctx.lineTo(gndEnd.x, gndEnd.y);
        ctx.strokeStyle = "#8b5a2b"; ctx.lineWidth=3; ctx.stroke();
        ctx.fillStyle = "#bc9a6c"; ctx.fillRect(0, gndStart.y-3, w, 8);
        
        // trajectory
        if(points.length>1) {
            ctx.beginPath();
            let first = toScreen(points[0].x, points[0].y);
            ctx.moveTo(first.x, first.y);
            for(let i=1; i<points.length; i++) {
                let p = toScreen(points[i].x, points[i].y);
                ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = "#22c55e"; ctx.lineWidth=2.8; ctx.stroke();
        }
        
        // apex marker
        if(apexIndex>=0 && points[apexIndex]) {
            let apex = points[apexIndex];
            let scr = toScreen(apex.x, apex.y);
            ctx.beginPath(); ctx.moveTo(scr.x-8, scr.y); ctx.lineTo(scr.x+8, scr.y); ctx.strokeStyle="#facc15"; ctx.lineWidth=2; ctx.stroke();
            ctx.beginPath(); ctx.arc(scr.x, scr.y, 5, 0, 2*Math.PI); ctx.fillStyle="#facc15"; ctx.fill();
            ctx.fillStyle="#0f172a"; ctx.font="bold 8px system-ui"; ctx.fillText("APEX", scr.x-12, scr.y-6);
        }
        
        // target (draggable)
        let targetScr = toScreen(targetX, groundYFn(targetX, slopeDeg));
        ctx.beginPath(); ctx.moveTo(targetScr.x-12, targetScr.y-6); ctx.lineTo(targetScr.x, targetScr.y+6); ctx.lineTo(targetScr.x+12, targetScr.y-6); ctx.fillStyle="#ef4444"; ctx.fill();
        ctx.fillStyle="#b91c1c"; ctx.font="bold 11px system-ui"; ctx.fillText("🎯", targetScr.x-5, targetScr.y-8);
        
        // measurement point
        if(measurePoint) {
            let scrM = toScreen(measurePoint.x, measurePoint.y);
            ctx.beginPath(); ctx.moveTo(scrM.x-10, scrM.y); ctx.lineTo(scrM.x+10, scrM.y); ctx.moveTo(scrM.x, scrM.y-10); ctx.lineTo(scrM.x, scrM.y+10);
            ctx.strokeStyle = "#f97316"; ctx.lineWidth=2; ctx.stroke();
            ctx.fillStyle = "#f97316"; ctx.font="bold 9px system-ui"; ctx.fillText(`📏 ${measurePoint.x.toFixed(1)}m, ${measurePoint.y.toFixed(1)}m`, scrM.x+5, scrM.y-5);
        }
        
        // cannon (draggable angle indicator)
        let cannonBase = toScreen(0, y0);
        let angleRad = angleDeg * Math.PI/180;
        let barrelLen = 28;
        let tipX = cannonBase.x + barrelLen * Math.cos(angleRad);
        let tipY = cannonBase.y - barrelLen * Math.sin(angleRad);
        ctx.beginPath(); ctx.moveTo(cannonBase.x, cannonBase.y); ctx.lineTo(tipX, tipY); ctx.strokeStyle="#1e293b"; ctx.lineWidth=6; ctx.stroke();
        ctx.beginPath(); ctx.arc(cannonBase.x, cannonBase.y, 10, 0, 2*Math.PI); ctx.fillStyle="#475569"; ctx.fill();
        ctx.fillStyle="white"; ctx.font="bold 10px system-ui"; ctx.fillText(`${angleDeg}°`, cannonBase.x-12, cannonBase.y-8);
        
        // projectile position during animation
        if(animX !== null && animY !== null) {
            let proj = toScreen(animX, animY);
            ctx.beginPath(); ctx.arc(proj.x, proj.y, 7, 0, 2*Math.PI); ctx.fillStyle="#f97316"; ctx.fill();
            if(showVector && !dragEnabled) {
                let rad = angleDeg * Math.PI/180;
                let vx_inst = v0 * Math.cos(rad);
                let vy_inst = v0 * Math.sin(rad) - g * animTimeVal;
                let scaleVec = 18;
                let vx_px = vx_inst * scaleVec / (v0+0.01);
                let vy_px = -vy_inst * scaleVec / (v0+0.01);
                ctx.beginPath(); ctx.moveTo(proj.x, proj.y); ctx.lineTo(proj.x+vx_px, proj.y+vy_px); ctx.strokeStyle="#dc2626"; ctx.lineWidth=2; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(proj.x, proj.y); ctx.lineTo(proj.x+vx_px, proj.y); ctx.strokeStyle="#3b82f6"; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(proj.x, proj.y); ctx.lineTo(proj.x, proj.y+vy_px); ctx.strokeStyle="#10b981"; ctx.stroke();
            }
        }
    }, [trajData, params, measurePoint]);

    const drawGraphs = useCallback((currentT) => {
        const xgraph = xgraphRef.current;
        const ygraph = ygraphRef.current;
        if(!xgraph || !ygraph) return;
        const ctxX = xgraph.getContext('2d');
        const ctxY = ygraph.getContext('2d');
        const w = xgraph.width, h = xgraph.height;
        ctxX.clearRect(0,0,w,h); ctxY.clearRect(0,0,w,h);
        
        const { times, xs, ys, totalTime } = trajData;
        if(times.length===0) return;
        
        let maxTime = totalTime;
        let maxX = Math.max(...xs, params.targetX+10);
        let maxY = Math.max(...ys, 5);
        
        function plot(ctxGraph, values, color, yMax, yLabel) {
            ctxGraph.beginPath();
            for(let i=0;i<times.length;i++) {
                let xp = 30 + (times[i]/maxTime)*(w-50);
                let yp = h-20 - (values[i]/yMax)*(h-35);
                if(i===0) ctxGraph.moveTo(xp,yp);
                else ctxGraph.lineTo(xp,yp);
            }
            ctxGraph.strokeStyle = color; ctxGraph.lineWidth=2; ctxGraph.stroke();
            if(currentT>=0){
                let cx = 30 + (currentT/maxTime)*(w-50);
                let val = (values===xs) ? getValueAtTime(currentT, times, xs) : getValueAtTime(currentT, times, ys);
                let yp = h-20 - (val/yMax)*(h-35);
                ctxGraph.beginPath(); ctxGraph.arc(cx, yp, 4, 0, 2*Math.PI); ctxGraph.fillStyle="#f97316"; ctxGraph.fill();
            }
            ctxGraph.fillStyle="#1e293b"; ctxGraph.font="8px system-ui"; ctxGraph.fillText(yLabel, w-25, h-8);
        }
        plot(ctxX, xs, "#3b82f6", maxX, "x (m)");
        plot(ctxY, ys, "#10b981", maxY, "y (m)");
    }, [trajData, params.targetX]);

    const refreshStatic = useCallback(() => {
        drawVisuals(null, null, false);
        drawGraphs(-1);
    }, [drawVisuals, drawGraphs]);

    // Redraw static when params/data change
    useEffect(() => {
        if(animState.current.id) {
            cancelAnimationFrame(animState.current.id);
            animState.current.id = null;
            animState.current.isAnimating = false;
        }
        refreshStatic();
    }, [refreshStatic]);

    // Animation loop
    const fire = () => {
        if(animState.current.id) cancelAnimationFrame(animState.current.id);
        animState.current.time = 0;
        animState.current.lastTimestamp = null;
        animState.current.isAnimating = true;
        
        const dur = trajData.totalTime;
        const { times, xs, ys } = trajData;
        
        const step = (now) => {
            if(!animState.current.isAnimating) return;
            if(!animState.current.lastTimestamp) animState.current.lastTimestamp = now;
            let dt = Math.min(0.03, (now - animState.current.lastTimestamp)/1000);
            animState.current.lastTimestamp = now;
            animState.current.time += dt;
            
            if(animState.current.time >= dur) {
                animState.current.time = dur;
                let fx = getValueAtTime(dur, times, xs);
                let fy = getValueAtTime(dur, times, ys);
                drawVisuals(fx, fy, true, dur);
                drawGraphs(dur);
                animState.current.isAnimating = false;
                animState.current.id = null;
                return;
            }
            let curX = getValueAtTime(animState.current.time, times, xs);
            let curY = getValueAtTime(animState.current.time, times, ys);
            drawVisuals(curX, curY, true, animState.current.time);
            drawGraphs(animState.current.time);
            animState.current.id = requestAnimationFrame(step);
        };
        animState.current.id = requestAnimationFrame(step);
    };

    const resetView = () => {
        if(animState.current.id) cancelAnimationFrame(animState.current.id);
        animState.current.isAnimating = false;
        refreshStatic();
    };

    // Drag handling
    const handleCanvasMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let mouseX = (e.clientX - rect.left) * scaleX;
        let mouseY = (e.clientY - rect.top) * scaleY;
        
        const cur = stateRef.current;
        let maxXsim = Math.min(350, cur.trajData.range+15);
        let xScaleSim = (canvas.width-80)/maxXsim;
        
        let cannonScrX = 40;
        let cannonScrY = canvas.height-40 - (cur.params.y0)* (canvas.height-70)/(cur.trajData.maxHeight+5);
        
        if(Math.hypot(mouseX - cannonScrX, mouseY - cannonScrY) < 20) {
            dragState.current = { mode: 'angle', startAngle: cur.params.angleDeg, startX: mouseX };
            e.preventDefault();
            return;
        }
        
        let targetScrX = 40 + cur.params.targetX * xScaleSim;
        let targetScrY = canvas.height-40 - (groundYFn(cur.params.targetX, cur.params.slopeDeg)) * (canvas.height-70)/(cur.trajData.maxHeight+5);
        
        if(Math.hypot(mouseX - targetScrX, mouseY - targetScrY) < 20) {
            dragState.current = { mode: 'target', startTarget: cur.params.targetX, startX: mouseX };
            e.preventDefault();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if(!dragState.current.mode) return;
            const canvas = canvasRef.current;
            if(!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            let mouseX = (e.clientX - rect.left) * scaleX;
            
            const cur = stateRef.current;
            let maxXsim = Math.min(350, cur.trajData.range+15);
            let xScaleSim = (canvas.width-80)/maxXsim;
            
            if(dragState.current.mode === 'angle') {
                let deltaX = (mouseX - dragState.current.startX) / 40;
                let newAngle = dragState.current.startAngle + deltaX * 20;
                newAngle = Math.min(90, Math.max(0, newAngle));
                setParams(p => ({...p, angleDeg: Math.round(newAngle)}));
            } else if(dragState.current.mode === 'target') {
                let deltaX = (mouseX - dragState.current.startX) / xScaleSim;
                let newTarget = dragState.current.startTarget + deltaX;
                newTarget = Math.min(250, Math.max(0, newTarget));
                setParams(p => ({...p, targetX: Math.round(newTarget)}));
            }
        };
        const handleMouseUp = () => { dragState.current.mode = null; };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleCanvasClick = (e) => {
        if(dragState.current.mode) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        let mouseX = (e.clientX - rect.left) * scaleX;
        
        const cur = stateRef.current;
        let maxXsim = Math.min(350, cur.trajData.range+15);
        let xScaleSim = (canvas.width-80)/maxXsim;
        let xWorld = (mouseX - 40) / xScaleSim;
        
        if(xWorld < 0 || xWorld > cur.trajData.range) return;
        
        let best = cur.trajData.points.reduce((b, p) => Math.abs(p.x - xWorld) < Math.abs(b.x - xWorld) ? p : b, cur.trajData.points[0]);
        let t_meas = getValueAtTime(best.x, cur.trajData.xs, cur.trajData.times);
        setMeasurePoint({ x: best.x, y: best.y, time: t_meas });
    };

    // UI Handlers
    const handleObjectSelect = (e) => {
        let val = e.target.value;
        if(val !== "custom") {
            let m=1, c=0.5, a=0.01;
            if(val === "baseball") { m=0.145; c=0.3; a=0.0042; }
            if(val === "cannonball") { m=5.0; c=0.5; a=0.018; }
            if(val === "pumpkin") { m=4.0; c=0.8; a=0.07; }
            if(val === "feather") { m=0.01; c=0.9; a=0.005; }
            setParams(p => ({...p, objectType: val, mass: m, Cd: c, areaRef: a}));
        } else {
            setParams(p => ({...p, objectType: val}));
        }
    };

    const handleGravitySelect = (e) => {
        let val = e.target.value;
        let newG = params.g;
        if(val === "earth") newG = 9.81;
        else if(val === "moon") newG = 1.62;
        else if(val === "mars") newG = 3.71;
        setParams(p => ({...p, gravityPreset: val, g: newG}));
    };

    const setOptimalAngle = () => {
        if(!params.dragEnabled && params.slopeDeg===0 && params.y0<0.1) {
            updateParam('angleDeg', 45);
        } else {
            alert("Optimal angle depends on drag, slope, and height – try adjusting manually or running an optimization sweep!");
        }
    };

    return (
        <div className="proj-container">
            <div className="proj-sim-card">
                <div className="proj-header">
                    <h1>🎯 Projectile Motion Pro <small>drag & wind • presets • interactive measurement</small></h1>
                    <div className="proj-toolbar">
                        <button onClick={fire} style={{background:'#ea580c'}}>🚀 FIRE</button>
                        <button className="secondary" onClick={resetView}>⟳ Reset view</button>
                        <button className="secondary" onClick={setOptimalAngle}>📐 Optimal angle (flat)</button>
                        <button className="secondary" onClick={() => setMeasurePoint(null)}>🗑️ Clear measure</button>
                    </div>
                </div>
                <div className="proj-flex-row">
                    <div className="proj-controls">
                        <div className="proj-ctrl-group">
                            <label className="group-label">🔫 Cannon & projectile</label>
                            <div className="proj-param-row">
                                <span>Object:</span>
                                <select value={params.objectType} onChange={handleObjectSelect}>
                                    <option value="custom">Custom</option>
                                    <option value="baseball">⚾ Baseball</option>
                                    <option value="cannonball">🔘 Cannonball</option>
                                    <option value="pumpkin">🎃 Pumpkin</option>
                                    <option value="feather">🪶 Feather</option>
                                </select>
                            </div>
                            <div className="proj-param-row">
                                <span>Launch speed (m/s):</span>
                                <input type="range" min="0" max="80" step="0.5" value={params.v0} onChange={e => updateParam('v0', +e.target.value)}/>
                                <span className="proj-num-input">{params.v0.toFixed(1)}</span>
                            </div>
                            <div className="proj-param-row">
                                <span>Launch angle (deg):</span>
                                <input type="range" min="0" max="90" step="1" value={params.angleDeg} onChange={e => updateParam('angleDeg', +e.target.value)}/>
                                <span className="proj-num-input">{params.angleDeg}°</span>
                            </div>
                            <div className="proj-param-row">
                                <span>Initial height (m):</span>
                                <input type="range" min="0" max="30" step="0.5" value={params.y0} onChange={e => updateParam('y0', +e.target.value)}/>
                                <span className="proj-num-input">{params.y0.toFixed(1)}</span>
                            </div>
                            <div className="proj-warning">💡 Drag the cannon barrel to change angle!</div>
                        </div>

                        <div className="proj-ctrl-group">
                            <label className="group-label">🌍 Environment</label>
                            <div className="proj-param-row" style={{marginBottom:'8px'}}>
                                <span>Gravity:</span>
                                <select value={params.gravityPreset} onChange={handleGravitySelect}>
                                    <option value="earth">Earth (9.81 m/s²)</option>
                                    <option value="moon">Moon (1.62 m/s²)</option>
                                    <option value="mars">Mars (3.71 m/s²)</option>
                                    <option value="custom">Custom (m/s²)</option>
                                </select>
                            </div>
                            {params.gravityPreset === 'custom' && (
                                <div className="proj-param-row">
                                    <span>Custom g:</span>
                                    <input type="number" step="0.5" value={params.g} onChange={e=>updateParam('g', +e.target.value)} style={{width:'80px'}}/>
                                </div>
                            )}
                            <div className="proj-param-row">
                                <span>Altitude (m):</span>
                                <input type="range" min="0" max="10000" step="500" value={params.altitude} onChange={e=>updateParam('altitude', +e.target.value)}/>
                                <span className="proj-num-input">{params.altitude}</span>
                            </div>
                        </div>

                        <div className="proj-ctrl-group">
                            <label className="group-label">🌬️ Air resistance & wind</label>
                            <label style={{fontSize:'0.85rem', display:'block', marginBottom:'6px', color:'#334155'}}>
                                <input type="checkbox" checked={params.dragEnabled} onChange={e=>updateParam('dragEnabled', e.target.checked)} style={{marginRight:'6px'}}/> 
                                Enable air resistance
                            </label>
                            {params.dragEnabled && (
                                <div>
                                    <div className="proj-param-row">
                                        <span>Mass (kg):</span>
                                        <input type="number" step="0.1" value={params.mass} onChange={e=>updateParam('mass', +e.target.value)} style={{width:'70px'}}/>
                                    </div>
                                    <div className="proj-param-row">
                                        <span>Drag coeff. Cd:</span>
                                        <input type="range" min="0" max="2.0" step="0.02" value={params.Cd} onChange={e=>updateParam('Cd', +e.target.value)}/>
                                        <span className="proj-num-input">{params.Cd.toFixed(2)}</span>
                                    </div>
                                    <div className="proj-param-row">
                                        <span>Area (m²):</span>
                                        <input type="number" step="0.001" value={params.areaRef} onChange={e=>updateParam('areaRef', +e.target.value)} style={{width:'70px'}}/>
                                    </div>
                                    <div className="proj-param-row">
                                        <span>Wind speed (m/s):</span>
                                        <input type="range" min="-20" max="20" step="0.5" value={params.wind} onChange={e=>updateParam('wind', +e.target.value)}/>
                                        <span className="proj-num-input">{params.wind.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="proj-ctrl-group" style={{borderBottom:'none'}}>
                            <label className="group-label">🎯 Target & ground</label>
                            <div className="proj-param-row">
                                <span>Target dist (m):</span>
                                <input type="range" min="0" max="250" step="1" value={params.targetX} onChange={e=>updateParam('targetX', +e.target.value)}/>
                                <span className="proj-num-input">{params.targetX}</span>
                            </div>
                            <div className="proj-param-row">
                                <span>Ground slope (°):</span>
                                <input type="range" min="-15" max="15" step="1" value={params.slopeDeg} onChange={e=>updateParam('slopeDeg', +e.target.value)}/>
                                <span className="proj-num-input">{params.slopeDeg}°</span>
                            </div>
                        </div>

                        <div className="proj-stats-bar">
                            <span>⏱️ {trajData.totalTime.toFixed(2)} s</span>
                            <span>📏 {trajData.range.toFixed(1)} m</span>
                            <span>📐 {trajData.maxHeight.toFixed(1)} m</span>
                            <span>{hitInfo.hit ? "🎯 HIT! ✅" : `🎯 Miss (${hitInfo.missDist.toFixed(1)} m)`}</span>
                        </div>
                        
                        {measurePoint ? (
                            <div className="proj-measure-panel">
                                📏 Measured: {measurePoint.x.toFixed(1)}m x, {measurePoint.y.toFixed(1)}m y @ {measurePoint.time.toFixed(2)}s
                            </div>
                        ) : (
                            <div className="proj-measure-panel" style={{color:'#64748b', borderColor:'#cbd5e1', background:'#f8fafc'}}>
                                📏 Click on trajectory to measure.
                            </div>
                        )}
                    </div>

                    <div className="proj-visualization">
                        <canvas 
                            ref={canvasRef} 
                            className="proj-canvas" 
                            width={800} height={450} 
                            style={{aspectRatio:'800/450'}}
                            onMouseDown={handleCanvasMouseDown}
                            onClick={handleCanvasClick}
                        ></canvas>
                        <div className="proj-legend">
                            <span>🟢 Trajectory (live)</span>
                            <span>🔴 Velocity vector</span>
                            <span>🟡 Apex marker</span>
                            <span>🎯 Drag target to move</span>
                            <span>📐 Drag cannon</span>
                        </div>
                        <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
                            <canvas ref={xgraphRef} width={350} height={110} style={{width:'48%', background:'#fff', borderRadius:'1rem'}}></canvas>
                            <canvas ref={ygraphRef} width={350} height={110} style={{width:'48%', background:'#fff', borderRadius:'1rem'}}></canvas>
                        </div>
                        <div className="proj-legend" style={{marginTop:'8px', background:'none'}}>📈 x(t) and y(t) – follow the moving point</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

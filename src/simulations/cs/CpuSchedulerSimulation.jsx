import { render, useEffect, useRef } from '/src/utils/react-lite.js';
import './CpuSchedulerSimulation.css';

export default function CpuSchedulerSimulation() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const $ = (id) => root.querySelector(`#${id}`);

    // DOM elements
    const readyDiv = $("readyQueue");
    const waitDiv = $("waitQueue");
    const runningSpan = $("runningPid");
    const sysTimeSpan = $("sysTime");
    const avgTurnSpan = $("avgTurnaround");
    const avgWaitSpan = $("avgWaiting");
    const cpuUtilSpan = $("cpuUtil");
    const throughputSpan = $("throughput");
    const ctxSpan = $("ctxSwitches");
    const ganttCanvas = $("ganttCanvas");
    const waitingChart = $("waitingChart");
    const processTableBody = $("processTableBody");
    const schedAlgoSelect = $("schedAlgo");
    const rrQuantumDiv = $("rrQuantumDiv");
    const quantumInput = $("quantum");
    const ctxOverheadInput = $("ctxOverhead");
    const speedSlider = $("speedSlider");
    const speedValueSpan = $("speedValue");

    // ---------- Process Class ----------
    class Process {
      constructor(id, name, totalBurst, arrival, priority, ioBurst) {
        this.id = id;
        this.name = name;
        this.totalBurst = totalBurst;
        this.remaining = totalBurst;
        this.arrival = arrival;
        this.priority = priority;
        this.ioBurst = ioBurst;
        this.ioRemaining = 0;
        this.state = "unborn";
        this.startTime = null;
        this.endTime = null;
        this.lastRunStart = null;
        this.totalWait = 0;
        this.totalTurnaround = 0;
        this.waitHistory = [];
      }
      reset() {
        this.remaining = this.totalBurst;
        this.ioRemaining = 0;
        this.state = this.arrival === 0 ? "ready" : "unborn";
        this.startTime = null;
        this.endTime = null;
        this.lastRunStart = null;
        this.totalWait = 0;
        this.totalTurnaround = 0;
        this.waitHistory = [];
      }
    }

    // ---------- Global state ----------
    let processes = [];
    let nextPid = 1;
    let currentProcess = null;
    let time = 0;
    let contextSwitches = 0;
    let ganttEntries = [];
    let simInterval = null;
    let running = false;
    let simulationEnded = false;
    let selectedAlgo = "fcfs";
    let roundRobinQuantum = 3;
    let ctxOverhead = 0;
    let currentQuantumUsed = 0;
    let speedMs = 200;

    function sanitizeProcessName(name) {
      const trimmed = String(name || '').trim();
      return trimmed.slice(0, 24) || `P${nextPid}`;
    }

    function renderQueue(container, processesToRender, emptyText, formatter) {
      container.replaceChildren();
      if (!processesToRender.length) {
        container.textContent = emptyText;
        return;
      }

      processesToRender.forEach((process) => {
        const item = document.createElement('div');
        item.className = 'cpu-queue-item';
        item.textContent = formatter(process);
        container.appendChild(item);
      });
    }

    function renderRunningProcess() {
      runningSpan.replaceChildren();
      if (!currentProcess) {
        runningSpan.textContent = ' idle';
        return;
      }

      const label = document.createElement('span');
      label.className = 'cpu-running-process';
      label.textContent = `${currentProcess.name} (rem:${currentProcess.remaining})`;
      runningSpan.appendChild(label);
    }

    function renderProcessTable() {
      processTableBody.replaceChildren();
      processes.forEach((process) => {
        const row = document.createElement('tr');
        [
          process.name,
          process.totalBurst,
          process.arrival,
          process.priority,
          process.ioBurst,
          process.state,
        ].forEach((value) => {
          const cell = document.createElement('td');
          cell.textContent = String(value);
          row.appendChild(cell);
        });
        processTableBody.appendChild(row);
      });
    }

    // Helper: update UI metrics
    function updateUI() {
      const readyProcs = processes.filter(p => p.state === "ready");
      renderQueue(readyDiv, readyProcs, "— idle —", p => `${p.name} (rem:${p.remaining})`);
      const waitingProcs = processes.filter(p => p.state === "waiting");
      renderQueue(waitDiv, waitingProcs, "— none —", p => `${p.name} I/O ${p.ioRemaining}`);
      renderRunningProcess();
      sysTimeSpan.innerText = time;
      ctxSpan.innerText = contextSwitches;

      const terminated = processes.filter(p => p.state === "terminated");
      let totalTurn = 0, totalWait = 0;
      for (let p of terminated) {
        totalTurn += (p.endTime - p.arrival);
        totalWait += p.totalWait;
      }
      avgTurnSpan.innerText = terminated.length ? (totalTurn / terminated.length).toFixed(2) : "0";
      avgWaitSpan.innerText = terminated.length ? (totalWait / terminated.length).toFixed(2) : "0";
      const totalCpuTime = ganttEntries.reduce((sum, e) => sum + (e.end - e.start), 0);
      const util = time > 0 ? (totalCpuTime / time) * 100 : 0;
      cpuUtilSpan.innerText = util.toFixed(1) + "%";
      throughputSpan.innerText = terminated.length;

      renderProcessTable();
      drawGantt();
      drawWaitingGraph();
    }

    function drawGantt() {
      if (!ganttCanvas) return;
      const canvas = ganttCanvas;
      const ctx = canvas.getContext('2d');
      const width = canvas.clientWidth;
      canvas.width = Math.max(800, width);
      const height = 120;
      canvas.height = height;
      ctx.clearRect(0, 0, canvas.width, height);
      if (ganttEntries.length === 0) return;
      const maxTime = Math.max(...ganttEntries.map(e => e.end), time);
      const scale = (canvas.width - 40) / (maxTime || 1);
      
      let y = 20;
      for (let entry of ganttEntries) {
        const x = 20 + entry.start * scale;
        const w = (entry.end - entry.start) * scale;
        if (w < 1) continue;
        ctx.fillStyle = entry.name === "idle" ? "#dcc18a" : (entry.name === "ctx_switch" ? "#a9402f" : "#2f5d88");
        ctx.fillRect(x, y, w, 42);
        ctx.fillStyle = entry.name === "idle" ? "#25231f" : "white";
        ctx.font = "bold 12px 'Patrick Hand'";
        ctx.fillText(entry.name, x + 4, y + 26);
        ctx.fillStyle = "#5f564b";
        ctx.font = "12px 'Patrick Hand'";
        ctx.fillText(entry.start, x, y + 70);
        ctx.fillText(entry.end, x + w - 15, y + 70);
      }
    }

    function drawWaitingGraph() {
      if (!waitingChart) return;
      const canvas = waitingChart;
      const ctx = canvas.getContext('2d');
      const width = canvas.clientWidth;
      canvas.width = Math.max(600, width);
      const height = 180;
      canvas.height = height;
      ctx.clearRect(0, 0, canvas.width, height);
      const processesWithHistory = processes.filter(p => p.waitHistory.length > 0);
      if (processesWithHistory.length === 0) return;
      const maxWait = Math.max(...processesWithHistory.flatMap(p => p.waitHistory.map(w => w.wait)), 1);
      const scaleY = (height - 30) / maxWait;
      const colors = ["#d8b45c", "#a9402f", "#4c7a3c", "#2f5d88", "#24496b"];
      processesWithHistory.forEach((p, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 2;
        let first = true;
        for (let point of p.waitHistory) {
          const x = 30 + (point.time / Math.max(time,1)) * (canvas.width - 60);
          const y = height - 20 - point.wait * scaleY;
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = colors[idx % colors.length];
        ctx.font = "12px 'Patrick Hand'";
        ctx.fillText(p.name, 5, 20 + idx * 16);
      });
      ctx.fillStyle = "#5f564b";
      ctx.fillText("Time →", canvas.width-40, height-5);
      ctx.fillText("Waiting time ↑", 10, 20);
    }

    function updateWaitingTimes() {
      for (let p of processes) {
        if (p.state === "ready" && p.lastRunStart !== null) {
          const newWait = time - p.lastRunStart;
          if (newWait > 0) {
            p.totalWait += newWait;
            p.waitHistory.push({ time, wait: p.totalWait });
            p.lastRunStart = time;
          }
        }
      }
    }

    function getNextProcess() {
      const ready = processes.filter(p => p.state === "ready");
      if (ready.length === 0) return null;
      if (selectedAlgo === "fcfs") {
        ready.sort((a,b) => a.arrival - b.arrival);
        return ready[0];
      } else if (selectedAlgo === "sjf") {
        ready.sort((a,b) => a.remaining - b.remaining);
        return ready[0];
      } else if (selectedAlgo === "srtf") {
        ready.sort((a,b) => a.remaining - b.remaining);
        return ready[0];
      } else if (selectedAlgo === "priority") {
        ready.sort((a,b) => a.priority - b.priority);
        return ready[0];
      } else if (selectedAlgo === "preemptive_priority") {
        ready.sort((a,b) => a.priority - b.priority);
        return ready[0];
      } else if (selectedAlgo === "rr") {
        ready.sort((a,b) => a.arrival - b.arrival);
        return ready[0];
      }
      return null;
    }

    function shouldPreempt(current, candidate) {
      if (!candidate) return false;
      if (selectedAlgo === "srtf") return candidate.remaining < current.remaining;
      if (selectedAlgo === "preemptive_priority") return candidate.priority < current.priority;
      return false;
    }

    function schedule() {
      if (!running && !simulationEnded) return;
      const next = getNextProcess();
      if (currentProcess && next && shouldPreempt(currentProcess, next)) {
        currentProcess.state = "ready";
        currentProcess.lastRunStart = time;
        ganttEntries.push({ processId: "ctx", name: "ctx_switch", start: time, end: time + ctxOverhead });
        time += ctxOverhead;
        contextSwitches++;
        currentProcess = null;
        currentQuantumUsed = 0;
        updateUI();
      }
      if (!currentProcess && next) {
        currentProcess = next;
        currentProcess.state = "running";
        currentProcess.lastRunStart = time;
        currentQuantumUsed = 0;
        updateUI();
      }
      updateUI();
    }

    function checkArrivals() {
      let changed = false;
      for (let p of processes) {
        if (p.state === "unborn" && p.arrival <= time) {
          p.state = "ready";
          p.lastRunStart = time;
          changed = true;
        }
      }
      if (changed) schedule();
    }

    function updateIO() {
      for (let p of processes) {
        if (p.state === "waiting" && p.ioRemaining > 0) {
          p.ioRemaining--;
          if (p.ioRemaining === 0) {
            p.state = "ready";
            p.lastRunStart = time;
            schedule();
          }
        }
      }
    }

    function tick() {
      if (!running) return;
      updateIO();
      checkArrivals();
      updateWaitingTimes();

      if (currentProcess && currentProcess.state === "running") {
        currentProcess.remaining--;
        currentQuantumUsed++;

        if (ganttEntries.length === 0 || ganttEntries[ganttEntries.length-1].processId !== currentProcess.id) {
          ganttEntries.push({ processId: currentProcess.id, name: currentProcess.name, start: time, end: time+1 });
        } else {
          ganttEntries[ganttEntries.length-1].end = time+1;
        }

        if (currentProcess.remaining === 0) {
          if (currentProcess.ioBurst > 0) {
            currentProcess.state = "waiting";
            currentProcess.ioRemaining = currentProcess.ioBurst;
            currentProcess.totalWait += (time - currentProcess.lastRunStart);
            currentProcess.lastRunStart = null;
            currentProcess = null;
          } else {
            currentProcess.state = "terminated";
            currentProcess.endTime = time+1;
            currentProcess.totalTurnaround = currentProcess.endTime - currentProcess.arrival;
            currentProcess.totalWait += (time - currentProcess.lastRunStart);
            currentProcess = null;
          }
          contextSwitches++;
          schedule();
        } 
        else if (selectedAlgo === "rr" && currentQuantumUsed >= roundRobinQuantum) {
          currentProcess.state = "ready";
          currentProcess.totalWait += (time - currentProcess.lastRunStart);
          currentProcess.lastRunStart = time;
          currentProcess = null;
          contextSwitches++;
          schedule();
        }
        else {
          currentProcess.lastRunStart = time;
        }
      } else {
        if (ganttEntries.length === 0 || ganttEntries[ganttEntries.length-1].name !== "idle") {
          ganttEntries.push({ processId: "idle", name: "idle", start: time, end: time+1 });
        } else {
          ganttEntries[ganttEntries.length-1].end = time+1;
        }
        schedule();
      }
      time++;
      
      if (processes.length > 0 && processes.every(p => p.state === "terminated")) {
        if (running) pauseSimulation();
        simulationEnded = true;
        running = false;
        if (simInterval) clearInterval(simInterval);
      }
      updateUI();
    }

    function startSimulation() {
      if (simInterval) clearInterval(simInterval);
      running = true;
      simulationEnded = false;
      simInterval = setInterval(() => { if (running) tick(); }, speedMs);
    }
    
    function pauseSimulation() {
      running = false;
      if (simInterval) clearInterval(simInterval);
      simInterval = null;
    }
    
    function stepSimulation() {
      if (!running && !simulationEnded) {
        pauseSimulation();
        tick();
      } else if (!running) tick();
    }
    
    function resetSimulation() {
      pauseSimulation();
      running = false;
      simulationEnded = false;
      time = 0;
      contextSwitches = 0;
      ganttEntries = [];
      currentProcess = null;
      currentQuantumUsed = 0;
      for (let p of processes) p.reset();
      schedule();
      updateUI();
    }

    function addProcess(name, burst, arrival, priority, ioBurst) {
      const safeName = sanitizeProcessName(name);
      const newP = new Process(nextPid++, safeName, burst, arrival, priority, ioBurst);
      newP.state = arrival === 0 ? "ready" : "unborn";
      processes.push(newP);
      resetSimulation();
    }

    function loadExample() {
      processes = [];
      nextPid = 1;
      addProcess("P1", 10, 0, 3, 2);
      addProcess("P2", 6, 1, 1, 0);
      addProcess("P3", 8, 2, 2, 1);
      addProcess("P4", 4, 3, 4, 0);
      resetSimulation();
    }

    ganttCanvas.addEventListener("click", (e) => {
      const rect = ganttCanvas.getBoundingClientRect();
      const scaleX = ganttCanvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const maxTime = Math.max(...ganttEntries.map(entry => entry.end), time);
      const timePos = (mouseX - 20) / ((ganttCanvas.width - 40) / (maxTime || 1));
      const entry = ganttEntries.find(entry => timePos >= entry.start && timePos <= entry.end);
      if (entry) {
        alert(`Process: ${entry.name}\nStart: ${entry.start}\nEnd: ${entry.end}`);
      }
    });

    $("startBtn").onclick = startSimulation;
    $("pauseBtn").onclick = pauseSimulation;
    $("stepBtn").onclick = stepSimulation;
    $("resetBtn").onclick = resetSimulation;
    
    $("addProcessBtn").onclick = () => {
      const name = $("procName").value;
      const burst = parseInt($("procBurst").value);
      const arrival = parseInt($("procArrival").value);
      const priority = parseInt($("procPriority").value);
      const io = parseInt($("procIOBurst").value);
      if (burst > 0) addProcess(name, burst, arrival, priority, io);
    };
    
    $("loadExampleBtn").onclick = loadExample;
    
    schedAlgoSelect.onchange = () => {
      selectedAlgo = schedAlgoSelect.value;
      rrQuantumDiv.style.display = selectedAlgo === "rr" ? "flex" : "none";
      resetSimulation();
    };
    
    quantumInput.onchange = () => { 
      roundRobinQuantum = parseInt(quantumInput.value) || 3; 
      if(selectedAlgo==="rr") resetSimulation(); 
    };
    
    ctxOverheadInput.onchange = () => { 
      ctxOverhead = parseInt(ctxOverheadInput.value) || 0; 
      resetSimulation(); 
    };
    
    speedSlider.oninput = () => {
      speedMs = parseInt(speedSlider.value);
      speedValueSpan.innerText = speedMs;
      if (running) {
        clearInterval(simInterval);
        simInterval = setInterval(() => { if (running) tick(); }, speedMs);
      }
    };

    loadExample();
    updateUI();

    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, []);

  return (
    <div className="cpu-scheduler-container" ref={rootRef}>
      <div className="cpu-app">
        <div className="cpu-hero">
          <h1> Advanced CPU Scheduler</h1>
          <div className="cpu-sub">SRTF · Preemptive Priority · RR · FCFS · SJF | context switch overhead | clickable Gantt | live waiting time graph</div>
        </div>

        <div className="cpu-dashboard">
          <div>
            <div className="cpu-card">
              <div className="cpu-card-header"> Gantt Chart (click for details)</div>
              <div className="cpu-card-body">
                <div className="cpu-gantt-container">
                  <canvas id="ganttCanvas" width="1000" height="130" style={{width: '100%', height: 'auto', cursor: 'pointer'}}></canvas>
                </div>
              </div>
            </div>
            
            <div className="cpu-card">
              <div className="cpu-card-header"> Waiting Time Evolution (per process)</div>
              <div className="cpu-card-body">
                <canvas id="waitingChart" width="800" height="180" style={{width: '100%', height: 'auto'}}></canvas>
              </div>
            </div>
            
            <div className="cpu-card">
              <div className="cpu-card-header"> Current State</div>
              <div className="cpu-card-body">
                <div style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap'}}>
                  <div>⏲ Time: <strong id="sysTime">0</strong></div>
                  <div> Running: <span id="runningPid" className="cpu-running-process">— idle —</span></div>
                  <div> Context switches: <strong id="ctxSwitches">0</strong></div>
                </div>
                <hr style={{margin: '0.8rem 0', borderColor: 'var(--input-border)'}} />
                <div><strong> Ready Queue</strong></div>
                <div id="readyQueue" className="cpu-queue-list">— empty —</div>
                <div style={{marginTop: '0.8rem'}}><strong>⏳ Waiting Queue (I/O)</strong></div>
                <div id="waitQueue" className="cpu-queue-list">— none —</div>
              </div>
            </div>
            
            <div className="cpu-card">
              <div className="cpu-card-header"> Performance Metrics</div>
              <div className="cpu-card-body">
                <div className="cpu-metrics-grid">
                  <div className="cpu-metric"><div>⏱ Avg Turnaround</div><div className="cpu-metric-value" id="avgTurnaround">0</div></div>
                  <div className="cpu-metric"><div>⌛ Avg Waiting Time</div><div className="cpu-metric-value" id="avgWaiting">0</div></div>
                  <div className="cpu-metric"><div> CPU Utilization</div><div className="cpu-metric-value" id="cpuUtil">0%</div></div>
                  <div className="cpu-metric"><div> Throughput</div><div className="cpu-metric-value" id="throughput">0</div></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="cpu-card">
              <div className="cpu-card-header"> Scheduler Controls</div>
              <div className="cpu-card-body">
                <div className="cpu-btn-group">
                  <button id="startBtn" className="success">▶ Start</button>
                  <button id="pauseBtn" className="warning">⏸ Pause</button>
                  <button id="stepBtn" className="primary">⏩ Step</button>
                  <button id="resetBtn" className="danger">⟳ Reset</button>
                </div>
                <div style={{display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center'}}>
                  <label> Algorithm:</label>
                  <select id="schedAlgo">
                    <option value="fcfs">FCFS</option>
                    <option value="sjf">SJF (non-preemptive)</option>
                    <option value="srtf">SRTF (preemptive SJF)</option>
                    <option value="priority">Priority (non-preemptive)</option>
                    <option value="preemptive_priority">Preemptive Priority</option>
                    <option value="rr">Round Robin</option>
                  </select>
                  <div id="rrQuantumDiv" style={{display: 'none', alignItems: 'center', gap: '0.5rem'}}>
                    <label>⏲ Quantum: </label>
                    <input type="number" id="quantum" defaultValue="3" min="1" max="20" style={{width: '70px'}} />
                  </div>
                </div>
                <div style={{marginTop: '0.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center'}}>
                  <label> Context switch overhead: <input type="number" id="ctxOverhead" defaultValue="0" min="0" max="5" step="1" style={{width: '70px'}} /> units</label>
                  <label> Speed: <input type="range" id="speedSlider" min="50" max="600" defaultValue="200" style={{width: '100px'}} /> <span id="speedValue">200</span> ms</label>
                </div>
              </div>
            </div>

            <div className="cpu-card">
              <div className="cpu-card-header"> Add / Edit Process</div>
              <div className="cpu-card-body">
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem'}}>
                  <input type="text" id="procName" placeholder="Name" defaultValue="P" />
                  <input type="number" id="procBurst" placeholder="Burst" defaultValue="8" min="1" />
                  <input type="number" id="procArrival" placeholder="Arrival" defaultValue="0" min="0" />
                  <input type="number" id="procPriority" placeholder="Priority (lower=higher)" defaultValue="5" />
                  <input type="number" id="procIOBurst" placeholder="I/O burst" defaultValue="0" min="0" />
                </div>
                <div className="cpu-btn-group" style={{marginTop: '0.8rem'}}>
                  <button id="addProcessBtn" className="primary"> Add process</button>
                  <button id="loadExampleBtn"> Load Example Set</button>
                </div>
              </div>
            </div>

            <div className="cpu-card">
              <div className="cpu-card-header"> Process Table</div>
              <div className="cpu-card-body" style={{overflowX: 'auto'}}>
                <table className="cpu-process-table" id="processTable">
                  <thead><tr><th>ID</th><th>Burst</th><th>Arrival</th><th>Priority</th><th>I/O</th><th>Status</th></tr></thead>
                  <tbody id="processTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function mountCpuSchedulerSimulation(container) {
  const app = render(CpuSchedulerSimulation);
  container.appendChild(app.root);
  return app.cleanup;
}

# IMPORTANT! You must use the GUI Desktop Workspace for this Challenge!

# Challenge Instructions

A common type of vulnerability is an _Authentication Bypass_, where an attacker can bypass the typical authentication logic of an application and log in without knowing the necessary user credentials.

This level challenges you to explore one such scenario.
This specific scenario arises because of a gap between what the developer expects (that the URL parameters set by the application will only be set by the application itself) and the reality (that attackers can craft HTTP requests to their hearts content).

This level assumes a passing familiarity with SQL, which you can develop in the [SQL Playground](/fundamentals/sql-playground).

The webserver program is `/challenge/server`.
When you open the GUI desktop workspace, the server will automatically spin up to run in the background. You can talk to it over HTTP using the bottom terminal.
We recommend reading through the server's code (particularly the endpoints) in the left and right terminals to understand what it is doing. From this, you can bypass this authentication to log in as the `admin` user and get the flag!


----

# Eye-Tracking Instructions

**This challenge uses your webcam to track eye movements.**  
We’ll collect only your gaze coordinates (no video is saved), to study how hackers approach CTF problems.

---

## 1. Prerequisites

- **Webcam**: You must have a working webcam.  
- **Lighting**: A well-lit room helps improve accuracy.  
- **Browser Permissions**: When prompted, **allow** camera access.  

---

## 2. Calibration (~30 seconds)

1. When the GUI workspace opens, you’ll see a **white screen** with **9 red dots**.  
2. A webcam preview and a small tracking dot appear in the top‑left corner.  
3. **Click each red dot 5 times**, while looking directly at it.  
4. Dots will turn **yellow** when fully clicked.  
5. Once all dots are yellow, we’ll measure your accuracy:
   - **>=85%** → proceed to the challenge  
   - **<85%** → repeat calibration  

---

## 3. During the Challenge

- After successful calibration, the white screen and video preview disappear.  
- You’ll see the normal GUI desktop with two terminals (white background, black text).  
- **Eye tracking continues** in the background, even if you can't see any on-screen cues.  
- **When you are done**, you can close the eye tracking tab and it will automatically save your data.

---

## 4. Tips for Best Accuracy

- Keep your monitor **at eye level** and your webcam **above the screen**.  
- Sit in a **well-lit** area.  
- Try to keep your **head still**. Minor movements are fine—if you look away or close your eyes briefly, tracking will resume when you return. 
- If you reload the page, you will have to recalibrate. 
- **When you are done**, you can close the eye tracking tab and it will automatically save your data.

---

Thank you! Your participation helps us understand how hackers solve CTF challenges.




<div id="challenge-notice-5" style="display:none;"></div>


<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
/**
 * createTracker: fully encapsulated eye + interaction tracker
 * Usage:
 *   const tracker = createTracker({ iframeId:'workspace-iframe', challenge:'example', urlBasePath:'https://cumberland.isis.vanderbilt.edu/skyler/', userId: init.userId });
 *   tracker.start();
 *   // tracker.stop(); // later, if you want
 *   // tracker.destroy(); // full cleanup (UI + listeners + stop + end webgazer)
 */
function createTracker({
  iframeId,
  iframeSelector,  
  challenge,
  bannerElId,
  expectedContainerId,
  requireVersionMatch = true,
  versionToChallenge = v => `path-traversal-${v}`,
  urlBasePath,
  userId,
  tickMs = 5000,
  minAccuracy = 85,
  allowCalibrationSkip = false,
}) {
  // ---- Private clocks for absolute timestamps ----
  const wallClockStart = Date.now();        // ms since epoch
  const perfStart = performance.now();      // ms since page load

  // ---- Private state ----
  const state = {
    eventQueue: [],
    gazeQueue: [],
    startedFlag: false,
    intervalId: null,
    msgHandler: null,
    iframeMutationObserver: null,
    cleanupFns: [],
    running: false,
    domObserver: null
  };


  // ---- Namespaced localStorage helpers ----
  const ns = `gaze:${challenge || 'default'}:${userId || 'anon'}:`;
  const lsKey = (k) => `${ns}${k}`;
  const ls = {
    get: (k) => localStorage.getItem(lsKey(k)),
    set: (k, v) => localStorage.setItem(lsKey(k), v),
    rm:  (k) => localStorage.removeItem(lsKey(k)),
    clearMine: () => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ns)) localStorage.removeItem(key);
      }
    }
  };

  // ---- Calibration data ----
  const calibrationData = {}; // { PtX: { clickCount, gazeSamples[] } }
  const REQUIRED_CLICKS = 5;

  // ---- Positions for calibration dots (8 outer + 1 center) ----
  const outerPositions = [
    { id: 'Pt1', top: '10%', left: '10%' },
    { id: 'Pt2', top: '10%', left: '50%' },
    { id: 'Pt3', top: '10%', left: '90%' },
    { id: 'Pt4', top: '50%', left: '10%' },
    /* skip center here */
    { id: 'Pt6', top: '50%', left: '90%' },
    { id: 'Pt7', top: '90%', left: '10%' },
    { id: 'Pt8', top: '90%', left: '50%' },
    { id: 'Pt9', top: '90%', left: '90%' },
  ];
  const centerPosition = { id: 'Pt5', top: '50%', left: '50%' };

  // ---------- Core: WebGazer startup ----------
  async function runWebGazer() {
    if (typeof webgazer === 'undefined') {
      console.warn('WebGazer not loaded');
      return;
    }

    const calibrated = ls.get('webgazerCalibrated') === 'true';
    let cam = ls.get('cam'); // deviceId

    if (!calibrated) {
      try { webgazer.clearData(); } catch {}

    }

    // Configure camera constraints
    const applyCam = (deviceId) => {
      try {
        webgazer.setCameraConstraints({
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            frameRate: { min: 5, ideal: 10, max: 15 },
            facingMode: 'user',
          },
        });
      } catch (e) {
        console.warn('setCameraConstraints failed', e);
      }
    };

    if (!cam && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter(d => d.kind === 'videoinput');
        if (videos.length) {
          cam = videos[0].deviceId;
          ls.set('cam', cam);
          applyCam(cam);
          await webgazer.begin();
        } else {
          console.warn('No video input devices found.');
        }
      } catch (err) {
        console.error('Could not list cameras:', err);
      }
    } else {
      applyCam(cam);
    }

    // Set up WebGazer model + listener
    webgazer
      .saveDataAcrossSessions(true)
      .setRegression('ridge')
      .setGazeListener((data, ts) => {
        if (!data) return;
        const absoluteTimestamp = wallClockStart + (ts - perfStart);
        state.gazeQueue.push({
          x: data.x, y: data.y, timestamp: ts, absoluteTimestamp
        });
      })
      .begin();

    if (!calibrated) {
      webgazer.showVideoPreview(true)
        .showPredictionPoints(true)
        .applyKalmanFilter(true);
      setupCalibration();
    } else {
      webgazer.showVideoPreview(false)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .applyKalmanFilter(true);
      console.log('WebGazer resumed with saved calibration – skipping UI.');
    }

    // Ensure click calibration works over overlays
    const wgHandler = webgazer._clickListener || webgazer.params?.clickListener;
    if (wgHandler) {
      document.removeEventListener('click', wgHandler);
      document.addEventListener('click', wgHandler, true);
    }
    document.addEventListener('mousedown', (e) => {
      if (typeof webgazer.recordScreenPosition === 'function') {
        webgazer.recordScreenPosition(e.clientX, e.clientY);
      }
    }, true);
  }

  // ---------- Calibration UI ----------
  function createCalibrationPoints() {
    if (document.querySelector('.calibrationDiv')) return;

    const bg = document.createElement('div');
    bg.className = 'calibrationBackground';
    Object.assign(bg.style, {
      position: 'fixed', inset: '0', backgroundColor: 'white'
    });
    document.body.appendChild(bg);

    const overlay = document.createElement('div');
    overlay.className = 'calibrationDiv';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0',
      pointerEvents: 'none', zIndex: 9999
    });

    const instructionText = document.createElement('div');
    instructionText.className = 'calibrationInstruction';
    instructionText.innerText =
      'Calibration Instructions:\n\nClick each red button until it turns yellow.\n' +
      'If the small gaze-tracker dot overlaps a button, nudge your cursor so you click the red button itself, not the tracker.';
    Object.assign(instructionText.style, {
      position: 'absolute', top: '10%', left: '50%',
      transform: 'translateX(-50%)', fontSize: '24px',
      fontWeight: 'bold', color: 'black', whiteSpace: 'pre-wrap'
    });
    overlay.appendChild(instructionText);

    // Camera selector
    const label = document.createElement('label');
    label.innerText = 'Choose camera: ';
    Object.assign(label.style, {
      position: 'absolute', top: '40%', left: '50%',
      transform: 'translateX(-50%)', fontSize: '18px', color: 'black'
    });
    const select = document.createElement('select');
    select.id = 'cameraSelect';
    select.style.marginLeft = '8px';
    label.appendChild(select);
    overlay.appendChild(label);

    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const cams = devices.filter(d => d.kind === 'videoinput');
          cams.forEach((c, i) => {
            const opt = document.createElement('option');
            opt.value = c.deviceId;
            opt.text  = c.label || `Camera ${i + 1}`;
            if (ls.get('cam') === c.deviceId) opt.selected = true;
            select.appendChild(opt);
          });
        })
        .catch(err => console.error('Could not list cameras:', err));
    }

    // Create 8 outer dots
    outerPositions.forEach(pos => {
      const btn = document.createElement('button');
      btn.className = 'Calibration';
      btn.id = pos.id;
      Object.assign(btn.style, {
        position: 'absolute', top: pos.top, left: pos.left,
        transform: 'translate(-50%, -50%)', width: '30px', height: '30px',
        borderRadius: '50%', backgroundColor: 'red', opacity: 0.6,
        pointerEvents: 'auto'
      });
      overlay.appendChild(btn);
    });

    if (allowCalibrationSkip) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.textContent = 'Skip calibration (dev)';
      Object.assign(skip.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '6px 10px',
        fontSize: '12px',
        borderRadius: '6px',
        border: '1px solid #999',
        background: '#fff',
        opacity: '0.85',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 10000
      });
      skip.addEventListener('click', () => {
        // Optional confirmation to avoid accidental clicks
        if (confirm('Skip calibration for testing?')) {
          finalizeCalibrationSuccess({ reason: 'dev-skip', overall: 100 });
        }
      });
      overlay.appendChild(skip);
    }

    document.body.appendChild(overlay);

    // Camera change handler — FIXED to use selected deviceId
    select.addEventListener('change', async (e) => {
      const deviceId = e.target.value;
      try {
        await webgazer.end();
      } catch {}
      try { webgazer.clearData(); } catch {}

      try {
        webgazer.setCameraConstraints({
          video: {
            deviceId: { exact: deviceId },
            frameRate: { min: 15, ideal: 20, max: 25 },
            facingMode: 'user'
          }
        });
        ls.set('cam', deviceId);
        await webgazer
          .saveDataAcrossSessions(true)
          .setRegression('ridge')
          .setGazeListener((data, ts) => {
            if (!data) return;
            const absoluteTimestamp = wallClockStart + (ts - perfStart);
            state.gazeQueue.push({ x: data.x, y: data.y, timestamp: ts, absoluteTimestamp });
          })
          .begin();

        webgazer.showVideoPreview(true).showPredictionPoints(true).applyKalmanFilter(true);
      } catch (err) {
        console.error('Switch camera failed:', err);
      }
    });
  }

  function createCenterButton() {
    if (document.getElementById(centerPosition.id)) return;
    const btn = document.createElement('button');
    btn.className = 'Calibration';
    btn.id = centerPosition.id;
    Object.assign(btn.style, {
      position: 'absolute', top: centerPosition.top, left: centerPosition.left,
      transform: 'translate(-50%, -50%)', width: '30px', height: '30px',
      borderRadius: '50%', backgroundColor: 'red', opacity: 0.6, pointerEvents: 'auto'
    });
    document.querySelector('.calibrationDiv').appendChild(btn);
    btn.addEventListener('click', calibrationClickHandler);
  }

  function calibrationClickHandler(e) {
    const id = e.target.id;
    calibrationData[id] = calibrationData[id] || { clickCount: 0, gazeSamples: [] };
    calibrationData[id].clickCount++;
    const gaze = webgazer.getCurrentPrediction?.();
    if (gaze) calibrationData[id].gazeSamples.push({ x: gaze.x, y: gaze.y });

    e.target.style.opacity = Math.min(1, 0.6 + 0.08 * calibrationData[id].clickCount);
    if (calibrationData[id].clickCount >= REQUIRED_CLICKS) {
      e.target.style.backgroundColor = 'yellow';
      e.target.disabled = true;
    }

    const allOuterDone = outerPositions.every(p => calibrationData[p.id]?.clickCount >= REQUIRED_CLICKS);
    if (allOuterDone) createCenterButton();

    if (id === centerPosition.id && calibrationData[id].clickCount >= REQUIRED_CLICKS) {
      measureCenterAccuracy();
    }
  }

  function ClearCalibration() {
    Object.keys(calibrationData).forEach(k => delete calibrationData[k]);
    try { webgazer.clearData(); } catch {}
    document.querySelectorAll('.Calibration').forEach(btn => {
      btn.disabled = false;
      btn.style.backgroundColor = 'red';
      btn.style.opacity = 0.6;
    });
  }

  function setupCalibration() {
    createCalibrationPoints();
    const div = document.querySelector('.calibrationDiv');
    div.style.pointerEvents = 'auto';
    div.style.zIndex = 9999;
    document.querySelectorAll('.Calibration')
      .forEach(btn => btn.addEventListener('click', calibrationClickHandler));
  }

  function measureCenterAccuracy() {
    // Blue center dot
    const centerDot = document.createElement('div');
    centerDot.id = 'centerDot';
    Object.assign(centerDot.style, {
      position: 'fixed', width: '20px', height: '20px', backgroundColor: 'blue',
      borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      zIndex: 10000
    });
    document.body.appendChild(centerDot);

    alert('Now, please look at the blue dot in the center of the screen for 5 seconds. We will use this to measure calibration accuracy.');

    setTimeout(() => {
      centerDot.remove();

      const snapshot = state.gazeQueue.slice(-15); // last 15 points
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const threshold = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;

      const precisions = snapshot.map(s => {
        const dx = centerX - s.x, dy = centerY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= threshold ? 100 - (dist / threshold * 100) : 0;
      });

      const overall = precisions.length
        ? Math.round(precisions.reduce((a, b) => a + b, 0) / precisions.length)
        : 0;

      if (overall < minAccuracy) {
        alert(`Calibration complete!\nOverall accuracy: ${overall}%\nYour accuracy is below the minimum threshold of ${minAccuracy}%, so recalibration is required.`);
        ClearCalibration(); setupCalibration(); return;
      }

      const proceed = confirm(`Calibration complete!\nOverall accuracy: ${overall}%\nDo you want to move on? Press Cancel to calibrate again.`);
      if (!proceed) { ClearCalibration(); setupCalibration(); return; }

      finalizeCalibrationSuccess({ reason: 'measured', overall });
    }, 5000);
  }

  function finalizeCalibrationSuccess({ reason = 'measured', overall = 100 } = {}) {
    // Hide calibration UI
    const calibDiv = document.querySelector('.calibrationDiv');
    if (calibDiv) calibDiv.style.display = 'none';
    const bg = document.querySelector('.calibrationBackground');
    if (bg) bg.remove();

    // Turn off previews/overlays but keep the trained model
    webgazer
      .showVideoPreview(false)
      .showPredictionPoints(false)
      .showFaceOverlay(false)
      .showFaceFeedbackBox(false)
      .saveDataAcrossSessions(true);

    // Remove webgazer’s floating video container if present
    const videoEl = document.getElementById('webgazerVideoContainer');
    if (videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl);

    // Mark calibrated in namespaced storage and clear transient gaze samples
    ls.set('webgazerCalibrated', 'true');
    state.gazeQueue.length = 0;

    console.log(`Calibration finalized (${reason}); overall=${overall}%`);
  }

  // ---------- Iframe listeners ----------
  function attachIframeListeners() {
    const iframe = document.getElementById(iframeId);
    if (!iframe) {
      console.warn('Iframe not found:', iframeId);
      return () => {};
    }

    const injectScript = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const old = doc.getElementById('eventForwarder');
        if (old) old.remove();

        const script = doc.createElement('script');
        script.id = 'eventForwarder';
        script.textContent = `
          if (!window._forwarderSetup) {
            window._forwarderSetup = true;

            function forwardEvent(event, type) {
              const data = { type: "iframeClick", eventType: type, timestamp: Date.now() };
              if (type === "keydown") data.key = event.key;
              else { data.x = event.clientX; data.y = event.clientY; }
              window.parent.postMessage(data, "*");
            }
            document.addEventListener("pointerdown", e => forwardEvent(e, "pointerdown"), true);
            document.addEventListener("keydown",     e => forwardEvent(e, "keydown"),     true);

            // ----- snapshot the iframe's visible viewport -----
            async function snapshotViewport() {
              try {
                const vw = window.innerWidth;
                const vh = window.innerHeight;

                // Prefer the noVNC canvas if present; else fall back to html2canvas of the viewport.
                const canvas = document.querySelector('#noVNC_canvas, canvas.noVNC_canvas, #screen, canvas') || null;

                let blob;

                if (canvas && canvas.getContext) {
                  // Capture the exact pixels visible on screen.
                  // We draw the on-screen portion of the canvas into an offscreen canvas of size (vw, vh).
                  // Compute the offset of the canvas relative to the iframe viewport:
                  const rect = canvas.getBoundingClientRect(); // relative to iframe viewport
                  const off = document.createElement('canvas');
                  off.width = vw;
                  off.height = vh;
                  const ctx = off.getContext('2d');

                  // Draw the source canvas so that the *visible* part lands at (0,0)-(vw,vh)
                  ctx.drawImage(
                    canvas,
                    -rect.left,  // dx
                    -rect.top    // dy
                  );

                  blob = await new Promise(res => off.toBlob(res, 'image/png'));
                } else if (window.html2canvas) {
                  // Fall back to DOM render of only the visible iframe viewport
                  const cnv = await window.html2canvas(document.documentElement, {
                    logging: false, useCORS: true, scale: 1,
                    x: window.scrollX, y: window.scrollY, width: vw, height: vh
                  });
                  blob = await new Promise(res => cnv.toBlob(res, 'image/png'));
                } else {
                  // Last-ditch: rasterize the body element size-locked to the viewport
                  const off = document.createElement('canvas');
                  off.width = vw; off.height = vh;
                  const ctx = off.getContext('2d');
                  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,vw,vh);
                  blob = await new Promise(res => off.toBlob(res, 'image/png'));
                }

                const buf = await blob.arrayBuffer();
                window.parent.postMessage({ type: 'IFRAME_SNAPSHOT', buf, w: vw, h: vh }, '*', [buf]);
              } catch (e) {
                window.parent.postMessage({ type: 'IFRAME_SNAPSHOT_ERROR', error: String(e) }, '*');
              }
            }

            // Listen for snapshot requests from parent
            window.addEventListener('message', (e) => {
              if (e?.data?.type === 'REQUEST_IFRAME_SNAPSHOT') snapshotViewport();
            });
          }
        `;
        doc.head.appendChild(script);
      } catch (err) {
        console.warn('Injection failed:', err);
      }
    };

    iframe.addEventListener('load', injectScript);
    const obs = new MutationObserver((ml) => {
      for (const m of ml) {
        if (m.type === 'attributes' && m.attributeName === 'src') {
          injectScript();
        }
      }
    });
    obs.observe(iframe, { attributes: true });

    // save cleanup
    state.cleanupFns.push(() => iframe.removeEventListener('load', injectScript));
    state.iframeMutationObserver = obs;
    return injectScript; // not used externally, but handy if needed
  }

  // Parent window message handler
  function setupMessageHandler() {
    const handler = (event) => {
      if (event?.data?.type !== 'iframeClick') return;
      const { eventType, timestamp, x, y, key } = event.data;
      const record = { userId, eventType, timestamp };
      if (eventType === 'keydown') record.key = key;
      else { record.x = x; record.y = y; }
      state.eventQueue.push(record);
    };
    window.addEventListener('message', handler);
    state.msgHandler = handler;
  }

  // ---------- Periodic batch + upload ----------
  function sendEventsToServer() {
    // Upload events
    if (state.eventQueue.length) {
      const form = new URLSearchParams();
      form.append('challenge', challenge);
      form.append('userId', userId);
      form.append('events', JSON.stringify(state.eventQueue));
      fetch(`${urlBasePath}save_events.php`, { method: 'POST', body: form })
        .then(r => r.json()).then(d => console.log('Events upload OK:', d))
        .catch(e => console.error('Events upload error:', e));
      state.eventQueue.length = 0;
    }

    // Upload gaze
    const calibrated = ls.get('webgazerCalibrated') === 'true';
    if (calibrated && state.gazeQueue.length) {
      if (!state.startedFlag) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        state.gazeQueue.unshift({ x: cx, y: cy, timestamp: -1, absoluteTimestamp: -1 });
        state.startedFlag = true;
        ls.set('started', 'true');
      }

      const form = new URLSearchParams();
      form.append('challenge', challenge);
      form.append('userId', userId);
      form.append('gazeData', JSON.stringify(state.gazeQueue));
      fetch(`${urlBasePath}save_gaze.php`, { method: 'POST', body: form })
        .then(r => r.json()).then(d => console.log('Gaze upload OK:', d))
        .catch(e => console.error('Gaze upload error:', e));

      const cur = state.gazeQueue[state.gazeQueue.length - 1];
      takeScreenshot(cur.x, cur.y, /*click*/ false);
      state.gazeQueue.length = 0;
    }
  }

  // ---------- Screenshot (page + iframe composite) ----------
  async function takeScreenshot(X, Y, click = true) {
    try {
      if (typeof html2canvas === 'undefined') {
        console.warn('html2canvas not loaded'); return;
      }

      // ---- A) Parent page: capture ONLY the visible viewport ----
      const vx = window.scrollX, vy = window.scrollY;
      const vw = window.innerWidth, vh = window.innerHeight;

      const pageCanvas = await html2canvas(document.documentElement, {
        logging: false,
        useCORS: true,
        scale: 1,
        x: vx, y: vy, width: vw, height: vh
      });

      // ---- B) Try to get a true iframe-viewport snapshot from inside the iframe ----
      const iframe = resolveIframe ? resolveIframe() : document.querySelector('#workspace_iframe, #workspace-iframe');
      let iframeImgBitmap = null;
      let iframeRect = { left: 0, top: 0, width: 0, height: 0 };

      if (iframe && iframe.contentWindow) {
        iframeRect = iframe.getBoundingClientRect();

        // Ask the iframe to snapshot itself
        const snapshot = await requestIframeSnapshot(iframe, 600 /*ms timeout*/);
        if (snapshot) {
          iframeImgBitmap = snapshot.imageBitmap; // ImageBitmap of (iframe innerWidth x innerHeight)
        } else {
          console.warn('Iframe did not respond to snapshot; skipping iframe layer.');
        }
      }

      // ---- C) Compose final image = parent viewport  ----
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = pageCanvas.width;
      finalCanvas.height = pageCanvas.height;
      const ctx = finalCanvas.getContext('2d');

      // Base: parent viewport
      ctx.drawImage(pageCanvas, 0, 0);

      // Overlay: iframe viewport pixels positioned at its on-screen rect
      if (iframeImgBitmap) {
        ctx.drawImage(iframeImgBitmap, iframeRect.left, iframeRect.top);
      }

      // ---- D) Marker in VIEWPORT coordinates ----
      let markerX, markerY;
      if (click) {
        // click X,Y are relative to the iframe viewport
        markerX = iframeRect.left + X;
        markerY = iframeRect.top + Y;

        ctx.beginPath();
        ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      } else {
        // gaze X,Y are already viewport (client) coords
        markerX = X;
        markerY = Y;
      }

      // ---- E) Upload ----
      const unixTs = Date.now();
      const isoTs = new Date(unixTs).toISOString();

      finalCanvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('screenshot', blob, 'screenshot.png');
        formData.append('X', markerX);
        formData.append('Y', markerY);
        formData.append('userId', userId);
        formData.append('challenge', challenge);
        formData.append('click', click);
        formData.append('screenshot_unix', unixTs);
        formData.append('screenshot_iso', isoTs);

        fetch(`${urlBasePath}save_screenshot.php`, { method: 'POST', mode: 'cors', body: formData })
          .then(r => r.json())
          .then(data => {
            console.log('Viewport screenshot upload successful:', data);
            finalCanvas.width = finalCanvas.height = 0;
          })
          .catch(err => console.error('Error uploading screenshot:', err));
      }, 'image/png');

    } catch (err) {
      console.error('Screenshot capture failed:', err);
    }
  }

  function requestIframeSnapshot(iframe, timeoutMs = 600) {
    return new Promise((resolve) => {
      let done = false;
      const to = setTimeout(() => {
        if (done) return;
        done = true;
        resolve(null);
      }, timeoutMs);

      function onMsg(ev) {
        if (ev.source !== iframe.contentWindow) return;
        const d = ev.data;
        if (!d || (d.type !== 'IFRAME_SNAPSHOT' && d.type !== 'IFRAME_SNAPSHOT_ERROR')) return;

        window.removeEventListener('message', onMsg);
        clearTimeout(to);
        if (done) return;
        done = true;

        if (d.type === 'IFRAME_SNAPSHOT_ERROR') {
          console.warn('Iframe snapshot error:', d.error);
          resolve(null);
          return;
        }

        // Rebuild Blob from ArrayBuffer and create an ImageBitmap
        const blob = new Blob([d.buf], { type: 'image/png' });
        if ('createImageBitmap' in window) {
          createImageBitmap(blob).then((imageBitmap) => {
            resolve({ imageBitmap, width: d.w, height: d.h });
          }).catch(() => resolve(null));
        } else {
          // Fallback to HTMLImageElement
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ imageBitmap: img, width: d.w, height: d.h });
          };
          img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
          img.src = url;
        }
      }

      window.addEventListener('message', onMsg);
      // Kick off the request
      iframe.contentWindow.postMessage({ type: 'REQUEST_IFRAME_SNAPSHOT' }, '*');
    });
  }

  function getExpectedContainer() {
    return expectedContainerId ? document.getElementById(expectedContainerId) : null;
  }


  function resolveIframe() {
    const container = getExpectedContainer();

    // Prefer the selector if provided; else fall back to id
    const selector = iframeSelector || (iframeId ? `#${iframeId}` : null);

    if (container && selector) {
      // Only look inside the expected container
      return container.querySelector(selector);
    }

    if (container && iframeId && !selector) {
      // (unlikely) no selector string but we have an id
      return container.querySelector(`#${iframeId}`);
    }

    // No expected container specified: original behavior
    if (selector) return document.querySelector(selector);
    if (iframeId)  return document.getElementById(iframeId);
    return null;
  }

  // --- Cross-tab presence (shared via localStorage) ---
  const PRESENCE_PREFIX = `${ns}tab:`;      // keys look like: gaze:<challenge>:<userId>:tab:<uuid>
  const tabId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2);
  const HEARTBEAT_MS = 2000;                // how often we refresh our presence
  const STALE_MS = HEARTBEAT_MS * 3;        // when a tab is considered gone (no recent heartbeat)

  function presenceKey(id = tabId) { return `${PRESENCE_PREFIX}${id}`; }

  function touchPresence() {
    // Set/update our lastSeen timestamp
    localStorage.setItem(presenceKey(), String(Date.now()));
  }

  function sweepStalePeers(now = Date.now()) {
    // Remove dead/stale tab entries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PRESENCE_PREFIX)) continue;
      const lastSeen = Number(localStorage.getItem(key) || 0);
      if (!lastSeen || now - lastSeen > STALE_MS) {
        localStorage.removeItem(key);
      }
    }
  }

  function countLivePeers(now = Date.now()) {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PRESENCE_PREFIX)) continue;
      const lastSeen = Number(localStorage.getItem(key) || 0);
      if (lastSeen && now - lastSeen <= STALE_MS) count++;
    }
    return count;
  }

  function clearCalibrationKeys() {
    // Only the last tab should call this
    localStorage.removeItem(`${ns}webgazerCalibrated`);
    localStorage.removeItem(`${ns}started`);
    // localStorage.removeItem(`${ns}cam`); // also forget camera so user picks again next time
  }

  // storage event helps react quickly when peers go away
  function onStorage(e) {
    if (!e || !e.key || !e.key.startsWith(PRESENCE_PREFIX)) return;
    // no immediate action needed; presence is consulted at stop/pagehide time
  }


  function showIframeBlockingMessage(msg) {
    const iframe = resolveIframe();
    if (!iframe || !iframe.contentWindow) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc || !doc.body) return;

    let modal = doc.getElementById('survey-check-modal');
    if (!modal) {
      modal = doc.createElement('div');
      modal.id = 'survey-check-modal';
      Object.assign(modal.style, {
        position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.6)',
        color: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 99999, padding: '1rem', boxSizing: 'border-box',
        fontSize: '1.1rem'
      });

      const text = doc.createElement('div');
      text.id = 'survey-check-text';
      text.style.marginBottom = '1rem';
      modal.appendChild(text);

      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Retry check';
      Object.assign(btn.style, {
        padding: '0.6rem 1.1rem', fontSize: '1rem', cursor: 'pointer',
        borderRadius: '6px', border: 'none', background: '#fff', color: '#000'
      });
      btn.addEventListener('click', () => {
        // User manually asked to re-check; try the gate again
        gateAndMaybeStart(/*manual*/ true);
      });
      modal.appendChild(btn);

      doc.body.appendChild(modal);
    }

    const label = doc.getElementById('survey-check-text');
    if (label) label.textContent = msg;
    modal.style.display = 'flex';
  }

  function hideIframeBlockingMessage() {
    const iframe = resolveIframe();
    if (!iframe || !iframe.contentWindow) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const modal = doc?.getElementById('survey-check-modal');
    if (modal) modal.style.display = 'none';
  }



  // ---------- Lifecycle ----------
  function start() {
    if (state.running) return;

    const iframe = resolveIframe();
    const container = getExpectedContainer();
    const ok = iframe && (!container || container.contains(iframe));

    if (!ok) {
      console.warn('No matching iframe under expected container; start() ignored.');
      return;
    }

    // presence/heartbeat…
    touchPresence();
    sweepStalePeers();
    state.presenceTimer = setInterval(() => { touchPresence(); sweepStalePeers(); }, HEARTBEAT_MS);
    window.addEventListener('storage', onStorage);

    runWebGazer();
    attachIframeListeners();
    setupMessageHandler();

    if (!state.intervalId) state.intervalId = setInterval(sendEventsToServer, tickMs);
    state.running = true;

    window.addEventListener('beforeunload', onPageHide, { once: true });
  }



  function stop() {
    // stop batching + listeners
    if (state.intervalId) { clearInterval(state.intervalId); state.intervalId = null; }
    if (state.msgHandler) { window.removeEventListener('message', state.msgHandler); state.msgHandler = null; }
    if (state.iframeMutationObserver) { state.iframeMutationObserver.disconnect(); state.iframeMutationObserver = null; }
    state.cleanupFns.splice(0).forEach(fn => { try { fn(); } catch {} });
    state.running = false;

    // stop presence heartbeat and remove our entry
    if (state.presenceTimer) { clearInterval(state.presenceTimer); state.presenceTimer = null; }
    window.removeEventListener('storage', onStorage);
    localStorage.removeItem(presenceKey());

    // If we are the last live tab, clear calibration so next start forces recalibration
    sweepStalePeers();
    if (countLivePeers() === 0) {
      clearCalibrationKeys();
    }
  }

  function destroy() {
    stop();
    if (state.domObserver) { state.domObserver.disconnect(); state.domObserver = null; }
    try { webgazer?.end?.(); } catch {}
    document.querySelector('.calibrationDiv')?.remove();
    document.querySelector('.calibrationBackground')?.remove();
    // ls.clearMine();
  }


  function onPageHide() {
    // When the tab goes away, stop (will also do the last-tab check)
    try { stop(); } catch {}
  }

  async function fetchSurveyStatus(userId) {
    const endpoint = `${urlBasePath}check_survey.php?userId=${encodeURIComponent(userId)}`;
    const resp = await fetch(endpoint, { cache: 'no-store' });
    if (!resp.ok) throw new Error('network error');
    return resp.json(); // => { filled: boolean, version: number }
  }

  let surveyPollTimer = null;

  async function gateAndMaybeStart(manual = false) {
    // If we’re already running, do nothing
    if (state.running) return;

    // Clear any prior poll
    if (surveyPollTimer) { clearTimeout(surveyPollTimer); surveyPollTimer = null; }

    try {
      const data = await fetchSurveyStatus(userId);
      if (!data?.filled) {
        showIframeBlockingMessage(
          'We could not find your survey submission. ' +
          'Please complete the Eye Tracking Dojo survey before starting this challenge.'
        );
        // Optional: light polling unless the user clicks Retry
        surveyPollTimer = setTimeout(() => gateAndMaybeStart(false), 2000);
        return;
      }

      const assignedVersion = data.version; // 1..n

      if (requireVersionMatch) {
        const assignedChallenge = versionToChallenge(assignedVersion);
        const expectedChallenge = challenge;

        if (expectedChallenge !== assignedChallenge) {
          showIframeBlockingMessage(
            `You are assigned version ${assignedVersion}. ` +
            `(expected here: ${expectedChallenge}). Please open "${assignedChallenge}" instead.`
          );
          surveyPollTimer = setTimeout(() => gateAndMaybeStart(false), 2000);
          return;
        }
      }

      // All good — hide modal and start the tracker
      hideIframeBlockingMessage();
      start();


    } catch (err) {
      console.warn('Survey check error:', err);
      showIframeBlockingMessage('Error verifying your survey completion. Click "Retry check" to try again.');
      // No auto-poll on network errors unless user presses Retry
    }
  }

  function showNotice(el, text) {
    el.textContent = text;
    el.style.display = 'block';
    el.style.fontWeight = '700';
    el.style.color = '#c00000';
    el.style.background = '#fff';
    el.style.padding = '10px 12px';
    el.style.border = '1px solid #c00000';
    el.style.borderRadius = '6px';
  }

  async function checkBanner() {
    const el = document.getElementById(bannerElId);
    if (!el) return; // silently skip if the page doesn't have it

    try {
      const endpoint = `${urlBasePath}check_survey.php?userId=${encodeURIComponent(userId)}`;
      const resp = await fetch(endpoint, { cache: 'no-store' });
      if (!resp.ok) throw new Error('network error');

      const { filled, version } = await resp.json(); // { filled: bool, version: number }
      if (!filled) {
        showNotice(el, 'We could not find your survey submission. Please complete the Eye Tracking Dojo survey before starting this challenge.');
        return null;
      }

      const assigned = versionToChallenge(version);

      if (requireVersionMatch && assigned !== challenge) {
        showNotice(el, `This page isn’t your assigned version. Assigned: ${assigned}. `
          + `You are currently on: ${challenge}. Please open ${assigned} instead.`);
        return null;
      }

      // All good — hide banner
      el.textContent = '';
      el.style.display = 'none';
      return version;

    } catch (err) {
      console.warn('Survey check error:', err);
      const el2 = document.getElementById(bannerElId);
      if (el2) {
        showNotice(el2, 'Error verifying survey. Please try again.');
      }
      return null;
    }
  }



  function autoStart() {
    if (state.domObserver) return;

    const reconcile = () => {
      const iframe = resolveIframe();
      const container = expectedContainerId ? document.getElementById(expectedContainerId) : null;
      const ok = iframe && (!container || container.contains(iframe));

      if (ok && !state.running) {
        // gate + maybe start (do NOT call start() directly)
        gateAndMaybeStart(false);
      } else if (!ok && state.running) {
        stop(); // cleanly stop if iframe removed/moved
      } else if (!ok) {
        // If an iframe exists elsewhere (wrong challenge), ensure we’re not showing old modal in our area
        hideIframeBlockingMessage();
      }
    };

    // Try immediately
    reconcile();

    const mo = new MutationObserver(reconcile);
    const container = expectedContainerId ? document.getElementById(expectedContainerId) : null;
    (container || document.documentElement)
      .ownerDocument // same doc
    mo.observe(container || document.documentElement, { childList: true, subtree: true });
    state.domObserver = mo;
  }




  // Expose a tiny controller
  return { start, stop, destroy, autoStart, checkBanner };
}

  
const tracker_5 = createTracker({
  iframeId: 'workspace-iframe',
  iframeSelector: '#workspace-iframe, #workspace_iframe',
  challenge: 'sqli-pin',
  bannerElId: 'challenge-notice-5', // div above for checking if the user is allowed to take this challenge  
  // for checking if this is the challenge that was started; if only one challenge in the module, leave it null
  expectedContainerId: 'challenges-body-5', 
  requireVersionMatch: false,
  urlBasePath: 'https://cumberland.isis.vanderbilt.edu/skyler/',
  userId: init.userId,             // pwn.college provides this
  tickMs: 5000,                    // batch interval
  minAccuracy: 85,                  // calibration threshold
  allowCalibrationSkip: true,
});

// Show/hide the banner based on survey/version BEFORE attempting to start anything
tracker_5.checkBanner();


// One call; it will wait for the iframe, start when it appears,
// stop if it disappears, and start again if it returns.
tracker_5.autoStart();
  
</script>

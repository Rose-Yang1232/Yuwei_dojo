# IMPORTANT! You must use the GUI Desktop Workspace for this Challenge!

# Challenge Instructions

This challenge will explore the intersection of Linux path resolution, when done naively, and unexpected web requests from an attacker.
We've implemented a simple web server for you --- it will serve up files from /challenge/files over HTTP.
Can you trick it into giving you the flag?

The webserver program is `/challenge/server`.
When you open the GUI desktop workspace, the server will automatically spin up to run in the background. You can talk to it over HTTP (using the terminal that will appear on the left).
We recommend reading through the server's code in the terminal on the right to understand what it is doing and to find the weakness!

**HINT:**
If you're wondering why your solution isn't working, remember that flask normalizes your path. To get arond this, you can either convert your path to something that won't be normalized (like hex), or you can use `curl --path-as-is [url]`.

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




<script>
    const wallClockStart = Date.now(); // milliseconds since Unix epoch
    const perfStart = performance.now(); // milliseconds since page load
</script>


<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>

        
<script>
let challenge;
challenge = "path-traversal-2";
const urlBasePath = "https://cumberland.isis.vanderbilt.edu/skyler/"
// Global queue to store recent gaze points.
let gazeQueue;
gazeQueue = [];
//let started = false;


// Flag to stop sending/recording while blocked
window._workspaceBlocked = false;

let _wsbRO = null; // ResizeObserver for blocker

function cancelEyeTrackingFlow() {
  // 1) Remove calibration overlay/background
  document.querySelector('.calibrationDiv')?.remove();
  document.querySelector('.calibrationBackground')?.remove();

  // 2) Stop WebGazer & clear state
  try { webgazer.showVideoPreview(false).showPredictionPoints(false).showFaceOverlay(false).showFaceFeedbackBox(false); } catch {}
  try { webgazer.end(); } catch {}
  try { webgazer.clearData(); } catch {}

  // Remove any residual DOM from WebGazer
  const vc = document.getElementById('webgazerVideoContainer');
  if (vc && vc.parentNode) vc.parentNode.removeChild(vc);

  // Clear calibration flags so the challenge won’t proceed
  localStorage.removeItem('webgazerCalibrated');
  localStorage.removeItem('started');
  try { gazeQueue = []; } catch {}

  // 3) Block the workspace so they must restart
  showWorkspaceBlocker('Eye tracking canceled. Click “Restart challenge” to continue.');
}


function positionWorkspaceBlocker() {
  const iframe = document.getElementById('workspace_iframe');
  const blocker = document.getElementById('workspace-blocker');
  if (!iframe || !blocker) return;
  const r = iframe.getBoundingClientRect();
  Object.assign(blocker.style, {
    position: 'fixed',
    left: r.left + 'px',
    top: r.top + 'px',
    width: r.width + 'px',
    height: r.height + 'px',
  });
}

function showWorkspaceBlocker(msg = 'Eye tracking was canceled. Click “Restart challenge” to continue.') {
  window._workspaceBlocked = true;

  let blocker = document.getElementById('workspace-blocker');
  if (!blocker) {
    blocker = document.createElement('div');
    blocker.id = 'workspace-blocker';
    Object.assign(blocker.style, {
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      zIndex: 99998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '1rem',
      pointerEvents: 'auto',
      borderRadius: '4px'
    });

    const inner = document.createElement('div');
    inner.innerHTML = `
      <div style="font-weight:600; margin-bottom: 0.5rem">${msg}</div>
      <div><button type="button" id="wsb-restart" class="btn btn-primary">Restart challenge</button></div>
    `;
    blocker.appendChild(inner);
    document.body.appendChild(blocker);

    // Clicking our button triggers your real restart control
    blocker.querySelector('#wsb-restart').addEventListener('click', () => {
      document.getElementById('challenge-restart')?.click();
    });

    window.addEventListener('resize', positionWorkspaceBlocker);
    window.addEventListener('scroll', positionWorkspaceBlocker, true);
    _wsbRO = new ResizeObserver(positionWorkspaceBlocker);
    const iframe = document.getElementById('workspace_iframe');
    if (iframe) _wsbRO.observe(iframe);
  }

  positionWorkspaceBlocker();
  blocker.style.display = 'flex';
}

function hideWorkspaceBlocker() {
  window._workspaceBlocked = false;
  const blocker = document.getElementById('workspace-blocker');
  if (blocker) blocker.remove();
  window.removeEventListener('resize', positionWorkspaceBlocker);
  window.removeEventListener('scroll', positionWorkspaceBlocker, true);
  if (_wsbRO) { try { _wsbRO.disconnect(); } catch {} _wsbRO = null; }
}


async function ensureSurveyCompleted(userId) {
  const endpoint = `${urlBasePath}check_survey.php?userId=${encodeURIComponent(userId)}`;
  let version = null;
  let abortController = null;
  let stopped = false;

  // Clean up if user leaves
  const cleanup = () => {
    stopped = true;
    if (abortController) abortController.abort();
  };
  window.addEventListener('beforeunload', cleanup);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cleanup();
  });

  // Helper to perform one check
  const doCheck = async () => {
    if (stopped) return null;
    abortController = new AbortController();
    try {
      const resp = await fetch(endpoint, {
        cache: 'no-store',
        signal: abortController.signal,
      });
      if (!resp.ok) throw new Error('network error');
      const data = await resp.json();
      if (data.filled) {
        const assignedVersion = data.version; // 1..4
        const expectedChallenge = `path-traversal-${assignedVersion}`;
        if (challenge !== expectedChallenge) {
          showWorkspaceBlocker(
            `You are assigned version ${assignedVersion} of the path traversal challenge ` +
            `(expected: ${expectedChallenge}), but this page is "${challenge}". ` +
            `Please navigate to your assigned version before proceeding.`
          );
          return null;
        }
        // correct version
        hideWorkspaceBlocker();
        return assignedVersion;
      } else {
        showWorkspaceBlocker(
          'We could not find your survey submission. You must complete the survey via the Eye Tracking Dojo link before proceeding.'
        );
        return null;
      }
    } catch (err) {
      if (stopped) return null;
      console.warn('Survey check error:', err);
      showWorkspaceBlocker('Error verifying your survey completion. Click "Retry check" to try again.');
      return null;
    }
  };

  // Initial check
  version = await doCheck();
  // If not done, listen for manual retry or poll every 2s
  while (!version && !stopped) {
    // Wait for either retry event or timeout
    await Promise.race([
      new Promise(r => {
        const listener = () => {
          window.removeEventListener('surveyCheckRetry', listener);
          r();
        };
        window.addEventListener('surveyCheckRetry', listener);
      }),
      new Promise(r => setTimeout(r, 2000)),
    ]);
    version = await doCheck();
  }

  // cleanup listeners
  window.removeEventListener('beforeunload', cleanup);
  return version;
}

// Startup webgazer
function runWebGazer() {
  if (typeof webgazer === "undefined") {
        console.log("WebGazer not available yet. Retrying...");
        return;
    }


  // 1) Detect prior calibration
  const calibrated = localStorage.getItem('webgazerCalibrated') === 'true';
  var cam = localStorage.getItem('cam');
  
  
  if (!calibrated){
    webgazer.clearData();     // only wipe data if NOT already calibrated
  }
  
  if (!cam) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length > 0) {
          cam = videoDevices[0].deviceId;
          localStorage.setItem('cam', cam);

          webgazer.setCameraConstraints({
            video: {
              deviceId: { exact: cam },
              frameRate: { min: 5, ideal: 10, max: 15 },
              facingMode: "user"
            }
          });

          // start WebGazer here too
          webgazer.begin();
        } else {
          console.warn("No video input devices found.");
        }
      }).catch(err => {
        console.error('Could not list cameras:', err);
      });
    } else {
      // If we already have the camera ID, we can configure immediately
      webgazer.setCameraConstraints({
        video: {
          deviceId: { exact: cam },
          frameRate: { min: 5, ideal: 10, max: 15 },
          facingMode: "user"
        }
      });
    }

  // 2) Tell WebGazer to persist/load its model
  webgazer
    .saveDataAcrossSessions(true)
    .setRegression('ridge')        // Use ridge regression model for accuracy
        .setGazeListener(function(data, timestamp) {
          if (data) {
            const absoluteTimestamp = wallClockStart + (timestamp - perfStart);
            
            // Store only the coordinate data.
            gazeQueue.push({ x: data.x, y:data.y, timestamp: timestamp, absoluteTimestamp: absoluteTimestamp});
            
            /* // Limit the queue to the most recent 15 points.
            if (gazeQueue.length > 15) {
                gazeQueue.shift();
            }
            */
            //console.log(`Gaze data: ${JSON.stringify(data)} at ${timestamp}`);
          }
        })
        .begin(); // Start tracking
    
    if (!calibrated){
        webgazer.showVideoPreview(true) // Show webcam preview
            .showPredictionPoints(true) // Show tracking points
            .applyKalmanFilter(true); // Smooth tracking data
    } else {
        webgazer.showVideoPreview(false) // Show webcam preview
            .showPredictionPoints(false) // Show tracking points
            .showFaceOverlay(false)      // hides the face-detection box
            .showFaceFeedbackBox(false) // hides the “keep your head centered” box
            .applyKalmanFilter(true); // Smooth tracking data
    }
    

    // Fix problem where webgazer doesnt see clicks inside the div. 
    // This enables it to continuously calibrate throughtout the challenge.
    const wgHandler = webgazer._clickListener || webgazer.params?.clickListener;
    if (wgHandler) {
        document.removeEventListener('click', wgHandler);
        // true = capture phase
        document.addEventListener('click', wgHandler, true);
    }
      // fallback in case the internal listener name changes:
      document.addEventListener('mousedown', e => {
        if (typeof webgazer.recordScreenPosition === 'function') {
          webgazer.recordScreenPosition(e.clientX, e.clientY);
        }
    }, true);
    
  if (calibrated) {
    console.log('WebGazer resumed with saved calibration – skipping UI.');
  } else {
    console.log('WebGazer started fresh – showing calibration UI.');
    setupCalibration();           // start calibration
  }
}
    
    
// Define positions for a 3x3 grid of calibration points.
const outerPositions = [
  { id: 'Pt1', top: '10%', left: '10%' },
  { id: 'Pt2', top: '10%', left: '50%' },
  { id: 'Pt3', top: '10%', left: '90%' },
  { id: 'Pt4', top: '50%', left: '10%' },
  /* skip Pt5 here */
  { id: 'Pt6', top: '50%', left: '90%' },
  { id: 'Pt7', top: '90%', left: '10%' },
  { id: 'Pt8', top: '90%', left: '50%' },
  { id: 'Pt9', top: '90%', left: '90%' }
];

const centerPosition = { id: 'Pt5', top: '50%', left: '50%' };   
    
    
// --- Calibration UI Creation and Styling ---
// Create calibration dots dynamically if they aren’t already on the page.
function createCalibrationPoints() {
  if (document.querySelector('.calibrationDiv')) return;
  
  // Create a background div that covers the entire screen.
  let backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'calibrationBackground';
  backgroundDiv.style.position = 'fixed';
  backgroundDiv.style.top = '0';
  backgroundDiv.style.left = '0';
  backgroundDiv.style.width = '100%';
  backgroundDiv.style.height = '100%';
  backgroundDiv.style.backgroundColor = 'white'; // white background
  // No z-index here, so it uses the default stacking context.

  // Append the background first.
  document.body.appendChild(backgroundDiv);

  let calibrationDiv = document.createElement('div');
  calibrationDiv.className = 'calibrationDiv';
  calibrationDiv.style.position = 'fixed';
  calibrationDiv.style.top = '0';
  calibrationDiv.style.left = '0';
  calibrationDiv.style.width = '100%';
  calibrationDiv.style.height = '100%';
  calibrationDiv.style.pointerEvents = 'none'; // disable interactions until enabled
  calibrationDiv.style.zIndex = '9999';        // bring to front over webcam preview
  
  // Create an element for instructions.
  let instructionText = document.createElement('div');
  instructionText.className = 'calibrationInstruction';
  instructionText.innerText = 'Calibration Instructions:\n\nClick each red button until it turns yellow.\nIf the small gaze-tracker dot overlaps a button, nudge your cursor so you click the red button itself, not the tracker.';
  instructionText.style.position = 'absolute';
  instructionText.style.top = '10%';
  instructionText.style.left = '50%';
  instructionText.style.transform = 'translateX(-50%)';
  instructionText.style.fontSize = '24px';
  instructionText.style.fontWeight = 'bold';
  instructionText.style.color = 'black';
  // Append the instruction text to the overlay.
  calibrationDiv.appendChild(instructionText);
  
  const label = document.createElement('label');
    label.innerText = 'Choose camera: ';
    label.style.position = 'absolute';
    label.style.top      = '40%';
    label.style.left     = '50%';
    label.style.transform= 'translateX(-50%)';
    label.style.fontSize = '18px';
    label.style.color    = 'black';

    const select = document.createElement('select');
    select.id = 'cameraSelect';
    select.style.marginLeft = '8px';
    label.appendChild(select);
    calibrationDiv.appendChild(label);

    // Populate cameras
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cams = devices.filter(d => d.kind === 'videoinput');
        cams.forEach((cam, i) => {
          const opt = document.createElement('option');
          opt.value = cam.deviceId;
          opt.text  = cam.label || `Camera ${i+1}`;
          select.appendChild(opt);
        });
      })
      .catch(err => console.error('Could not list cameras:', err));
  

  // create only the 8 outer buttons:
  outerPositions.forEach(pos => {
    let btn = document.createElement('button');
    btn.className = 'Calibration';
    btn.id = pos.id;
    Object.assign(btn.style, {
      position: 'absolute',
      top: pos.top,
      left: pos.left,
      transform: 'translate(-50%, -50%)',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: 'red',
      opacity: '0.6',
      pointerEvents: 'auto'
    });
    calibrationDiv.appendChild(btn);
  });

  document.body.appendChild(calibrationDiv);
  
  
  document.getElementById('cameraSelect').addEventListener('change', async e => {
      const deviceId = e.target.value;
      console.log('Switching to camera', deviceId);
      
      webgazer.end();

      // 1) Stop & clear WebGazer’s model
      webgazer.clearData();

      // 2) Tell it to open exactly that camera
      webgazer.setCameraConstraints({
        video: {
          deviceId: { exact: cam },
          frameRate: { min: 15, ideal: 20, max: 25 },
          facingMode: "user"
        }
      });
      
      localStorage.setItem('cam', deviceId);

      // 3) Restart tracking (reload any saved model)
      await webgazer
        .saveDataAcrossSessions(true)
        .setRegression('ridge')        // Use ridge regression model for accuracy
            .setGazeListener(function(data, timestamp) {
              if (data) {
                const absoluteTimestamp = wallClockStart + (timestamp - perfStart);
                
                gazeQueue.push({ x: data.x, y:data.y, timestamp: timestamp, absoluteTimestamp: absoluteTimestamp});

              }
            })
            .begin(); // Start tracking

      webgazer
        .showVideoPreview(true)
        .showPredictionPoints(true)
        .applyKalmanFilter(true);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.id = 'calibrationCancel';
  cancelBtn.textContent = 'Cancel eye tracking';
  Object.assign(cancelBtn.style, {
    position: 'absolute',
    bottom: '8%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.6rem 1rem',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '8px',
    border: '1px solid #888',
    background: '#f8f9fa',
  });
  cancelBtn.addEventListener('click', cancelEyeTrackingFlow);
  calibrationDiv.appendChild(cancelBtn);
}

function createCenterButton() {
  // only if it doesn’t already exist:
  if (document.getElementById(centerPosition.id)) return;

  let pos = centerPosition;
  let btn = document.createElement('button');
  btn.className = 'Calibration';
  btn.id = pos.id;
  Object.assign(btn.style, {
    position: 'absolute',
    top: pos.top,
    left: pos.left,
    transform: 'translate(-50%, -50%)',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'red',
    opacity: '0.6',
    pointerEvents: 'auto'
  });
  document.querySelector('.calibrationDiv').appendChild(btn);
  btn.addEventListener('click', calibrationClickHandler);
}

// --- Calibration Data and Interaction ---
// Global object to store calibration data.
let calibrationData = {}; // e.g., { Pt1: { clickCount: 0, gazeSamples: [] }, ... }
const REQUIRED_CLICKS = 5;

// Handler for calibration dot clicks.
function calibrationClickHandler(event) {
  let id = event.target.id;
  if (!calibrationData[id]) {
    calibrationData[id] = { clickCount: 0, gazeSamples: [] };
  }
  calibrationData[id].clickCount++;
  let gazeData = webgazer.getCurrentPrediction();
  if (gazeData) calibrationData[id].gazeSamples.push({ x: gazeData.x, y: gazeData.y });

  // Update opacity & disable
  event.target.style.opacity = Math.min(1, 0.6 + 0.08 * calibrationData[id].clickCount);
  if (calibrationData[id].clickCount >= REQUIRED_CLICKS) {
    event.target.style.backgroundColor = 'yellow';
    event.target.disabled = true;
  }

  // **Step A**: if all *outer* buttons done, show center:
  const allOuterDone = outerPositions.every(p => {
    return calibrationData[p.id] && calibrationData[p.id].clickCount >= REQUIRED_CLICKS;
  });
  if (allOuterDone) {
    createCenterButton();
  }

  // **Step B**: only when the *center* button itself has 5 clicks, proceed:
  if (id === centerPosition.id && calibrationData[id].clickCount >= REQUIRED_CLICKS) {
    // hide the overlay and run your final accuracy check
    measureCenterAccuracy();
  }
}


// Reset calibration data and restore calibration dot appearance.
function ClearCalibration(){
  calibrationData = {};
  webgazer.clearData(); // clear internal model
  document.querySelectorAll('.Calibration').forEach(btn => {
    btn.disabled = false;
    btn.style.backgroundColor = 'red';
    btn.style.opacity = '0.6'; // reset to initial opacity
  });
}

// Setup calibration UI and attach event listeners.
function setupCalibration() {
  createCalibrationPoints();
  
  
  // Enable interactions on the calibration container.
  let calibDiv = document.querySelector('.calibrationDiv');
  calibDiv.style.pointerEvents = 'auto';
  calibDiv.style.zIndex = '9999';
  
  document.querySelectorAll('.Calibration').forEach(btn => {
    btn.addEventListener('click', calibrationClickHandler);
  });
}

function measureCenterAccuracy() {
  // Clear any old data in the gazeQueue.
  //gazeQueue = [];
  
  // Create a center dot element.
  let centerDot = document.createElement('div');
  centerDot.id = 'centerDot';
  centerDot.style.position = 'fixed';
  centerDot.style.width = '20px';
  centerDot.style.height = '20px';
  centerDot.style.backgroundColor = 'blue';
  centerDot.style.borderRadius = '50%';
  centerDot.style.top = '50%';
  centerDot.style.left = '50%';
  centerDot.style.transform = 'translate(-50%, -50%)';
  centerDot.style.zIndex = '10000';
  document.body.appendChild(centerDot);

  // Instruct the user.
  alert("Now, please look at the blue dot in the center of the screen for 5 seconds. We will use this to measure calibration accuracy.");

  // Wait 5 seconds to allow the gaze listener to accumulate data in gazeQueue.
  setTimeout(() => {
    document.body.removeChild(centerDot);

    // Take a snapshot of the current gazeQueue.
    let snapshot = JSON.parse(JSON.stringify(gazeQueue.slice(-15)));; // copy last 15 elements
    console.log("Snapshot of gaze data:", snapshot);

    // Define the center coordinates.
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    // Use the screen diagonal/2 as a threshold for mapping distance to accuracy.
    let threshold = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;
    
    // Compute a precision percentage for each sample.
    let precisionPercentages = snapshot.map(sample => {
      let dx = centerX - sample.x;
      let dy = centerY - sample.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let precision = (distance <= threshold)
        ? 100 - (distance / threshold * 100)
        : 0;
      return precision;
    });

    // Average the precision percentages.
    let overallPrecision = precisionPercentages.reduce((sum, p) => sum + p, 0) / precisionPercentages.length;
    overallPrecision = Math.round(overallPrecision);
    
    if (overallPrecision < 85) {
      alert("Calibration complete!\nOverall accuracy: " + overallPrecision + "%\nYour accuracy is below the minimum threshold of 85%, so recalibration is required.");
      ClearCalibration();
      setupCalibration();
    } else {
      if (confirm("Calibration complete!\nOverall accuracy: " + overallPrecision + "%\nDo you want to move on? Please select cancel if you want to calibrate again.")) {
        const calibDiv = document.querySelector('.calibrationDiv');
        if (calibDiv) {
          calibDiv.style.display = 'none';
        }
        
        const backgroundDiv = document.querySelector('.calibrationBackground');
        if (backgroundDiv) {
          backgroundDiv.remove();
        }
        
        webgazer.showVideoPreview(false) // remove webcam preview
            .showPredictionPoints(false) // remove tracking points
            .showFaceOverlay(false)      
            .showFaceFeedbackBox(false)
            .saveDataAcrossSessions(true); 
            
        const videoEl = document.getElementById('webgazerVideoContainer');
        if (videoEl && videoEl.parentNode) {
          videoEl.parentNode.removeChild(videoEl);
        }
        localStorage.setItem('webgazerCalibrated', 'true');
        window.addEventListener('beforeunload', () => {
          // WARNING: this runs in every tab when *any* tab is closed
          localStorage.clear();
        });
        gazeQueue = [];
      } else {
        ClearCalibration();
        setupCalibration();
      }
    }

  }, 5000);
}
</script>






<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
window.eventQueue = window.eventQueue || []; // Stores events before sending

// Wait for an element to exist; selector can be a string or a () => element
function waitForElement(selectorOrFn, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const check = typeof selectorOrFn === 'function' ? selectorOrFn : () => document.querySelector(selectorOrFn);
    const found = check();
    if (found) return resolve(found);

    const obs = new MutationObserver(() => {
      const el = check();
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    if (timeout) {
      setTimeout(() => { obs.disconnect(); reject(new Error('waitForElement timeout')); }, timeout);
    }
  });
}



function attachIframeListeners(iframe) {
  if (!iframe) return;

  function injectScript() {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc) return;

      // remove any previous forwarder we injected
      const old = iframeDoc.getElementById('eventForwarder');
      if (old) old.remove();

      const script = iframeDoc.createElement('script');
      script.id = 'eventForwarder';
      script.textContent = `
        if (!window._forwarderSetup) {
          window._forwarderSetup = true;
          function forwardEvent(event, type) {
            let data = { type: "iframeClick", eventType: type, timestamp: Date.now() };
            if (type === "keydown") data.key = event.key;
            else { data.x = event.clientX; data.y = event.clientY; }
            window.parent.postMessage(data, "*");
          }
          document.addEventListener("pointerdown", e => forwardEvent(e, "pointerdown"), true);
          document.addEventListener("keydown",     e => forwardEvent(e, "keydown"),     true);
        }
      `;
      iframeDoc.head.appendChild(script);
      console.log("[forwarder] injected into iframe");
    } catch (err) {
      console.warn("[forwarder] injection failed:", err);
    }
  }

  // inject whenever the iframe loads
  iframe.addEventListener('load', injectScript);

  // re-inject if src changes
  const attrObserver = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'attributes' && m.attributeName === 'src') {
        console.log("[forwarder] iframe src changed; re-injecting…");
        injectScript();
      }
    }
  });
  attrObserver.observe(iframe, { attributes: true });

  // best effort immediate inject (in case it's already loaded)
  injectScript();
}

function watchIframe() {
  const existing = document.getElementById('workspace_iframe');
  if (existing && !existing._listenersAttached) {
    existing._listenersAttached = true;
    attachIframeListeners(existing);
  }

  // observe DOM for future insertions/replacements
  const domObserver = new MutationObserver(() => {
    const el = document.getElementById('workspace_iframe');
    if (el && !el._listenersAttached) {
      el._listenersAttached = true; // simple guard per element
      attachIframeListeners(el);
    }
  });
  domObserver.observe(document.documentElement, { childList: true, subtree: true });
}



window.addEventListener("message", function (event) {
  if (window._workspaceBlocked) return;
  if (event.data && event.data.type === "iframeClick") {
    console.log("Captured event inside iframe:", event.data);

    let eventRecord = {
      userId: init.userId,
      eventType: event.data.eventType,
      timestamp: event.data.timestamp
    };

    if (event.data.eventType === "keydown") {
      eventRecord.key = event.data.key; // Store keypress event
    } else {
      eventRecord.x = event.data.x;
      eventRecord.y = event.data.y;
    }

    // Store event in queue
    window.eventQueue.push(eventRecord);

    // Only take screenshots for mouse clicks
    /*
    if (event.data.eventType === "mousedown" || event.data.eventType === "pointerdown") {
      takeScreenshot(event.data.x, event.data.y);
    }
    */
  }
});


// Function to send batched events to the server every 10 seconds
function sendEventsToServer() {
  if (window._workspaceBlocked) {
    window.eventQueue = [];
    return;
  }
  
  if (window.eventQueue.length !== 0) { // Don't send if there's nothing to send

      console.log("Sending batched events to server:", window.eventQueue);

      const formData = new URLSearchParams();
        formData.append("challenge", challenge);
        formData.append("userId", init.userId);
        formData.append("events", JSON.stringify(window.eventQueue)); // Encode JSON as a string

        fetch(`${urlBasePath}save_events.php`, {
            method: "POST",
            body: formData 
        })
        .then(response => response.json())
        .then(data => console.log("Events upload successful:", data))
        .catch(error => console.error("Error uploading events:", error));
        
        
  }
  window.eventQueue = []; // Clear queue after sending
  
  let isCalibrated = localStorage.getItem('webgazerCalibrated') === 'true';
  let started = localStorage.getItem('started') === 'true';
  
  if (typeof gazeQueue !== 'undefined' && isCalibrated && gazeQueue.length !== 0){
      console.log("Sending batched gaze data to server.");
      
      if (!started) {
        // Prepend a sentinel gaze point with screen center and timestamp -1
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        gazeQueue.unshift({ x: centerX, y: centerY, timestamp: -1 });

        started = true;
        localStorage.setItem('started', 'true');
      }

      const formData = new URLSearchParams();
        formData.append("challenge", challenge);
        formData.append("userId", init.userId);
        formData.append("gazeData", JSON.stringify(gazeQueue)); // Encode JSON as a string

        fetch(`${urlBasePath}save_gaze.php`, {
            method: "POST",
            body: formData 
        })
        .then(response => response.json())
        .then(data => console.log("Gaze data upload successful:", data))
        .catch(error => console.error("Error uploading gaze data:", error));
      
      cur_gaze = gazeQueue.at(-1);
      takeScreenshot(cur_gaze.x, cur_gaze.y, false);
  } else if (!isCalibrated){
      return;
  }
  
  
  gazeQueue = [];
}

// Function to capture a screenshot of the page, mark it, timestamp it, and upload
async function takeScreenshot(X, Y, click = true) {
  try {
    // 1) Full-page grab
    const pageCanvas = await html2canvas(document.body, {
      logging: false,
      useCORS: true,
      scale: 1
    });

    // 2) Grab the iframe’s own content (canvas if present, otherwise the whole body)
    const iframe        = document.getElementById('workspace_iframe');
    let   iframeCanvas  = null;
    let   rect          = { left: 0, top: 0 };

    if (iframe) {
      rect = iframe.getBoundingClientRect();
      const iframeDoc    = iframe.contentDocument || iframe.contentWindow.document;
      const targetCanvas = iframeDoc.querySelector("canvas");

      if (targetCanvas && targetCanvas.tagName.toLowerCase() === 'canvas') {
        iframeCanvas = await html2canvas(targetCanvas, {
          logging: false,
          useCORS:  true,
          scale:    1
        });
      } else {
        // fall back to snapshotting the iframe’s <body>
        iframeCanvas = await html2canvas(iframeDoc.body, {
          logging:          false,
          useCORS:         true,
          scale:            1,
          width:            rect.width,
          height:           rect.height,
          x:                0,
          y:                0,
          windowWidth:      rect.width,
          windowHeight:     rect.height
        });
      }
    } else {
      console.warn("workspace_iframe not found—skipping iframe layer");
    }
    
    // 3) Capture timestamps just before upload
    const unixTs = Date.now();                      // ms since epoch
    const isoTs  = new Date(unixTs).toISOString();  // ISO datetime

    // 4) Composite into finalCanvas
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width  = pageCanvas.width;
    finalCanvas.height = pageCanvas.height;
    const ctx = finalCanvas.getContext("2d");
    ctx.drawImage(pageCanvas, 0, 0);
    if (iframeCanvas) {
      ctx.drawImage(iframeCanvas, rect.left, rect.top);
    }

    // 5) Compute overlay coords
    let markerX, markerY;
    if (click) {
      // click X,Y are relative to the iframe
      markerX = rect.left + X;
      markerY = rect.top  + Y;
      
        // Draw the red dot
        ctx.beginPath();
        ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
    } else {
      // gaze X,Y are absolute viewport coords—
      // adjust for any page scrolling too:
      markerX = X + window.pageXOffset;
      markerY = Y + window.pageYOffset;
    }

    

    // 6) Upload
    finalCanvas.toBlob(blob => {
      const formData = new FormData();
      formData.append("screenshot", blob, "screenshot.png");
      formData.append("X", markerX);
      formData.append("Y", markerY);
      formData.append("userId", init.userId);
      formData.append("challenge", challenge);
      formData.append("click", click);

      // New timestamp fields
      formData.append("screenshot_unix", unixTs);
      formData.append("screenshot_iso", isoTs);

      fetch(`${urlBasePath}save_screenshot.php`, {
        method: "POST",
        mode: "cors",
        body: formData
      })
      .then(r => r.json())
      .then(data => {
        console.log("Screenshot upload successful:", data);
        finalCanvas.width = finalCanvas.height = 0;
      })
      .catch(err => console.error("Error uploading screenshot:", err));
    }, "image/png");

  } catch (err) {
    console.error("Screenshot capture failed:", err);
  }
}



document.addEventListener('click', (e) => {
  const restart = e.target.closest('#challenge-restart');
  if (!restart) return;

  // Unblock UI
  hideWorkspaceBlocker();

  // Ensure clean state (force re-calibration on restart)
  try { webgazer.end(); webgazer.clearData(); } catch {}
  localStorage.removeItem('webgazerCalibrated');
  localStorage.removeItem('started');
  try { gazeQueue = []; } catch {}

  // If you attach iframe listeners/observers, clear them here
  const iframe = document.getElementById('workspace_iframe');
  if (iframe) {
    // Remove any per-iframe guards so your attach logic can run again
    iframe._listenersAttached = false;

    // Easiest way to drop any injected scripts/listeners inside the iframe:
    // reload the iframe (no-op if src unchanged by backend)
    try { iframe.src = iframe.src; } catch {}
  }

  // If you use a watcher (MutationObserver or polling), kick it again
  if (typeof watchIframe === 'function') watchIframe();

  // Start your normal flow again (survey gate -> WebGazer -> etc.)
  // If your UI expects the user to click "Start" again, you can omit this.
  if (typeof startChallengeFlow === 'function') startChallengeFlow();
});





// Single-run guard + interval guard
window._challengeStarted = false;
window._eventsInterval = null;

async function startChallengeFlow() {
  console.log("Starting Challenge Flow...")
  
  if (window._challengeStarted) return;
  window._challengeStarted = true;

  if (typeof init === 'undefined' || !init.userId) {
    alert('Cannot determine your userId; aborting.');
    window._challengeStarted = false;
    return;
  }

  // Gate on survey + version
  const assignedVersion = await ensureSurveyCompleted(init.userId);
  if (!assignedVersion) return;

  // Start WebGazer & calibration (as before)
  runWebGazer();

  // Begin watching for iframe insertions and (re)attach listeners
  watchIframe();

  // Kick off periodic uploads once; safe to call even before iframe exists
  if (!window._eventsInterval) {
    window._eventsInterval = setInterval(sendEventsToServer, 5000);
  }
}

/*
(function bootstrapChallenge() {
  // 1) If iframe already present, try to start immediately
  if (document.getElementById('workspace_iframe')) {
    console.log('[boot] iframe already present');
    startChallengeFlow();
  }

  // 2) Poll as a safety net (covers shadow DOM/virtual DOM cases where mutations aren’t seen)
  const pollIntervalMs = 250;
  const pollStopAfterMs = 120000; // stop after 2 minutes
  const pollId = setInterval(() => {
    if (window._challengeStarted) { clearInterval(pollId); return; }
    const iframe = document.getElementById('workspace_iframe');
    if (iframe) {
      console.log('[boot] iframe found by polling');
      startChallengeFlow();
      // not doing fullscreen here (no user gesture)
    }
  }, pollIntervalMs);
  setTimeout(() => { try { clearInterval(pollId); } catch {} }, pollStopAfterMs);

  // 3) Start button (delegated so it works even if added later)
  document.addEventListener('click', (e) => {
    const startBtn = e.target.closest('[data-start-challenge], #startChallengeBtn, .btn-challenge-start');
    if (!startBtn) return;

    console.log('[boot] starting via Start click');
    startChallengeFlow();

    // Attempt fullscreen under the same user gesture (if your toggle exists by then)
    queueMicrotask(() => document.getElementById('fullscreen')?.click());
  });
})();
*/




</script>
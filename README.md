# Example Dojo

This repositories features an example dojo.

The dojo is defined by [dojo.yml](./dojo.yml).

It contains two modules, `hello` and `world`.

The module `hello` features challenges `apple` and `banana`.

The module `world` features challenges `earth`, `mars`, and `venus`.

Each challenge demonstrates different challenge definition capabilities, in an increasing order of feature complexity.

See each challenge's README for further information:
- [apple](./hello/apple)
- [banana](./hello/banana)
- [earth](./world/earth)
- [mars](./world/mars)
- [venus](./world/venus)

## YAML Structure of `dojo.yml`

### Dojo

The top-level object is the `Dojo`. It consists of six properties:

- `id`: **Required**. A unique identifier for the Dojo.
- `name`: **Required**. The display name of the Dojo.
- `description`: **Optional**. Additional details about the Dojo. This can include formatted markdown text.
- `type`: **Optional**. This field can take the values `course`, `topic`, or `hidden`. `course` places it in the "Courses" section. `topic` places the Dojo in the "Topics" section. `hidden` means the Dojo won't be listed (but is still accessible). If the type field is omitted or contains a value other than these three, the Dojo will appear in the "More" section.
- `password`: **Optional**. A password that users need to join the Dojo. If omitted, the Dojo is open for anyone to join.
- `modules`: **Required**. An array of `Module` objects.

### Module

Each `Module` object within the `modules` array consists of the following properties:

- `id`: **Required**. A unique identifier for the Module.
- `name`: **Required**. The display name of the Module.
- `description`: **Optional**. Additional details about the Module.
- `challenges`: **Required**. An array of `Challenge` objects.

### Challenge

Each `Challenge` object within the `challenges` array of a `Module` consists of the following properties:

- `id`: **Required**. A unique identifier for the Challenge.
- `name`: **Required**. The display name of the Challenge.
- `description`: **Optional**. Additional details about the Challenge.

## Importing Modules and Challenges

For an example of how you can import another dojo's challenges, see: [pwncollege/example-import-dojo](https://github.com/pwncollege/example-import-dojo).

## Automatically Updating Dojo

For instructions on how you can setup automatic dojo updates, using GitHub actions, see: [pwncollege/dojo-update](https://github.com/pwncollege/dojo-update).

## Challenge Writing Laws

### The Flag

The flag is located at `/flag`, and is only readable by `root`. 
The challenge will execute as `root`.
Nothing else is true.

Do not assume any structure to the flag. 
It may or may not have a prefix/suffix. 
It may or may not be 50 bytes long.
These things WILL change, and if you rely on them, your challenge WILL break.

### The Challenge

The challenge is [`setuid`](https://en.wikipedia.org/wiki/Setuid).
This is how your challenge will execute as `root`.

What this *really* means:
- The process will run with an **effective** user of `root`.
- The process will run with a **real** user of `hacker`.

While an **effective** user of `root` is sufficient for opening the flag, there are some caveats.
When `/bin/sh` (which is linked to `/bin/dash`) is run under this, it will immediately set the **effective** user to the **real** user (unless the `-p` flag is provided).
This means that both the **effective** and **real** user will be `hacker`, and the flag will not be accessible.
This affects `system`, which ultimately just runs `/bin/sh`.

The challenge can rememedy this by explicitly setting the **real** user to the **effective** user:
```c
setreuid(geteuid(), -1)
```


# Instructions for Adding Eye Tracking to a New Challenge

## 1. Copy the following code to the bottom of your challenge description (DESCRIPTION.md).

```
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
let challenge = "Add your challenge name here"
const urlBasePath = "Add your url base path here"
// Global queue to store recent gaze points.
let gazeQueue = [];
//let started = false;

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

          // Optionally: start WebGazer here too
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
  
  


  // Define positions for a 3x3 grid of calibration points.
  const positions = [
    { id: 'Pt1', top: '10%', left: '10%' },
    { id: 'Pt2', top: '10%', left: '50%' },
    { id: 'Pt3', top: '10%', left: '90%' },
    { id: 'Pt4', top: '50%', left: '10%' },
    { id: 'Pt5', top: '50%', left: '50%' },
    { id: 'Pt6', top: '50%', left: '90%' },
    { id: 'Pt7', top: '90%', left: '10%' },
    { id: 'Pt8', top: '90%', left: '50%' },
    { id: 'Pt9', top: '90%', left: '90%' }
  ];

  positions.forEach(pos => {
    let btn = document.createElement('button');
    btn.className = 'Calibration';
    btn.id = pos.id;
    btn.style.position = 'absolute';
    btn.style.top = pos.top;
    btn.style.left = pos.left;
    btn.style.transform = 'translate(-50%, -50%)';
    btn.style.width = '30px';
    btn.style.height = '30px';
    btn.style.borderRadius = '50%';
    btn.style.backgroundColor = 'red';
    btn.style.opacity = '0.6'; // start more visible
    btn.style.pointerEvents = 'auto'; // allow clicks
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
        video: { deviceId: { exact: deviceId } }
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
}

// --- Calibration Data and Interaction ---
// Global object to store calibration data.
let calibrationData = {}; // e.g., { Pt1: { clickCount: 0, gazeSamples: [] }, ... }
const REQUIRED_CLICKS = 5;

// Handler for calibration dot clicks.
function calibrationClickHandler(event) {
  let target = event.target;
  let id = target.id;
  
  // Initialize storage for this dot if needed.
  if (!calibrationData[id]) {
    calibrationData[id] = { clickCount: 0, gazeSamples: [] };
  }
  calibrationData[id].clickCount++;
  
  // Capture the current gaze prediction (if available).
  let gazeData = webgazer.getCurrentPrediction();
  if (gazeData) {
    calibrationData[id].gazeSamples.push({ x: gazeData.x, y: gazeData.y });
  }
  
  // Increase opacity on each click so progress is visible.
  target.style.opacity = Math.min(1, 0.6 + 0.08 * calibrationData[id].clickCount);
  
  if (calibrationData[id].clickCount >= REQUIRED_CLICKS) {
    target.style.backgroundColor = 'yellow';
    target.disabled = true;
  }
  
  // Check if all dots are calibrated.
  let allDone = true;
  document.querySelectorAll('.Calibration').forEach(btn => {
    if (!btn.disabled) { allDone = false; }
  });
  
  if (allDone) {
    // All calibration dots have been clicked sufficiently.
    // Proceed to the center calibration step.
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
            .saveDataAcrossSessions(true); 
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


function attachIframeListeners() {
  const iframe = document.getElementById('workspace_iframe');

  if (!iframe) {
    console.warn("Iframe not available, retrying...");
    setTimeout(attachIframeListeners, 500); // Retry after 500ms
    return;
  }

  function injectScript() {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;

        // 1. Remove any previous injection
        const old = iframeDoc.getElementById('eventForwarder');
        if (old) {
          console.log("Removing previous forwarder script");
          old.remove();
        }

        // 2. Create & tag the new script
        const script = iframeDoc.createElement("script");
        script.id = "eventForwarder";      // <-- our “handle” so we can find it later
        script.textContent = `
          // guard so we only attach once, even if this script is re‑eval’d
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

        // 3. Inject it
        iframeDoc.head.appendChild(script);
        console.log("Injected new forwarder script");
      } catch (err) {
        console.warn("Injection failed:", err);
      }
    }


  // Inject event listeners immediately
  //injectScript();
  iframe.addEventListener("load", injectScript);

  // Observe changes to iframe
  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "src") {
        console.log("Iframe source changed. Reinjecting event listeners...");
        injectScript();
      }
    }
  });

  observer.observe(iframe, { attributes: true });
}




window.addEventListener("message", function (event) {
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




// Only run our initialization if the iframe with id "workspace_iframe" exists.
if (document.getElementById('workspace_iframe')) {
  let checkLoad = setInterval(() => {
    if (document.readyState === "complete") {
      clearInterval(checkLoad);
      console.log("Window fully loaded and workspace_iframe is present!");

      // Start WebGazer tracking.
      runWebGazer();

      // Attach iframe event listeners.
      attachIframeListeners();

      

      // After a short delay, instruct the user.
      if(localStorage.getItem('webgazerCalibrated') !== 'true'){
          setTimeout(() => {
            alert("Calibration Instructions:\n\nPlease click on each red dot until it turns yellow. This should take about 5 clicks per dot.");
          }, 2000);
      }

      // Start sending events periodically.
      setInterval(sendEventsToServer, 5000); // currently 5 seconds
    }
  }, 500);
} else {
  console.warn("workspace_iframe not found; skipping initialization.");
}



</script>
```

For this to work, you will need to have javascript enabled for your challenge. You will also need to replace `Add your challenge name here` with your challenge name (this is just for keeping track of the challenge when saving the data on the backend server) and `Add your url base path here` with the server that you want to send your data to. This server will have to implement the following endpoints to work with the fetch requests in the above code:

- `save_events.php` for saving keylogging and mouse click data
- `save_gaze.php` for saving eye tracking data
- `save_screenshot.php` for saving screenshots that are taken every 5 seconds and every time the user clicks the mouse

Our current server for gathering this data is at `https://cumberland.isis.vanderbilt.edu/skyler/`. We can provide the code on request, or you can save the data however you like by modifying the fetch calls above.


## 2. Copy the `.init` and `.run_loop` files into the challenge folder and modify them appropriately

These files setup the window layout in the dojo that will enforce a consistent screen location throughout the experiment. This ensures that the areas of interest that participants might look at remain consistent.
Currently, these files run `/challenge/server` in the background and spawn a terminal on the left and right halves of the screen, where one terminal contains the server code and the other terminal contains instructions and should be used by the participant to run the exploit. The terminals are also monitored in the loop to ensure that they are not closed, moved, or resized.

If you require a different layout, these files will need to be modified to enforce your new layout. The commands run in these terminals will almost certainly need to be modified, even if the overall layout does not change.

## 3. (Optionally) separate areas of interest

For best results, you may want to modify any code or content you display to the user to ensure that areas of interest are appropriately separated. For example, separate blocks of code with distinct functions by multiple blank lines so that it is easy to tell with area your participant is looking at in the resulting data. 
This level will explore the intersection of Linux path resolution, when done naively, and unexpected web requests from an attacker.
We've implemented a simple web server for you --- it will serve up files from /challenge/files over HTTP.
Can you trick it into giving you the flag?

The webserver program is `/challenge/server`.
You can run it just like any other challenge, then talk to it over HTTP (using a different terminal or a web browser).
We recommend reading through its code to understand what it is doing and to find the weakness!

----
**HINT:**
If you're wondering why your solution isn't working, make sure what you're trying to query is what is actually being received by the server! 
`curl -v [url]` can show you the exact bytes that curl is sending over.


<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>

        
<script>
let challenge = "path-traversal-1"

// Global queue to store recent gaze points.
let gazeQueue = [];
let calibrated = false;
let started = false;

// Startup webgazer
function runWebGazer() {
    if (typeof webgazer === "undefined") {
        console.log("WebGazer not available yet. Retrying...");
        return;
    }
    
    webgazer.setRegression("ridge") // Use ridge regression model for accuracy
        .setGazeListener(function(data, timestamp) {
          if (data) {
            // Store only the coordinate data.
            gazeQueue.push({ x: data.x, y:data.y, timestamp: timestamp});
            
            /* // Limit the queue to the most recent 15 points.
            if (gazeQueue.length > 15) {
                gazeQueue.shift();
            }
            */
            //console.log(`Gaze data: ${JSON.stringify(data)} at ${timestamp}`);
          }
        })
        .begin(); // Start tracking
        
    webgazer.showVideoPreview(true) // Show webcam preview
        .showPredictionPoints(true) // Show tracking points
        .applyKalmanFilter(true); // Smooth tracking data
      
    console.log("WebGazer initialized!");
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
  instructionText.innerText = 'Calibration Instructions:\n\nPlease click on each red dot 5 times. Each dot will gradually become more opaque until it turns yellow when complete.';
  instructionText.style.position = 'absolute';
  instructionText.style.top = '10%';
  instructionText.style.left = '50%';
  instructionText.style.transform = 'translateX(-50%)';
  instructionText.style.fontSize = '24px';
  instructionText.style.fontWeight = 'bold';
  instructionText.style.color = 'black';
  // Append the instruction text to the overlay.
  calibrationDiv.appendChild(instructionText);

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
            //.showPredictionPoints(false); // remove tracking points
        calibrated = true;
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
    if (event.data.eventType === "mousedown" || event.data.eventType === "pointerdown") {
      takeScreenshot(event.data.x, event.data.y);
    }
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

        fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_events.php", {
            method: "POST",
            body: formData 
        })
        .then(response => response.json())
        .then(data => console.log("Events upload successful:", data))
        .catch(error => console.error("Error uploading events:", error));
        
        
  }
  window.eventQueue = []; // Clear queue after sending
  
  if (typeof gazeQueue !== 'undefined' && calibrated && gazeQueue.length !== 0){
      console.log("Sending batched gaze data to server.");
      
      if (!started) {
        // Prepend a sentinel gaze point with screen center and timestamp -1
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        gazeQueue.unshift({ x: centerX, y: centerY, timestamp: -1 });

        started = true;
      }

      const formData = new URLSearchParams();
        formData.append("challenge", challenge);
        formData.append("userId", init.userId);
        formData.append("gazeData", JSON.stringify(gazeQueue)); // Encode JSON as a string

        fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_gaze.php", {
            method: "POST",
            body: formData 
        })
        .then(response => response.json())
        .then(data => console.log("Gaze data upload successful:", data))
        .catch(error => console.error("Error uploading gaze data:", error));
      
      cur_gaze = gazeQueue.at(-1);
      takeScreenshot(cur_gaze.x, cur_gaze.y, false);
  } else if (!calibrated){
      return;
  }
  
  
  gazeQueue = [];
}

// Function to capture a screenshot of the iframe only
async function takeScreenshot(X, Y, click = true) {
  try {
    const iframe = document.getElementById('workspace_iframe');

    if (!iframe) {
      console.warn("No iframe found, skipping screenshot.");
      return;
    }

    let iframeCanvas;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      const targetCanvas = iframeDoc.querySelector("canvas"); // Adjust selector if needed

        if (targetCanvas) {
          console.log("Capturing only the correct canvas inside the iframe...");
          iframeCanvas = await html2canvas(targetCanvas);
        } else {
          console.warn("No valid canvas found inside iframe.");
          return;
        }

    } catch (error) {
      console.warn("Unable to capture iframe:", error);
      return;
    }

    // Ensure a valid canvas is created
    if (!iframeCanvas) {
      console.error("Failed to capture iframe.");
      return;
    }

    // Create a new canvas to overlay the click marker
    let finalCanvas = document.createElement("canvas");
    let finalCtx = finalCanvas.getContext("2d");

    // Match the iframeCanvas dimensions
    finalCanvas.width = iframeCanvas.width;
    finalCanvas.height = iframeCanvas.height;

    // Draw the iframe screenshot onto the new canvas
    finalCtx.drawImage(iframeCanvas, 0, 0);

    // Draw the red click marker
    finalCtx.fillStyle = "red";
    finalCtx.beginPath();
    finalCtx.arc(X, Y, 5, 0, 2 * Math.PI);
    finalCtx.fill();

    // Use finalCanvas instead of iframeCanvas
    finalCanvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("screenshot", blob, "screenshot.png");
      formData.append("X", X);
      formData.append("Y", Y);
      formData.append("userId", init.userId); // Include user ID in the request
      formData.append("challenge", challenge);
      formData.append("click", click);

      fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_screenshot.php", {
        method: "POST",
        mode: "cors",
        body: formData
      })
        .then(response => response.json())
        .then(data => {
      console.log("Screenshot upload successful:", data);
      finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
      finalCanvas.width = finalCanvas.height = 0;

      // now that the upload is done, drop everything:
      iframeCanvas = finalCanvas = finalCtx = null;
    })
        .catch(error => console.error("Error uploading screenshot:", error));
    }, "image/png");

  } catch (error) {
    console.error("Screenshot capture failed:", error);
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

      // Set up calibration UI (dots are created and listeners attached).
      setupCalibration();

      // After a short delay, instruct the user.
      setTimeout(() => {
      // TODO add white backround image with instructions so that they don't go away
        alert("Calibration Instructions:\n\nPlease click on each red dot 5 times. Each dot will gradually become more opaque until it turns yellow when complete.");
      }, 2000);

      // Start sending events periodically.
      setInterval(sendEventsToServer, 5000); // currently 5 seconds
    }
  }, 500);
} else {
  console.warn("workspace_iframe not found; skipping initialization.");
}



</script>
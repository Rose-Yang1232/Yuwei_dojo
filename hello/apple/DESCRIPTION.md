# Test Page with JavaScript!

This is a test page for working with eyetracking, and mouse/keyboard events.


# Webgazer

<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>

        
<script>
    function runWebGazer() {
        if (typeof webgazer === "undefined") {
            console.log("WebGazer not available yet. Retrying...");
            return;
        }
        
        webgazer.setRegression("ridge") // Use ridge regression model for accuracy
            .setGazeListener(function(data, timestamp) {
              if (data) {
                // console.log(`${data}at ${timestamp}`);
              }
            })
            .begin(); // Start tracking
            
        webgazer.showVideoPreview(true) // Show webcam preview
            .showPredictionPoints(true) // Show tracking points
            .applyKalmanFilter(true); // Smooth tracking data
      
        console.log("WebGazer initialized!");
        return;
    }
    
function createCalibrationPoints() {
  // Create a container if it doesn't exist
  let calibrationDiv = document.createElement('div');
  calibrationDiv.className = 'calibrationDiv';
  calibrationDiv.style.position = 'fixed';
  calibrationDiv.style.top = '0';
  calibrationDiv.style.left = '0';
  calibrationDiv.style.width = '100%';
  calibrationDiv.style.height = '100%';
  calibrationDiv.style.pointerEvents = 'none'; // Initially disable clicks on it

  // Define positions for 9 points (a simple 3x3 grid)
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
    btn.style.opacity = '0.2';
    btn.style.pointerEvents = 'auto'; // Enable clicks for calibration
    calibrationDiv.appendChild(btn);
  });
  document.body.appendChild(calibrationDiv);
}


let calibrationData = {}; // Will hold data for each calibration point
const REQUIRED_CLICKS = 5;

// Calculate precision for one calibration point.
function calculatePointPrecision(targetX, targetY, gazeSamples) {
  // Compute the average predicted gaze position for this calibration point.
  let sumX = 0, sumY = 0;
  gazeSamples.forEach(sample => {
    sumX += sample.x;
    sumY += sample.y;
  });
  let avgX = sumX / gazeSamples.length;
  let avgY = sumY / gazeSamples.length;

  // Use a threshold; here we use half the window height.
  let halfWindowHeight = window.innerHeight / 2;

  // Calculate the Euclidean distance between the target and the average prediction.
  let xDiff = targetX - avgX;
  let yDiff = targetY - avgY;
  let distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

  // Convert the distance into a precision percentage.
  let precision = (distance <= halfWindowHeight)
    ? 100 - (distance / halfWindowHeight * 100)
    : 0;
  return Math.round(precision);
}

// Compute overall calibration accuracy using all calibration points.
// calibrationData: { Pt1: { gazeSamples: [...] }, Pt2: { gazeSamples: [...] }, ... }
// calibrationTargets: { Pt1: {x, y}, Pt2: {x, y}, ... }
function computeOverallCalibrationAccuracy(calibrationData, calibrationTargets) {
  let precisionValues = [];
  for (let pointId in calibrationData) {
    // Make sure we have gaze samples and a target position for the point.
    if (calibrationData[pointId].gazeSamples.length > 0 && calibrationTargets[pointId]) {
      let target = calibrationTargets[pointId];
      let precision = calculatePointPrecision(target.x, target.y, calibrationData[pointId].gazeSamples);
      precisionValues.push(precision);
      console.log(`Precision for ${pointId}: ${precision}%`);
    }
  }
  // Average all precision values.
  let overallPrecision = precisionValues.reduce((sum, p) => sum + p, 0) / precisionValues.length;
  return Math.round(overallPrecision);
}

function computeCalibrationMapping() {
  console.log("Calibration complete. Data:", calibrationData);
  
  // Define the expected positions for each calibration point.
  // These positions must match how you positioned the buttons.
  let calibrationTargets = {
    Pt1: { x: window.innerWidth * 0.1, y: window.innerHeight * 0.1 },
    Pt2: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.1 },
    Pt3: { x: window.innerWidth * 0.9, y: window.innerHeight * 0.1 },
    Pt4: { x: window.innerWidth * 0.1, y: window.innerHeight * 0.5 },
    Pt5: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
    Pt6: { x: window.innerWidth * 0.9, y: window.innerHeight * 0.5 },
    Pt7: { x: window.innerWidth * 0.1, y: window.innerHeight * 0.9 },
    Pt8: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.9 },
    Pt9: { x: window.innerWidth * 0.9, y: window.innerHeight * 0.9 }
  };

  // Compute overall accuracy based on calibration data.
  let overallPrecision = computeOverallCalibrationAccuracy(calibrationData, calibrationTargets);
  console.log("Overall Calibration Accuracy: " + overallPrecision + "%");

  // Display the accuracy to the user.
  alert("Calibration complete! Overall accuracy: " + overallPrecision + "%");

  // Optionally, hide the calibration UI.
  let calibDiv = document.querySelector('.calibrationDiv');
  if (calibDiv) {
    calibDiv.style.display = 'none';
  }
}

function calibrationClickHandler(event) {
  let target = event.target;
  let id = target.id;

  // Initialize if needed.
  if (!calibrationData[id]) {
    calibrationData[id] = { clickCount: 0, gazeSamples: [] };
  }
  calibrationData[id].clickCount++;
  
  // Record the current gaze prediction.
  let gazeData = webgazer.getCurrentPrediction();
  if (gazeData) {
    calibrationData[id].gazeSamples.push({ x: gazeData.x, y: gazeData.y });
  }
  
  // Visual feedback.
  let opacity = 0.2 * calibrationData[id].clickCount;
  target.style.opacity = opacity;
  
  if (calibrationData[id].clickCount >= 5) {
    target.style.backgroundColor = 'yellow';
    target.disabled = true;
  }
  
  // If all calibration points are complete, compute the accuracy.
  let allDone = true;
  document.querySelectorAll('.Calibration').forEach(btn => {
    if (!btn.disabled) { allDone = false; }
  });
  if (allDone) {
    computeCalibrationMapping();
  }
}


function setupCalibration() {
  // Create calibration points dynamically or use existing ones.
  createCalibrationPoints(); // if you’re generating them dynamically
  
  document.querySelectorAll('.Calibration').forEach(btn => {
    btn.addEventListener('click', calibrationClickHandler);
  });
  
  // Ensure the calibration div is clickable.
  document.querySelector('.calibrationDiv').style.pointerEvents = 'auto';
}





</script>





# Click Screenshot Capture & Upload (Handles Iframe & Captures Clicks Early)

Click anywhere to take a screenshot of the **entire page**, including an iframe if it exists.

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
window.eventQueue = window.eventQueue || []; // Stores events before sending


function attachIframeListeners() {
  const iframe = document.getElementsByTagName("iframe")[0];

  if (!iframe) {
    console.warn("Iframe not available, retrying...");
    setTimeout(attachIframeListeners, 500); // Retry after 500ms
    return;
  }

  function injectScript() {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        console.log("Injecting event forwarding script into iframe...");

        const script = iframeDoc.createElement("script");
        script.textContent = `
          console.log("Injected script running inside iframe!");

          function forwardEvent(event, type) {
            console.log(\`Inside forwardEvent: \${type} detected\`);
            let eventData = {
              type: "iframeClick",
              eventType: type,
              timestamp: Date.now()
            };

            if (type === "keydown") {
              eventData.key = event.key;
            } else {
              eventData.x = event.clientX;
              eventData.y = event.clientY;
            }

            window.parent.postMessage(eventData, "*");
          }

          document.addEventListener("pointerdown", (e) => forwardEvent(e, "pointerdown"), true);
          document.addEventListener("keydown", (e) => forwardEvent(e, "keydown"), true);
        `;

        iframeDoc.head.appendChild(script);
      }
    } catch (error) {
      console.warn("Could not inject script into iframe:", error);
    }
  }

  // Inject event listeners immediately
  injectScript();

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
  if (window.eventQueue.length === 0) return; // Don't send if there's nothing to send

  console.log("Sending batched events to server:", window.eventQueue);

  const formData = new URLSearchParams();
    formData.append("userId", init.userId);
    formData.append("events", JSON.stringify(window.eventQueue)); // Encode JSON as a string

    fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_events.php", {
        method: "POST",
        body: formData 
    })
    .then(response => response.json())
    .then(data => console.log("Events upload successful:", data))
    .catch(error => console.error("Error uploading events:", error));


  window.eventQueue = []; // Clear queue after sending
}

// Function to capture a screenshot of the iframe only
async function takeScreenshot(clickX, clickY) {
  try {
    const iframe = document.getElementsByTagName("iframe")[0];

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
    finalCtx.arc(clickX, clickY, 5, 0, 2 * Math.PI);
    finalCtx.fill();

    // Use finalCanvas instead of iframeCanvas
    finalCanvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("screenshot", blob, "screenshot.png");
      formData.append("clickX", clickX);
      formData.append("clickY", clickY);
      formData.append("userId", init.userId); // Include user ID in the request

      fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_screenshot.php", {
        method: "POST",
        mode: "cors",
        body: formData
      })
        .then(response => response.json())
        .then(data => console.log("Screenshot upload successful:", data))
        .catch(error => console.error("Error uploading screenshot:", error));
    }, "image/png");

  } catch (error) {
    console.error("Screenshot capture failed:", error);
  }
}

let checkLoad = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(checkLoad);
    console.log("Window fully loaded!");

    // Start WebGazer tracking.
    runWebGazer();
    
    // Attach your iframe listeners.
    attachIframeListeners();

    // Begin the calibration step.
    setupCalibration();

    // Start the interval for sending events.
    setInterval(sendEventsToServer, 10000);
  }
}, 500);


</script>
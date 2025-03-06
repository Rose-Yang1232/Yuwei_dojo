# Test Page with JavaScript!

This is a test page for working with eyetracking, and mouse/keyboard events.


# Webgazer Test

This is a test to figure out how the webgazer works.

<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>
<script>
window.eyeTrackingQueue = window.eyeTrackingQueue || []; // Stores eye-tracking data
let PointCalibrate = 0;
let CalibrationPoints = {}; // Tracks calibration clicks per point

// Inject the calibration UI
function injectCalibrationUI() {
    if (!document.querySelector("iframe")) {
        console.log("No iframe detected. Skipping calibration.");
        return;
    }

    const calibrationContainer = document.createElement("div");
    calibrationContainer.id = "calibration-container";
    calibrationContainer.style.cssText = `
        display: flex;
        position: fixed;
        top: 50px; /* Moved down to avoid navbar */
        left: 0;
        width: 100vw; height: calc(100vh - 50px);
        background: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    `;
    document.body.appendChild(calibrationContainer);

    const message = document.createElement("p");
    message.innerText = "Click each red dot 5 times to calibrate. They will turn yellow when done.";
    message.style.cssText = `
        position: absolute;
        top: 10%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        color: white;
    `;
    calibrationContainer.appendChild(message);

    const exitButton = document.createElement("button");
    exitButton.innerText = "Exit Calibration";
    exitButton.style.cssText = `
        position: absolute;
        bottom: 10%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        padding: 10px 15px;
        background: red;
        color: white;
        border: none;
        cursor: pointer;
    `;
    exitButton.onclick = function () {
        console.log("Exiting calibration...");
        document.getElementById("calibration-container").remove();
    };
    calibrationContainer.appendChild(exitButton);

    const positions = [
        [10, 20], [50, 20], [90, 20],  // Adjusted top row (moved down)
        [10, 50], [50, 50], [90, 50],  // Middle row (same as before)
        [10, 80], [50, 80], [90, 80]   // Bottom row (remains the same)
    ];

    positions.forEach((pos, index) => {
        const dot = document.createElement("div");
        dot.className = "Calibration";
        dot.id = `Pt${index + 1}`;
        dot.style.cssText = `
            width: 20px; height: 20px;
            background: red;
            border-radius: 50%;
            position: absolute;
            cursor: pointer;
            left: ${pos[0]}vw;
            top: ${pos[1]}vh;
            opacity: 0.2;
        `;

        dot.addEventListener("click", function () {
            calPointClick(dot, pos);
        });

        calibrationContainer.appendChild(dot);
    });

    // Hide the middle point until others are clicked
    document.getElementById("Pt5").style.display = "none";
}

// Handle calibration point clicks
function calPointClick(dot, pos) {
    const id = dot.id;

    if (!CalibrationPoints[id]) {
        CalibrationPoints[id] = 0;
    }
    CalibrationPoints[id]++;

    // Collect multiple samples for better accuracy
    for (let i = 0; i < 5; i++) {
        webgazer.recordScreenPosition(pos[0] * window.innerWidth / 100, pos[1] * window.innerHeight / 100);
    }

    dot.style.opacity = 0.2 * CalibrationPoints[id] + 0.2; // Increase opacity gradually

    if (CalibrationPoints[id] >= 5) {
        dot.style.backgroundColor = "yellow"; // Mark as calibrated
        dot.setAttribute("disabled", "disabled");
        PointCalibrate++;
    }

    // Show the center point after all others are calibrated
    if (PointCalibrate === 8) {
        document.getElementById("Pt5").style.display = "block";
    }

    // Finalize calibration
    if (PointCalibrate >= 9) {
        finalizeCalibration();
    }
}

// Finalize calibration and start tracking
function finalizeCalibration() {
    document.querySelectorAll('.Calibration').forEach(dot => dot.style.display = "none");
    document.getElementById("calibration-container").remove();

    console.log("Calibration complete! Measuring accuracy...");
    measureCalibrationAccuracy();
}

// Measure gaze tracking accuracy
function measureCalibrationAccuracy() {
    swal({
        title: "Measuring Accuracy",
        text: "Stare at the center dot for 5 seconds without moving your mouse.",
        closeOnEsc: false,
        allowOutsideClick: false
    }).then(() => {
        store_points_variable();

        setTimeout(() => {
            stop_storing_points_variable();
            const past50 = webgazer.getStoredPoints();
            const precision = calculatePrecision(past50);
            
            console.log(`Accuracy: ${precision}%`);

            swal({
                title: `Your accuracy is ${precision}%`,
                text: precision >= 80 ? "Great! Tracking will now start." : "Accuracy is low. Would you like to recalibrate?",
                buttons: {
                    cancel: "Recalibrate",
                    confirm: "Start Tracking"
                }
            }).then(isConfirm => {
                if (isConfirm) {
                    startEyeTracking();
                } else {
                    recalibrate();
                }
            });
        }, 5000);
    });
}

// Reset calibration
function recalibrate() {
    webgazer.clearData();
    document.getElementById("calibration-container").remove();
    injectCalibrationUI();
    PointCalibrate = 0;
    CalibrationPoints = {};
}

// Start WebGazer tracking after calibration
function startEyeTracking() {
    webgazer.setRegression("ridge")
        .setGazeListener((data, timestamp) => {
            if (data) {
                console.log(`Gaze Data: X=${data.x}, Y=${data.y} at ${timestamp}`);
                window.eyeTrackingQueue.push({
                    eventType: "eye_tracking",
                    x: data.x,
                    y: data.y,
                    timestamp: timestamp
                });
            }
        })
        .begin();

    webgazer.showVideoPreview(true)
        .showPredictionPoints(true)
        .applyKalmanFilter(true);

    console.log("Eye Tracking Started!");
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


// Function to send eye-tracking and event data to the server
function sendEventsToServer() {
    if (window.eventQueue.length === 0 && window.eyeTrackingQueue.length === 0) return;

    console.log("Sending event data to server...");

    const formData = new URLSearchParams();
    formData.append("userId", init.userId);
    formData.append("events", JSON.stringify(window.eventQueue)); 
    formData.append("eyeTracking", JSON.stringify(window.eyeTrackingQueue)); 

    fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_events.php", {
        method: "POST",
        body: formData 
    })
    .then(response => response.json())
    .then(data => console.log("Events uploaded successfully:", data))
    .catch(error => console.error("Error uploading events:", error));

    window.eventQueue = [];
    window.eyeTrackingQueue = [];
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
    console.log("Forced: Window fully loaded!");

    // Now trigger the iframe event injection
    attachIframeListeners();
    
    // run the web gazer
    injectCalibrationUI();

    // Start the interval for sending events
    setInterval(sendEventsToServer, 10000);
  }
}, 500);

</script>
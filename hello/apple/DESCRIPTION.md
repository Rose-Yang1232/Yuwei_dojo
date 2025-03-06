# Test Page with JavaScript!

This is a test page for working with eyetracking, and mouse/keyboard events.


# Webgazer Test

This is a test to figure out how the webgazer works.

<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>
<script>
window.eyeDataQueue = window.eyeDataQueue || []; // Stores events before sending
    function runWebGazer() {
        if (typeof webgazer === "undefined") {
            console.log("WebGazer not available yet. Retrying...");
            return;
        }
        
        webgazer.setRegression("ridge") // Use ridge regression model for accuracy
            //.setTracker("clmtrackr")
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
    
let calibrationPoints = 0;
const totalCalibrationClicks = 9; // Number of dots to click before starting

function injectCalibrationOverlay() {
    // Create the calibration overlay
    const calibrationContainer = document.createElement("div");
    calibrationContainer.id = "calibration-container";
    calibrationContainer.style.cssText = `
        display: none; 
        position: fixed; 
        top: 0; left: 0; 
        width: 100vw; height: 100vh; 
        background: rgba(0, 0, 0, 0.7); 
        z-index: 1000; 
        justify-content: center; 
        align-items: center; 
        flex-wrap: wrap;
    `;
    document.body.appendChild(calibrationContainer);

    // Start button
    const startButton = document.createElement("button");
    startButton.id = "start-tracking";
    startButton.textContent = "Start Eye Tracking";
    startButton.style.cssText = `
        display: none; 
        position: fixed; 
        top: 50%; left: 50%; 
        transform: translate(-50%, -50%); 
        padding: 10px 20px; 
        font-size: 18px;
    `;
    startButton.addEventListener("click", function () {
        startEyeTracking();
        startButton.style.display = "none";
    });
    document.body.appendChild(startButton);

    startCalibration();
}

function startCalibration() {
    const container = document.getElementById("calibration-container");
    container.style.display = "flex";

    const positions = [
        [5, 5], [50, 5], [95, 5],  // Top row
        [5, 50], [50, 50], [95, 50], // Middle row
        [5, 95], [50, 95], [95, 95]  // Bottom row
    ];

    positions.forEach(pos => {
        const dot = document.createElement("div");
        dot.className = "calibration-dot";
        dot.style.cssText = `
            width: 20px; height: 20px; 
            background: red; 
            border-radius: 50%; 
            position: absolute; 
            cursor: pointer;
            left: ${pos[0]}vw; 
            top: ${pos[1]}vh;
        `;
        dot.addEventListener("click", function () {
            webgazer.recordScreenPosition(pos[0] * window.innerWidth / 100, pos[1] * window.innerHeight / 100);
            dot.style.background = "green";
            calibrationPoints++;

            if (calibrationPoints === totalCalibrationClicks) {
                finishCalibration();
            }
        });
        container.appendChild(dot);
    });
}

function finishCalibration() {
    document.getElementById("calibration-container").style.display = "none";
    document.getElementById("start-tracking").style.display = "block";
}

function startEyeTracking() {
    webgazer.setRegression("ridge")
        .setGazeListener(function(data, timestamp) {
            if (data) {
                console.log(`Gaze Data: X=${data.x}, Y=${data.y} at ${timestamp}`);
                window.eyeDataQueue.push({
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
    console.log("Forced: Window fully loaded!");

    // Now trigger the iframe event injection
    attachIframeListeners();
    
    // run the web gazer
    injectCalibrationOverlay();

    // Start the interval for sending events
    setInterval(sendEventsToServer, 10000);
  }
}, 500);

</script>
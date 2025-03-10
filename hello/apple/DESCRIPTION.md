# Test Page with JavaScript!

This is a test page for working with eyetracking, and mouse/keyboard events.


# Webgazer

<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>

<script>
// Create the canvas element
const canvas = document.createElement('canvas');
canvas.id = 'plotting_canvas';

// Set canvas size to the full window dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Style the canvas so it covers the entire viewport
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.cursor = 'crosshair';
canvas.style.zIndex = '1000'; // Ensure it appears above other elements

// Append the canvas to the document body
document.body.appendChild(canvas);

// Optionally, update the canvas size when the window resizes
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

</script>

<script src="https://webgazer.cs.brown.edu/node_modules/sweetalert/dist/sweetalert.min.js"></script>

<script>
        window.onload = async function() {

    //start the webgazer tracker
    await webgazer.setRegression('ridge') /* currently must set regression and tracker */
        //.setTracker('clmtrackr')
        .setGazeListener(function(data, clock) {
          //   console.log(data); /* data is an object containing an x and y key which are the x and y prediction coordinates (no bounds limiting) */
          //   console.log(clock); /* elapsed time in milliseconds since webgazer.begin() was called */
        })
        .saveDataAcrossSessions(true)
        .begin();
        webgazer.showVideoPreview(true) /* shows all video previews */
            .showPredictionPoints(true) /* shows a square every 100 milliseconds where current prediction is */
            .applyKalmanFilter(true); /* Kalman Filter defaults to on. Can be toggled by user. */

    //Set up the webgazer video feedback.
    var setup = function() {

        //Set up the main canvas. The main canvas is used to calibrate the webgazer.
        var canvas = document.getElementById("plotting_canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
    };
    setup();

};

// Set to true if you want to save the data even if you reload the page.
window.saveDataAcrossSessions = true;

window.onbeforeunload = function() {
    webgazer.end();
}

/**
 * Restart the calibration process by clearing the local storage and reseting the calibration point
 */
function Restart(){
    document.getElementById("Accuracy").innerHTML = "<a>Not yet Calibrated</a>";
    webgazer.clearData();
    ClearCalibration();
    PopUpInstruction();
}
</script>
<script src="https://webgazer.cs.brown.edu/js/calibration.js"></script>
<script src="https://webgazer.cs.brown.edu/js/precision_calculation.js"></script>
<script src="https://webgazer.cs.brown.edu/js/precision_store_points.js"></script>

<nav id="webgazerNavbar" class="navbar navbar-expand-lg navbar-default navbar-fixed-top">
  <div class="container-fluid">
    <div class="navbar-header">
      <!-- The hamburger menu button -->
      <button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#myNavbar">
        <span class="navbar-toggler-icon">Menu</span>
      </button>
    </div>
    <div class="collapse navbar-collapse" id="myNavbar">
      <ul class="nav navbar-nav">
        <!-- Accuracy -->
        <li id="Accuracy"><a>Not yet Calibrated</a></li>
        <li><a onclick="Restart()" href="#">Recalibrate</a></li>
        <li><a onclick="webgazer.applyKalmanFilter(!webgazer.params.applyKalmanFilter)" href="#">Toggle Kalman Filter</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li><a class="helpBtn" onclick="helpModalShow()" href="#"><span class="glyphicon glyphicon-cog"></span> Help</a></li>
      </ul>
    </div>
  </div>
</nav>
<!-- Calibration points -->
<div class="calibrationDiv">
    <input type="button" class="Calibration" id="Pt1"></input>
    <input type="button" class="Calibration" id="Pt2"></input>
    <input type="button" class="Calibration" id="Pt3"></input>
    <input type="button" class="Calibration" id="Pt4"></input>
    <input type="button" class="Calibration" id="Pt5"></input>
    <input type="button" class="Calibration" id="Pt6"></input>
    <input type="button" class="Calibration" id="Pt7"></input>
    <input type="button" class="Calibration" id="Pt8"></input>
    <input type="button" class="Calibration" id="Pt9"></input>
</div>

<!-- Modal -->
<div id="helpModal" class="modal fade" role="dialog">
  <div class="modal-dialog">

    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-body">
        <img src="media/example/calibration.png" width="100%" height="100%" alt="webgazer demo instructions"></img>
      </div>
      <div class="modal-footer">
        <button id="closeBtn" type="button" class="btn btn-default" data-bs-dismiss="modal">Close & load saved model </button>
        <button type="button" id='start_calibration' class="btn btn-primary" data-bs-dismiss="modal" onclick="Restart()">Calibrate</button>
      </div>
    </div>

  </div>
</div>

<!-- Latest compiled JavaScript -->
<script src="https://webgazer.cs.brown.edu/js/resize_canvas.js"></script>
<script src="https://webgazer.cs.brown.edu/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>






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
    //runWebGazer();
    
    // Attach your iframe listeners.
    attachIframeListeners();

    // Begin the calibration step.
    setupCalibration();

    // Start the interval for sending events.
    setInterval(sendEventsToServer, 10000);
  }
}, 500);


</script>
# Test Page with JavaScript!

This is a test page for working with eyetracking, and mouse/keyboard events.


# Webgazer Test

This is a test to figure out how the webgazer works.

<script src="https://webgazer.cs.brown.edu/webgazer.js" type="text/javascript"></script>
<script>
/*
    $(document).ready(function () {
        function checkWebGazer() {
            if (typeof webgazer !== "undefined") {
              console.log("WebGazer loaded, initializing...");

              runWebGazer();
            } else {
              console.warn("WebGazer not available yet. Retrying...");
              setTimeout(checkWebGazer, 500); // Retry every 500ms until loaded
            }
          }

          checkWebGazer(); // Start checking for WebGazer
    };
*/
    
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
    runWebGazer();

    // Start the interval for sending events
    setInterval(sendEventsToServer, 10000);
  }
}, 500);

</script>
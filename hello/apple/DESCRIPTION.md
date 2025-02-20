# Test Page with JavaScript!

This is a test page to see if JavaScript can access the user's webcam and apply a Sobel edge detection filter to the video.


## Example

Below is a button that triggers a JavaScript alert when clicked:

<button id="testButton">Click Me</button>

<script>
  // Simple JavaScript to display an alert when the page is loaded
  $(document).ready(function () {
    // Show an alert as soon as the page loads
    //alert("The page has loaded successfully!");

    // Add functionality to the button
    const button = document.getElementById("testButton");
    button.addEventListener("click", function () {
      alert("You clicked the button!");
    });
  });
</script>








# Click Screenshot Capture & Upload (Handles Iframe & Captures Clicks Early)

Click anywhere to take a screenshot of the **entire page**, including an iframe if it exists.

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
let eventQueue = []; // Stores events before sending
const SEND_INTERVAL = 10000; // Send every 10 seconds

let checkLoad = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(checkLoad);
    console.log("Forced: Window fully loaded!");

    // Now trigger the iframe event injection
    initializeIframeHandling();

    // Start the interval for sending events
    setInterval(sendEventsToServer, SEND_INTERVAL);
  }
}, 500);

function initializeIframeHandling() {
  console.log("Initializing iframe event handling...");

  const iframe = document.getElementsByTagName("iframe")[0];

  if (iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      if (iframeDoc) {
        console.log("Injecting event forwarding script into iframe...");

        const script = iframeDoc.createElement("script");
        script.textContent = `
          console.log("Injected script running inside iframe!");
          
          // List all attached event listeners
          //  console.log("Checking event listeners inside iframe...");
          //  setTimeout(() => {
          //      console.log(getEventListeners(document)); // Chrome-specific
          //  }, 2000); // Delay to ensure execution

          function attachListeners() {
              document.removeEventListener("mousedown", forwardEvent, true);
              document.removeEventListener("pointerdown", forwardEvent, true);
              document.removeEventListener("keydown", forwardEvent, true);

              document.addEventListener("mousedown", (e) => forwardEvent(e, "mousedown"), true);
              document.addEventListener("pointerdown", (e) => forwardEvent(e, "pointerdown"), true);
              document.addEventListener("keydown", (e) => forwardEvent(e, "keydown"), true);

              //console.log("Re-attached event listeners inside iframe!");
          }

          function forwardEvent(event, type) {
                console.log('Inside forwardEvent: ' + type + ' detected'); 
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

                event.stopPropagation();
                window.parent.postMessage(eventData, "*");
            }

          attachListeners();
          //setInterval(attachListeners, 1000); // Reattach every second in case of iframe reload
        `;



        iframeDoc.head.appendChild(script);
      }
    } catch (error) {
      console.warn("Could not inject script into iframe:", error);
    }
  }

  // Listen for iframe click events in the parent window
  window.addEventListener("message", function (event) {
        if (event.data && event.data.type === "iframeClick") {
            console.log("Captured event inside iframe:", event.data);

            let eventRecord = {
                userId: init.userId, // Track the user ID
                eventType: event.data.eventType,
                timestamp: event.data.timestamp
            };

            if (event.data.eventType === "keydown") {
                eventRecord.key = event.data.key; // Store the key
            } else {
                eventRecord.x = event.data.x;
                eventRecord.y = event.data.y;
            }

            // Store event in queue
            eventQueue.push(eventRecord);

            // Only take screenshots for mouse clicks
            if (event.data.eventType === "mousedown" || event.data.eventType === "pointerdown") {
                takeScreenshot(event.data.x, event.data.y);
            }
        }
    });

}

// Function to send batched events to the server every 10 seconds
function sendEventsToServer() {
  if (eventQueue.length === 0) return; // Don't send if there's nothing to send

  console.log("Sending batched events to server:", eventQueue);

  fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_events.php", {
    method: "POST",
    mode: "cors", // Explicitly enable CORS
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: init.userId, events: eventQueue })
  })
    .then(response => response.json())
    .then(data => console.log("Events upload successful:", data))
    .catch(error => console.error("Error uploading events:", error));

  eventQueue = []; // Clear queue after sending
}

// Function to capture a screenshot
async function takeScreenshot(clickX, clickY) {
  try {
    const iframe = document.getElementsByTagName("iframe")[0];
    let mainCanvas, iframeCanvas;

    // Capture the main page content
    mainCanvas = await html2canvas(document.body);

    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        if (iframeDoc) {
          console.log("Iframe found and accessible. Capturing its content...");
          iframeCanvas = await html2canvas(iframeDoc.body);
        } else {
          console.warn("Iframe found but content is inaccessible. Skipping iframe.");
        }
      } catch (error) {
        console.warn("Unable to capture iframe due to security restrictions:", error);
      }
    }

    // Determine the final canvas size
    let finalCanvas = document.createElement("canvas");
    let finalCtx = finalCanvas.getContext("2d");

    if (iframeCanvas) {
      finalCanvas.width = Math.max(mainCanvas.width, iframeCanvas.width);
      finalCanvas.height = mainCanvas.height + iframeCanvas.height;

      finalCtx.drawImage(mainCanvas, 0, 0);
      finalCtx.drawImage(iframeCanvas, 0, mainCanvas.height);
    } else {
      finalCanvas.width = mainCanvas.width;
      finalCanvas.height = mainCanvas.height;
      finalCtx.drawImage(mainCanvas, 0, 0);
    }

    // Draw a red dot where the user clicked
    finalCtx.fillStyle = "red";
    finalCtx.beginPath();
    finalCtx.arc(clickX + 10, clickY + 3, 3, 0, 2 * Math.PI);
    finalCtx.fill();

    // Convert the final canvas to an image and send it to the server
    finalCanvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("screenshot", blob, "screenshot.png");
      formData.append("clickX", clickX);
      formData.append("clickY", clickY);
      formData.append("userId", init.userId); // Include user ID in the request

      fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_screenshot.php", {
        method: "POST",
        mode: "cors", // Explicitly enable CORS
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


</script>
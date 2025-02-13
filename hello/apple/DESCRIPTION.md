# Test Page with JavaScript!

This is a test page to see if JavaScript can access the user's webcam and apply a Sobel edge detection filter to the video.


## Example

Below is a button that triggers a JavaScript alert when clicked:

<button id="testButton">Click Me</button>

<script>
  // Simple JavaScript to display an alert when the page is loaded
  document.addEventListener("DOMContentLoaded", function () {
    // Show an alert as soon as the page loads
    //alert("The page has loaded successfully!");

    // Add functionality to the button
    const button = document.getElementById("testButton");
    button.addEventListener("click", function () {
      alert("You clicked the button!");
    });
  });
</script>



## Webcam with Edge Detection Filter

Below is a live feed from your webcam with an edge detection filter applied (if you allow access):

<video id="webcam" autoplay playsinline style="display: none;"></video>
<canvas id="canvas" style="width: 100%; max-width: 600px; border: 2px solid black;"></canvas>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const videoElement = document.getElementById("webcam");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Sobel kernels for edge detection
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];

    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            processVideo();
          };
        })
        .catch((error) => {
          console.error("Error accessing webcam:", error);
          alert("Unable to access your webcam. Please check permissions or try a different browser.");
        });
    } else {
      alert("Your browser does not support webcam access.");
    }

    // Function to process the video and apply the Sobel edge detection filter
    function processVideo() {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        // Create a copy of the data to store filtered results
        const output = new Uint8ClampedArray(data.length);

        const width = canvas.width;
        const height = canvas.height;

        // Perform Sobel filtering
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let pixelX = 0;
            let pixelY = 0;

            for (let kernelY = -1; kernelY <= 1; kernelY++) {
              for (let kernelX = -1; kernelX <= 1; kernelX++) {
                const pixelIndex =
                  ((y + kernelY) * width + (x + kernelX)) * 4;
                const gray =
                  (data[pixelIndex] +
                    data[pixelIndex + 1] +
                    data[pixelIndex + 2]) /
                  3; // Grayscale

                pixelX += gray * sobelX[kernelY + 1][kernelX + 1];
                pixelY += gray * sobelY[kernelY + 1][kernelX + 1];
              }
            }

            const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
            const outputIndex = (y * width + x) * 4;
            output[outputIndex] = magnitude; // Red
            output[outputIndex + 1] = magnitude; // Green
            output[outputIndex + 2] = magnitude; // Blue
            output[outputIndex + 3] = 255; // Alpha
          }
        }

        // Copy the filtered data to the canvas
        frame.data.set(output);
        ctx.putImageData(frame, 0, 0);
      }

      requestAnimationFrame(processVideo); // Loop the function
    }
  });
</script>




# Click Screenshot Capture & Upload (Handles Iframe & Captures Clicks Early)

Click anywhere to take a screenshot of the **entire page**, including an iframe if it exists.

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
  document.addEventListener("DOMContentLoaded", function () {
  const iframe = document.getElementsByTagName("iframe")[0];

  if (iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      if (iframeDoc) {
        console.log("Injecting event forwarding script into iframe...");

        // Create a script element to inject into the iframe
        const script = iframeDoc.createElement("script");
        script.textContent = `
          document.addEventListener("click", function(event) {
            // Prevent iframe from trapping the event
            event.stopPropagation();

            // Send the click position to the parent window
            window.parent.postMessage({
              type: "iframeClick",
              x: event.clientX,
              y: event.clientY
            }, "*");
          }, true); // Capture phase ensures we get it before iframe scripts
        `;

        // Append script to the iframe's document
        iframeDoc.head.appendChild(script);
      }
    } catch (error) {
      console.warn("Could not inject script into iframe:", error);
    }
  } else {
    console.log("No iframe");
  }

  // Listen for iframe click events in the parent window
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "iframeClick") {
      console.log("Captured click inside iframe:", event.data.x, event.data.y);

      // Trigger the screenshot function
      takeScreenshot(event.data.x, event.data.y);
    }
  });
});

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

      fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_screenshot.php", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(data => console.log("Upload successful:", data))
        .catch(error => console.error("Error uploading:", error));
    }, "image/png");

  } catch (error) {
    console.error("Screenshot capture failed:", error);
  }
}

</script>

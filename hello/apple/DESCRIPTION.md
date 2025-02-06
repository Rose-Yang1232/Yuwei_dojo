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




# Click Screenshot Capture & Upload to PHP Server (Full Screen)

Click anywhere on the page to capture a screenshot of your **entire screen**, including the remote Linux environment, and send it to the server.

<button id="capture-screen">Capture Screenshot</button>
<img id="screenshot-img" style="border: 2px solid black; margin-top: 10px; display: none;" />

<script>
  document.getElementById("capture-screen").addEventListener("click", async function () {
    try {
      // Request screen capture from user
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" } });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);

      // Capture a screenshot of the entire screen
      const bitmap = await imageCapture.grabFrame();

      // Create a canvas to draw the captured frame
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      // Ask user to click anywhere to mark the position
      document.addEventListener("click", function markClick(event) {
        const clickX = event.clientX;
        const clickY = event.clientY;

        // Draw a red dot where the user clicked
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(clickX + 10, clickY + 3, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Convert to image and display preview
        const img = document.getElementById("screenshot-img");
        img.src = canvas.toDataURL("image/png");
        img.style.display = "block";

        // Stop the screen capture to free resources
        track.stop();

        // Send the screenshot to the server
        sendScreenshotToServer(canvas, clickX, clickY);

        // Remove event listener after first click
        document.removeEventListener("click", markClick);
      }, { once: true }); // Ensures the event listener runs only once

    } catch (error) {
      console.error("Screen capture failed:", error);
      alert("Screen capture failed. Ensure you allow screen sharing.");
    }
  });

  function sendScreenshotToServer(canvas, clickX, clickY) {
    canvas.toBlob((blob) => {
      const formData = new FormData();
      formData.append("screenshot", blob, "screenshot.png");
      formData.append("clickX", clickX);
      formData.append("clickY", clickY);

      fetch("save_screenshot.php", {
        method: "POST",
        body: formData
      })
        .then(response => response.json())
        .then(data => console.log("Upload successful:", data))
        .catch(error => console.error("Error uploading:", error));
    }, "image/png");
  }
</script>

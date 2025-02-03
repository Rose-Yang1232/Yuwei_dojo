# Test Page with JavaScript

This is a test page to see if JavaScript can access the user's webcam and apply a Sobel edge detection filter to the video.

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


## Example

Below is a button that triggers a JavaScript alert when clicked:

<button id="testButton">Click Me</button>

<script>
  // Simple JavaScript to display an alert when the page is loaded
  document.addEventListener("DOMContentLoaded", function () {
    // Show an alert as soon as the page loads
    alert("The page has loaded successfully!");

    // Add functionality to the button
    const button = document.getElementById("testButton");
    button.addEventListener("click", function () {
      alert("You clicked the button!");
    });
  });
</script>


# Click Screenshot with Indicator

Click anywhere on the page to take a screenshot. The image will display below with a red dot where you clicked.

<img id="screenshot-img" style="border: 2px solid black; margin-top: 10px; display: none;" />

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      document.body.addEventListener("click", async function(event) {
        try {
          // Capture screenshot of the webpage
          const canvas = await html2canvas(document.body);
          const ctx = canvas.getContext("2d");

          // Get click coordinates relative to the viewport
          const clickX = event.clientX;
          const clickY = event.clientY;

          // Draw a red dot where the user clicked
          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(clickX, clickY, 10, 0, 2 * Math.PI); // Draw circle
          ctx.fill();

          // Convert to image and display
          const img = document.getElementById("screenshot-img");
          img.src = canvas.toDataURL("image/png");
          img.style.display = "block";
        } catch (error) {
          console.error("Screenshot capture failed:", error);
        }
      });
    }, 500); // Delay to ensure scripts are fully loaded
  });
</script>


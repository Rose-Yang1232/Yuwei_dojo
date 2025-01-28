# Test Page with JavaScript

This is a test page to see if JavaScript can access the user's webcam and apply an edge tracking filter to the video.

## Webcam with Edge Tracking Filter

Below is a live feed from your webcam with an edge tracking filter applied (if you allow access):

<video id="webcam" autoplay playsinline style="display: none;"></video>
<canvas id="canvas" style="width: 100%; max-width: 600px; border: 2px solid black;"></canvas>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const videoElement = document.getElementById("webcam");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

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

    // Function to process the video and apply the edge tracking filter
    function processVideo() {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        // Apply a simple edge detection filter
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale conversion
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

          // Set all channels to the grayscale value
          data[i] = data[i + 1] = data[i + 2] = avg;
        }

        ctx.putImageData(frame, 0, 0);
      }

      requestAnimationFrame(processVideo); // Loop the function
    }
  });
</script>

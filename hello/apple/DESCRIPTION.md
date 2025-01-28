# Test Page with JavaScript

This is a test page to see if JavaScript can access the user's webcam.

## Webcam Access Example

Below is a live feed from your webcam (if you allow access):

<video id="webcam" autoplay playsinline style="width: 100%; max-width: 600px; border: 2px solid black;"></video>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    // Get the video element from the DOM
    const videoElement = document.getElementById("webcam");

    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Request access to the webcam
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          // Set the video source to the webcam stream
          videoElement.srcObject = stream;
        })
        .catch((error) => {
          // Handle errors (e.g., permission denied, no webcam available)
          console.error("Error accessing webcam:", error);
          alert("Unable to access your webcam. Please check permissions or try a different browser.");
        });
    } else {
      alert("Your browser does not support webcam access.");
    }
  });
</script>

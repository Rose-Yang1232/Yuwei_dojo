# Test Page with JavaScript

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


# Click Screenshot Capture & Upload to PHP Server

Click anywhere on the page to capture a screenshot and send it to the server.

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
  document.addEventListener("click", async function(event) {
    try {
      // Capture screenshot of the entire visible page
      const canvas = await html2canvas(document.body);
      const ctx = canvas.getContext("2d");

      // Get click coordinates relative to viewport
      const clickX = event.pageX - document.body.getBoundingClientRect().left;;
      const clickY = event.pageY;

      // Draw a red dot where the user clicked
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(clickX, clickY, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Convert canvas to Base64 PNG image
      const imageData = canvas.toDataURL("image/png");

      // Prepare data to send
      const payload = new FormData();
      payload.append("screenshot", imageData);
      payload.append("clickX", clickX);
      payload.append("clickY", clickY);

      // Send data to PHP server
      fetch("https://cumberland.isis.vanderbilt.edu/skyler/save_screenshot.php", {
        method: "POST",
        body: payload
      })
      .then(response => response.json())
      .then(data => console.log("Upload successful:", data))
      .catch(error => console.error("Error uploading:", error));

    } catch (error) {
      console.error("Screenshot capture failed:", error);
    }
  });
</script>

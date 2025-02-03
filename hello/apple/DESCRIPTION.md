# Test Page with JavaScript

This is a test page to see if JavaScript can access the user's webcam and apply a Sobel edge detection filter to the video.


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


# Click Screenshot with Coordinates

Click anywhere on the page to capture a screenshot. The image will appear below along with the coordinates of your click.

<img id="screenshot-img" style="border: 2px solid black; margin-top: 10px; display: none;" />
<p id="coordinates" style="font-weight: bold; margin-top: 10px;"></p>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
  document.addEventListener("click", async function(event) {
    try {
      // Capture a screenshot of the webpage
      const canvas = await html2canvas(document.body);

      // Convert the canvas to an image and display it
      const img = document.getElementById("screenshot-img");
      img.src = canvas.toDataURL("image/png");
      img.style.display = "block";

      // Display the click coordinates
      const coordinates = document.getElementById("coordinates");
      coordinates.textContent = `Click Position: X=${event.clientX}, Y=${event.clientY}`;
    } catch (error) {
      console.error("Screenshot capture failed:", error);
    }
  });
</script>

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


# Click Coordinates Display

Click anywhere on the page to see the coordinates of your mouse click.

<p id="coordinates" style="font-weight: bold; margin-top: 10px;">Click somewhere to see coordinates...</p>

<script>
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded");
    
    document.addEventListener("click", function(event) {
      const coordinates = document.getElementById("coordinates");

      // Debugging: Ensure element exists
      if (!coordinates) {
        console.error("Element #coordinates not found!");
        return;
      }

      // Debugging: Log before updating
      console.log("Updating coordinates:", event.clientX, event.clientY);

      // Update the coordinates
      coordinates.textContent = `Click Position: X=${event.clientX}, Y=${event.clientY}`;
    });
  });
</script>

This is earth.

and this is a test page to see if js code can work for webgazer.

<!-- ## example  -->
a button that js 

<button id="startTracking">Start Tracking</button>
<button id="stopTracking" disabled>Stop Tracking</button>

<p id="trackingStatus">Tracking: <span style="color: red;">OFF</span></p>

<canvas id="gazeCanvas" width="800" height="500" style="border: 1px solid black;"></canvas>

<script>
   document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startTracking");
    const stopButton = document.getElementById("stopTracking");
    const trackingStatus = document.getElementById("trackingStatus");
    const canvas = document.getElementById("gazeCanvas");
    const ctx = canvas.getContext("2d");

    let gazeData = [];

    // Function to start tracking
    function startTracking() {
        webgazer.setGazeListener((data, elapsedTime) => {
            if (data) {
                console.log(`Gaze X: ${data.x}, Gaze Y: ${data.y}, Time: ${elapsedTime}ms`);
                gazeData.push({ x: data.x, y: data.y, time: elapsedTime });

                // Draw gaze points on canvas
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(data.x, data.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        }).begin();

        webgazer.showPredictionPoints(true);
        startButton.disabled = true;
        stopButton.disabled = false;
        trackingStatus.innerHTML = "Tracking: ON";
    }

    // Function to stop tracking
    function stopTracking() {
        webgazer.end();
        startButton.disabled = false;
        stopButton.disabled = true;
        trackingStatus.innerHTML = "Tracking: OFF";

        // Send gaze data to backend
        sendDataToServer(gazeData);
    }

    // Function to send gaze data to backend
    function sendDataToServer(data) {
        fetch("https://yourserver.com/save_gaze_data.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gazeData: data }),
        })
        .then(response => console.log("Data saved successfully"))
        .catch(error => console.error("Error sending data:", error));
    }

    // Attach event listeners to buttons
    startButton.addEventListener("click", startTracking);
    stopButton.addEventListener("click", stopTracking);
});
</script>
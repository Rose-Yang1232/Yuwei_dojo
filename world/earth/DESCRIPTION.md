This is earth.

and this is a test page to see if js code can work for webgazer.

## example 
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

    startButton.addEventListener("click", function () {
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
        trackingStatus.innerHTML = "Tracking: **ON**";
    });

    stopButton.addEventListener("click", function () {
        webgazer.end();
        startButton.disabled = false;
        stopButton.disabled = true;
        trackingStatus.innerHTML = "Tracking: **OFF**";

        // Send gaze data to backend
        sendDataToServer(gazeData);
    });

    function sendDataToServer(data) {
        fetch("https://yourserver.com/save_gaze_data.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gazeData: data }),
        })
        .then(response => response.json())
        .then(result => console.log("Data saved:", result))
        .catch(error => console.error("Error sending data:", error));
    }
});
</script>
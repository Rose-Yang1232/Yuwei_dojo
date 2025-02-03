document.addEventListener("click", function(event) {
    alert("Mouse clicked")
    
    // Get the paragraph element
    const coordinates = document.getElementById("coordinates");
    
    // Display the X, Y coordinates
    coordinates.textContent = `Click Position: X=${event.clientX}, Y=${event.clientY}`;
  });
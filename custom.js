

setInterval(() => {
  var curselected = $("#workspace-select").val();

  // force selection of desktop workspace   TODO do the ports change?
  // 6080 was in the workspace for me
 
  if ($("#workspace-select").length) {
    if ($("#workspace-select").val() != "desktop: 6080") {
      if (typeof selectService === "function") {
        $("#workspace-select").val("desktop: 6080").change(); // update the UI element
        // force selection if we find the workspace selector menu and
        // the current selection is not the desktop
        selectService("desktop: 6080"); // activate the service....
      }
    }
  }

  console.log("Custom JS in web-security" + curselected + "\n");
}, 1000);

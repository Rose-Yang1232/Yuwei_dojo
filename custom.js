
$( document ).ready ( function () {
  if (!window.location.href.includes("workspace")) {
    if ($("#workspace-iframe").length) {
      // remove iframe from DOM, force them to use the workspace URL.
      $("#workspace-iframe").remove();

      // put in a message (TODO make this suck less)
      $("#challenge-workspace").append("<div><h2>You must use the Workspace tab for this challenge.  Please click Workspace at the top of the page</h2></div>");
    }
  }
}


setInterval(() => {
  var curselected = $("#workspace-select").val();

  // force selection of desktop workspace   TODO do the ports change?
  // 6080 was in the workspace for me
  if (curselected != "desktop: 6080") {
    // should be a function in actionbar.js...   
    selectService("desktop: 6080");
  }

  console.log("Custom JS in web-security" + curselected + "\n");
}, 1000);

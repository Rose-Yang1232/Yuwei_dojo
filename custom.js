

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

# IMPORTANT! You must use the GUI Desktop Workspace for this Challenge!

# Challenge Instructions

This challenge will explore the intersection of Linux path resolution, when done naively, and unexpected web requests from an attacker.
We've implemented a simple web server for you --- it will serve up files from /challenge/files over HTTP.
Can you trick it into giving you the flag?

The webserver program is `/challenge/server`.
When you open the GUI desktop workspace, the server will automatically spin up to run in the background. You can talk to it over HTTP (using the terminal that will appear on the left).
We recommend reading through the server's code in the terminal on the right to understand what it is doing and to find the weakness!

**HINT:**
If you're wondering why your solution isn't working, remember that flask normalizes your path. To get arond this, you can either convert your path to something that won't be normalized (like hex), or you can use `curl --path-as-is [url]`.

----

# Eye-Tracking Instructions

**This challenge uses your webcam to track eye movements.**  
We’ll collect only your gaze coordinates (no video is saved), to study how hackers approach CTF problems.

---

## 1. Prerequisites

- **Webcam**: You must have a working webcam.  
- **Lighting**: A well-lit room helps improve accuracy.  
- **Browser Permissions**: When prompted, **allow** camera access.  

---

## 2. Calibration (~30 seconds)

1. When the GUI workspace opens, you’ll see a **white screen** with **9 red dots**.  
2. A webcam preview and a small tracking dot appear in the top‑left corner.  
3. **Click each red dot 5 times**, while looking directly at it.  
4. Dots will turn **yellow** when fully clicked.  
5. Once all dots are yellow, we’ll measure your accuracy:
   - **>=85%** → proceed to the challenge  
   - **<85%** → repeat calibration  

---

## 3. During the Challenge

- After successful calibration, the white screen and video preview disappear.  
- You’ll see the normal GUI desktop with two terminals (white background, black text).  
- **Eye tracking continues** in the background, even if you can't see any on-screen cues.  
- **When you are done**, you can close the eye tracking tab and it will automatically save your data.

---

## 4. Tips for Best Accuracy

- Keep your monitor **at eye level** and your webcam **above the screen**.  
- Sit in a **well-lit** area.  
- Try to keep your **head still**. Minor movements are fine—if you look away or close your eyes briefly, tracking will resume when you return. 
- If you reload the page, you will have to recalibrate. 
- **When you are done**, you can close the eye tracking tab and it will automatically save your data.

---

Thank you! Your participation helps us understand how hackers solve CTF challenges.




<div id="challenge-notice-4" style="display:none;"></div>

<script>
  
const tracker_4 = createTracker({
  iframeId: 'workspace-iframe',
  iframeSelector: '#workspace-iframe, #workspace_iframe',
  challenge: 'path-traversal-4',
  bannerElId: 'challenge-notice-4', // div above for checking if the user is allowed to take this challenge  
  // for checking if this is the challenge that was started; if only one challenge in the module, leave it null
  expectedContainerId: 'challenges-body-4', 
  requireVersionMatch: true,
  challengeTimeMinutes: 25,
  urlBasePath: 'https://cumberland.isis.vanderbilt.edu/skyler/',
  userId: init.userId,             // pwn.college provides this
  tickMs: 5000,                    // batch interval
  minAccuracy: 85,                  // calibration threshold
  allowCalibrationSkip: true,
});

// Show/hide the banner based on survey/version BEFORE attempting to start anything
tracker_4.checkBanner();


// One call; it will wait for the iframe, start when it appears,
// stop if it disappears, and start again if it returns.
tracker_4.autoStart();
  
</script>

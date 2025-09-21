# IMPORTANT! You must use the GUI Desktop Workspace for this Challenge!

# Challenge Instructions

A common type of vulnerability is an _Authentication Bypass_, where an attacker can bypass the typical authentication logic of an application and log in without knowing the necessary user credentials.

This level challenges you to explore one such scenario.
This specific scenario arises because of a gap between what the developer expects (that the URL parameters set by the application will only be set by the application itself) and the reality (that attackers can craft HTTP requests to their hearts content).

This level assumes a passing familiarity with SQL, which you can develop in the [SQL Playground](/fundamentals/sql-playground).

The webserver program is `/challenge/server`.
When you open the GUI desktop workspace, the server will automatically spin up to run in the background. You can talk to it over HTTP using the bottom terminal.
We recommend reading through the server's code (particularly the endpoints) in the left and right terminals to understand what it is doing. From this, you can bypass this authentication to log in as the `admin` user and get the flag!


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




<div id="challenge-notice-5" style="display:none;"></div>


<script>

  
const tracker_5 = createTracker({
  iframeId: 'workspace-iframe',
  iframeSelector: '#workspace-iframe, #workspace_iframe',
  challenge: 'auth-bypass-param',
  bannerElId: 'challenge-notice-5', // div above for checking if the user is allowed to take this challenge  
  // for checking if this is the challenge that was started; if only one challenge in the module, leave it null
  expectedContainerId: 'challenges-body-5', 
  requireVersionMatch: false,
  challengeTimeMinutes: 25,
  urlBasePath: 'https://cumberland.isis.vanderbilt.edu/skyler/',
  userId: init.userId,             // pwn.college provides this
  tickMs: 5000,                    // batch interval
  minAccuracy: 85,                  // calibration threshold
  allowCalibrationSkip: true,
});

// Show/hide the banner based on survey/version BEFORE attempting to start anything
tracker_5.checkBanner();


// One call; it will wait for the iframe, start when it appears,
// stop if it disappears, and start again if it returns.
tracker_5.autoStart();
  
</script>

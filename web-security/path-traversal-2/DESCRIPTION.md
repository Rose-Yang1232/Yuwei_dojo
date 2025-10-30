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




<div id="challenge-notice-2" style="display:none;"></div>



<script>

/*
const versionToChallenge = v => `path-traversal-${v}`;

function showNotice(el, text) {
  el.textContent   = text;
  el.style.display = 'block';
  el.style.fontWeight   = '700';
  el.style.color        = '#c00000';
  el.style.background   = '#fff';
  el.style.padding      = '10px 12px';
  el.style.border       = '1px solid #c00000';
  el.style.borderRadius = '6px';
}

function hideNotice(el) {
  el.textContent = '';
  el.style.display = 'none';
}

// Checks if the user is allowed to take a challenge.
// Returns { ok, assignedVersion, assignedChallenge, reason }.
// Also updates page banner
async function checkChallengeEligibility({
  userId,
  challenge,
  urlBasePath,
  requireVersionMatch = true,
  bannerElId,
}) {
  const banner = bannerElId ? document.getElementById(bannerElId) : null;

  try {
    const endpoint = `${urlBasePath}check_survey.php?userId=${encodeURIComponent(userId)}`;
    const resp = await fetch(endpoint, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json(); // { filled: boolean, version: number }

    if (!data?.filled) {
      const msg = 'We could not find your survey submission. Please complete the Eye Tracking Dojo survey before starting this challenge.';
      if (banner) showNotice(banner, msg);
      return { ok: false, assignedVersion: null, assignedChallenge: null, reason: 'no-survey' };
    }

    const assignedVersion = data.version;
    const assignedChallenge = versionToChallenge(assignedVersion);

    if (requireVersionMatch && assignedChallenge !== challenge) {
      const msg = `This page isn’t your assigned version. Assigned: ${assignedChallenge}. You are currently on: ${challenge}. Please open ${assignedChallenge} instead.`;
      if (banner) showNotice(banner, msg);
      return { ok: false, assignedVersion, assignedChallenge, reason: 'version-mismatch' };
    }

    if (banner) hideNotice(banner);
    return { ok: true, assignedVersion, assignedChallenge, reason: 'ok' };
  } catch (err) {
    const msg = 'Error verifying your survey completion. Please try again.';
    if (banner) showNotice(banner, msg);
    return { ok: false, assignedVersion: null, assignedChallenge: null, reason: 'network-error' };
  }
}

checkChallengeEligibility({
  userId,
  challenge,
  urlBasePath,
  requireVersionMatch = true,
  bannerElId,
})

(async () => {
  const gate = await checkChallengeEligibility({
    userId: init.userId,
    challenge: 'path-traversal-2',
    urlBasePath: 'https://cumberland.isis.vanderbilt.edu/skyler/',
    requireVersionMatch: true,
    bannerElId: 'challenge-notice-2',
  });

})();
*/


/*
const tracker_2 = createTracker({
  iframeId: 'workspace-iframe',
  iframeSelector: '#workspace-iframe, #workspace_iframe',
  challenge: 'path-traversal-2',
  bannerElId: 'challenge-notice-2', // div above for checking if the user is allowed to take this challenge  
  // for checking if this is the challenge that was started; if only one challenge in the module, leave it null
  expectedContainerId: 'challenges-body-2', 
  requireVersionMatch: true,
  challengeTimeMinutes: 25,
  urlBasePath: 'https://cumberland.isis.vanderbilt.edu/skyler/',
  userId: init.userId,             // pwn.college provides this
  tickMs: 5000,                    // batch interval
  minAccuracy: 85,                  // calibration threshold
  allowCalibrationSkip: true,
});

// Show/hide the banner based on survey/version BEFORE attempting to start anything
tracker_2.checkBanner();


// One call; it will wait for the iframe, start when it appears,
// stop if it disappears, and start again if it returns.
tracker_2.autoStart();
*/
  
</script>

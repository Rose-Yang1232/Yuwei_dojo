setInterval(() => {

    // pwn.college has tons of duplicates of the workspace-select
    // element for some reason.  Let's do this check only in the
    // workspace URL
    if (window.location.href.includes("workspace")) {

      var curselected = $("#workspace-select").val();

      // force selection of desktop workspace   TODO do the ports change?
      // 6080 was in the workspace for me
     
      if ($("#workspace-select").length) {
        if ( $("#workspace-select").is(":visible") && 
             $("#workspace-select").val() != "desktop: 6080") {
          if (typeof selectService === "function") {
            $("#workspace-select").val("desktop: 6080").change(); // update the UI element
            // force selection if we find the workspace selector menu and
            // the current selection is not the desktop
            selectService("desktop: 6080"); // activate the service....
          }
        }
      }
    }

  if (!window.location.href.includes("workspace")) {
    if ($("#workspace-iframe").length) {
      console.log("Removing iframe from DOM.");
      // remove iframe from DOM, force them to use the workspace URL.
      $("#workspace-iframe").replaceWith("<div><h2>You must use the Workspace tab for this challenge.  Please click Workspace at the top of the page</h2></div>");

      // put in a message (TODO make this suck less)
      //$("#challenge-workspace").append("<div><h2>You must use the Workspace tab for this challenge.  Please click Workspace at the top of the page</h2></div>");
    }
  }

  //console.log("Custom JS in web-security" + curselected + "\n");
}, 1000);


// if on the module page, remove challenges not assigned to this user
(async () => {
  if (window.location.pathname.includes("web-security")){
    const endpoint = `https://huang.isis.vanderbilt.edu/skyler/check_survey.php?userId=${encodeURIComponent(init.userId)}`;
    try {
      const resp = await fetch(endpoint, { cache: 'no-store' });
      if (!resp.ok) throw new Error('network error');

      const data = await resp.json();
      const allowedChallenges = data.allowedChallenges || [];

      const accordionItems = document.querySelectorAll('.accordion-item');

      accordionItems.forEach(item => {
        const header = item.querySelector('h4[data-challenge-id]');
        if (!header) return; // skip malformed

        const challengeId = header.getAttribute('data-challenge-id');

        if (!allowedChallenges.includes(challengeId)) {
          item.remove();
        }
      });
    } catch (err) {
      console.error('Error fetching survey info:', err);
    }
  }
})();

// load an external script. Same functionality as using src in script tag
function loadScript(src, { async = true, defer = false, crossOrigin = null } = {}) {
  return new Promise((resolve, reject) => {
    // if already loaded, resolve immediately
    if (document.querySelector(`script[src="${src}"]`)) {
      // wait a tick to ensure the existing script has executed
      return requestAnimationFrame(() => resolve());
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = async;
    if (defer) s.defer = true;
    if (crossOrigin) s.crossOrigin = crossOrigin;

    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error(`Failed to load script ${src}`));

    document.head.appendChild(s);
  });
}





/**
 * createTracker: fully encapsulated eye + interaction tracker
 * Usage:
 *   const tracker = createTracker({ iframeId:'workspace-iframe', challenge:'example', urlBasePath:'https://huang.isis.vanderbilt.edu/skyler/', userId: init.userId });
 *   tracker.start();
 *   // tracker.stop(); // later, if you want
 *   // tracker.destroy(); // full cleanup (UI + listeners + stop + end webgazer)
*/

function createTracker({
  iframeId,
  iframeSelector,
  challenge,
  bannerElId,
  expectedContainerId = null,
  requireVersionMatch = true,
  versionToChallenge = v => `path-traversal-${v}`,
  challengeTimeMinutes = 25,
  urlBasePath,
  userId,
  tickMs = 5000,
  minAccuracy = 85,
  allowCalibrationSkip = false,
}) {
  const wallClockStart = Date.now();
  const perfStart = performance.now();

  function getCaptureChannel() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('sensai')) return 'sensai';
    if (path.includes('workspace')) return 'challenge';
    return 'unknown';
  }

  function shouldCaptureFromThisTab() {
    return document.visibilityState === 'visible' && !document.hidden;
  }

  function logVisibilityState() {
    console.log(
      `[capture ${state.captureChannel}] visibility=${document.visibilityState}, hidden=${document.hidden}`
    );
  }

  const state = {
    eventQueue: [],
    gazeQueue: [],
    startedFlag: false,
    intervalId: null,
    msgHandler: null,
    iframeMutationObserver: null,
    cleanupFns: [],
    running: false,
    expireTimerId: null,
    bannerObserver: null,
    bannerReadyObserver: null,
    domObserver: null,
    presenceTimer: null,

    captureStream: null,
    captureVideo: null,
    captureReady: false,
    captureCanvas: null,
    captureTrack: null,
    captureChannel: getCaptureChannel()
  };

  const ns = `gaze:${challenge || 'default'}:${userId || 'anon'}:`;
  const lsKey = (k) => `${ns}${k}`;
  const ls = {
    get: (k) => localStorage.getItem(lsKey(k)),
    set: (k, v) => localStorage.setItem(lsKey(k), v),
    rm:  (k) => localStorage.removeItem(lsKey(k)),
    clearMine: () => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ns)) localStorage.removeItem(key);
      }
    }
  };

  const CHALLENGE_TIME_MS = Math.max(1, challengeTimeMinutes) * 60 * 1000;

  function getDeadline() {
    const v = Number(ls.get('deadline'));
    return Number.isFinite(v) ? v : 0;
  }

  function setDeadline(ts) {
    ls.set('deadline', String(ts));
  }

  function isTimedOut() {
    const d = getDeadline();
    return ls.get('timedOut') === 'true' || (d && Date.now() >= d);
  }

  function markTimedOut() {
    ls.set('timedOut', 'true');
  }

  function timeoutMessageText() {
    return 'Time is up for this challenge. Please move on to the next challenge, or finish the experiment if you have completed all challenges. This challenge is now finished. Failing to finish this challenge will NOT affect your compensation.';
  }

  function clearExpiryAlarm() {
    if (state.expireTimerId) {
      clearTimeout(state.expireTimerId);
      state.expireTimerId = null;
    }
  }

  function scheduleExpiryAlarm() {
    clearExpiryAlarm();
    const d = getDeadline();
    if (!d) return;
    const delay = Math.max(0, d - Date.now());
    state.expireTimerId = setTimeout(() => {
      if (isTimedOut()) return;
      markTimedOut();
      recordCompletionOnce('timed out');
    }, delay);
  }

  function clearTimerKeys() {
    ls.rm('deadline');
    ls.rm('timedOut');
  }

  function completionKey(k) {
    return lsKey(`completion:${k}`);
  }

  async function recordCompletionOnce(method) {
    if (localStorage.getItem(completionKey('completed')) === 'true') return;
    if (localStorage.getItem(completionKey('queued')) === 'true') return;

    try {
      localStorage.setItem(completionKey('queued'), 'true');

      const form = new URLSearchParams();
      form.append('userId', userId);
      form.append('challenge', challenge);
      form.append('method', method);

      const resp = await fetch(`${urlBasePath}record_completion.php`, {
        method: 'POST',
        body: form,
        cache: 'no-store',
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const ok = await resp.json().catch(() => ({}));
      if (ok && ok.status === 'ok') {
        localStorage.setItem(completionKey('completed'), 'true');
        localStorage.setItem(completionKey('method'), method);
      } else {
        localStorage.removeItem(completionKey('queued'));
      }
    } catch (e) {
      localStorage.removeItem(completionKey('queued'));
      console.warn('recordCompletionOnce failed:', e);
    }
  }

  function getExpectedContainer() {
    return expectedContainerId ? document.getElementById(expectedContainerId) : null;
  }

  function resolveIframe() {
    const container = getExpectedContainer();
    const selector = iframeSelector || (iframeId ? `#${iframeId}` : null);

    if (container && selector) return container.querySelector(selector);
    if (container && iframeId && !selector) return container.querySelector(`#${iframeId}`);
    if (selector) return document.querySelector(selector);
    if (iframeId) return document.getElementById(iframeId);
    return null;
  }

  function getBannerEl() {
    const container = getExpectedContainer();
    return container
      ? container.querySelector('#workspace-notification-banner')
      : document.getElementById('workspace-notification-banner');
  }

  function bannerShowsSolved(el) {
    if (!el) return false;
    const txt = (el.textContent || '').toLowerCase();
    if (txt.includes('solved')) return true;

    try {
      const clsOk = el.classList?.contains('animate-banner');
      const inline = (el.getAttribute('style') || '').toLowerCase();
      const computed = (getComputedStyle(el).borderColor || '').toLowerCase();
      if (clsOk && (inline.includes('brand-green') || computed.includes('green'))) return true;
    } catch (_) {}

    return false;
  }

  function ensureBannerWatcher() {
    if (state.bannerObserver) return;

    const installOn = (el) => {
      if (!el) return false;

      if (bannerShowsSolved(el)) {
        recordCompletionOnce('found flag');
      }

      const ob = new MutationObserver(() => {
        if (bannerShowsSolved(el)) {
          recordCompletionOnce('found flag');
        }
      });

      ob.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      state.bannerObserver = ob;
      return true;
    };

    if (installOn(getBannerEl())) return;

    const root = getExpectedContainer() || document.documentElement;
    const ready = new MutationObserver(() => {
      const el = getBannerEl();
      if (el && installOn(el)) {
        ready.disconnect();
        state.bannerReadyObserver = null;
      }
    });

    ready.observe(root, { childList: true, subtree: true });
    state.bannerReadyObserver = ready;
  }

  const calibrationData = {};
  const REQUIRED_CLICKS = 5;

  const outerPositions = [
    { id: 'Pt1', top: '10%', left: '10%' },
    { id: 'Pt2', top: '10%', left: '50%' },
    { id: 'Pt3', top: '10%', left: '90%' },
    { id: 'Pt4', top: '50%', left: '10%' },
    { id: 'Pt6', top: '50%', left: '90%' },
    { id: 'Pt7', top: '90%', left: '10%' },
    { id: 'Pt8', top: '90%', left: '50%' },
    { id: 'Pt9', top: '90%', left: '90%' },
  ];

  const centerPosition = { id: 'Pt5', top: '50%', left: '50%' };

  async function runWebGazer() {
    if (typeof webgazer === 'undefined') {
      console.warn('WebGazer not loaded');
      return;
    }

    const calibrated = ls.get('webgazerCalibrated') === 'true';
    let cam = ls.get('cam');

    if (!calibrated) {
      try { webgazer.clearData(); } catch {}
    }

    const applyCam = (deviceId) => {
      try {
        webgazer.setCameraConstraints({
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            frameRate: { min: 5, ideal: 10, max: 15 },
            facingMode: 'user',
          },
        });
      } catch (e) {
        console.warn('setCameraConstraints failed', e);
      }
    };

    if (!cam && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter(d => d.kind === 'videoinput');
        if (videos.length) {
          cam = videos[0].deviceId;
          ls.set('cam', cam);
          applyCam(cam);
          await webgazer.begin();
        } else {
          console.warn('No video input devices found.');
        }
      } catch (err) {
        console.error('Could not list cameras:', err);
      }
    } else {
      applyCam(cam);
    }

    webgazer
      .saveDataAcrossSessions(true)
      .setRegression('ridge')
      .setGazeListener((data, ts) => {
        if (!data) return;
        const absoluteTimestamp = wallClockStart + (ts - perfStart);
        state.gazeQueue.push({
          x: data.x,
          y: data.y,
          timestamp: ts,
          absoluteTimestamp
        });
      })
      .begin();

    if (!calibrated) {
      webgazer.showVideoPreview(true)
        .showPredictionPoints(true)
        .applyKalmanFilter(true);
      setupCalibration();
    } else {
      webgazer.showVideoPreview(false)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .applyKalmanFilter(true);
      console.log('WebGazer resumed with saved calibration – skipping UI.');
    }

    const wgHandler = webgazer._clickListener || webgazer.params?.clickListener;
    if (wgHandler) {
      document.removeEventListener('click', wgHandler);
      document.addEventListener('click', wgHandler, true);
    }

    document.addEventListener('mousedown', (e) => {
      if (typeof webgazer.recordScreenPosition === 'function') {
        webgazer.recordScreenPosition(e.clientX, e.clientY);
      }
    }, true);
  }

  function createCalibrationPoints() {
    if (document.querySelector('.calibrationDiv')) return;

    const bg = document.createElement('div');
    bg.className = 'calibrationBackground';
    Object.assign(bg.style, {
      position: 'fixed',
      inset: '0',
      backgroundColor: 'white'
    });
    document.body.appendChild(bg);

    const overlay = document.createElement('div');
    overlay.className = 'calibrationDiv';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: 9999
    });

    const instructionText = document.createElement('div');
    instructionText.className = 'calibrationInstruction';
    instructionText.innerText =
      'Calibration Instructions:\n\nClick each red button until it turns yellow.\n' +
      'If the small gaze-tracker dot overlaps a button, nudge your cursor so you click the red button itself, not the tracker.\n' +
      'Ensure you are in a well-lit room and your face is clearly visible in the video in the top left';
    Object.assign(instructionText.style, {
      position: 'absolute',
      top: '10%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'black',
      whiteSpace: 'pre-wrap'
    });
    overlay.appendChild(instructionText);

    const label = document.createElement('label');
    label.innerText = 'Choose camera: ';
    Object.assign(label.style, {
      position: 'absolute',
      top: '45%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '18px',
      color: 'black'
    });

    const select = document.createElement('select');
    select.id = 'cameraSelect';
    select.style.marginLeft = '8px';
    label.appendChild(select);
    overlay.appendChild(label);

    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const cams = devices.filter(d => d.kind === 'videoinput');
          cams.forEach((c, i) => {
            const opt = document.createElement('option');
            opt.value = c.deviceId;
            opt.text = c.label || `Camera ${i + 1}`;
            if (ls.get('cam') === c.deviceId) opt.selected = true;
            select.appendChild(opt);
          });
        })
        .catch(err => console.error('Could not list cameras:', err));
    }

    outerPositions.forEach(pos => {
      const btn = document.createElement('button');
      btn.className = 'Calibration';
      btn.id = pos.id;
      Object.assign(btn.style, {
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -50%)',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: 'red',
        opacity: 0.6,
        pointerEvents: 'auto'
      });
      overlay.appendChild(btn);
    });

    if (allowCalibrationSkip) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.textContent = 'Skip calibration (dev)';
      Object.assign(skip.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '6px 10px',
        fontSize: '12px',
        borderRadius: '6px',
        border: '1px solid #999',
        background: '#fff',
        opacity: '0.85',
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 10000
      });
      skip.addEventListener('click', () => {
        if (confirm('Skip calibration for testing?')) {
          finalizeCalibrationSuccess({ reason: 'dev-skip', overall: 100 });
        }
      });
      overlay.appendChild(skip);
    }

    document.body.appendChild(overlay);

    select.addEventListener('change', async (e) => {
      const deviceId = e.target.value;
      try { await webgazer.end(); } catch {}
      try { webgazer.clearData(); } catch {}

      try {
        webgazer.setCameraConstraints({
          video: {
            deviceId: { exact: deviceId },
            frameRate: { min: 15, ideal: 20, max: 25 },
            facingMode: 'user'
          }
        });

        ls.set('cam', deviceId);

        await webgazer
          .saveDataAcrossSessions(true)
          .setRegression('ridge')
          .setGazeListener((data, ts) => {
            if (!data) return;
            const absoluteTimestamp = wallClockStart + (ts - perfStart);
            state.gazeQueue.push({ x: data.x, y: data.y, timestamp: ts, absoluteTimestamp });
          })
          .begin();

        webgazer.showVideoPreview(true).showPredictionPoints(true).applyKalmanFilter(true);
      } catch (err) {
        console.error('Switch camera failed:', err);
      }
    });
  }

  function createCenterButton() {
    if (document.getElementById(centerPosition.id)) return;

    const btn = document.createElement('button');
    btn.className = 'Calibration';
    btn.id = centerPosition.id;
    Object.assign(btn.style, {
      position: 'absolute',
      top: centerPosition.top,
      left: centerPosition.left,
      transform: 'translate(-50%, -50%)',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      backgroundColor: 'red',
      opacity: 0.6,
      pointerEvents: 'auto'
    });

    document.querySelector('.calibrationDiv').appendChild(btn);
    btn.addEventListener('click', calibrationClickHandler);
  }

  function calibrationClickHandler(e) {
    const id = e.target.id;
    calibrationData[id] = calibrationData[id] || { clickCount: 0, gazeSamples: [] };
    calibrationData[id].clickCount++;

    const gaze = webgazer.getCurrentPrediction?.();
    if (gaze) calibrationData[id].gazeSamples.push({ x: gaze.x, y: gaze.y });

    e.target.style.opacity = Math.min(1, 0.6 + 0.08 * calibrationData[id].clickCount);
    if (calibrationData[id].clickCount >= REQUIRED_CLICKS) {
      e.target.style.backgroundColor = 'yellow';
      e.target.disabled = true;
    }

    const allOuterDone = outerPositions.every(p => calibrationData[p.id]?.clickCount >= REQUIRED_CLICKS);
    if (allOuterDone) createCenterButton();

    if (id === centerPosition.id && calibrationData[id].clickCount >= REQUIRED_CLICKS) {
      measureCenterAccuracy();
    }
  }

  function clearCalibration() {
    Object.keys(calibrationData).forEach(k => delete calibrationData[k]);
    try { webgazer.clearData(); } catch {}

    document.querySelectorAll('.Calibration').forEach(btn => {
      btn.disabled = false;
      btn.style.backgroundColor = 'red';
      btn.style.opacity = 0.6;
    });
  }

  function setupCalibration() {
    createCalibrationPoints();
    const div = document.querySelector('.calibrationDiv');
    div.style.pointerEvents = 'auto';
    div.style.zIndex = 9999;
    document.querySelectorAll('.Calibration')
      .forEach(btn => btn.addEventListener('click', calibrationClickHandler));
  }

  function measureCenterAccuracy() {
    const centerDot = document.createElement('div');
    centerDot.id = 'centerDot';
    Object.assign(centerDot.style, {
      position: 'fixed',
      width: '20px',
      height: '20px',
      backgroundColor: 'blue',
      borderRadius: '50%',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10000
    });
    document.body.appendChild(centerDot);

    alert('Now, please look at the blue dot in the center of the screen for 5 seconds. We will use this to measure calibration accuracy.');

    setTimeout(() => {
      centerDot.remove();

      const snapshot = state.gazeQueue.slice(-15);
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const threshold = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;

      const precisions = snapshot.map(s => {
        const dx = centerX - s.x;
        const dy = centerY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= threshold ? 100 - (dist / threshold * 100) : 0;
      });

      const overall = precisions.length
        ? Math.round(precisions.reduce((a, b) => a + b, 0) / precisions.length)
        : 0;

      if (overall < minAccuracy) {
        alert(`Calibration complete!\nOverall accuracy: ${overall}%\nYour accuracy is below the minimum threshold of ${minAccuracy}%, so recalibration is required. Please ensure the room is well-lit to aid accuracy.`);
        clearCalibration();
        setupCalibration();
        return;
      }

      const proceed = confirm(`Calibration complete!\nOverall accuracy: ${overall}%\nDo you want to move on? Press Cancel to calibrate again.`);
      if (!proceed) {
        clearCalibration();
        setupCalibration();
        return;
      }

      finalizeCalibrationSuccess({ reason: 'measured', overall });
    }, 5000);
  }

  async function startTabCapture() {
    if (state.captureStream && state.captureReady) return true;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('This browser does not support tab capture. Please use a recent Chromium-based browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 5, max: 8 }
        },
        audio: false,
        preferCurrentTab: true
      });

      const track = stream.getVideoTracks()[0];
      if (!track) {
        alert('No video track was returned from screen capture.');
        return false;
      }

      const settings = track.getSettings ? track.getSettings() : {};
      console.log(`[capture ${state.captureChannel}] track settings:`, settings);

      const video = document.createElement('video');
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;
      await video.play();

      state.captureStream = stream;
      state.captureVideo = video;
      state.captureTrack = track;
      state.captureCanvas = document.createElement('canvas');
      state.captureReady = true;

      track.addEventListener('ended', () => {
        console.warn(`[capture ${state.captureChannel}] user stopped tab capture.`);
        state.captureReady = false;
        state.captureTrack = null;
        state.captureStream = null;

        if (state.captureVideo) {
          try {
            state.captureVideo.pause();
            state.captureVideo.srcObject = null;
          } catch (_) {}
        }

        state.captureVideo = null;
      });

      const surface = settings.displaySurface || 'unknown';
      if (surface !== 'browser') {
        alert('Please choose "This Tab" when prompted. Screen or window sharing can break gaze-to-screenshot alignment.');
      }

      return true;
    } catch (err) {
      console.error(`[capture ${state.captureChannel}] failed to start tab capture:`, err);
      alert('We could not start tab capture. Please click "Start Experiment" again and choose "This Tab".');
      return false;
    }
  }

  function stopTabCapture() {
    if (state.captureTrack) {
      try { state.captureTrack.stop(); } catch (_) {}
    }

    if (state.captureStream) {
      try {
        state.captureStream.getTracks().forEach(t => t.stop());
      } catch (_) {}
    }

    if (state.captureVideo) {
      try {
        state.captureVideo.pause();
        state.captureVideo.srcObject = null;
      } catch (_) {}
    }

    if (state.captureCanvas) {
      state.captureCanvas.width = 0;
      state.captureCanvas.height = 0;
    }

    state.captureTrack = null;
    state.captureStream = null;
    state.captureVideo = null;
    state.captureCanvas = null;
    state.captureReady = false;
  }

  function finalizeCalibrationSuccess({ reason = 'measured', overall = 100 } = {}) {
    const overlay = document.querySelector('.calibrationDiv');
    const bg = document.querySelector('.calibrationBackground');
    if (!overlay) return;

    overlay.innerHTML = '';

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#fff',
      color: '#000',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      maxWidth: '650px',
      textAlign: 'center',
      pointerEvents: 'auto',
      fontFamily: 'sans-serif'
    });

    const title = document.createElement('h2');
    title.textContent = 'Calibration complete';
    panel.appendChild(title);

    const text = document.createElement('p');
    text.textContent =
      `Overall accuracy: ${overall}%. ` +
      `Before the challenge begins, click "Start Experiment" and choose "This Tab" in the browser prompt. ` +
      `This tab will maintain its own capture stream and only upload screenshots while it is the active tab.`;
    panel.appendChild(text);

    const note = document.createElement('p');
    note.textContent =
      'Important: if you use both the challenge and sensai tabs, you must approve tab capture once in each tab.';
    note.style.fontWeight = 'bold';
    panel.appendChild(note);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Start Experiment';
    Object.assign(btn.style, {
      padding: '12px 18px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '1px solid #666',
      cursor: 'pointer',
      background: '#fff'
    });

    const status = document.createElement('div');
    status.style.marginTop = '12px';
    status.style.minHeight = '24px';

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'Requesting tab capture permission...';

      const ok = await startTabCapture();
      if (!ok) {
        btn.disabled = false;
        status.textContent = 'Could not start tab capture. Please try again.';
        return;
      }

      overlay.remove();
      bg?.remove();

      webgazer
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(false)
        .saveDataAcrossSessions(true);

      const videoEl = document.getElementById('webgazerVideoContainer');
      if (videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl);

      ls.set('webgazerCalibrated', 'true');
      state.gazeQueue.length = 0;

      if (!getDeadline()) {
        setDeadline(Date.now() + CHALLENGE_TIME_MS);
      }
      scheduleExpiryAlarm();

      console.log(`Calibration finalized (${reason}); overall=${overall}%`);
    });

    panel.appendChild(btn);
    panel.appendChild(status);
    overlay.appendChild(panel);
  }

  // ---------- Iframe listeners ----------
  function attachIframeListeners() {
    const iframe = resolveIframe ? resolveIframe() : document.querySelector('#workspace_iframe, #workspace-iframe');
    if (!iframe) {
      console.warn('Iframe not found:', iframeId);
      return () => {};
    }

    const injectScript = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        const old = doc.getElementById('eventForwarder');
        if (old) old.remove();

        const script = doc.createElement('script');
        script.id = 'eventForwarder';
        script.textContent = `
          if (!window.forwarderSetup) {
            window.forwarderSetup = true;

            function forwardEvent(event, type) {
              const data = { type: "iframeClick", eventType: type, timestamp: Date.now() };
              if (type === "keydown") data.key = event.key;
              else { data.x = event.clientX; data.y = event.clientY; }
              window.parent.postMessage(data, "*");
            }

            document.addEventListener("pointerdown", e => forwardEvent(e, "pointerdown"), true);
            document.addEventListener("keydown", e => forwardEvent(e, "keydown"), true);
          }
        `;
        doc.head.appendChild(script);
      } catch (err) {
        console.warn('Iframe is cross-origin; event injection disabled:', err);
      }
    };

    iframe.addEventListener('load', injectScript);
    state.cleanupFns.push(() => iframe.removeEventListener('load', injectScript));
    return injectScript;
  }

  // Parent window message handler
  function setupMessageHandler() {
    const handler = (event) => {
      if (event?.data?.type !== 'iframeClick') return;
      const { eventType, timestamp, x, y, key } = event.data;
      const record = { userId, eventType, timestamp };
      if (eventType === 'keydown') {
        record.key = key;
      } else {
        record.x = x;
        record.y = y;
      }
      state.eventQueue.push(record);
    };

    window.addEventListener('message', handler);
    state.msgHandler = handler;
  }

  async function startTabCapture() {
    if (state.captureStream && state.captureReady) return true;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('This browser does not support tab capture. Please use a recent Chromium-based browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 5, max: 8 }
        },
        audio: false,
        preferCurrentTab: true
      });

      const track = stream.getVideoTracks()[0];
      if (!track) {
        alert('No video track was returned from screen capture.');
        return false;
      }

      const settings = track.getSettings ? track.getSettings() : {};
      console.log(`[capture ${state.captureChannel}] track settings:`, settings);

      const video = document.createElement('video');
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;

      await video.play();

      state.captureStream = stream;
      state.captureVideo = video;
      state.captureTrack = track;
      state.captureCanvas = document.createElement('canvas');
      state.captureReady = true;

      track.addEventListener('ended', () => {
        console.warn(`[capture ${state.captureChannel}] user stopped tab capture.`);
        state.captureReady = false;
        state.captureTrack = null;
        state.captureStream = null;

        if (state.captureVideo) {
          try {
            state.captureVideo.pause();
            state.captureVideo.srcObject = null;
          } catch (_) {}
        }
        state.captureVideo = null;
      });

      const surface = settings.displaySurface || 'unknown';
      if (surface !== 'browser') {
        alert('Please choose "This Tab" when prompted. Screen or window sharing can break gaze-to-screenshot alignment.');
      }

      return true;
    } catch (err) {
      console.error(`[capture ${state.captureChannel}] failed to start tab capture:`, err);
      alert('We could not start tab capture. Please click "Start Experiment" again and choose "This Tab".');
      return false;
    }
  }

  function stopTabCapture() {
    if (state.captureTrack) {
      try { state.captureTrack.stop(); } catch (_) {}
    }

    if (state.captureStream) {
      try {
        state.captureStream.getTracks().forEach(track => track.stop());
      } catch (_) {}
    }

    if (state.captureVideo) {
      try {
        state.captureVideo.pause();
        state.captureVideo.srcObject = null;
      } catch (_) {}
    }

    if (state.captureCanvas) {
      state.captureCanvas.width = 0;
      state.captureCanvas.height = 0;
    }

    state.captureTrack = null;
    state.captureStream = null;
    state.captureVideo = null;
    state.captureCanvas = null;
    state.captureReady = false;
  }

  async function takeScreenshot(X, Y, click = true) {
    try {
      if (!shouldCaptureFromThisTab()) {
        return;
      }

      if (!state.captureReady || !state.captureVideo || !state.captureCanvas) {
        console.warn(`[capture ${state.captureChannel}] tab capture is not ready; screenshot skipped.`);
        return;
      }

      const video = state.captureVideo;
      if (!video.videoWidth || !video.videoHeight) {
        console.warn(`[capture ${state.captureChannel}] capture video has no dimensions yet; screenshot skipped.`);
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const canvas = state.captureCanvas;
      canvas.width = viewportWidth;
      canvas.height = viewportHeight;

      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);
      ctx.drawImage(video, 0, 0, viewportWidth, viewportHeight);

      let markerX;
      let markerY;

      if (click) {
        const iframe = resolveIframe
          ? resolveIframe()
          : document.querySelector('#workspace_iframe, #workspace-iframe');

        const iframeRect = iframe
          ? iframe.getBoundingClientRect()
          : { left: 0, top: 0 };

        markerX = Math.round(iframeRect.left + X);
        markerY = Math.round(iframeRect.top + Y);
      } else {
        markerX = Math.round(X);
        markerY = Math.round(Y);
      }

      ctx.beginPath();
      ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();

      const unixTs = Date.now();
      const isoTs = new Date(unixTs).toISOString();

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error(`[capture ${state.captureChannel}] screenshot blob creation failed`);
          return;
        }

        const formData = new FormData();
        formData.append('screenshot', blob, 'screenshot.jpeg');
        formData.append('X', markerX);
        formData.append('Y', markerY);
        formData.append('userId', userId);
        formData.append('challenge', challenge || '');
        formData.append('click', click ? 'true' : 'false');
        formData.append('screenshot_unix', unixTs);
        formData.append('screenshot_iso', isoTs);

        formData.append('screenshot_width', viewportWidth);
        formData.append('screenshot_height', viewportHeight);
        formData.append('video_width', video.videoWidth);
        formData.append('video_height', video.videoHeight);
        formData.append('viewport_width', viewportWidth);
        formData.append('viewport_height', viewportHeight);

        formData.append('capture_channel', state.captureChannel || 'unknown');
        formData.append('visibility_state', document.visibilityState);
        formData.append('is_active_tab', shouldCaptureFromThisTab() ? 'true' : 'false');

        fetch(`${urlBasePath}save_screenshot.php`, {
          method: 'POST',
          mode: 'cors',
          body: formData
        })
          .then(r => r.json())
          .catch(err => console.error(`[capture ${state.captureChannel}] error uploading screenshot:`, err));
      }, 'image/jpeg', 0.35);
    } catch (err) {
      console.error(`[capture ${state.captureChannel}] screenshot capture failed:`, err);
    }
  }

  // Periodic batch and upload
  function sendEventsToServer() {
    if (state.eventQueue.length) {
      const form = new URLSearchParams();
      form.append('challenge', challenge || '');
      form.append('userId', userId);
      form.append('events', JSON.stringify(state.eventQueue));
      form.append('capture_channel', state.captureChannel || 'unknown');

      fetch(`${urlBasePath}save_events.php`, { method: 'POST', body: form })
        .then(r => r.json())
        .catch(e => console.error('Events upload error:', e));

      state.eventQueue.length = 0;
    }

    const calibrated = ls.get('webgazerCalibrated') === 'true';
    if (calibrated && state.gazeQueue.length) {
      if (!state.startedFlag) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        state.gazeQueue.unshift({
          x: centerX,
          y: centerY,
          timestamp: -1,
          absoluteTimestamp: -1
        });
        state.startedFlag = true;
        ls.set('started', 'true');
      }

      const gazePayload = state.gazeQueue.slice();

      const form = new URLSearchParams();
      form.append('challenge', challenge || '');
      form.append('userId', userId);
      form.append('gazeData', JSON.stringify(gazePayload));
      form.append('capture_channel', state.captureChannel || 'unknown');
      form.append('visibility_state', document.visibilityState);
      form.append('is_active_tab', shouldCaptureFromThisTab() ? 'true' : 'false');

      fetch(`${urlBasePath}save_gaze.php`, { method: 'POST', body: form })
        .then(r => r.json())
        .catch(e => console.error('Gaze upload error:', e));

      if (shouldCaptureFromThisTab()) {
        const currentPoint = gazePayload[gazePayload.length - 1];
        if (currentPoint && currentPoint.absoluteTimestamp !== -1) {
          takeScreenshot(currentPoint.x, currentPoint.y, false);
        }
      }

      state.gazeQueue.length = 0;
    }
  }

  // ---------- Lifecycle ----------
  function start() {
    if (state.running) return;

    if (isTimedOut()) {
      showIframeBlockingMessage(timeoutMessageText(), { showRetry: false });
      return;
    }

    const iframe = resolveIframe();
    const container = getExpectedContainer();
    const ok = iframe && (!container || container.contains(iframe));

    if (!ok) {
      console.warn('No matching iframe under expected container; start() ignored.');
      return;
    }

    touchPresence();
    sweepStalePeers();
    state.presenceTimer = setInterval(() => {
      touchPresence();
      sweepStalePeers();
    }, HEARTBEAT_MS);

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', logVisibilityState);

    runWebGazer();
    attachIframeListeners();
    setupMessageHandler();

    if (!state.intervalId) {
      state.intervalId = setInterval(sendEventsToServer, tickMs);
    }

    state.running = true;
    scheduleExpiryAlarm();

    window.addEventListener('beforeunload', onPageHide, { once: true });
  }

  function stop() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }

    if (state.msgHandler) {
      window.removeEventListener('message', state.msgHandler);
      state.msgHandler = null;
    }

    if (state.iframeMutationObserver) {
      state.iframeMutationObserver.disconnect();
      state.iframeMutationObserver = null;
    }

    if (state.bannerObserver) {
      state.bannerObserver.disconnect();
      state.bannerObserver = null;
    }

    if (state.bannerReadyObserver) {
      state.bannerReadyObserver.disconnect();
      state.bannerReadyObserver = null;
    }

    state.cleanupFns.splice(0).forEach(fn => {
      try { fn(); } catch {}
    });

    state.running = false;
    clearExpiryAlarm();

    if (state.presenceTimer) {
      clearInterval(state.presenceTimer);
      state.presenceTimer = null;
    }

    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', logVisibilityState);
    localStorage.removeItem(presenceKey());

    stopTabCapture();

    sweepStalePeers();
    if (countLivePeers() === 0) {
      clearCalibrationKeys();
      clearTimerKeys();
    }
  }

  function destroy() {
    stop();

    if (state.domObserver) {
      state.domObserver.disconnect();
      state.domObserver = null;
    }

    try {
      webgazer?.end?.();
    } catch {}

    document.querySelector('.calibrationDiv')?.remove();
    document.querySelector('.calibrationBackground')?.remove();
  }

  function onPageHide() {
    try {
      stop();
    } catch {}
  }

  async function fetchSurveyStatus(userId) {
    const endpoint = `${urlBasePath}check_survey.php?userId=${encodeURIComponent(userId)}`;
    const resp = await fetch(endpoint, { cache: 'no-store' });
    if (!resp.ok) throw new Error('network error');
    return resp.json();
  }

  let surveyPollTimer = null;

  async function gateAndMaybeStart(manual = false) {
    if (state.running) return;

    if (isTimedOut()) {
      markTimedOut();
      recordCompletionOnce('timed out');
      showIframeBlockingMessage(timeoutMessageText(), { showRetry: false });
      return;
    }

    if (surveyPollTimer) {
      clearTimeout(surveyPollTimer);
      surveyPollTimer = null;
    }

    try {
      const data = await fetchSurveyStatus(userId);
      if (!data?.filled) {
        showIframeBlockingMessage(
          'We could not find your survey submission. ' +
          'Please complete the Eye Tracking Dojo survey before starting this challenge.'
        );
        surveyPollTimer = setTimeout(() => gateAndMaybeStart(false), 2000);
        return;
      }

      const assignedVersion = data.version;

      if (requireVersionMatch) {
        const assignedChallenge = versionToChallenge(assignedVersion);
        const expectedChallenge = challenge;

        if (expectedChallenge !== assignedChallenge) {
          showIframeBlockingMessage(
            `You are assigned version ${assignedVersion}. ` +
            `(expected here: ${expectedChallenge}). Please open "${assignedChallenge}" instead.`
          );
          surveyPollTimer = setTimeout(() => gateAndMaybeStart(false), 2000);
          return;
        }
      }

      hideIframeBlockingMessage();
      start();
      scheduleExpiryAlarm();
    } catch (err) {
      console.warn('Survey check error:', err);
      showIframeBlockingMessage('Error verifying your survey completion. Click "Retry check" to try again.');
    }
  }

  function showNotice(el, text) {
    el.textContent = text;
    el.style.display = 'block';
    el.style.fontWeight = '700';
    el.style.color = '#c00000';
    el.style.background = '#fff';
    el.style.padding = '10px 12px';
    el.style.border = '1px solid #c00000';
    el.style.borderRadius = '6px';
  }

  async function checkBanner() {
    const el = document.getElementById(bannerElId);
    if (!el) return;

    try {
      const endpoint = `${urlBasePath}check_survey.php?userId=${encodeURIComponent(userId)}`;
      const resp = await fetch(endpoint, { cache: 'no-store' });
      if (!resp.ok) throw new Error('network error');

      const { filled, version } = await resp.json();
      if (!filled) {
        showNotice(el, 'We could not find your survey submission. Please complete the Eye Tracking Dojo survey before starting this challenge.');
        return null;
      }

      const assigned = versionToChallenge(version);

      if (requireVersionMatch && assigned !== challenge) {
        showNotice(
          el,
          `This page isn’t your assigned version. Assigned: ${assigned}. ` +
          `You are currently on: ${challenge}. Please open ${assigned} instead.`
        );
        return null;
      }

      el.textContent = '';
      el.style.display = 'none';
      return version;
    } catch (err) {
      console.warn('Survey check error:', err);
      const el2 = document.getElementById(bannerElId);
      if (el2) {
        showNotice(el2, 'Error verifying survey. Please try again.');
      }
      return null;
    }
  }

  function autoStart() {
    if (state.domObserver) return;

    const reconcile = () => {
      ensureBannerWatcher();

      const iframe = resolveIframe();
      const container = expectedContainerId ? document.getElementById(expectedContainerId) : null;
      const ok = iframe && (!container || container.contains(iframe));

      if (ok && !state.running) {
        gateAndMaybeStart(false);
      } else if (!ok && state.running) {
        stop();
      } else if (!ok) {
        hideIframeBlockingMessage();
      }
    };

    reconcile();

    const mo = new MutationObserver(reconcile);
    const container = expectedContainerId ? document.getElementById(expectedContainerId) : null;
    mo.observe(container || document.documentElement, { childList: true, subtree: true });
    state.domObserver = mo;
  }

  return { start, stop, destroy, autoStart, checkBanner };
}


if(window.location.pathname.includes("workspace") || window.location.pathname.includes("sensai")){
  (async function loadEyeTracker() {
    try {
      await loadScript('https://huang.isis.vanderbilt.edu/static/eye/html2canvas.min.js');
      await loadScript('https://huang.isis.vanderbilt.edu/static/eye/webgazer.js');
    } catch (err) {
      console.error('Failed to load eye libraries:', err);
    }

    const tracker = createTracker({
      iframeId: 'workspace-iframe',
      iframeSelector: '#workspace-iframe, #workspace_iframe',
      challenge: window.challenge?.challenge_id,
      bannerElId: null, // div above for checking if the user is allowed to take this challenge; no longer needed
      // for checking if this is the challenge that was started; if only one challenge in the module, leave it null
      expectedContainerId: null, 
      requireVersionMatch: false,
      challengeTimeMinutes: 25,
      urlBasePath: 'https://huang.isis.vanderbilt.edu/skyler/',
      userId: init.userId,             // pwn.college provides this
      tickMs: 5000,                    // batch interval
      minAccuracy: 85,                  // calibration threshold
      allowCalibrationSkip: true,
    });

    tracker.autoStart();
  })();
}
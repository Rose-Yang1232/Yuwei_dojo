# IMPORTANT! You must use the GUI Desktop Workspace for this Challenge!
Click `Workspace` in the ribbon above after starting the challenge.

# Challenge Instructions
In the 1990s, the wise designers of the web invented JavaScript to make websites more interactive.
JavaScript lives alongside your HTML, and makes things interesting.
For example, this turns your browser into a clock:

```html
<html>
  <body>
    <script>
      document.body.innerHTML = Date();
    </script>
  </body>
</html>
```

Basically, the HTML `<script>` tag tells the browser that what is inside that tag is JavaScript, and the browser executes it.

This application is vulnerable to _Cross Site Scripting_.
This means that you can trick a victim user into running JavaScript that you convince the webpage to display to that user.

The webserver program is `/challenge/server`.
When you open the GUI desktop workspace, the server and victim will automatically spin up to run in the background. You can view the resulting page in a firefox window that will appear on the right.
We recommend reading through the victim's code in the terminal on the left to understand what it is doing and how you can force it to give you the flag! Note that the victim's code in this terminal has had the imports and other unimportant code removed.


----
**DEBUGGING:**
Before you start assuming something is wrong, `try reloading the webpage` in the firefox browser. Since this webpage doesn't poll or stream content, new posts may not appear until you reload the page.
Otherwise, two main things can go wrong here.

1. First, you might not be injecting your `<script>` tag properly.
   You should check this similar to the debugging path of the previous challenge: bring it up in Firefox and View Source or Inspect Element to make sure it looks correct.
2. Second, your actual JavaScript might be buggy.
   JavaScript errors will show up on your Firefox console.
   Pull up the web development console in the DOJO's Firefox, load the page, and see if anything has gone wrong!
   If it hasn't, consider resorting to print-debugging inside JavaScript (you can print to the console with, e.g., `console.log("wtf")`.

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

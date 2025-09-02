# IMPORTANT! You must use the GUI Desktop Workspace for this Challenge!

# Challenge Instructions

This application is vulnerable to a _SQL injection_.
A SQL injection, conceptually, is to SQL what a Command Injection is to the shell.
In Command Injections, the application assembled a command string, and a gap between the developer's intent and the command shell's actual functionality enabled attackers to carry out actions unintended by the attacker.
A SQL injection is the same: the developer builds the application to make SQL queries for certain goals, but because of the way these queries are assembled by the application logic, the resulting actions of the SQL query, when executed by the database, can be disastrous from a security perspective.

The quintessential SQL injection adds a condition so that an application can succeed without knowing the password.
How can you accomplish this?

The webserver program is `/challenge/server`.
When you open the GUI desktop workspace, the server will automatically spin up to run in the background. You can access it using the firefox window at the bottom of the screen.
We recommend reading through the server's code (particularly the endpoints) in the left and right terminals to understand what it is doing. From this, you can bypass this authentication to log in as the `admin` user and get the flag! Please note that the code in the windows has been *slightly* modified from the server code that is running the webpage so that the code you are reading will fit on the screen. It is not different in any way that will affect the exploit, however.

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





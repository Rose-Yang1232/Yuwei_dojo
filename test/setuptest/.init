#!/usr/bin/exec-suid -- /bin/bash


# Open Firefox on the left side of the screen (960x1080 at 0,0)
firefox --window-size=960,1080 --window-position=0,0 &

# Wait for Firefox to launch
sleep 2

# Open a terminal on the right side of the screen (80x24 rows/columns, position right half)
#gnome-terminal --geometry=80x24+960+0 -- bash -c "cd /challenge; echo 'Flag Contents:'; cat /flag; exec bash"
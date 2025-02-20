#!/bin/bash
# Ensure the script can access the GUI
export DISPLAY=:1  # Use :1 for noVNC

# Wait for the GUI to load completely
sleep 2

# Check if a terminal is already open
if wmctrl -l | grep -q "Terminal"; then
    echo "Terminal is already running. Exiting script."
    exit 0
fi

# Open terminal if no terminal is found
xfce4-terminal &

# Wait for it to launch
sleep 2

# Move the terminal to the right half of the screen
wmctrl -r "Terminal" -e 0,960,0,960,1080

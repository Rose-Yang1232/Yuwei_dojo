#!/bin/bash
sleep 2

# Open terminal
xfce4-terminal &

# Wait for terminal to open
sleep 2

# Move terminal to the right half
wmctrl -r "Xfce Terminal" -e 0,960,0,960,1080

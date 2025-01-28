#!/usr/bin/exec-suid -- /bin/bash

# Ensure Firefox and a terminal are installed
if ! command -v firefox >/dev/null; then
  echo "Error: Firefox is not installed. Please install it and try again."
  exit 1
fi

if ! command -v gnome-terminal >/dev/null; then
  echo "Error: gnome-terminal is not installed. Please install it and try again."
  exit 1
fi

# Open Firefox
firefox &

# Wait for Firefox to launch
sleep 5

# Get the Firefox window ID
firefox_window=$(xdotool search --name "Mozilla Firefox" | head -n 1)
screen_width=$(xdpyinfo | grep dimensions | awk '{print $2}' | cut -d'x' -f1)
screen_height=$(xdpyinfo | grep dimensions | awk '{print $2}' | cut -d'x' -f2)

# Move Firefox to the left half of the screen
xdotool windowmove "$firefox_window" 0 0
xdotool windowsize "$firefox_window" $((screen_width / 2)) $screen_height

# Open a terminal in the /challenge directory
gnome-terminal -- bash -c "cd /challenge; echo 'Flag Contents:'; cat /flag; exec bash" &

# Wait for the terminal to launch
sleep 2

# Get the terminal window ID
terminal_window=$(xdotool search --name "Terminal" | head -n 1)

# Move the terminal to the right half of the screen
xdotool windowmove "$terminal_window" $((screen_width / 2)) 0
xdotool windowsize "$terminal_window" $((screen_width / 2)) $screen_height

echo "Setup complete! Firefox is on the left and a terminal is on the right."

cat /flag

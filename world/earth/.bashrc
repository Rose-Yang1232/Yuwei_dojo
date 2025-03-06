# Ensure this only runs in interactive sessions
# if [[ $- == *i* ]]; then
    # Wait a few seconds to ensure XFCE is ready
    sleep 3

    # Launch terminal
    xfce4-terminal &

    # Wait and resize the terminal
    sleep 2
    WINDOW_ID=$(wmctrl -l | grep -i "terminal" | awk '{print $1}' | tail -n 1)
    if [ ! -z "$WINDOW_ID" ]; then
        wmctrl -i -r $WINDOW_ID -e 0,100,100,1200,800
    fi
# fi

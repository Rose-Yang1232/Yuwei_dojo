# Use the official Ubuntu as the base image
FROM ubuntu:24.04

# Set the environment variable to avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies (adjust these as needed for your application)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    python3 \
    python3-pip \
    git \
    tmux \
    x11-utils \
    xinput \
    firefox \
    net-tools \
    wmctrl \
    xfce4-terminal \ 
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy the application files from your local machine to the container
COPY . /app

# # Copy the setup script to enforce the desktop layout
# COPY setup_layout.sh /etc/profile.d/setup_layout.sh
# RUN chmod +x /etc/profile.d/setup_layout.sh

# # Ensure DISPLAY is set when the container starts (for noVNC)
# RUN echo "export DISPLAY=:0" >> /root/.bashrc
# # Install Python dependencies if there’s a requirements.txt (optional)
# RUN pip3 install -r requirements.txt

# Specify the command to run your application (adjust as necessary)
CMD ["bash"]

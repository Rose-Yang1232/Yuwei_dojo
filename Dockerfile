FROM ubuntu:20.04

# Set environment variables to disable interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Update and install required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    python3 \
    python3-pip \
    git \
    tmux \
    x11-utils \
    wmctrl \
    firefox \
    net-tools \
    openbox \
    xfce4-terminal \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy application files from local machine to container
COPY . /app

# Default command: open a shell when container starts
CMD ["bash"]


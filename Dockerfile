FROM node:18

# Install chromium + ffmpeg
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    ffmpeg \
    --no-install-recommends

# Set working directory
WORKDIR /app

# Copy package files first (cache layer)
COPY package*.json ./

RUN npm install

# Copy project files
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

CMD ["npm", "start"]

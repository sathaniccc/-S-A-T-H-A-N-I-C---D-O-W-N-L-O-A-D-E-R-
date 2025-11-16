FROM node:20

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    ffmpeg \
    --no-install-recommends

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

CMD ["npm", "start"]

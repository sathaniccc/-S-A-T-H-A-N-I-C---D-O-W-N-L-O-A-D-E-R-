FROM node:18

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    ffmpeg \
    --no-install-recommends

WORKDIR /app
COPY . .
RUN npm install

ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

CMD ["npm", "start"]￼Enter

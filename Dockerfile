# Use the official Node.js 14 image
FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget

# Expose port
EXPOSE 8081

# Run the server
CMD ["node", "server.js"]

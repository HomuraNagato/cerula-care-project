FROM node:22-bookworm

# Install dependencies outside /home so volume mount won't overlay them
WORKDIR /deps
COPY package.json package-lock.json* ./
RUN npm install

# Set NODE_PATH so Node.js finds the modules
ENV NODE_PATH=/deps/node_modules
ENV PATH="/deps/node_modules/.bin:$PATH"

WORKDIR /home

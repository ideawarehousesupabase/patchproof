# Use the official Puppeteer image which comes with all necessary system dependencies pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to configure the environment and install dependencies
USER root

# Set the working directory
WORKDIR /app

# Ensure Puppeteer skips downloading a local copy of Chromium 
# because the base image already has it installed globally
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Expose port 3001 (Render will automatically inject its own PORT variable)
ENV PORT=3001
EXPOSE 3001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code to standard JavaScript
RUN npm run build

# Change ownership of the app directory to the non-root user
RUN chown -R pptruser:pptruser /app

# Switch back to the secure non-root user provided by the Puppeteer image
USER pptruser

# Start the backend server
CMD ["npm", "start"]

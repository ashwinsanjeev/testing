# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .
# Build the application (if applicable, e.g., for React or Angular apps)
EXPOSE 5000

# Start the server (assuming app.js is your main server file)
CMD ["node", "app.js"]


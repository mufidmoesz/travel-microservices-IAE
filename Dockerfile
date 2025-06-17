FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Copy the start script
COPY start.sh ./
RUN chmod +x ./start.sh

# Start the app with DB init and seeding
CMD ["./start.sh"]

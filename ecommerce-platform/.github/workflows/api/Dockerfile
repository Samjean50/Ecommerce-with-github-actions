                # backend/Dockerfile
                FROM node:18

                # Set working directory
                WORKDIR /app

                # Copy package files and install dependencies
                COPY package*.json ./
                RUN npm install

                # Copy the rest of the backend source code
                COPY . .

                # Expose backend port (adjust if not 3000)
                EXPOSE 3000

                # Start the backend server
                CMD ["node", "server.js"]
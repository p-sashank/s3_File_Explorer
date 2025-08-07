# Stage 1: Build the React application
FROM node:lts-alpine as builder

# Set the working directory
WORKDIR /app/frontend

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./
RUN npm install --silent

# Copy the rest of the frontend source code
COPY . ./

# Build the React app for production
RUN npm run build

# Stage 2: Serve the React application with Nginx (a lightweight web server)
FROM nginx:alpine

# Copy the built React app from the builder stage to Nginx's HTML directory
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Expose port 80 (Nginx's default HTTP port)
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
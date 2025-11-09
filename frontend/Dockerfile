# frontend/Dockerfile

# Stage 1: Build the React/Vite application
FROM node:20-alpine as build
WORKDIR /app
COPY package.json .
COPY package-lock.json .
# Install dependencies
RUN npm install
COPY . .
# The default build command for Vite is 'npm run build', which outputs to 'dist'
RUN npm run build 

# Stage 2: Serve the built static files with NGINX
FROM nginx:alpine
# Copy the built files from the 'dist' folder in the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html
# Remove the default NGINX configuration
RUN rm /etc/nginx/conf.d/default.conf
# Copy the custom NGINX configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
FROM node:alpine

VOLUME ["/etc/nginx/sites-enabled", "/etc/nginx/certs", "/etc/nginx/conf.d", "/var/log/nginx", "/var/www/html"]

RUN apk add --update nginx python build-base

# Install Nginx.
RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf

RUN mkdir -p /app
ADD . /app
WORKDIR /app

# Build frontend
RUN npm install --quiet && npm run build:production

# Copy frontend build to /usr/share/nginx/html
RUN mkdir -p /usr/share/nginx/html
RUN cp -R build/* /usr/share/nginx/html

CMD ["nginx"]

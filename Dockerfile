# Backstroke Dockerfile
# Run me like: docker build -t backstroke .
FROM node:6.6.0
MAINTAINER Ryan Gaus "rgaus.net"
EXPOSE 8000

# Create a user to run the app
RUN useradd -m -s /bin/bash app

# Setup a place to put the app
RUN mkdir /app && \
    chmod 755 /app && \
    chown -R app:app /app

USER app

# pull down source and set it up
Add . /app
RUN cd /app && npm install

# add node to the path
ENV NODE_ENV production
ENV PORT 8000
ENV BACKSTROKE_SERVER https://backstroke.us
ENV MONGODB_URI mongodb://mongodb:27017

# build frontend for production
RUN cd /app && npm run build:production

# Run the app
CMD cd /app && npm start

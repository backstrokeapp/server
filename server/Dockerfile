FROM node:6.6.0
MAINTAINER Ryan Gaus "rgaus.net"
EXPOSE 8000

# Create a user to run the app and setup a place to put the app
RUN useradd -m -s /bin/sh app && \
  mkdir /app && \
  chmod 755 /app && \
  chown -R app:app /app

USER app
WORKDIR /app

# pull down source and set it up
ADD . /app
RUN npm install --quiet

# add node to the path
ENV NODE_ENV=production \
    PORT=8000 \
    BACKSTROKE_SERVER=https://backstroke.us \
    MONGODB_URI=mongodb://mongodb:27017

# Run the app
CMD npm start

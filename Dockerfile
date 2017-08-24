FROM node:7.6-alpine
MAINTAINER Ryan Gaus "rgaus.net"

# Create a user to run the app and setup a place to put the app
COPY . /app
RUN rm -rf /app/node_modules

WORKDIR /app

# Set up packages
RUN yarn

# Run the app
CMD yarn start

if [ "$NODE_ENV" = "production" ]; then
  USE_MIXPANEL='' npm run coverage && npm run build:production
fi

# make ci happy
if [ "$NODE_ENV" = "test" ]; then
  exit 0
fi

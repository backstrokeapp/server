#!/bin/bash
set +x
HOST="root@67.205.187.179"
TEMP="$(mktemp -d)"

echo "* Initializing server..."
ssh $HOST "mkdir -p /app/server /app/site /app/dashboard && chown -R root:www-data /app && chmod -R 775 /app"

echo "* Compressing backend..."
cd .. && tar --exclude='./node_modules' -cvf $TEMP/backend.tar.gz backend/

echo "* Sending backend..."
scp $TEMP/backend.tar.gz $HOST:/tmp/backend.tar.gz

rm -rf $TEMP

echo "* Installing nginx"
ssh $HOST <<END
sudo apt-get install nginx

# For api.backstroke.us
cat <<EOF > /etc/nginx/sites-enabled/api
server {
  server_name api.backstroke.us;
  listen 80;

  location / {
    proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \\\$http_x_forwarded_proto;
    proxy_set_header Host \\\$http_host;
    proxy_set_header X-Real-IP \\\$remote_addr;
    proxy_redirect off;
    proxy_pass http://localhost:8000;
  }
}
EOF

# For app.backstroke.us
cat <<EOF > /etc/nginx/sites-enabled/app
server {
  server_name app.backstroke.us;
  listen 80;
  root /app/dashboard;
  index index.html;

  location / {
    try_files \\\$uri \\\$uri/ =404;
  }
}
EOF

systemctl restart nginx
END

echo "* Uncompressing, setting up and booting server..."
ssh $HOST <<END
cd /tmp
tar xf backend.tar.gz
rm -rf /app/server.previous/
mv /app/server /app/server.previous/
mv /tmp/backend/ /app/server/

# Install nvm
sudo apt-get update
sudo apt-get install -y build-essential libssl-dev curl git
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
. "\$HOME/.nvm/nvm.sh"

# Install node, yarn, and pm2
nvm install v6
echo "node -v = \$(node -v)"
echo "npm -v = \$(npm -v)"
[ -f \$(which yarn) ] || npm i -g yarn
[ -f \$(which pm2) ] || npm i -g pm2

source /app/server.env

# Set up backend
cd /app/server
[ -f \$(which babel) ] || npm i -g babel-cli
yarn

babel src/ -d dist/
pm2 delete server
pm2 start dist/server.js --name server
END

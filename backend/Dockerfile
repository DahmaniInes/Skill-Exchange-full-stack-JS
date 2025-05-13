FROM node:18.20.8

WORKDIR /app

COPY package*.json ./

# Installer les outils nécessaires pour compiler bcrypt
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Installer les dépendances et recompiler bcrypt
RUN npm install && npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
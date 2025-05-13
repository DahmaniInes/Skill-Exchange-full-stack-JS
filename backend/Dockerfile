# Dockerfile pour le backend (Express)
FROM node:18
WORKDIR /app
COPY package*.json ./


# Installer les outils nécessaires pour compiler bcrypt
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Installer les dépendances et forcer la recompilation de bcrypt
RUN npm install && npm rebuild bcrypt --build-from-source

#RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
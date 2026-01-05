# ================== STAGE 1: Build ==================
FROM node:20-bullseye AS build
WORKDIR /app

# Copier package.json et tsconfig.json
COPY package*.json tsconfig.json ./

# Installer toutes les dépendances
RUN npm install

# Copier le code source
COPY src ./src

# Compiler TypeScript
RUN npx tsc

# ================== STAGE 2: Production ==================
FROM node:20-bullseye AS production
WORKDIR /app

# Copier uniquement les fichiers nécessaires pour exécuter le serveur
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --omit=dev

# Définir la commande pour lancer le serveur
CMD ["node", "dist/server.js"]

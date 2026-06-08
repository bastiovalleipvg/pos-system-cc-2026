FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instala todas las dependencias (Next necesita devDependencies para compilar)
RUN npm install

COPY . .

# Compila la aplicación optimizada
RUN npm run build

EXPOSE 3000

# Arranca en modo producción real
CMD ["npm", "start"]

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instala todas las dependencias (Next necesita devDependencies para compilar)
RUN npm install

COPY . .

# 1. Declarar que recibiremos un argumento durante el build
ARG NEXT_PUBLIC_API_URL

# 2. Convertir ese argumento en variable de entorno para que Next.js lo lea al compilar
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Compila la aplicación optimizada
RUN npm run build

EXPOSE 3000

# Arranca en modo producción real
CMD ["npm", "start"]

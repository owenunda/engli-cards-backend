# Usa la versión LTS actual
FROM node:22.21.0-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crea usuario no-root (mejor seguridad)
RUN addgroup -S app && adduser -S -G app app

WORKDIR /app

# Copiamos package-lock y package.json para reproducibilidad
COPY package*.json ./

# Instalamos todas las dependencias (necesarias para build)
RUN npm ci

# Copiamos el código fuente
COPY . .

# Compilamos la aplicación NestJS
RUN npm run build

# Eliminamos devDependencies para producción
RUN npm ci --omit=dev && npm cache clean --force

# Cambiamos permisos y usuario
RUN chown -R app:app /app
USER app

# Puerto de la aplicación NestJS
EXPOSE 3000

# Variables de entorno por defecto seguras
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck para Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de arranque usando dumb-init y el build compilado
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]
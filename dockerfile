# ----------------------------------------------------
# 1. ETAPA DE CONSTRUCCIÓN (Builder Stage)
# Responsable de instalar todas las dependencias (incluyendo dev) y compilar la aplicación.
# ----------------------------------------------------
FROM node:22.21.0-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# 1. Copia solo los archivos de manifiesto para aprovechar el caché de npm/yarn
COPY package*.json ./
# 2. Copia los archivos de configuración esenciales para el build
COPY tsconfig.json ./
COPY tsconfig.build.json ./
# Si tienes nest-cli.json, cópialo también:
# COPY nest-cli.json ./

# Instala todas las dependencias (necesarias para la compilación)
RUN npm ci

# Copia el código fuente restante (src/, test/, etc.)
# Esto incluye todo lo que NO fue excluido por tu .dockerignore corregido.
COPY . .

# Compila la aplicación NestJS, generando la carpeta 'dist'
RUN npm run build


# ----------------------------------------------------
# 2. ETAPA DE PRODUCCIÓN (Production Stage)
# Imagen final, solo contiene el código compilado y las dependencias de producción.
# ----------------------------------------------------
FROM node:22.21.0-alpine

# Instalar dumb-init para un manejo correcto de las señales (PID 1)
RUN apk add --no-cache dumb-init curl

# Crea usuario no-root 'app' para seguridad
RUN addgroup -S app && adduser -S -G app app

WORKDIR /app

# Copia SÓLO los archivos requeridos para la ejecución desde la etapa 'builder':
# 1. Copia node_modules (Docker copia solo las dependencias de producción si se configuró en el builder)
COPY --from=builder /app/node_modules ./node_modules
# 2. Copia el código compilado (el resultado del 'npm run build')
COPY --from=builder /app/dist ./dist
# 3. Copia package.json (necesario para la ejecución)
COPY --from=builder /app/package.json ./package.json

# Cambia la propiedad de la carpeta y establece el usuario para la ejecución
RUN chown -R app:app /app
USER app

# Puerto de la aplicación NestJS
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck para Docker (asegúrate de que el endpoint /health esté implementado en tu app)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de arranque (usando dumb-init)
ENTRYPOINT ["dumb-init", "--"]
# Nota: node dist/main es más directo y eficiente que usar 'npm run start:prod'
CMD ["node", "dist/main"]

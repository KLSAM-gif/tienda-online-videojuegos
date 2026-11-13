# Sirve el frontend estático. Cuando exista el backend (Spring Boot + MySQL)
# se añadirá un docker-compose con los servicios api y db.
FROM nginx:1.27-alpine
COPY . /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/.dockerignore /usr/share/nginx/html/README.md
EXPOSE 80

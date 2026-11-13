# Gaming Store

Tienda digital de videojuegos para PC, Xbox y PlayStation, accesorios y productos físicos, con un programa de fidelización llamado *Gaming Points*.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- PHP 8.2
- MySQL 8.0
- Docker y Docker Compose
- Git y GitHub

## Requisitos

Para ejecutar el proyecto se necesita:

- Docker Desktop instalado y en funcionamiento.
- Git para clonar el repositorio.
- Un archivo .env con las variables de conexión a la base de datos.

## Cómo descargar el proyecto

Clonar el repositorio desde GitHub:

bash
git clone https://github.com/KLSAM-gif/tienda-online-videojuegos.git


Entrar a la carpeta:

bash
cd tienda-online-videojuegos


## Configuración de variables de entorno

Crear un archivo llamado .env en la carpeta principal del proyecto, tomando como referencia el archivo .env.example.

Configurar las siguientes variables:

env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=gamingstore
DB_USER=root
DB_PASSWORD=


Al ejecutar Docker Compose, la aplicación utiliza el nombre del servicio db para comunicarse con MySQL.

*Importante:* El archivo .env contiene información de configuración privada y no debe subirse a GitHub. Está excluido mediante .gitignore y .dockerignore.

## Ejecución con Docker

El proyecto utiliza Docker Compose para ejecutar dos servicios:

- *app:* contiene PHP 8.2 y Apache, donde se ejecuta la aplicación.
- *db:* contiene MySQL 8.0, donde se almacenan los datos.

Para construir las imágenes y levantar los servicios, ejecutar:

bash
docker compose up -d --build


Para comprobar que los contenedores estén funcionando:

bash
docker compose ps


Abrir la aplicación en el navegador:

text
http://localhost:8080


Para comprobar el funcionamiento de la API:

text
http://localhost:8080/api/?action=health


La respuesta debe mostrar que la conexión con la base de datos funciona correctamente, junto con información de productos, recompensas, plataformas y requisitos.

Para detener los servicios:

bash
docker compose down


Los datos de MySQL se conservan en un volumen de Docker llamado gamingstore_data.

## Base de datos

El proyecto utiliza MySQL y necesita contar con las tablas correspondientes para que la API pueda realizar sus consultas.

Al ejecutar el proyecto por primera vez, se debe importar una copia de la base de datos al servicio MySQL. Esta copia debe obtenerse de una exportación SQL del proyecto.

El archivo de respaldo debe mantenerse fuera del repositorio si contiene información privada o datos de usuarios.

## Reglas de Gaming Points

- Se obtiene 1 punto por cada $10 MXN pagados.
- Cada punto equivale a $1 MXN de descuento.
- Los puntos se acreditan al confirmar la compra.
- Los pagos realizados con puntos o cupones no generan puntos.
- No se pueden utilizar más puntos de los disponibles ni superar el total de la compra.
- Al cancelar o reembolsar un pedido se revierten los puntos correspondientes.
- Los niveles Bronce, Plata, Oro y Diamante dependen de los puntos acumulados.

## Estructura del proyecto

text
GamingStore/
├── api/
│   ├── config.php
│   └── index.php
├── assets/
├── css/
├── js/
├── pages/
├── index.html
├── login.html
├── register.html
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── .env.example
└── README.md


## API y servicios

La API está desarrollada en PHP y permite realizar operaciones relacionadas con la información de la tienda y la base de datos.

La conexión se realiza mediante PDO, utilizando variables de entorno para configurar el acceso a MySQL.

El endpoint de comprobación permite verificar que el servicio PHP puede consultar la base de datos.

## Uso de GitHub

El código fuente del proyecto se encuentra disponible en:

https://github.com/KLSAM-gif/tienda-online-videojuegos

Para descargar los cambios más recientes:

bash
git pull


Para consultar los cambios realizados:

bash
git status


## Consideraciones

- No se deben publicar archivos .env ni contraseñas.
- Las credenciales de demostración no deben utilizarse en un entorno de producción.
- Los datos de la base de datos deben importarse antes de probar las operaciones que los necesitan.
- Docker permite ejecutar la aplicación y la base de datos en contenedores separados, facilitando su instalación y ejecución en otros equipos.
-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: gamingstore
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `biblioteca`
--

DROP TABLE IF EXISTS `biblioteca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biblioteca` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint unsigned NOT NULL,
  `producto_id` bigint unsigned NOT NULL,
  `detalle_pedido_id` bigint unsigned NOT NULL,
  `plataforma_id` smallint unsigned NOT NULL,
  `licencia_id` bigint unsigned DEFAULT NULL,
  `adquirido_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descargado` tinyint(1) NOT NULL DEFAULT '0',
  `descargado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_biblioteca_usuario_producto_plataforma` (`usuario_id`,`producto_id`,`plataforma_id`),
  UNIQUE KEY `uq_biblioteca_detalle` (`detalle_pedido_id`),
  KEY `fk_biblio_producto` (`producto_id`),
  KEY `fk_biblio_plataforma` (`plataforma_id`),
  KEY `fk_biblio_licencia` (`licencia_id`),
  CONSTRAINT `fk_biblio_detalle` FOREIGN KEY (`detalle_pedido_id`) REFERENCES `detalle_pedido` (`id`),
  CONSTRAINT `fk_biblio_licencia` FOREIGN KEY (`licencia_id`) REFERENCES `licencias` (`id`),
  CONSTRAINT `fk_biblio_plataforma` FOREIGN KEY (`plataforma_id`) REFERENCES `plataformas` (`id`),
  CONSTRAINT `fk_biblio_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `fk_biblio_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `canjes`
--

DROP TABLE IF EXISTS `canjes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canjes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` bigint unsigned NOT NULL,
  `recompensa_id` bigint unsigned NOT NULL,
  `puntos_costo` int unsigned NOT NULL,
  `codigo_generado` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_generado` decimal(10,2) DEFAULT NULL,
  `estado` enum('generado','pendiente_entrega','entregado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'generado',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_canjes_public_id` (`public_id`),
  KEY `ix_canjes_usuario_fecha` (`usuario_id`,`creado_en`),
  KEY `fk_canje_recompensa` (`recompensa_id`),
  CONSTRAINT `fk_canje_recompensa` FOREIGN KEY (`recompensa_id`) REFERENCES `recompensas` (`id`),
  CONSTRAINT `fk_canje_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracion_niveles`
--

DROP TABLE IF EXISTS `configuracion_niveles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_niveles` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `puntos_minimos` int unsigned NOT NULL,
  `icono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden` tinyint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nivel_codigo` (`codigo`),
  UNIQUE KEY `uq_nivel_orden` (`orden`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracion_tienda`
--

DROP TABLE IF EXISTS `configuracion_tienda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_tienda` (
  `clave` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cupones`
--

DROP TABLE IF EXISTS `cupones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cupones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `tipo` enum('monto_fijo','porcentaje') NOT NULL DEFAULT 'monto_fijo',
  `valor` decimal(10,2) NOT NULL,
  `minimo_compra` decimal(10,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `valido_desde` datetime DEFAULT NULL,
  `valido_hasta` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cupones_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_pedido`
--

DROP TABLE IF EXISTS `detalle_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_pedido` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint unsigned NOT NULL,
  `producto_id` bigint unsigned DEFAULT NULL,
  `producto_public_id` varchar(80) NOT NULL,
  `nombre_producto` varchar(180) NOT NULL,
  `tipo_producto` enum('digital','fisico') NOT NULL,
  `plataforma` varchar(40) DEFAULT NULL,
  `cantidad` int unsigned NOT NULL DEFAULT '1',
  `precio_original` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `total_linea` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_detalle_pedido` (`pedido_id`),
  KEY `ix_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `direcciones_usuario`
--

DROP TABLE IF EXISTS `direcciones_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `direcciones_usuario` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint unsigned NOT NULL,
  `nombre_destinatario` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `calle` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_exterior` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_interior` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `colonia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_postal` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_predeterminada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ix_direcciones_usuario` (`usuario_id`),
  CONSTRAINT `fk_direccion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `envios`
--

DROP TABLE IF EXISTS `envios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `envios` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint unsigned NOT NULL,
  `estado` enum('pendiente','empacado','en_transito','entregado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `paqueteria` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_rastreo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_envio_pedido` (`pedido_id`),
  CONSTRAINT `fk_envio_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gs_estado_usuario`
--

DROP TABLE IF EXISTS `gs_estado_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gs_estado_usuario` (
  `usuario_id` bigint unsigned NOT NULL,
  `estado_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`),
  CONSTRAINT `fk_gs_estado_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gs_estado_usuario_chk_1` CHECK (json_valid(`estado_json`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `licencias`
--

DROP TABLE IF EXISTS `licencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licencias` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint unsigned NOT NULL,
  `clave_cifrada` varbinary(512) NOT NULL,
  `estado` enum('disponible','asignada','revocada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'disponible',
  `asignada_detalle_id` bigint unsigned DEFAULT NULL,
  `asignada_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_licencia_detalle` (`asignada_detalle_id`),
  KEY `ix_licencias_producto_estado` (`producto_id`,`estado`),
  CONSTRAINT `fk_licencia_detalle` FOREIGN KEY (`asignada_detalle_id`) REFERENCES `detalle_pedido` (`id`),
  CONSTRAINT `fk_licencia_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint unsigned NOT NULL,
  `usuario_admin_id` bigint unsigned DEFAULT NULL,
  `tipo` enum('entrada','salida','ajuste','venta','cancelacion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `stock_resultante` int unsigned NOT NULL,
  `referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nota` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_mov_inv_producto_fecha` (`producto_id`,`creado_en`),
  KEY `fk_mov_inv_admin` (`usuario_admin_id`),
  CONSTRAINT `fk_mov_inv_admin` FOREIGN KEY (`usuario_admin_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_mov_inv_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimientos_puntos`
--

DROP TABLE IF EXISTS `movimientos_puntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_puntos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint unsigned NOT NULL,
  `tipo` enum('compra','canje','descuento','reembolso','reversa','ajuste') COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `puntos_delta` int NOT NULL,
  `saldo_resultante` int unsigned NOT NULL,
  `referencia` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pedido_id` bigint unsigned DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_mov_puntos_usuario_fecha` (`usuario_id`,`creado_en`),
  KEY `ix_mov_puntos_pedido` (`pedido_id`),
  CONSTRAINT `fk_mov_puntos_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_mov_puntos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pedido_id` bigint unsigned NOT NULL,
  `metodo` enum('tarjeta','paypal','saldo_puntos','demo','otro') NOT NULL,
  `proveedor` varchar(60) DEFAULT NULL,
  `referencia_externa` varchar(120) DEFAULT NULL,
  `importe` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
  `ultimos_cuatro` varchar(4) DEFAULT NULL,
  `procesado_en` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_pagos_pedido` (`pedido_id`),
  CONSTRAINT `fk_pago_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(40) NOT NULL,
  `usuario_id` bigint unsigned NOT NULL,
  `estado` enum('pendiente','confirmado','procesando','enviado','entregado','cancelado','reembolsado') NOT NULL DEFAULT 'pendiente',
  `subtotal` decimal(10,2) NOT NULL,
  `descuento_productos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descuento_cupon` decimal(10,2) NOT NULL DEFAULT '0.00',
  `puntos_utilizados` int unsigned NOT NULL DEFAULT '0',
  `descuento_puntos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `correo_entrega` varchar(190) DEFAULT NULL,
  `direccion_nombre` varchar(120) DEFAULT NULL,
  `direccion_calle` varchar(180) DEFAULT NULL,
  `direccion_numero` varchar(60) DEFAULT NULL,
  `direccion_colonia` varchar(100) DEFAULT NULL,
  `direccion_ciudad` varchar(100) DEFAULT NULL,
  `direccion_estado` varchar(100) DEFAULT NULL,
  `direccion_cp` varchar(12) DEFAULT NULL,
  `direccion_telefono` varchar(30) DEFAULT NULL,
  `tiene_fisicos` tinyint(1) NOT NULL DEFAULT '0',
  `tiene_digitales` tinyint(1) NOT NULL DEFAULT '0',
  `etapa_envio` tinyint unsigned NOT NULL DEFAULT '0',
  `cancelado_en` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pedidos_public_id` (`public_id`),
  KEY `ix_pedidos_usuario_fecha` (`usuario_id`,`creado_en`),
  KEY `ix_pedidos_estado` (`estado`),
  CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plataformas`
--

DROP TABLE IF EXISTS `plataformas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plataformas` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plataformas_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `producto_plataforma`
--

DROP TABLE IF EXISTS `producto_plataforma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_plataforma` (
  `producto_id` bigint unsigned NOT NULL,
  `plataforma_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`producto_id`,`plataforma_id`),
  KEY `fk_pp_plataforma` (`plataforma_id`),
  CONSTRAINT `fk_pp_plataforma` FOREIGN KEY (`plataforma_id`) REFERENCES `plataformas` (`id`),
  CONSTRAINT `fk_pp_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(80) NOT NULL,
  `nombre` varchar(180) NOT NULL,
  `descripcion` text,
  `tipo` enum('digital','fisico') NOT NULL,
  `genero` varchar(80) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descuento_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `ventas` int unsigned NOT NULL DEFAULT '0',
  `fecha_lanzamiento` date DEFAULT NULL,
  `calificacion` decimal(3,2) DEFAULT NULL,
  `colores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `imagen_url` text,
  `icono` varchar(30) DEFAULT NULL,
  `stock` int unsigned DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT '1',
  `eliminado_en` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_productos_public_id` (`public_id`),
  KEY `ix_productos_tipo_disponible` (`tipo`,`disponible`),
  KEY `ix_productos_genero` (`genero`),
  CONSTRAINT `productos_chk_1` CHECK (json_valid(`colores`))
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recompensas`
--

DROP TABLE IF EXISTS `recompensas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recompensas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(80) NOT NULL,
  `tipo` enum('cupon','giftcard','wallpaper','especial','accesorio') NOT NULL,
  `nombre` varchar(180) NOT NULL,
  `descripcion` text,
  `costo_puntos` int unsigned NOT NULL,
  `valor_mxn` decimal(10,2) DEFAULT NULL,
  `icono` varchar(30) DEFAULT NULL,
  `colores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_recompensas_public_id` (`public_id`),
  CONSTRAINT `recompensas_chk_1` CHECK (json_valid(`colores`))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `requisitos_sistema`
--

DROP TABLE IF EXISTS `requisitos_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisitos_sistema` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint unsigned NOT NULL,
  `tipo` enum('minimo','recomendado') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sistema_operativo` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `procesador` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `memoria` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `graficos` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `almacenamiento` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otros` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_requisitos_producto_tipo` (`producto_id`,`tipo`),
  CONSTRAINT `fk_requisitos_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `requisitos_sistema_chk_1` CHECK (json_valid(`otros`))
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario_cupones`
--

DROP TABLE IF EXISTS `usuario_cupones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_cupones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint unsigned NOT NULL,
  `cupon_id` bigint unsigned NOT NULL,
  `monto_asignado` decimal(10,2) DEFAULT NULL,
  `origen` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asignado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `utilizado_en` datetime DEFAULT NULL,
  `pedido_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_cupon` (`usuario_id`,`cupon_id`,`id`),
  KEY `ix_usuario_cupon_disponible` (`usuario_id`,`utilizado_en`),
  KEY `fk_uc_cupon` (`cupon_id`),
  KEY `fk_uc_pedido` (`pedido_id`),
  CONSTRAINT `fk_uc_cupon` FOREIGN KEY (`cupon_id`) REFERENCES `cupones` (`id`),
  CONSTRAINT `fk_uc_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_uc_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('customer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `avatar` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_public_id` (`public_id`),
  UNIQUE KEY `uq_usuarios_username` (`username`),
  UNIQUE KEY `uq_usuarios_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-13 19:12:14

# Estructura y Descripción de Archivos del Proyecto

Este documento detalla la estructura y el propósito de cada uno de los archivos existentes en el proyecto **Simple Taxi Fleet Simulator**, desarrollado sobre el framework **LoopBack 4**.

---

## 1. Archivos en la Raíz del Proyecto

### Configuración y Entorno de Ejecución

* **[`package.json`](../package.json)**  
  Manifiesto principal de Node.js. Define los metadatos del proyecto, scripts de ciclo de vida (`build`, `test`, `start`, `migrate`, `openapi-spec`, linter, `test:manual`, `workspace`), dependencias centrales del framework (`@loopback/core`, `@loopback/rest`, `@loopback/repository`, etc.) y dependencias de desarrollo.

* **[`pnpm-lock.yaml`](../pnpm-lock.yaml)**  
  Archivo de bloqueo de dependencias generado por `pnpm`. Fija las versiones exactas instaladas de todo el árbol de dependencias para asegurar builds reproducibles.

* **[`docker-compose.yml`](../docker-compose.yml)**  
  Orquestación de servicios en contenedores locales para desarrollo:
  - **PostgreSQL 16** (`localhost:5432`): Base de datos relacional para `Driver` y `Vehicle`.
  - **Redis 7** (`localhost:6379`): Almacén clave-valor en memoria para `Shift` activos en tiempo real.
  - **MongoDB 7** (`localhost:27017`): Base de datos documental para el archivo histórico inmutable de `ShiftHistory`.

* **[`tsconfig.json`](../tsconfig.json)**  
  Configuración principal del compilador de TypeScript (`lb-tsc`). Extiende `@loopback/build/config/tsconfig.common.json`.

* **[`.eslintrc.js`](../.eslintrc.js)** y **[`.eslintignore`](../.eslintignore)**  
  Configuración y reglas de exclusión para ESLint con estándares estrictos de LoopBack 4 y TypeScript.

* **[`.prettierrc`](../.prettierrc)** y **[`.prettierignore`](../.prettierignore)**  
  Configuración de formato de código Prettier (comillas simples, espaciado de 2 caracteres).

* **[`.mocharc.json`](../.mocharc.json)**  
  Configuración para Mocha con timeout ampliado (10s) para soportar la conexión a los 4 motores de base de datos durante las pruebas.

* **[`Dockerfile`](../Dockerfile)** y **[`.dockerignore`](../.dockerignore)**  
  Contenedor multi-stage de producción para la aplicación.

* **[`api.http`](../api.http)**  
  Colección interactiva de peticiones HTTP organizada por entidad y casos de uso del ciclo de vida del turno (compatible con Kulala en Neovim, REST Client en VS Code y scripts curl).

---

## 2. Herramientas y Scripts (`scripts/`)

* **[`scripts/api-fzf.sh`](../scripts/api-fzf.sh)**  
  Script interactivo en Bash que utiliza `fzf`, `curl` y `jq` como TUI en la terminal para disparar peticiones contra la API sin salir de la consola.

* **[`scripts/workspace.kdl`](../scripts/workspace.kdl)**  
  Layout declarativo de Zellij para abrir Neovim, la API en ejecución y la TUI interactiva en paneles sincronizados.

---

## 3. Directorio de Documentación (`docs/`)

* **[`docs/roadmap.md`](roadmap.md)**  
  Hoja de ruta pedagógica en 9 fases para el aprendizaje e implementación incremental del proyecto (Fundaciones, DataSources, Modelado, Capa HTTP, Inversión de Control, Lógica de Negocio y Geolocalización en Jerez, Pipeline/Sequence, Seguridad y Testing).

* **[`docs/domain-architecture.md`](domain-architecture.md)**  
  Definición técnica del dominio, persistencia políglota, ciclo de vida de turnos, integración con OpenStreetMap Nominatim y despacho en Jerez de la Frontera.

* **[`docs/pnpm-guidelines.md`](pnpm-guidelines.md)**  
  Guía de buenas prácticas y resolución de incidencias al trabajar con `pnpm` en LoopBack 4.

* **[`docs/project-structure.md`](project-structure.md)**  
  Este documento descriptivo del árbol del repositorio.

---

## 4. Código Fuente de la Aplicación (`src/`)

### Módulos Principales de la Aplicación

* **[`src/index.ts`](../src/index.ts)**  
  Punto de entrada (`main`) del runtime de Node.js. Instancia la clase `SimpleTaxiFleetSimulatorApplication`, arranca el ciclo de vida (`app.boot()`, `app.start()`) y gestiona el apagado elegante.

* **[`src/application.ts`](../src/application.ts)**  
  Clase central de la arquitectura LoopBack 4. Hereda de `RestApplication` y compone mixins (`BootMixin`, `RepositoryMixin`, `ServiceMixin`). Configura rutas estáticas, explorador Swagger `/explorer` y convenciones de arranque.

* **[`src/sequence.ts`](../src/sequence.ts)**  
  Pipeline del ciclo de vida de peticiones HTTP (`MiddlewareSequence`).

* **[`src/migrate.ts`](../src/migrate.ts)**  
  Script ejecutable vía `npm run migrate` para sincronizar y crear tablas en PostgreSQL (`driver`, `vehicle`).

* **[`src/openapi-spec.ts`](../src/openapi-spec.ts)**  
  Exportador de la especificación OpenAPI (Swagger) a formato JSON sin necesidad de arrancar el servidor HTTP.

---

### Capas del Dominio (LoopBack 4)

#### Controladores (`src/controllers/`)
* **[`src/controllers/driver.controller.ts`](../src/controllers/driver.controller.ts)**: Endpoints REST CRUD para conductores en PostgreSQL.
* **[`src/controllers/vehicle.controller.ts`](../src/controllers/vehicle.controller.ts)**: Endpoints REST CRUD para vehículos en PostgreSQL.
* **[`src/controllers/shift-history.controller.ts`](../src/controllers/shift-history.controller.ts)**: Endpoints REST de lectura y consulta histórica en MongoDB.
* **[`src/controllers/user.controller.ts`](../src/controllers/user.controller.ts)**: Endpoints REST para operadores de flota en base de datos local embebida.
* **[`src/controllers/shift.controller.ts`](../src/controllers/shift.controller.ts)**: Orquestador RPC de turnos en tiempo real sobre Redis (`/shifts`, `/shifts/{id}/accept`, `/shifts/{id}/complete`).
* **[`src/controllers/ping.controller.ts`](../src/controllers/ping.controller.ts)**, **`hello-world.controller.ts`**, **`free-sample.controller.ts`**: Controladores de prueba y salud.
* **[`src/controllers/index.ts`](../src/controllers/index.ts)**: Barrel export de todos los controladores.

#### Fuentes de Datos (`src/datasources/`)
* **[`src/datasources/db.datasource.ts`](../src/datasources/db.datasource.ts)**: Conector `memory` con archivo `data/db.json` para usuarios.
* **[`src/datasources/postgres.datasource.ts`](../src/datasources/postgres.datasource.ts)**: Conector `loopback-connector-postgresql` conectado al contenedor de PostgreSQL.
* **[`src/datasources/redis.datasource.ts`](../src/datasources/redis.datasource.ts)**: Conector `loopback-connector-kv-redis` conectado al contenedor de Redis.
* **[`src/datasources/mongodb.datasource.ts`](../src/datasources/mongodb.datasource.ts)**: Conector `loopback-connector-mongodb` conectado al contenedor de MongoDB.
* **[`src/datasources/index.ts`](../src/datasources/index.ts)**: Barrel export de DataSources.

#### Modelos de Dominio (`src/models/`)
* **[`src/models/driver.model.ts`](../src/models/driver.model.ts)**: Entidad `Driver` con estado (`AVAILABLE`, `ON_DUTY`, `OFF_DUTY`).
* **[`src/models/vehicle.model.ts`](../src/models/vehicle.model.ts)**: Entidad `Vehicle` con matrícula, licencia, coordenadas GPS y estado.
* **[`src/models/shift.model.ts`](../src/models/shift.model.ts)**: Entidad `Shift` en tiempo real (`PENDING`, `ONTHEWAY`, `FINISHED`).
* **[`src/models/shift-history.model.ts`](../src/models/shift-history.model.ts)**: Entidad `ShiftHistory` con snapshot inmutable y duración en minutos.
* **[`src/models/user.model.ts`](../src/models/user.model.ts)**: Entidad `User` con correo, contraseña en hash y rol.
* **[`src/models/index.ts`](../src/models/index.ts)**: Barrel export de modelos.

#### Repositorios (`src/repositories/`)
* **[`src/repositories/driver.repository.ts`](../src/repositories/driver.repository.ts)**: `DefaultCrudRepository` sobre PostgreSQL.
* **[`src/repositories/vehicle.repository.ts`](../src/repositories/vehicle.repository.ts)**: `DefaultCrudRepository` sobre PostgreSQL.
* **[`src/repositories/shift.repository.ts`](../src/repositories/shift.repository.ts)**: `DefaultKeyValueRepository` sobre Redis.
* **[`src/repositories/shift-history.repository.ts`](../src/repositories/shift-history.repository.ts)**: `DefaultCrudRepository` sobre MongoDB.
* **[`src/repositories/user.repository.ts`](../src/repositories/user.repository.ts)**: `DefaultCrudRepository` sobre In-Memory `db.json`.
* **[`src/repositories/index.ts`](../src/repositories/index.ts)**: Barrel export de repositorios.

---

### Módulos de las Fases 5 y 6 (En Desarrollo)

* **`src/keys.ts`**: Centralización de `BindingKey` para la Inversión de Control de LoopBack 4 (`GeocoderBindings`, `ShiftServiceBindings`, etc.).
* **`src/services/`**:
  * **`geocoder.service.ts`**: Integración con la API de OpenStreetMap Nominatim adaptada a Jerez de la Frontera, España.
  * **`fare-calculator.service.ts`**: Cálculo de distancias Haversine, tarificación y búsqueda de taxi más cercano.
  * **`shift.service.ts`**: Lógica de negocio y máquina de estados desacoplada de los controladores.
* **`src/observers/`**:
  * **`database-seed.observer.ts`**: `LifeCycleObserver` para comprobar conectividad y sembrar datos iniciales (operador, paradas y taxis en Jerez) al iniciar la aplicación.

---

## 5. Suite de Pruebas (`src/__tests__/`)

* **Aceptación (`src/__tests__/acceptance/`)**:
  - `driver.controller.acceptance.ts`: Pruebas de endpoints CRUD de conductores.
  - `shift.controller.acceptance.ts`: Prueba E2E de ciclo de vida completo de un turno (crear en Redis, aceptar, completar, persistir en Mongo y liberar en Postgres).
  - `home-page.acceptance.ts` y `ping.controller.acceptance.ts`: Pruebas de rutas base y salud.
  - `sample-controllers.acceptance.ts`: Pruebas de controladores de ejemplo.
* **Integración (`src/__tests__/integration/`)**:
  - `datasources/datasources.integration.ts`: Conectividad real a los 4 DataSources.
  - `repositories/`: Pruebas individuales de operaciones CRUD contra PostgreSQL, Redis, MongoDB y Memory.
* **Unitarias (`src/__tests__/unit/`)**:
  - `models/domain-models.unit.ts`: Validación de esquemas y valores por defecto de los 5 modelos.
  - `hello-world.controller.unit.ts`: Pruebas de controladores independientes.

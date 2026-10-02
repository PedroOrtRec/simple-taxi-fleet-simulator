# Estructura y Descripción de Archivos del Proyecto

Este documento detalla la estructura y el propósito de cada uno de los archivos existentes en el proyecto **Simple Taxi Fleet Simulator**, desarrollado sobre el framework **LoopBack 4**.

---

## 1. Archivos en la Raíz del Proyecto

### Configuración y Entorno de Ejecución

* **[`package.json`](../package.json)**  
  Manifiesto principal de Node.js. Define los metadatos del proyecto, scripts de ciclo de vida (`build`, `test`, `start`, `migrate`, `openapi-spec`, linter), dependencias centrales del framework (`@loopback/core`, `@loopback/rest`, `@loopback/repository`, etc.) y dependencias de desarrollo (`@loopback/build`, `@loopback/testlab`, `typescript`, etc.).

* **[`pnpm-lock.yaml`](../pnpm-lock.yaml)**  
  Archivo de bloqueo de dependencias generado por `pnpm`. Fija las versiones exactas instaladas de todo el árbol de dependencias para asegurar builds reproducibles.

* **[`tsconfig.json`](../tsconfig.json)**  
  Configuración principal del compilador de TypeScript (`tsc` / `lb-tsc`). Extiende las configuraciones base predefinidas por LoopBack (`@loopback/build/config/tsconfig.common.json`), define directorios de entrada (`src`) y salida compilada (`dist`).

* **[`tsconfig.tsbuildinfo`](../tsconfig.tsbuildinfo)**  
  Caché de compilación incremental generada automáticamente por TypeScript para acelerar compilaciones sucesivas.

* **[`.eslintrc.js`](../.eslintrc.js)** y **[`.eslintignore`](../.eslintignore)**  
  Configuración y reglas de exclusión para ESLint. Utiliza el paquete `@loopback/eslint-config` para mantener estándares estrictos de calidad y sintaxis TypeScript.

* **[`.prettierrc`](../.prettierrc)** y **[`.prettierignore`](../.prettierignore)**  
  Configuración del formateador de código Prettier. Define estilos consistentes (comillas simples, espaciado, trailing commas) y excluye archivos compilados o temporales.

* **[`.mocharc.json`](../.mocharc.json)**  
  Archivo de configuración para el ejecutor de pruebas Mocha, estableciendo flags por defecto para la suite de tests.

* **[`.editorconfig`](../.editorconfig)**  
  Define configuraciones de estilo de edición (identación con 2 espacios, codificación UTF-8, fin de línea LF) compatibles con la mayoría de editores e IDEs (como VS Code).

* **[`.gitignore`](../.gitignore)**  
  Especifica qué carpetas y archivos locales o generados (ej. `node_modules/`, `dist/`, `.env`, logs) deben quedar fuera del control de versiones en Git.

* **[`.yo-rc.json`](../.yo-rc.json)**  
  Archivo de metadatos de Yeoman utilizado internamente por `@loopback/cli` para almacenar preferencias elegidas al crear el proyecto (por ejemplo, el gestor de paquetes por defecto).

### Despliegue y Guías

* **[`Dockerfile`](../Dockerfile)** y **[`.dockerignore`](../.dockerignore)**  
  Definición de contenedor Docker basada en imagen multi-stage de Node.js para compilar y ejecutar la aplicación en entornos aislados o producción, excluyendo dependencias innecesarias mediante `.dockerignore`.

* **[`README.md`](../README.md)**  
  Documentación general de bienvenida generada por LoopBack con instrucciones sobre cómo instalar, compilar, probar y arrancar la aplicación.

* **[`DEVELOPING.md`](../DEVELOPING.md)**  
  Guía recomendada de desarrollo con recomendaciones para Visual Studio Code (extensiones, tareas en segundo plano de compilación en modo watch y ejecución de tests).

---

## 2. Directorio de Documentación (`docs/`)

* **[`docs/roadmap.md`](roadmap.md)**  
  Hoja de ruta pedagógica en 9 fases para el aprendizaje e implementación incremental del proyecto (Fundaciones, DataSources, Modelado, Capa HTTP, Inversión de Control, Lógica de Negocio, Pipeline/Sequence, Seguridad y Testing).

* **[`docs/project-structure.md`](project-structure.md)**  
  Este archivo. Guía explicativa exhaustiva del rol de cada fichero del repositorio dentro del framework LoopBack 4.

---

## 3. Directorio de Recursos Estáticos (`public/`)

* **[`public/index.html`](../public/index.html)**  
  Página HTML estática de bienvenida servida por defecto en la ruta raíz HTTP (`GET /`). Expone enlaces a la documentación de LoopBack y al explorador de OpenAPI (`/explorer`).

---

## 4. Código Fuente de la Aplicación (`src/`)

### Módulos Principales de la Aplicación

* **[`src/index.ts`](../src/index.ts)**  
  **Punto de entrada (`main`) del runtime de Node.js.**
  * Instancia la clase `SimpleTaxiFleetSimulatorApplication`.
  * Ejecuta el ciclo de vida de arranque del servidor: `await app.boot()` seguido de `await app.start()`.
  * Configura las opciones del servidor HTTP (host, puerto por variables de entorno y apagado elegante o `gracePeriodForClose`).
  * Expone la función `main` y reexporta todo el contenido de `src/application.ts`.

* **[`src/application.ts`](../src/application.ts)**  
  **Clase central de la arquitectura LoopBack 4.**
  * Hereda de `RestApplication` y compone mixins clave:
    * `BootMixin`: Habilita el descubrimiento y registro automático de artefactos (controllers, repositories, datasources).
    * `RepositoryMixin`: Proporciona enlaces y métodos para registrar repositorios de datos.
    * `ServiceMixin`: Habilita la inyección y registro de servicios auxiliares y proxies.
  * Registra la secuencia de middlewares personalizada (`MySequence`).
  * Sirve la carpeta `public/` en la ruta `/`.
  * Configura e inicializa el explorador interactivo de OpenAPI (`RestExplorerComponent`) en `/explorer`.
  * Define las convenciones del `Booter` (dónde escanear controladores, sufijos `.controller.js`, etc.).

* **[`src/sequence.ts`](../src/sequence.ts)**  
  **Pipeline del ciclo de vida de las peticiones HTTP.**
  * Define la clase `MySequence` que extiende `MiddlewareSequence`.
  * Es el interceptor central por el que pasa cada petición HTTP entrante. En fases posteriores aquí se controlan pasos como resolución de rutas, autenticación de usuarios, inyección de dependencias por request y manejo global de errores.

* **[`src/migrate.ts`](../src/migrate.ts)**  
  **Script de migración de bases de datos.**
  * Ejecutable vía `npm run migrate`.
  * Instancia la aplicación, ejecuta `app.boot()` y llama a `app.migrateSchema({existingSchema})` para crear o sincronizar automáticamente tablas/colecciones en las fuentes de datos configuradas (SQLite, MongoDB) antes de salir limpiamente del proceso.

* **[`src/openapi-spec.ts`](../src/openapi-spec.ts)**  
  **Exportador de especificación OpenAPI.**
  * Ejecutable vía `npm run openapi-spec`.
  * Instancia la aplicación y exporta toda la especificación Swagger/OpenAPI en formato JSON o YAML a un archivo sin necesidad de levantar el servidor HTTP.

---

### Capas del Dominio (Arquitectura LoopBack 4)

* **`src/controllers/`**
  * **[`src/controllers/index.ts`](../src/controllers/index.ts)**: Archivo barril (*barrel*) que reexporta todos los controladores del directorio para facilitar su importación.
  * **[`src/controllers/ping.controller.ts`](../src/controllers/ping.controller.ts)**: Controlador HTTP de ejemplo. Muestra el uso de decoradores `@get('/ping')` y `@response(200, ...)` con esquemas OpenAPI fuertemente tipados para devolver el estado de salud del servidor.
  * **[`src/controllers/README.md`](../src/controllers/README.md)**: Documentación de referencia sobre la función de los controladores en LoopBack.

* **`src/datasources/`**
  * **[`src/datasources/README.md`](../src/datasources/README.md)**: Carpeta reservada para fuentes de datos (`DataSource`). Aquí residirán los conectores hacia SQLite (para Driver y Vehicle) y MongoDB (para Shift).

* **`src/models/`**
  * **[`src/models/README.md`](../src/models/README.md)**: Carpeta reservada para las entidades y modelos de dominio definidos mediante decoradores `@model()` y `@property()`.

* **`src/repositories/`**
  * **[`src/repositories/README.md`](../src/repositories/README.md)**: Carpeta reservada para los repositorios (`DefaultCrudRepository`), que encapsulan el acceso a datos y las operaciones CRUD vinculando Modelos y DataSources.

---

### Suite de Pruebas (`src/__tests__/`)

* **[`src/__tests__/README.md`](../src/__tests__/README.md)**  
  Documentación interna sobre la estructura de pruebas en LoopBack 4 (unitarias, integración y aceptación).

* **[`src/__tests__/acceptance/test-helper.ts`](../src/__tests__/acceptance/test-helper.ts)**  
  Utilidad de testing. Inicializa una instancia de `SimpleTaxiFleetSimulatorApplication` en un puerto HTTP efímero mediante `@loopback/testlab` y crea un cliente HTTP (`supertest`) para ejecutar tests de aceptación reales.

* **[`src/__tests__/acceptance/home-page.acceptance.ts`](../src/__tests__/acceptance/home-page.acceptance.ts)**  
  Test de aceptación end-to-end que verifica que la ruta raíz (`GET /`) devuelva código HTTP 200 y contenga el documento HTML esperado.

* **[`src/__tests__/acceptance/ping.controller.acceptance.ts`](../src/__tests__/acceptance/ping.controller.acceptance.ts)**  
  Test de aceptación end-to-end que realiza una petición `GET /ping` y valida que la respuesta tenga el formato JSON correcto con las cabeceras y propiedades esperadas.

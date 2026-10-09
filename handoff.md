# Documento de Traspaso Técnico (Handoff) y Estado del Proyecto
## Simple Taxi Fleet Simulator — LoopBack 4

> **Fecha de Elaboración:** Octubre 2026  
> **Estado del Código:** Fases 1 a 6 completadas y verificadas (48 passing tests, TypeScript strict, 0 advertencias de linter).  
> **Rama Principal:** `main` (sincronizada con GitHub: `PedroOrtRec/simple-taxi-fleet-simulator`).

---

## 1. Resumen Ejecutivo del Estado Actual

El proyecto **Simple Taxi Fleet Simulator** implementa una plataforma políglota de simulación de flotas de taxi en tiempo real construida sobre **LoopBack 4**, contextualizada en el término municipal de **Jerez de la Frontera (Cádiz, España)**.

### 1.1. Arquitectura de Datos Políglota
* **PostgreSQL 16 (Docker, puerto 5432)**: Gestión del inventario persistente de activos (`Driver`, `Vehicle`) con coordenadas GPS en `double precision`.
* **Redis 7 (Docker, puerto 6379)**: Máquina de estados efímera de turnos en tiempo real (`Shift` en estados `PENDING` y `ONTHEWAY`) mediante repositorio Key-Value (`DefaultKeyValueRepository`).
* **MongoDB 7 (Docker, puerto 27017)**: Almacén histórico de auditoría inmutable (`ShiftHistory`) para turnos finalizados (`FINISHED`).
* **In-Memory / JSON local (`data/db.json`)**: Gestión de operadores y usuarios del sistema (`User`).
* **OpenStreetMap Nominatim (REST externo)**: Servicio de geocodificación directa e inversa en Jerez de la Frontera mediante `loopback-connector-rest`.

### 1.2. Hitos Arquitectónicos Alcanzados (Fases 1 a 6)
1. **Contenedor IoC y Contextos**: Claves de inyección fuertemente tipadas en `src/keys.ts` (`BindingKey<T>`), proveedores dinámicos (`GeocoderServiceProvider`) e inyección limpia de repositorios y servicios.
2. **Servicios de Dominio Aislados**:
   - `GeocoderService`: Geocodificación y geocodificación inversa con OpenStreetMap Nominatim.
   - `FareCalculatorService`: Cálculo de distancias con la **fórmula de Haversine**, baremo tarifario municipal de Jerez y algoritmo de búsqueda del taxi más cercano (`findClosestVehicle`).
   - `ShiftService`: Orquestación multi-base de datos desacoplada de la capa de transporte HTTP.
3. **Observadores de Ciclo de Vida (`LifeCycleObserver`)**:
   - `DatabaseSeedObserver`: Siembra inicial idempotente de 6 paradas de taxi emblemáticas en Jerez (Plaza del Arenal, Estación de Tren, Hospital, Real Escuela Ecuestre, Aeropuerto, Circuito) y emisión de log de diagnóstico de flota durante el apagado controlado (`stop()`).
4. **Controladores Delgados (Thin Controllers)**:
   - `ShiftController` delega toda la orquestación en `ShiftService` y expone el endpoint `GET /shifts/closest-taxi`.
5. **Herramientas de Desarrollo**:
   - Suite de peticiones HTTP para Neovim / Kulala en `api.http`.
   - Selector interactivo de terminal TUI en `scripts/api-fzf.sh`.
   - Entorno multiterminal con Zellij en `scripts/workspace.kdl`.

---

## 2. Análisis de Brechas (Gap Analysis) frente al Tutorial Oficial de LoopBack 4

Al contrastar nuestro desarrollo actual con el tutorial oficial de LoopBack 4 (*Todo Tutorial, Todo-List Tutorial, SOAP Web Service Tutorial, Authentication & Authorization Guide, y Validation Guide*), identificamos los siguientes conceptos pendientes de implementar:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LOOPBACK 4 RADAR DE BRECHAS                      │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ CONCEPTO / TUTORIAL OFICIAL   │ ESTADO EN NUESTRO PROYECTO                  │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 1. Relaciones (@belongsTo,    │ ⚠️ PENDIENTE: Claves foráneas planas        │
│    @hasMany, @hasOne)         │    (assignedVehicleId suelto sin resolver)  │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 2. Inclusion Resolvers        │ ⚠️ PENDIENTE: No se pueden hacer joins      │
│    (filter: { include: [...]})│    ni navegación de grafos relacionales     │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. Controladores Relacionales │ ⚠️ PENDIENTE: Faltan endpoints anidados     │
│    (DriverVehicleController)  │    como /drivers/{id}/vehicle               │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 4. Servicios SOAP Legacy      │ ⚠️ PENDIENTE: Solo usamos REST; falta probar│
│    (loopback-connector-soap)  │    WSDL y loopback-connector-soap           │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 5. Autenticación JWT          │ ⚠️ PENDIENTE: User guarda password en plano │
│    (@loopback/authentication) │    y no hay emisión/validación de JWT       │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 6. Autorización y Roles       │ ⚠️ PENDIENTE: Endpoints públicos sin guards │
│    (@loopback/authorization)  │    de rol (ADMIN, OPERATOR, DRIVER)         │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 7. Secuencia Personalizada    │ ⚠️ PENDIENTE: Usamos DefaultSequence básica │
│    (Custom Sequence Pipeline) │    sin métricas, trace ID ni error handler  │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 8. Interceptores Globales     │ ⚠️ PENDIENTE: Falta probar @intercept para  │
│    (@intercept y Middleware)  │    auditoría y caching                      │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 9. Validación Declarativa     │ ⚠️ PENDIENTE: Sin validación de esquemas    │
│    (AJV / Validadores Custom) │    avanzada (matrículas españolas, etc.)    │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 10. File Upload / Streaming   │ ⚠️ PENDIENTE: Sin soporte de subida de      │
│    (Multipart / Documentos)   │    documentos o fotos de vehículos          │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 3. Detalle de Conceptos Pendientes y Casos de Uso

### 3.1. Relaciones de LoopBack 4 (`@loopback/repository` Relations)
* **Situación actual**: En `src/models/driver.model.ts` tenemos `assignedVehicleId?: number` y en `src/models/vehicle.model.ts` tenemos `assignedDriverId?: number`. Son campos planos desconectados.
* **Problema técnico**: Para saber qué vehículo conduce Carlos Sainz hay que hacer una consulta manual a `Driver`, extraer el ID y hacer una segunda consulta manual a `Vehicle`. Si se borra un vehículo, el ID del conductor queda huérfano.
* **Lo que enseña el tutorial oficial**:
  1. **Decorador `@belongsTo` y `@hasOne`**:
     ```typescript
     @belongsTo(() => Vehicle)
     assignedVehicleId?: number;
     ```
  2. **Propiedad de navegación en la interfaz**:
     ```typescript
     export interface DriverRelations {
       vehicle?: VehicleWithRelations;
     }
     ```
  3. **Inyección de `Getter<Repository>` en Repositorios**: Para evitar bloqueos por dependencias circulares en tiempo de inicialización de la app:
     ```typescript
     export class DriverRepository extends DefaultCrudRepository<...> {
       public readonly vehicle: BelongsToAccessor<Vehicle, typeof Driver.prototype.id>;

       constructor(
         @inject('datasources.postgres') dataSource: PostgresDataSource,
         @repository.getter('VehicleRepository') protected vehicleRepoGetter: Getter<VehicleRepository>,
       ) {
         super(Driver, dataSource);
         this.vehicle = this.createBelongsToAccessorFor('vehicle', vehicleRepoGetter);
         this.registerInclusionResolver('vehicle', this.vehicle.inclusionResolver);
       }
     }
     ```
  4. **Filtros de inclusión (*Inclusion Filters*)**:
     Permite ejecutar: `GET /drivers?filter={"include":[{"relation":"vehicle"}]}` y recibir en una única llamada el conductor con todo el objeto anidado de su taxi asignado.
  5. **Controlador Relacional (`DriverVehicleController`)**:
     Endpoints canónicos generados por `lb4 relation`:
     - `GET /drivers/{id}/vehicle`
     - `POST /drivers/{id}/vehicle`
     - `PATCH /drivers/{id}/vehicle`
     - `DELETE /drivers/{id}/vehicle`

---

### 3.2. Integración de Servicios Web SOAP (`loopback-connector-soap`)
* **Situación actual**: En la Fase 6 conectamos OpenStreetMap mediante `loopback-connector-rest`. El tutorial oficial de LoopBack 4 cuenta con una sección dedicada a servicios SOAP mediante WSDL.
* **Caso de negocio propuesto para el simulador**:
  - En el sector del taxi real, los sistemas modernos conviven con administraciones públicas que exigen protocolos legacy.
  - Diseñar un servicio de **Tasa Municipal / Facturación Oficial del Ayuntamiento de Jerez (`TaxInspectionSoapService`)**:
    - Conector: `loopback-connector-soap`.
    - WSDL local o servicio mock (con `soap` de Node.js o archivo WSDL estático).
    - Métodos SOAP: `ValidarLicenciaMunicipal(licencia: string): boolean`, `CalcularTasaEmisiones(euroNorm: string): number`.

---

### 3.3. Autenticación y Autorización (JWT, RBAC y Casbin)
* **Situación actual**: `UserController` guarda la contraseña en texto plano en `data/db.json` y no existen cabeceras de autorización `Authorization: Bearer <token>`. Cualquiera puede completar turnos o dar de baja conductores sin credenciales.
* **Lo que enseña el tutorial oficial**:
  1. Instalar `@loopback/authentication` y `@loopback/authentication-jwt`.
  2. Decorar métodos con `@authenticate('jwt')`.
  3. Servicios vinculados en IoC:
     - `TokenServiceBindings.TOKEN_SERVICE`: Genera y verifica tokens JWT con clave secreta y tiempo de expiración.
     - `UserServiceBindings.USER_SERVICE`: Valida credenciales contra `UserRepository`.
     - `PasswordHasherBindings.PASSWORD_HASHER`: Hasheo seguro de contraseñas con `bcryptjs` (salt rounds).
  4. Autorización granular `@loopback/authorization`:
     - Decorador `@authorize({ allowedRoles: ['ADMIN'] })` para operaciones críticas (crear vehículos, eliminar conductores).
     - Rol `'DISPATCHER'` para solicitar y asignar turnos.
     - Rol `'DRIVER'` para consultar su vehículo asignado y aceptar/completar turnos propios.

---

### 3.4. Pipeline HTTP: Secuencia Personalizada, Middleware e Interceptores
* **Situación actual**: La aplicación utiliza `DefaultSequence`, que delega directamente el ciclo `findRoute -> parseParams -> invoke -> send`.
* **Lo que enseña el tutorial oficial**:
  1. **Secuencia Personalizada (`src/sequence.ts`)**:
     - Inyección de Correlation ID (`X-Request-Id`) en cabeceras.
     - Medición precisa de latencia HTTP (`start = Date.now()` y log al finalizar).
     - Gestor global de errores (`reject(context, error)`) para formatear respuestas de error amigables sin exponer stack traces internos.
  2. **Interceptores de Método y Globales (`@intercept`)**:
     - Interceptor para medir tiempos de respuesta de llamadas externas a OpenStreetMap.
     - Interceptor de auditoría para registrar cada mutación de la flota en PostgreSQL.
  3. **Middleware Pipeline**:
     - Integración de middleware de Express/Koa (CORS personalizado, Helmet para cabeceras de seguridad, rate-limiting con Redis).

---

### 3.5. Validación Avanzada y Control de Errores
* Validadores con JSON Schema / AJV para:
  - Formato estricto de matrícula española (4 dígitos + 3 letras consonantes: `^[0-9]{4}-[B-DF-HJ-NP-TV-Z]{3}$`).
  - Coordenadas geográficas obligatoriamente acotadas al polígono del término municipal de Jerez de la Frontera (`lat: [36.5, 36.8]`, `lon: [-6.3, -5.9]`).

---

### 3.6. Subida de Archivos y Documentos (File Transfer)
* Manejo de peticiones `multipart/form-data` con Multer en LoopBack 4.
* Casos de uso:
  - Subir fotografía del conductor (`POST /drivers/{id}/avatar`).
  - Subir ficha técnica o certificado de ITV del vehículo (`POST /vehicles/{id}/itv-certificate`).

---

## 4. Hoja de Ruta Sugerida para Retomar el Proyecto

Cuando se retome el desarrollo, se recomienda abordar los siguientes sprints en este orden:

### Sprint 1: Relaciones Relacionales en LoopBack 4
1. Decorar `Driver` con `@belongsTo(() => Vehicle, { name: 'vehicle' })`.
2. Decorar `Vehicle` con `@hasOne(() => Driver, { keyTo: 'assignedVehicleId' })`.
3. Inyectar `Getter<VehicleRepository>` en `DriverRepository` y registrar el `inclusionResolver`.
4. Inyectar `Getter<DriverRepository>` en `VehicleRepository` y registrar el `inclusionResolver`.
5. Crear el controlador `DriverVehicleController` con `lb4 relation`.
6. Añadir tests de integración validando consultas con `{ include: ['vehicle'] }`.
7. Actualizar `api.http` y `scripts/api-fzf.sh`.

### Sprint 2: Secuencia Personalizada, Middleware e Interceptores
1. Refactorizar `src/sequence.ts` incorporando:
   - Medición de latencia.
   - Manejo centralizado de excepciones con `reject`.
   - Log de auditoría en consola o archivo.
2. Crear un interceptor `@intercept('interceptors.NominatimRateLimiter')` para asegurar que no se superan las políticas de OSM (máx. 1 req/segundo).

### Sprint 3: Autenticación JWT y Autorización RBAC
1. Instalar `@loopback/authentication`, `@loopback/authentication-jwt` y `@loopback/authorization`.
2. Hashear contraseñas de usuarios con `bcryptjs`.
3. Crear endpoints `/users/login` y `/users/whoami`.
4. Proteger endpoints de administración con `@authenticate('jwt')` y `@authorize({ allowedRoles: ['ADMIN'] })`.
5. Adaptar los tests de aceptación pasando el token Bearer en las cabeceras.

### Sprint 4: Conector SOAP y Validaciones de Negocio
1. Crear un servidor SOAP mock local o WSDL simulado.
2. Configurar `loopback-connector-soap` en un nuevo `SoapDataSource`.
3. Crear el servicio de validación de licencias y consumirlo antes de permitir que un conductor active su turno.
4. Añadir validadores AJV para matrículas y geocercas (*geofencing*).

---

## 5. Nueva Tarea / Proyecto Independiente: Extracción de `api-fzf`

### 5.1. Justificación y Visión
Durante el desarrollo del simulador, el script [`scripts/api-fzf.sh`](file:///Users/pedroortega/dev/personal/simple-taxi-fleet-simulator/scripts/api-fzf.sh) demostró ser una de las herramientas más productivas y ergonómicas para probar endpoints interactivos, ejecutar flujos E2E encadenados y visualizar respuestas JSON coloreadas sin depender de interfaces gráficas pesadas (como Postman o Insomnia).

El objetivo de esta nueva tarea es **extraer este concepto a un proyecto independiente y de código abierto**, convirtiéndolo en un paquete CLI/TUI universal reutilizable para cualquier proyecto backend (Node.js, Go, Python, Rust, Java, etc.).

### 5.2. Especificación Técnica de la Herramienta Independiente (`api-fzf`)

* **Nombre Propuesto**: `api-fzf` (o `openapi-fzf`).
* **Instalación Universal**:
  ```bash
  # Ejecución al vuelo sin instalación
  npx api-fzf
  
  # O instalación global
  npm install -g api-fzf
  # O vía Homebrew
  brew install pedroortega/tap/api-fzf
  ```

### 5.3. Modos de Operación

1. **Modo Automático vía OpenAPI / Swagger (Zero Config)**:
   - El CLI detecta si existe un archivo `openapi.json`, `swagger.json` o una URL remota (`http://localhost:3000/openapi.json`).
   - Parsea dinámicamente todos los endpoints, métodos HTTP, parámetros de ruta, query params y schemas de body.
   - Al ejecutar `npx api-fzf`, el usuario ve inmediatamente todos los endpoints en el buscador difuso `fzf` con preview de documentación y esquema OpenAPI.
   - Pide interactivamente los parámetros obligatorios y opcionales mostrando sus descripciones y tipos de datos.

2. **Modo Declarativo (`.api-fzf.yml` o `api-fzf.json`)**:
   - Para proyectos que requieren flujos E2E complejos con dependencias encadenadas (ej. crear conductor -> guardar `id` -> asignar a vehículo -> crear turno -> finalizar turno).
   - Formato de configuración declarativa de ejemplo:
     ```yaml
     version: 1
     baseUrl: "http://localhost:3000"
     runner: "httpie" # o "curl"
     
     flows:
       - name: "E2E Flujo Completo de Turno"
         description: "Driver -> Vehicle -> Shift -> MongoDB"
         steps:
           - method: POST
             path: /drivers
             body: { name: "Carlos Sainz", status: "AVAILABLE" }
             capture: { driverId: ".id" }
           - method: POST
             path: /vehicles
             body: { plate: "9988-XYZ", licenseNumber: "TX-01" }
             capture: { vehicleId: ".id" }
           - method: PATCH
             path: /drivers/{{driverId}}
             body: { assignedVehicleId: "{{vehicleId}}" }
     
     endpoints:
       - category: "Shifts"
         method: GET
         path: /shifts/closest-taxi
         params:
           - name: address
             type: string
             default: "Plaza del Arenal, Jerez de la Frontera"
             description: "Dirección de recogida en Jerez"
     ```

3. **Modo Parser `api.http` / `.rest`**:
   - Permite apuntar directamente a un archivo `api.http` existente (utilizado por extensiones de VS Code o Neovim Kulala) y convertir automáticamente cada bloque de petición en una opción ejecutable de `fzf`.

### 5.4. Características Principales de la Herramienta
* **Doble Motor de Ejecución**:
  - `httpie`: Salida coloreada, formateada y con cabeceras legibles por defecto.
  - `curl`: Fallback universal para entornos donde `httpie` no esté disponible.
* **Extracción de Variables con `jq`**:
  - Captura automática de IDs y tokens de respuesta para reutilizarlos en llamadas posteriores dentro de la misma sesión.
* **Historial de Respuestas y Re-ejecución Rápida**:
  - Atajo en el menú para repetir la última petición con las mismas variables.
* **Soporte para Autenticación**:
  - Gestión interactiva de cabeceras `Authorization: Bearer <token>` o `API-Key`.

### 5.5. Fases de Desarrollo para el Proyecto `api-fzf`
1. **Fase 1 (Proof of Concept - Node.js + TS)**:
   - Creación del repositorio `api-fzf`.
   - Lógica de menú con `fzf` invocada a través de child processes o wrapper nativo.
   - Soporte para ejecutar peticiones HTTPie / cURL.
2. **Fase 2 (Parser OpenAPI Spec)**:
   - Integración con `@stoplight/spectral` o `swagger-parser` para extraer rutas y esquemas automáticamente.
   - Generación dinámica del menú y formularios interactivos de variables con `@inquirer/prompts`.
3. **Fase 3 (Soporte de Flujos E2E y Captura de Variables)**:
   - Motor de ejecución secuencial de pasos con interpolación de variables `{{variable}}`.
4. **Fase 4 (Empaquetado y Distribución)**:
   - Publicación en npm (`api-fzf`).
   - Binarios autónomos mediante `pkg` o compilación nativa.

---

## 6. Guía Rápida para Retomar el Proyecto Localmente

Si vas a continuar trabajando en este repositorio en una sesión futura:

```bash
# 1. Asegurar que los contenedores de base de datos están activos
docker compose up -d

# 2. Comprobar que los puertos están escuchando
# Postgres: 5432 | Redis: 6379 | MongoDB: 27017

# 3. Compilar el código TypeScript y ejecutar las pruebas automáticas
pnpm test

# 4. Iniciar la aplicación en modo desarrollo
pnpm start

# 5. O arrancar el entorno de desarrollo TUI completo con Zellij
pnpm run workspace

# 6. Probar endpoints de forma interactiva con FZF
pnpm run test:manual
```

---

*Fin del documento de traspaso.*

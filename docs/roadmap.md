# Hoja de Ruta Pedagógica (Roadmap) - Simple Taxi Fleet Simulator

Este documento define las fases progresivas de aprendizaje e implementación de **LoopBack 4** para el proyecto **Simple Taxi Fleet Simulator**.

---

## Resumen Ejecutivo de Fases

| Fase | Apartado LoopBack 4 | Estado | Componente / Concepto Central |
| :--- | :--- | :---: | :--- |
| **1. Fundaciones** | Getting Started, Project Layout, CLI | **Completado** | Scaffolding (`@loopback/cli`), TypeScript strict, arranque de `Application` y configuración de entorno. |
| **2. Fuentes de Datos & Docker** | DataSources, Connectors & Docker Compose | **Completado** | `docker-compose.yml` (PostgreSQL, Redis, MongoDB), conectores Memory (`db.json`), `postgresql`, `kv-redis` y `mongodb`. Auto-migración (`npm run migrate`). |
| **3. Modelado y Repositorios** | Models, Repositories, Relations | **Completado** | Modelos `User`, `Driver`, `Vehicle`, `Shift`, `ShiftHistory`. Repositorios CRUD y KV. Pruebas de integración de persistencia. |
| **4. Capa HTTP & OpenAPI** | Controllers, Routing, OpenAPI Spec | **Completado** | 5 controladores REST/RPC (`Driver`, `Vehicle`, `Shift`, `ShiftHistory`, `User`), acceptance tests E2E y herramientas de desarrollo TUI (`api-fzf.sh`, `api.http`). |
| **5. Núcleo e Inversión de Control** | Context, Dependency Injection, Binding | **Siguiente** | Jerarquía de contextos (`ApplicationContext` vs `RequestContext`), `BindingKey`, `BindingScope`, y `Provider<T>` personalizados. |
| **6. Lógica de Dominio y Servicios** | Services, External Proxies, Observers | **Siguiente** | Geocodificación para **Jerez de la Frontera** (OpenStreetMap Nominatim), cálculo de tarifas/Haversine, `ShiftService` y `LifeCycleObserver` (seeding). |
| **7. Pipeline y Ciclo de Petición** | Sequence, Middleware, Interceptors | Pendiente | Secuencia personalizada, interceptores globales y de método (`@intercept`), métricas de latencia y auditoría. |
| **8. Seguridad y Acceso** | Authentication, Authorization | Pendiente | Extensión `@loopback/authentication`, tokens JWT, roles (`admin`, `dispatcher`, `driver`) y guards. |
| **9. Testing y Calidad** | Testing, Booter, CI/CD | Continuo | Suite automatizada de tests unitarios, integración y aceptación con `@loopback/testlab`. |

---

## Detalle de Fases Completadas (Fases 1 a 4)

- **Fase 1: Fundaciones**: Inicialización con TypeScript en modo estricto, configuración de ESLint/Prettier, estructura de carpetas y scripts de ejecución.
- **Fase 2: Infraestructura Políglota**: Orquestación de contenedores Docker (PostgreSQL 16, Redis 7, MongoDB 7) y archivo local embebido (`data/db.json`). Configuración de `DbDataSource`, `PostgresDataSource`, `RedisDataSource` y `MongodbDataSource`. Script de auto-migración `src/migrate.ts`.
- **Fase 3: Modelado de Dominio y Repositorios**: Entidades de negocio (`Driver`, `Vehicle`, `Shift`, `ShiftHistory`, `User`) y sus respectivos repositorios (`DriverRepository`, `VehicleRepository`, `ShiftRepository`, `ShiftHistoryRepository`, `UserRepository`). Tests de integración validando operaciones contra bases de datos reales.
- **Fase 4: Controladores HTTP y Testing E2E**: Controladores REST para activos y usuarios, y controlador de máquina de estados para turnos en tiempo real (`ShiftController`). Pruebas de aceptación con `supertest` y `@loopback/testlab`. Entorno interactivo con Zellij, Kulala (`api.http`) y FZF (`api-fzf.sh`).

---

## Fase 5: Núcleo e Inversión de Control (IoC, Contexts & Bindings)

El corazón arquitectónico de LoopBack 4 es su contenedor de Inversión de Control basado en **Contextos** y **Dependency Injection (DI)**.

### 1. Objetivos Pedagógicos y Técnicos
- Comprender la **jerarquía de contextos**:
  - `ApplicationContext`: Nivel raíz persistente durante toda la vida del proceso Node.js (servicios singleton, datasources, configuraciones globales).
  - `ServerContext`: Contexto del servidor HTTP.
  - `RequestContext`: Contexto efímero creado por cada petición HTTP entrante y destruido al emitir la respuesta (ideal para almacenar el usuario autenticado actual, correlation ID, o transacciones de base de datos).
- Definir **Binding Keys fuertemente tipados** (`BindingKey<T>`) centralizados en `src/keys.ts` para evitar dependencias por cadenas de texto sueltas.
- Configurar **Binding Scopes**:
  - `BindingScope.SINGLETON`: Una única instancia compartida por toda la aplicación.
  - `BindingScope.CONTEXT`: Una instancia por contexto (ej. por cada HTTP Request).
  - `BindingScope.TRANSIENT`: Una nueva instancia cada vez que se inyecta.
- Implementar **`Provider<T>`**:
  - Clases que resuelven dinámicamente un valor o instancia a través de un método `value(): Promise<T> | T`.

### 2. Componentes a Implementar en la Fase 5
1. `src/keys.ts`:
   - Definición de identificadores fuertemente tipados:
     - `GeocoderBindings.GEOCODER_SERVICE`
     - `ShiftServiceBindings.SHIFT_SERVICE`
     - `FareCalculatorBindings.FARE_SERVICE`
2. Refactorización de la inyección de dependencias para desacoplar controladores de la instanciación de servicios y configuraciones.

---

## Fase 6: Lógica de Dominio, Servicios y LifeCycle Observers

Esta fase traslada la lógica de negocio y las integraciones externas fuera de los controladores HTTP, transformando la aplicación en una arquitectura limpia y desacoplada.

### 6.1. Integración de Geolocalización para Jerez de la Frontera, España
En el tutorial oficial de LoopBack 4 (*Todo / Todo-list Tutorial*), se ilustra la conexión a un servicio SOAP/REST externo usando la API de geocodificación del *US Census Bureau*. Dicha API está limitada exclusivamente a direcciones de Estados Unidos.

Para nuestro simulador de taxis en **Jerez de la Frontera (Cádiz, España)**, adaptamos este patrón usando **OpenStreetMap Nominatim**:
- **Proveedor**: OpenStreetMap Nominatim API (`https://nominatim.openstreetmap.org`).
- **Coste**: 100% gratuito, de código abierto y sin requerir API key comercial.
- **Políticas de Uso**: Requiere enviar una cabecera `User-Agent` identificativa (ej. `SimpleTaxiFleetSimulator/1.0`) y filtrar por país (`countrycodes=es`).
- **Capacidades**:
  1. **Geocodificación Directa (`geocode`)**:
     - Entrada: Dirección o punto de interés en Jerez (ej. `"Plaza del Arenal, Jerez"`, `"Estación de Tren, Jerez"`, `"Calle Larga, Jerez"`).
     - Salida: Coordenadas geográficas (`latitude`, `longitude`) y nombre normalizado.
  2. **Geocodificación Inversa (`reverseGeocode`)**:
     - Entrada: Coordenadas GPS del taxi (`lat`, `lon`).
     - Salida: Nombre de calle, barrio y código postal en Jerez de la Frontera.

#### Componentes de Geocodificación:
* **DataSource REST**: `src/datasources/geocoder.datasource.ts` utilizando conector REST o cliente HTTP nativo tipado.
* **Servicio e Interfaces**: `src/services/geocoder.service.ts`
  ```typescript
  export interface GeoPoint {
    latitude: number;
    longitude: number;
  }

  export interface GeocodeResult {
    displayName: string;
    point: GeoPoint;
    boundingBox?: string[];
  }

  export interface GeocoderService {
    geocode(address: string): Promise<GeocodeResult[]>;
    reverseGeocode(point: GeoPoint): Promise<string>;
  }
  ```

### 6.2. Servicio de Cálculo de Tarifas y Despacho (`FareCalculatorService`)
- **Fórmula de Haversine**: Cálculo preciso de distancias ortodrómicas entre coordenadas (en kilómetros) adaptado al callejero de Jerez.
- **Estimación de Tarifa**:
  - Bajada de bandera (tarifa diurna / nocturna).
  - Coste por kilómetro recorrido estimado entre origen (`from`) y destino (`to`).
- **Asignación Inteligente del Taxi más Cercano**:
  - Filtra vehículos disponibles en PostgreSQL (`Vehicle.status === 'AVAILABLE'`).
  - Calcula la distancia entre la posición GPS de cada taxi y el origen de recogida (`fromCoordinates`).
  - Selecciona y asigna automáticamente el taxi con menor tiempo de llegada estimado.

### 6.3. Servicio de Orquestación de Turnos (`ShiftService`)
- Desacopla la máquina de estados de `ShiftController`.
- Métodos del servicio:
  - `requestShift(shiftData)`: Resuelve coordenadas mediante `GeocoderService`, estima tarifa y guarda en Redis con estado `PENDING`.
  - `acceptShift(shiftId, driverId)`: Valida disponibilidad en PostgreSQL, asocia el conductor al turno y cambia estado a `ONTHEWAY` en Redis.
  - `completeShift(shiftId, payload)`: Cambia el taxi a `AVAILABLE`, calcula tiempo total, persiste el snapshot en MongoDB y elimina el registro efímero de Redis.

### 6.4. Observador de Ciclo de Vida (`LifeCycleObserver`) y Seeding
LoopBack 4 proporciona la interfaz `LifeCycleObserver` con métodos `start()` y `stop()` para ejecutar acciones durante el arranque y apagado del servidor.

- **`DatabaseSeedObserver` (`src/observers/database-seed.observer.ts`)**:
  - Se ejecuta en `app.start()`.
  - Verifica si PostgreSQL y Memory contienen datos maestros.
  - Si las tablas están vacías, siembra de forma idempotente:
    1. **Operador por defecto** en `data/db.json` (`admin@taxijerez.es`).
    2. **Paradas y taxis emblemáticos de Jerez de la Frontera** en PostgreSQL:
       - Parada Plaza del Arenal (`lat: 36.6815`, `lon: -6.1383`)
       - Parada Estación de Tren y Autobuses (`lat: 36.6868`, `lon: -6.1264`)
       - Parada Hospital General de Jerez (`lat: 36.6974`, `lon: -6.1558`)
       - Parada Real Escuela Andaluza del Arte Ecuestre (`lat: 36.6923`, `lon: -6.1367`)
       - Parada Aeropuerto de Jerez (`lat: 36.7446`, `lon: -6.0601`)
       - Circuito de Velocidad de Jerez (`lat: 36.7083`, `lon: -6.0342`)
       - Conductores asociados a cada vehículo en estado `AVAILABLE`.

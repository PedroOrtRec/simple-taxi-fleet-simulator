# Guía de Buenas Prácticas: Uso de pnpm con LoopBack 4

Este documento detalla las consideraciones técnicas, problemas identificados y soluciones recomendadas al trabajar con **pnpm** en proyectos basados en **LoopBack 4**.

---

## 1. Contexto: ¿Por qué surgen fricciones entre pnpm y LoopBack 4?

LoopBack 4 y sus generadores (`@loopback/cli`) fueron concebidos asumiendo una estructura tradicional de `node_modules` plana (estilo `npm` v5+ o `yarn` v1) y delegando tareas de instalación directamente en el binario del sistema `npm`.

**pnpm**, por el contrario:
1. Utiliza un almacén basado en enlaces duros y simbólicos (*symlinked node_modules*).
2. Bloquea el acceso a dependencias fantasma (*phantom dependencies*): un paquete solo es accesible por tu código si está declarado explícitamente en `package.json`.
3. Mantiene su propio archivo de bloqueo (`pnpm-lock.yaml`), el cual entra en conflicto si un subproceso invoca `npm install`.

Para garantizar un flujo de desarrollo 100% estable, deben seguirse las siguientes **tres reglas fundamentales**:

---

## 2. Regla 1: Instalar el CLI en `devDependencies` y usar `pnpm exec lb4`

### El Problema con `pnpm dlx lb4` o `npx lb4`:
* `pnpm dlx` descarga una versión efímera en una carpeta temporal aislada. Al ejecutarse fuera del contexto del proyecto, a menudo no detecta las dependencias locales, falla al resolver plugins de TypeScript o ejecuta versiones incompatibles del CLI frente a las dependencias `@loopback/*` instaladas.

### La Solución:
El CLI debe instalarse como dependencia de desarrollo dentro del proyecto:
```bash
pnpm add -D @loopback/cli
```

A partir de ese momento, todos los comandos de generación deben ejecutarse usando **`pnpm exec`**:
```bash
# Correcto: ejecuta el binario local sincronizado con el proyecto
pnpm exec lb4 model
pnpm exec lb4 datasource
pnpm exec lb4 repository
pnpm exec lb4 controller
```

---

## 3. Regla 2: Declarar explícitamente las dependencias de tipos de Mocha

### El Problema de las *Phantom Dependencies*:
* LoopBack 4 incluye el wrapper `lb-mocha` a través de `@loopback/testlab` y `@loopback/build`.
* Con `npm`, los tipos globales de Mocha (`describe`, `it`, `before`, `after`) quedaban disponibles indirectamente en el `node_modules` raíz.
* Con `pnpm`, la estructura estricta aísla las dependencias transitivas. Si `@types/mocha` no está en tu `package.json`, TypeScript (`lb-tsc`) no encontrará los tipos globales durante la compilación o en los tests unitarios.

### La Solución:
Instalar explícitamente las declaraciones de tipos de Mocha en `devDependencies`:
```bash
pnpm add -D @types/mocha
```

---

## 4. Regla 3: Preinstalar las dependencias de conectores

### El Problema del asistente de `lb4 datasource`:
* Cuando se genera un DataSource con `lb4 datasource`, el asistente detecta si el conector requerido está instalado. Si no lo está, lanza por debajo un comando `npm install --save <conector>`.
* Al convivir con un entorno configurado para `pnpm`, la ejecución de `npm` produce colisiones en el lockfile y arroja errores como:
  ```text
  npm error Cannot read properties of null (reading 'matches')
  ```
  impidiendo que el paquete se instale o dejando el `package.json` desincronizado.

### La Solución:
Instalar siempre el paquete conector correspondiente con **`pnpm`** antes de correr el asistente (o inmediatamente después):

```bash
# PostgreSQL
pnpm add loopback-connector-postgresql

# Redis
pnpm add loopback-connector-kv-redis

# MongoDB
pnpm add loopback-connector-mongodb
```

Al estar ya presente en `package.json`, el asistente de `pnpm exec lb4 datasource` reconocerá la librería instalada y completará la configuración del DataSource limpiamente sin invocar `npm`.

---

## 5. Cheat Sheet de Comandos con pnpm

| Acción | Comando Recomendado |
| :--- | :--- |
| **Instalar dependencias del proyecto** | `pnpm install` |
| **Añadir dependencia de producción** | `pnpm add <paquete>` |
| **Añadir dependencia de desarrollo** | `pnpm add -D <paquete>` |
| **Compilar el proyecto** | `pnpm run build` |
| **Ejecutar tests y linter** | `pnpm test` |
| **Formatear código con Prettier** | `pnpm run prettier:fix` |
| **Generar artefactos LoopBack 4** | `pnpm exec lb4 <model\|datasource\|repository\|controller>` |

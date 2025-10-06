## Purpose
Short, actionable instructions so an AI coding agent can be productive in this repository immediately.

## Quick facts
- Framework: NestJS v11 (TypeScript). See `package.json` and `src/main.ts`.
- DB: PostgreSQL using the `pg` Pool (no ORM). See `src/database/database.service.ts` and `env.example`.
- Build/test: npm scripts in `package.json` (build, start:dev, test, test:e2e).
- TS config: `tsconfig.json` uses `nodenext` and emits decorators.

## High-level architecture (what to read first)
- `src/app.module.ts` — application composition (imports `DatabaseModule`, `UsersModule`).
- `src/database/*` — single DB access abstraction. `DatabaseService` manages a `pg` Pool, provides `query()` and `transaction()` helpers.
- `src/users/*` — example feature: controller -> service -> repository. Follow this pattern for new features.

Why this matters: controllers call service methods, services orchestrate business logic and call repositories, and repositories run raw SQL through `DatabaseService`. This means changes touching data should usually modify repositories and possibly reuse `DatabaseService.transaction()` for multi-step operations.

## Developer workflows & commands (concrete)
- Install: `npm install` (see `package.json`).
- Run dev server: `npm run start:dev` (Nest watch mode). App listens on port from `src/config/envConfig.ts` (env var `PORT`, default 3000).
- Build: `npm run build` (runs `nest build`).
- Run production bundle: `npm run start:prod` -> `node dist/main`.
- Unit tests: `npm run test`. E2E tests: `npm run test:e2e` (config at `test/jest-e2e.json`).
- Lint/format: `npm run lint` and `npm run format`. ESLint rules live in `eslint.config.mjs` and Prettier in `.prettierrc`.

Note: many scripts assume a running Postgres instance and the environment variables from `.env` (use `env.example` as a template).

## Project-specific patterns & conventions (concrete examples)
- Raw SQL everywhere: repositories use template strings and rely on `DatabaseService.query()` returning `result.rows`. Example: `src/users/repositories/users.repository.ts`.
- Transaction helper: use `databaseService.transaction(async (client) => { ... })` to run multiple statements atomically (see `DatabaseService.transaction`).
- Module/provider registration: providers are registered in the Nest module `providers` arrays (see `src/users/users.module.ts` and `src/database/database.module.ts`). When adding a new provider, export it if other modules will use it.
- Environment handling: `src/config/envConfig.ts` calls `dotenv.config()` and returns a typed object. Agents should read that file before changing any env-dependent code.
- Logging: project uses console.log/error with Spanish messages in a few places (e.g., `database.service.ts`). Respect existing message style when adding quick logs, but prefer more structured logging for larger changes.

## Known gotchas discovered in code (be conservative)
- SQL string issues: some queries in `src/users/repositories/users.repository.ts` are missing commas between selected columns (e.g. `avatar_url created_at`), which will cause runtime SQL errors. Validate and run queries locally (or in tests) after edits.
- Controller param usage: `src/users/users.controller.ts` uses `@Get('/:id') getUserById(@Param() id: string)` — Nest typically uses `@Param('id') id: string`. Confirm expected shapes in callers/tests.

These are observable in the current source; prefer to run tests or a quick `psql` against a local DB to verify SQL fixes.

## Integration points & external deps
- PostgreSQL via `pg` (see `dependencies` in `package.json`). No ORM or migration tool present — schema and migrations are outside this repo.
- dotenv for environment variables.
- Jest + ts-jest for tests; e2e test config in `test/jest-e2e.json`.

## How an AI agent should change code safely
- Small change checklist for PRs made by an agent:
  - Run `npm run lint` and `npm run build` locally (or CI) to catch TS/ESLint errors.
  - Run `npm test` and, if the change touches DB code, `npm run test:e2e` (requires DB env).
  - If editing SQL, copy the query and run it against a local Postgres to confirm column names and commas.
  - Keep module provider registrations in sync (`*.module.ts`).

## Key files to inspect when debugging
- `src/database/database.service.ts` — connection, query, transaction behavior.
- `src/config/envConfig.ts` and `env.example` — env var names and defaults.
- `src/users/repositories/users.repository.ts` — raw SQL examples and error handling.
- `src/users/users.controller.ts` and `src/users/users.service.ts` — controller/service flow example.
- `package.json`, `tsconfig.json`, `eslint.config.mjs` — build/test/lint environment.

If any section is unclear or you want more examples (e.g., adding a full new feature following the repo pattern), tell me which area you want expanded and I will iterate.

## Reglas y convenciones adicionales (para agentes y contribuidores)

Las siguientes reglas deben aplicarse siempre al trabajar en este repositorio. Están redactadas en español para mayor claridad y son de cumplimiento obligatorio para cambios automatizados por agentes:

- Utiliza siempre la tabulación para formatear el código.
- Prioriza siempre soluciones simples.
- Después de realizar cambios, SIEMPRE asegúrate de iniciar un nuevo servidor para que puedan probarse (si aplica).
- Mata siempre todos los servidores relacionados que hayan sido creados en pruebas anteriores antes de iniciar un nuevo servidor.
- Busca siempre código existente para iterar en lugar de crear nuevo código desde cero.
- Evita la duplicación de código cuando sea posible; revisa si ya existe lógica similar.
- Escribe código que tenga en cuenta los entornos: desarrollo, pruebas y producción.
- Asegúrate de hacer solo los cambios solicitados o aquellos en los que tengas plena confianza y relación con la solicitud.
- Al corregir un bug, no introduzcas un nuevo patrón o tecnología sin agotar las opciones con la implementación actual; si lo haces, elimina la implementación anterior.
- Mantén la base de código limpia y bien organizada.
- Evita escribir scripts directamente en archivos si es posible (especialmente si son de un solo uso).
- Documenta siempre tu código, aunque sea con comentarios breves que expliquen la intención.
- Usa nombres de variables, funciones y clases descriptivos y claros.
- Antes de subir cambios, asegúrate de pasar todas las pruebas unitarias y de integración.
- Haz commits pequeños y frecuentes, con mensajes claros y significativos.
- Mantén consistencia en el estilo de código (nomenclatura, formato, patrones).
- Antes de eliminar código, valida que no sea usado por otro módulo o proceso oculto.
- Revisa siempre dependencias externas: elimina las que no uses y mantén actualizadas las necesarias.
- Divide el código en funciones o módulos pequeños y reutilizables.
- No expongas información sensible (contraseñas, tokens, claves API) en el código ni en los commits.
- Implementa logs claros y útiles que permitan rastrear errores en los diferentes entornos.
- Siempre revisa que las variables de entorno estén correctamente configuradas según el entorno (dev, test, prod).
- Utiliza revisiones de código (code review) siempre que sea posible antes de integrar cambios.
- Asegúrate de manejar errores y excepciones en todas las capas críticas del sistema.
- Usa control de versiones responsablemente: nunca subas cambios directamente a la rama principal sin revisión o pruebas.
- Optimiza el rendimiento, pero no sacrifiques legibilidad por micro-optimizaciones innecesarias.

Si deseas, puedo traducir estas reglas al inglés o integrarlas en el checklist de PRs y pipelines.

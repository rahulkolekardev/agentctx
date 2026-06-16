# AgentCtx Detection Rules

## Repository root

Walk upward until one of these is found:

- `.git`
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `nx.json`

## Package manager

Strongest signal first:

1. `package.json` `packageManager` field
2. `pnpm-lock.yaml`
3. `bun.lock` or `bun.lockb`
4. `yarn.lock`
5. `package-lock.json`

## Framework priority

`nextjs > sveltekit > astro > nestjs > express > fastify > vite > react > unknown`

## Language

- `tsconfig.json`, `.ts`, `.tsx` → TypeScript
- `.js`, `.jsx`, `.mjs`, `.cjs` → JavaScript

## Test runner

- `vitest` dependency or `vitest.config.*`
- `jest` dependency or `jest.config.*`
- `@playwright/test` dependency or `playwright.config.*`
- `cypress` dependency or `cypress.config.*`
- `node --test` scripts or `node:test` usage

## Database tools

- Prisma: `prisma/schema.prisma` or `prisma` dependency
- Drizzle: `drizzle.config.*` or `drizzle-orm` dependency
- Mongoose: `mongoose` dependency
- TypeORM: `typeorm` dependency
- Sequelize: `sequelize` dependency
- Knex: `knex` dependency

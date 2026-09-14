# Project Cohouse — Backend

Splitwise/Tricount-style expense splitting API for cohousing groups, with receipt scanning.

NestJS + PostgreSQL (TypeORM). The frontend lives in a separate repository.

## Getting started
```
npm install
npm run db:up          # start local Postgres via docker-compose
npm run migration:run
npm run dev
```

Copy `env/.env.template` to `env/.env` and fill in the values before running.

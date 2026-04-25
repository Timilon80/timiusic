# TIMIUSIC Radio IA

Emisora web construida con Next.js, SQLite y un panel de administracion para gestionar streaming, catalogo multimedia y usuarios.

## Requisitos

- Node.js 20+
- npm 10+

## Variables de entorno

Crea un archivo `.env` local con estas variables:

```env
APP_SECRET=un-secreto-largo-y-unico
ADMIN_DEFAULT_PASSWORD=una-clave-admin-segura
ALLOW_PUBLIC_REGISTRATION=false
```

Notas:

- `APP_SECRET` firma las sesiones.
- `ADMIN_DEFAULT_PASSWORD` se usa para sembrar el usuario `admin` en una base nueva.
- `ALLOW_PUBLIC_REGISTRATION=false` cierra el registro publico y deja el alta de clientes en manos del admin.

## Scripts

- `npm run dev`: desarrollo local
- `npm run typecheck`: validacion TypeScript
- `npm run build`: build de produccion
- `npm run check`: typecheck + build
- `npm run start`: servir build de produccion

## Seguridad y despliegue

- No subas `.env`, `data/` ni `public/uploads/` al repositorio.
- Configura `APP_SECRET` y `ADMIN_DEFAULT_PASSWORD` tambien en tu hosting.
- Si vas a abrir registro publico, activa `ALLOW_PUBLIC_REGISTRATION=true` de forma consciente.

## GitHub Actions

La carpeta `.github/workflows/ci.yml` ejecuta `npm run typecheck` y `npm run build` en cada push o pull request.

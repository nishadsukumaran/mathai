# npm run dev — Error Diagnosis & Fixes (March 9, 2026)

## Root Cause
The monorepo root `node_modules` had a partially-interrupted npm install from a prior session.
Several packages were installed but their files were incomplete or empty.

## Errors Found & Fixed

### 1. `Cannot find module 'postcss'`
- **File**: `node_modules/postcss/package.json` — 0 bytes (empty)
- **Fix**: Copied valid `package.json` from `apps/web/node_modules/postcss` (same version 8.5.8)

### 2. `Module not found: Can't resolve './lib/oauth'`
- **File**: `node_modules/oauth/lib/` — empty directory (0 files)
- **Fix**: Copied `oauth.js`, `oauth2.js`, `sha1.js`, `_utils.js` from fresh install of oauth@0.9.15

### 3. `node_modules/d3-color/package.json` — 0 bytes
- **Fix**: Replaced with valid package.json from d3-color@3.1.0

### 4. `node_modules/picomatch/package.json` — 0 bytes  
- **Fix**: Replaced with valid package.json from picomatch@2.3.1

### 5. `node_modules/csstype/index.d.ts` — missing
- **Fix**: Copied 895KB index.d.ts from fresh install of csstype@3.2.3

## Also Added (apps/web/package.json)
These deps were missing and caused their own errors:
- `@next-auth/prisma-adapter@^1.0.7`
- `@prisma/client@^5.8.0`
- `nodemailer@^6.9.0`
- `@types/nodemailer@^6.4.0`

## Root Workspace Fix
Added `"packages/*"` to root `package.json` workspaces so `@mathai/shared-types` is properly linked.

## Result
`npm run dev` starts cleanly. Server ready in ~2.2s.
Only remaining warnings (not errors):
- Port 3000 in use → using 3001 (close the other process)
- `images.domains` deprecated → update `next.config.ts` to use `remotePatterns`

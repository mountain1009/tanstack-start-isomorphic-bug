# createIsomorphicFn Bug Reproduction

This repository demonstrates a bug in `@tanstack/react-start`'s `createIsomorphicFn` when used with Cloudflare Workers.

## Bug Description

When `createIsomorphicFn()` is called at **module top-level**, it returns a **function** instead of the expected value. However, when called **inside a component**, it works correctly.

Related issue: https://github.com/TanStack/router/issues/6217

## Expected Behavior

```ts
const getEnvironment = createIsomorphicFn()
  .server(() => "server")
  .client(() => "client");

const value = getEnvironment();
// Expected: "server" during SSR, "client" on client
// Actual: [Function] at module level
```

## Steps to Reproduce

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start dev server:
   ```bash
   pnpm dev
   ```
4. Open http://localhost:5173
5. Observe the console output and page content

## Observed Results

| Call Location | Expected | Actual |
|---------------|----------|--------|
| Module top-level | `"server"` (string) | `[Function]` |
| Inside component | `"client"` (string) | `"client"` ✅ |

## Environment

- `@tanstack/react-start`: 1.143.6
- `@cloudflare/vite-plugin`: 1.0.0+
- Vite: 7.0.0
- Node.js: 22.x

# Gemini AI Assistant Instructions for `comic-display`

## Vercel Blob and Next.js Caching Pitfalls

When developing API routes that read from and write to `@vercel/blob` (or any external persistent storage) in this Next.js project, you **MUST** strictly adhere to the following rules to prevent severe data loss caused by race conditions and stale CDN edge caching.

### 1. Disable Next.js Route Caching (force-dynamic)
Next.js aggressively caches API responses, especially on Vercel. If an API route mutates data (e.g., `POST`, `PUT`, `DELETE`), but also performs reads (`GET` or reading the current state before a mutation), the route must explicitly opt-out of all caching.

Every file in `app/api/**/route.ts` that interacts with persistent state (like the users array or projects list) **MUST** include these exports at the top level:

```typescript
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

*Failure to do this will result in the `get()` calls returning stale state. When followed by a `put()`, the stale state overwrites newer changes, silently deleting recent entries (e.g., rapid user creation).*

### 2. Disable `@vercel/blob` Fetch Caching
Even if the Next.js route is dynamic, the underlying `fetch` calls made by the `@vercel/blob` SDK might still be intercepted and cached by the edge CDN. 

When calling `@vercel/blob`'s `get` method, you **MUST** bypass the cache by passing `{ useCache: false }`. Since the official TypeScript definitions might not expose this option, you must cast the options object to `any`:

```typescript
import { get } from "@vercel/blob";

// CORRECT 
const result = await get(pathname, { access: "private", useCache: false } as any);

// INCORRECT (Will cache and cause data loss during concurrent mutations)
// const result = await get(pathname, { access: "private" });
```

### 3. Incremental State Merging
When updating an object within an array stored in `@vercel/blob` (e.g., updating a project's `isShared` status), **NEVER** replace the entire object blindly with the payload received from the client. The client payload might omit sensitive fields (like `token`, `passwords`, etc.) which are hidden for security.

Always fetch the existing object, spread the existing properties, and then merge the incoming changes:

```typescript
// CORRECT
const oldItem = items[idx];
items[idx] = { ...oldItem, ...incomingChanges };
// Explicitly preserve sensitive keys if they were omitted in incomingChanges
if (!incomingChanges.token && oldItem.token) {
  items[idx].token = oldItem.token;
}

// INCORRECT (Will destroy hidden fields)
// items[idx] = incomingChanges;
```

### 4. Global Memory Fallback for Local Development
If `BLOB_READ_WRITE_TOKEN` is not provided (local development), the app falls back to in-memory arrays. In Next.js dev mode (`next dev`), files are frequently hot-reloaded, destroying local module-scoped variables.

You **MUST** attach in-memory fallbacks to `globalThis` to preserve state across hot-reloads:

```typescript
const globalAny = globalThis as any;
if (!globalAny.myCache) {
  globalAny.myCache = [];
}
const myCache = globalAny.myCache;
```

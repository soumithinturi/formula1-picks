import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // Exact path matches for PWA files - Read into memory to avoid Bun caching bug crash
    "/manifest.json": async () => new Response(await Bun.file("./src/manifest.json").text(), { headers: { "Content-Type": "application/json" } }),
    "/sw.js": async () => new Response(await Bun.file("./src/sw.js").text(), { headers: { "Content-Type": "application/javascript" } }),
    "/assets/icon-192x192.png": async () => new Response(await Bun.file("./src/assets/icon-192x192.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),
    "/assets/icon-512x512.png": async () => new Response(await Bun.file("./src/assets/icon-512x512.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),
    "/assets/screenshot-wide.png": async () => new Response(await Bun.file("./src/assets/screenshot-wide.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),
    "/assets/screenshot-mobile.png": async () => new Response(await Bun.file("./src/assets/screenshot-mobile.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),

    // Relative path matches (just in case the browser resolves them this way)
    "/src/manifest.json": async () => new Response(await Bun.file("./src/manifest.json").text(), { headers: { "Content-Type": "application/json" } }),
    "/src/sw.js": async () => new Response(await Bun.file("./src/sw.js").text(), { headers: { "Content-Type": "application/javascript" } }),
    "/src/assets/icon-192x192.png": async () => new Response(await Bun.file("./src/assets/icon-192x192.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),
    "/src/assets/icon-512x512.png": async () => new Response(await Bun.file("./src/assets/icon-512x512.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),
    "/src/assets/screenshot-wide.png": async () => new Response(await Bun.file("./src/assets/screenshot-wide.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),
    "/src/assets/screenshot-mobile.png": async () => new Response(await Bun.file("./src/assets/screenshot-mobile.png").arrayBuffer(), { headers: { "Content-Type": "image/png" } }),

    // Serve index.html for all other unmatched routes
    "/*": index,

    // Handle API hello
    "/api/hello": {
      async GET(req) {
        return Response.json({ message: "Hello, world!", method: "GET" });
      },
      async PUT(req) {
        return Response.json({ message: "Hello, world!", method: "PUT" });
      }
    },
    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({ message: `Hello, ${name}!` });
    }
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

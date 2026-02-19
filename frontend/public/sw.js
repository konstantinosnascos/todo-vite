
self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
    const request = event.request;

    if (
        request.method === "GET" &&
        new URL(request.url).pathname === "/todos"
    ) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ fallback: true }),
                    {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
            })
        );
    }
});
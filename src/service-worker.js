import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("/todos")) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(
                    JSON.stringify({
                        offline: true,
                        data: []
                    }),
                    { headers: { "Content-Type": "application/json" } }
                )
            )
        );
    }
});
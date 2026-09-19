// მინიმალური service worker: Chrome/Android-ის ზოგ ვერსიაში აპლიკაციად
// დაინსტალირებადობისთვის სჭირდება fetch handler. არაფერს ვქეშავთ და
// არაფერს ვაჩერებთ — ყველა მოთხოვნა ჩვეულებრივ ქსელში გადის.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

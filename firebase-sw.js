importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
    projectId: "ps-store-jodhpur",
    messagingSenderId: "66716451867",
    appId: "1:66716451867:web:psstore"
});

const messaging = firebase.messaging();

// Background notification handler
messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification;
    self.registration.showNotification(`PS STORE — ${title}`, {
        body,
        icon:  "/images/logo.png",
        badge: "/images/logo.png",
        vibrate: [200, 100, 200],
        data: { url: "https://psstorelive.in" },
        actions: [
            { action: "open", title: "Open App" },
            { action: "close", title: "Dismiss" }
        ]
    });
});

self.addEventListener("notificationclick", (e) => {
    e.notification.close();
    if (e.action !== "close") {
        clients.openWindow("https://psstorelive.in");
    }
});

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAL16tFZmWvHoMmmHvD26g_0UJW-BZQrUc",
    authDomain: "ps-store-jodhpur.firebaseapp.com",
    projectId: "ps-store-jodhpur",
    storageBucket: "ps-store-jodhpur.firebasestorage.app",
    messagingSenderId: "66716451867",
    appId: "1:66716451867:web:79382824db9f9556c024be",
    measurementId: "G-ZMD54SS712"
});

const messaging = firebase.messaging();

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

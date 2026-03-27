importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyCbzlHhGeAU_BB5eyP9T8DXP6evye5aYF4",
  authDomain: "meteocv.firebaseapp.com",
  projectId: "meteocv",
  storageBucket: "meteocv.firebasestorage.app",
  messagingSenderId: "431194668169",
  appId: "1:431194668169:web:907995e79783f987a5da58",
  measurementId: "G-624KWCD9C0"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Esto detecta los mensajes cuando la web NO está abierta
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/multimedia/logo.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cierra la notificación al pinchar

  // Define a qué URL quieres enviar al usuario
  const urlToOpen = 'https://meteocv.vercel.app';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Si la web ya está abierta en una pestaña, le da el foco (la trae al frente)
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no estaba abierta, abre una pestaña nueva con tu web
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
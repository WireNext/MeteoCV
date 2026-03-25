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
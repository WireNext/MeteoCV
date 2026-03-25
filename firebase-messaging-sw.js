// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbzlHhGeAU_BB5eyP9T8DXP6evye5aYF4",
  authDomain: "meteocv.firebaseapp.com",
  projectId: "meteocv",
  storageBucket: "meteocv.firebasestorage.app",
  messagingSenderId: "431194668169",
  appId: "1:431194668169:web:907995e79783f987a5da58",
  measurementId: "G-624KWCD9C0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1NiBpik9hIZc-QcriUvUOjx4tL7OhlMs",
  authDomain: "dailydifint.firebaseapp.com",
  projectId: "dailydifint",
  storageBucket: "dailydifint.firebasestorage.app",
  messagingSenderId: "126605853271",
  appId: "1:126605853271:web:ff3c0d305fe52bac725912",
  measurementId: "G-R39FCYWXNQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
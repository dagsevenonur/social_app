import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
    apiKey: "AIzaSyBSNzSSDemp4FNiEGChaw4FqGrLp8ixe_I",
    authDomain: "socialapp-edd93.firebaseapp.com",
    projectId: "socialapp-edd93",
    storageBucket: "socialapp-edd93.firebasestorage.app",
    messagingSenderId: "890711860349",
    appId: "1:890711860349:web:546f0e2b0d9664e8d77d14",
    measurementId: "G-SLG6D0XZDX"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth ve Firestore servislerini al
export const auth = getAuth(app);
export const db = getFirestore(app); 
// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database'; // Realtime Database を使うのでこれをインポート

// あなたのFirebaseプロジェクトの構成をここに追加します
// Firebaseコンソールで確認してください
const firebaseConfig = {
  apiKey: "AIzaSyDACeO_bZop_vj-cQWEB7C1mg_R9YMi0ps",
  authDomain: "summerhomeworkapp.firebaseapp.com",
  projectId: "summerhomeworkapp",
  storageBucket: "summerhomeworkapp.firebasestorage.app",
  messagingSenderId: "46418444732",
  appId: "1:46418444732:web:72d8ec8117e65ef7f6ebb9",
  databaseURL: "https://summerhomeworkapp-default-rtdb.firebaseio.com/",
};

// Firebaseを初期化
export const app = initializeApp(firebaseConfig); // app をエクスポートする

// Realtime Databaseのインスタンスを取得
export const database = getDatabase(app);

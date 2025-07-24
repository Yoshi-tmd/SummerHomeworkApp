// auth.ts
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './firebaseConfig'; // firebaseConfig.ts から初期化された app をインポート

// ★Firebase Authentication のインスタンスを取得（再度）
export const auth = getAuth(app); // ★この行を復活させます

/**
 * 新しいユーザーをメールとパスワードで登録します。
 * @param email ユーザーのメールアドレス
 * @param password ユーザーのパスワード
 * @returns Promise<UserCredential>
 */
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User registered successfully:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    console.error('Error registering user:', error.message);
    throw error; // エラーを呼び出し元に伝える
  }
};

/**
 * 既存のユーザーをメールとパスワードでログインさせます。
 * @param email ユーザーのメールアドレス
 * @param password ユーザーのパスワード
 * @returns Promise<UserCredential>
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in successfully:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    console.error('Error logging in user:', error.message);
    throw error;
  }
};

/**
 * 現在のユーザーをログアウトさせます。
 * @returns Promise<void>
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully.');
  } catch (error: any) {
    console.error('Error logging out:', error.message);
    throw error;
  }
};

// FirebaseConfig.ts に修正が必要です
// export const app = initializeApp(firebaseConfig); のように app をエクスポートするように変更します。
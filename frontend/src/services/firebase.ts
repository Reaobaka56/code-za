import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithCredential, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAlu2QqyfC6rggmTK8XxogJXuGkuGvwttk",
  authDomain: "web-ide-6f8b0.firebaseapp.com",
  projectId: "web-ide-6f8b0",
  storageBucket: "web-ide-6f8b0.firebasestorage.app",
  messagingSenderId: "479851404387",
  appId: "1:479851404387:web:dcead3dcd6052b758aac56",
  measurementId: "G-7K1SNXT6KQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally (it might not work in all environments)
export const analyticsPromise = isSupported().then(yes => yes ? getAnalytics(app) : null);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInWithGithubCredential = async (accessToken: string) => {
  try {
    const credential = GithubAuthProvider.credential(accessToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error) {
    console.error("Error signing in with GitHub credential", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

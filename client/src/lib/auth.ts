import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  async signInWithGoogle(): Promise<FirebaseUser | null> {
    try {
      console.log("Attempting Google sign-in...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Sign-in successful:", result.user);
      return result.user;
    } catch (error: any) {
      console.error("Google sign-in error details:", {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      
      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Dominio non autorizzato. Configura il dominio in Firebase Console.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloccato dal browser. Abilita i popup per questo sito.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login annullato dall\'utente.');
      }
      
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
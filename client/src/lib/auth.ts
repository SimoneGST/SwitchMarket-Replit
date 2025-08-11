import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export const authService = {
  async signInWithGoogle(): Promise<FirebaseUser | null> {
    try {
      // Configure provider
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      // Use popup with error handling
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      // Re-throw with original error for proper handling
      throw error;
    }
  },

  // Handle redirect result on page load
  async handleRedirectResult(): Promise<FirebaseUser | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        return result.user;
      }
      return null;
    } catch (error: any) {
      console.error("Redirect error:", error);
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

  async signUpWithEmail(email: string, password: string, userType: 'customer' | 'merchant'): Promise<FirebaseUser | null> {
    try {
      console.log("Creating account with email:", email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        userType: userType,
        createdAt: new Date(),
        profileCompleted: false
      });
      
      console.log("Account created successfully:", result.user);
      return result.user;
    } catch (error: any) {
      console.error("Email sign-up error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email già in uso. Prova ad accedere invece di registrarti.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password troppo debole. Usa almeno 6 caratteri.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Indirizzo email non valido.');
      }
      
      throw error;
    }
  },

  async signInWithEmail(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      console.log("Signing in with email:", email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign-in successful:", result.user);
      return result.user;
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Utente non trovato. Verifica l\'email o registrati.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Password errata. Riprova.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Indirizzo email non valido.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Troppi tentativi falliti. Riprova più tardi.');
      }
      
      throw error;
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Utente non trovato con questa email.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Indirizzo email non valido.');
      }
      
      throw error;
    }
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
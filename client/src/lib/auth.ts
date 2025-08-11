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
      console.log("🔐 Attempting Google sign-in...");
      console.log("🔧 Firebase Config Check:", {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Missing", 
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? "✓ Set" : "✗ Missing",
        authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
      });
      
      // Configure provider
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      try {
        // Try popup first (works better on desktop)
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ Google sign-in successful (popup):", {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        return result.user;
      } catch (popupError: any) {
        console.log("🔄 Popup failed, trying redirect...", popupError.code);
        
        // If popup fails, try redirect (works better on mobile/restricted environments)
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/unauthorized-domain') {
          
          console.log("🔄 Using redirect method...");
          await signInWithRedirect(auth, googleProvider);
          return null; // Redirect will reload the page
        }
        
        throw popupError;
      }
    } catch (error: any) {
      console.error("❌ Google sign-in error details:", {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      
      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error(`Dominio non autorizzato. Aggiungi "${window.location.hostname}" ai domini autorizzati in Firebase Console.`);
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloccato. Sto provando con il redirect...');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login annullato. Riprova e completa l\'autenticazione.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Errore di rete. Verifica la connessione internet.');
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Errore configurazione Firebase. Controlla le chiavi API.');
      }
      
      throw new Error(`Errore autenticazione: ${error.message}`);
    }
  },

  // Handle redirect result on page load
  async handleRedirectResult(): Promise<FirebaseUser | null> {
    try {
      console.log("🔍 Checking for redirect result...");
      const result = await getRedirectResult(auth);
      if (result) {
        console.log("✅ Google sign-in successful (redirect):", {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        return result.user;
      }
      return null;
    } catch (error: any) {
      console.error("❌ Redirect result error:", error);
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
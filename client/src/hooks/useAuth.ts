import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { users } from "@/lib/firestore";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        const { authService } = await import("@/lib/auth");
        await authService.handleRedirectResult();
      } catch (error) {
        console.error("Redirect result error:", error);
      }
    };
    
    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get or create user document in Firestore
          let userData = await users.get(firebaseUser.uid);
          
          if (!userData) {
            // Extract name parts from Google displayName
            const nameParts = firebaseUser.displayName?.split(" ") || [];
            const firstName = nameParts[0] || "";
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
            

            
            // Create new user document
            userData = await users.create({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName,
              lastName,
              profileImageUrl: firebaseUser.photoURL || "",
              userType: undefined, // Will be set during onboarding
            });
          } else {
            // Update existing user with Google data if missing
            const updates: any = {};
            if (!userData.firstName && firebaseUser.displayName) {
              const nameParts = firebaseUser.displayName.split(" ");
              updates.firstName = nameParts[0] || "";
              if (nameParts.length > 1) {
                updates.lastName = nameParts.slice(1).join(" ");
              }
            }
            if (!userData.profileImageUrl && firebaseUser.photoURL) {
              updates.profileImageUrl = firebaseUser.photoURL;
            }
            
            if (Object.keys(updates).length > 0) {
              const updatedData = await users.update(firebaseUser.uid, updates);
              if (updatedData) {
                userData = updatedData;
              }
            }
          }
          
          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
  };
}

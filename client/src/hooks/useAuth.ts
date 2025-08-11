import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { users } from "@/lib/firestore";
import { authService } from "@/lib/auth";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        console.log("🔄 Starting auth state check...");
        const redirectUser = await authService.handleRedirectResult();
        if (redirectUser && isMounted) {
          console.log("🎯 Redirect user found, processing...");
        }
      } catch (error) {
        console.error("❌ Redirect result error:", error);
      }
    };
    
    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      console.log("🔄 Auth state changed:", firebaseUser ? "User logged in" : "User logged out");
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
            
            console.log('🔍 Creating new user from Google account:', {
              displayName: firebaseUser.displayName,
              extractedFirstName: firstName,
              extractedLastName: lastName,
              email: firebaseUser.email
            });
            
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
              console.log('🔄 Updating existing user with Google data:', updates);
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

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
  };
}

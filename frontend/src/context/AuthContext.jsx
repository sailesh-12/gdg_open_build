import { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            console.log("🔐 Attempting Google Sign-In...");
            console.log("  Auth instance:", auth);
            console.log("  Google Provider:", googleProvider);
            const result = await signInWithPopup(auth, googleProvider);
            console.log("✅ Google Sign-In successful:", result.user.email);
            return { success: true, user: result.user };
        } catch (error) {
            console.error("❌ Google Sign-In Error:");
            console.error("  Error Code:", error.code);
            console.error("  Error Message:", error.message);
            console.error("  Full Error:", error);
            if (error.customData) {
                console.error("  Custom Data:", error.customData);
            }
            return { success: false, error: error.message };
        }
    };

    const signUpWithEmail = async (email, password) => {
        try {
            console.log("🔐 Attempting Email Sign-Up for:", email);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            console.log("✅ Email Sign-Up successful:", result.user.email);
            return { success: true, user: result.user };
        } catch (error) {
            console.error("❌ Email Sign-Up Error:");
            console.error("  Error Code:", error.code);
            console.error("  Error Message:", error.message);
            console.error("  Full Error:", error);
            return { success: false, error: error.message };
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            console.log("🔐 Attempting Email Sign-In for:", email);
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log("✅ Email Sign-In successful:", result.user.email);
            return { success: true, user: result.user };
        } catch (error) {
            console.error("❌ Email Sign-In Error:");
            console.error("  Error Code:", error.code);
            console.error("  Error Message:", error.message);
            console.error("  Full Error:", error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

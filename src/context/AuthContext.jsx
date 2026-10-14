
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;

      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const profileRef = doc(db, "users", firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (!active) return;

        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        } else {
          setProfile({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            role: "buyer",
          });
        }
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function register({ name, email, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();

    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    try {
      await updateProfile(credential.user, {
        displayName: name.trim(),
      });

      const newProfile = {
        uid: credential.user.uid,
        name: name.trim(),
        email: normalizedEmail,
        role,
        createdAt: serverTimestamp(),
      };

      await setDoc(
        doc(db, "users", credential.user.uid),
        newProfile
      );

      setUser(credential.user);
      setProfile({
        ...newProfile,
        createdAt: new Date(),
      });

      return credential.user;
    } catch (error) {
      // Si falla el perfil, no dejamos una sesión parcial abierta.
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Error al cerrar la sesión parcial:", signOutError);
      }

      throw error;
    }
  }

  async function login({ email, password }) {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

    return credential.user;
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}

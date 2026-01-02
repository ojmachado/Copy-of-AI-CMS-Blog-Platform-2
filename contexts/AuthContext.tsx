
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Timeout de segurança: Se o Firebase não responder em 3s, libera a renderização
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("AuthContext: Firebase connection timeout. Forcing UI render.");
        setIsLoading(false);
      }
    }, 3000);

    let unsubscribe = () => {};

    try {
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser && firebaseUser.email) {
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.email.toLowerCase()));
              if (userDoc.exists()) {
                setUser(userDoc.data() as User);
              } else {
                setUser(null);
              }
            } catch (error) {
              console.error("Erro ao carregar perfil do usuário:", error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
          clearTimeout(timeout);
        });
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Auth Listener Error:", e);
      setIsLoading(false);
    }

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

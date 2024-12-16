import React, { createContext, useContext, useEffect } from 'react';
import { useAsyncOperation, AsyncOperation } from '../shared/AsyncOperation';
import Loading from '../shared/Loading';
import Alert from '../shared/Alert';

export type User = {
  id: number;
  login: string;
}

type ContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<ContextType>({
  user: null,
  setUser: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export const getAuth = async (): Promise<User | null> => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_42_URI}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    } else {
      console.error('Token invalide');
      localStorage.removeItem('access_token');
      return null;
    }
  } catch (error) {
    console.error('Erreur réseau :', error);
    return null;
  }
};


function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ busy, user, errorMessage, setUser }, setState] = useAsyncOperation<AsyncOperation<ContextType>>(
    {
      user: null,
      setUser: (user: User | null): void => setState((prev) => ({ ...prev, user })),
      busy: true,
    },
    true,
  );

  const validateToken = () => {
    getAuth()
      .then((user) => {
        setState((prev: AsyncOperation<ContextType>) => ({ ...prev, user, busy: false }));
      })
      .catch((error) => {
        setState((prev: AsyncOperation<ContextType>) => ({
          ...prev,
          errorMessage: error.message || "Erreur inconnue",
          busy: false,
        }));
      });
  };

  useEffect(() => {
    validateToken();
  }, []);

  // Surveiller les changements de token
  useEffect(() => {
    const tokenChangeHandler = () => {
      if (localStorage.getItem('access_token')) {
        validateToken();
      }
    };

    window.addEventListener('storage', tokenChangeHandler);
    return () => window.removeEventListener('storage', tokenChangeHandler);
  }, []);

  if (busy) return <Loading />;
  if (errorMessage) return <Alert children={errorMessage} />;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}


export default AuthProvider;
import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile } from "@/api/users";

export interface IAuthContext {
  loggedIn: boolean;
  loading: boolean;
  setLoggedIn?: (value: boolean) => void;
  logOut: () => void;
  user: IUser | null;
  setUser?: (user: IUser) => void;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  username: string;
  age: number;
  display_name?: string;
  timezone?: string;
  // Add other user properties as needed
}

export const AuthContext = createContext<IAuthContext>({
  loggedIn: false,
  loading: false,
  user: null,
  logOut: () => {},
  setLoggedIn: () => {},
  setUser: () => {},
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<IAuthContext>({
    loggedIn: false,
    loading: true,
    user: null,
    logOut: () => {},
    setLoggedIn: () => {},
  });

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        try {
          const user = await getUserProfile();
          setState((prev) => ({
            ...prev,
            loggedIn: true,
            loading: false,
            user,
          }));
        } catch (error) {
          await AsyncStorage.removeItem("token");
          setState((prev) => ({
            ...prev,
            loggedIn: false,
            loading: false,
            user: null,
          }));
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    })();
  }, []);

  const logOut = async () => {
    await AsyncStorage.removeItem("token");
    setState((prev) => ({
      ...prev,
      loggedIn: false,
      user: null,
    }));
  };

  const data = useMemo(() => {
    return {
      loggedIn: state.loggedIn,
      loading: state.loading,
      user: state.user,
      setLoggedIn: (value: boolean) =>
        setState((prev) => ({ ...prev, loggedIn: value })),
      setUser: (user: IUser) => setState((prev) => ({ ...prev, user })),
      logOut,
    };
  }, [state.loggedIn, state.loading, state.user]);

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

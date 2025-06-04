import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile } from "@/api/users";

export interface IAuthContext {
  loggedIn: boolean;
  loading: boolean;
  setLoggedIn?: (value: boolean) => void;
  logOut: () => void;
}

export const AuthContext = createContext<IAuthContext>({
  loggedIn: false,
  loading: false,
  logOut: () => {},
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState({
    loggedIn: false,
    loading: true,
    user: null,
  });

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        const user = await getUserProfile();
        setState((prev) => ({
          ...prev,
          loggedIn: true,
          loading: false,
          user,
        }));
      }
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
      logOut,
    };
  }, [state.loggedIn, state.loading, state.user]);

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

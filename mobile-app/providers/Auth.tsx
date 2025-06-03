import React, {
  createContext,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");

      setTimeout(() => {
        if (token) {
          setLoggedIn(true);
        }

        setLoading(false);
      }, 1000); // Simulate loading delay
    })();
  }, []);

  const logOut = async () => {
    await AsyncStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        loading,
        logOut,
        setLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

import { createContext, useState, useContext,useEffect, type ReactNode  } from "react";
import api from "../api/axios";

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (form: any) => Promise<void>;
  logout: () => void;
  updateUser: (changes: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);export function AuthProvider({ children }:{children:ReactNode}){

    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")||"null"));
    const [token, setToken] = useState(localStorage.getItem("token"));

    const saveData = (data:any) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
    }

    const register = async (form:any) => {
        const res = await api.post("/auth/register", form);
        saveData(res.data);
    }

    const login = async (email:string, password:string) => {
        const res = await api.post("/auth/login", { email, password });
        saveData(res.data);
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        if (!token) return;

        const loadMe = async () => {
            try {
                const res = await api.get("/auth/me");
                const freshUser = res.data.user;
                localStorage.setItem("user", JSON.stringify(freshUser));
                setUser(freshUser);
            } catch (err) {
                logout();
            }
        };
        loadMe();
    }, [token]);

    const updateUser = (changes:any) => {
        const update = { ...user, ...changes };
        localStorage.setItem("user", JSON.stringify(update));
        setUser(update)
    }
    return (

        <AuthContext.Provider
            value={{ user, token, login, logout, register, updateUser }}
        >
            {children}
        </AuthContext.Provider>

    );

}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
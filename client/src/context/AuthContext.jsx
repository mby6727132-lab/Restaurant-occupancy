import { createContext, useState, useContext,useEffect  } from "react";
import api from "../api/axios";
const AuthContext = createContext(null);


export function AuthProvider({ children }) {

    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [token, setToken] = useState(localStorage.getItem("token"));

    const saveData = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
    }

    const register = async (form) => {
        const res = await api.post("/auth/register", form);
        saveData(res.data);
    }

    const login = async (email, password) => {
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

    const updateUser = (changes) => {
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
    return useContext(AuthContext);
}
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react";
import api from "../api/axios";
import Search from "./Search";

export default function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([])
    const [error, setError] = useState();
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState(null);


    const handleLogout = () => {
        logout();
        navigate("/login");
    }

    useEffect(() => {
        const loadRestaurants = async () => {
            setError("")
            try {
                setLoading(true)
                const res = await api.get("restaurants");
                setRestaurants(res.data.items);
            } catch (err) {
                setError(err?.response?.data?.error?.massage || "טעינת מסעדות נכשלה")
            } finally {
                setLoading(false)
            }
        }
        loadRestaurants();
    },[])

    return (
        <>
            <header>
                <h3>שלום, <p>{user.fullName}</p></h3>
                <button onClick={handleLogout}>התנתק</button>
                <button onClick={() => navigate("/myRestaurants/new")}>מנהל</button>
                <button onClick={() => navigate("/home")}>אורח</button>
                <Search restaurants={restaurants} onSearch={setResults}/>
            </header>
            <h2>מסעדות</h2>
            {loading && <p>טוען...</p>}
            {error && <p>{error}</p>}
            <div>
                {results !== null && results.length === 0&& <p>לא נמצאו מסעדות תואמות לסינון</p>}
                {(results ?? restaurants).map((r) => (
                    <div key={r.id}>
                        <h3>{r.name} {}</h3>
                        <p>{r.city}</p>
                        <p>{r.type}</p>
                        <p>{r.occupancy.occupancyPercent}% מלא</p>
                        <hr />
                    </div>

                ))}
            </div>

        </>
    )
}
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function Login() {

    const [form, setForm] = useState({email: "", password: "" })
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();
    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {

            await login(form.email, form.password);
            navigate("/home");

        } catch (err) {
            setError(err.response?.data?.error?.message || "ההתחברות נכשלה");
        }
    };
    return (

        <form onSubmit={handleSubmit}>
            <h2>הרשמה</h2>
            <input name="email" placeholder="mail" type="email" value={form.email} onChange={handleChange} required></input>
            <input name="password" placeholder="password" type="password" value={form.password} onChange={handleChange} required></input>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">התחבר</button>
            <p>חדש אצלינו? <Link to="/register">הירשם</Link></p>
        </form>

    );
}
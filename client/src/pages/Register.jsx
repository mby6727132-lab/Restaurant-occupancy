import { useState } from "react"
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function validPassword(password) {
    if (password.length < 8)
        return "הסיסמה חייבת להכיל לפחות 8 תווים";
    if (!/[0-9]/.test(password))
        return "הסיסמה חייבת להכיל לפחות ספרה אחת";
    if (!/[A-Za-z]/.test(password))
        return "הסיסמה חייבת להכיל לפחות אות אחת";
    return "";
}

export default function Register() {

    const [form, setForm] = useState({ fullName: "", email: "", password: "" })
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { register } = useAuth();
    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const passwordError = validPassword(form.password)
        if (passwordError) {
            setError(passwordError);
            return;
        }
        try {
           await register(form);
            navigate("/home");

        } catch (err) {
            setError(err.response?.data?.error?.message || "ההרשמה נכשלה");
        }
    };
    return (

        <form onSubmit={handleSubmit}>
            <h2>הרשמה</h2>
            <input name="fullName" placeholder="name" value={form.fullName} onChange={handleChange} required></input>
            <input name="email" placeholder="mail" type="email" value={form.email} onChange={handleChange} required></input>
            <input name="password" placeholder="password" type="password" value={form.password} onChange={handleChange} required></input>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">הרשמה</button>
            <p>רשום כבר? <Link to="/login">התחבר</Link></p>
        </form>

    );
}
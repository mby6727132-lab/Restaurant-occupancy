import { useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingOverlay from "../components/LoadingOverlay";


function validPassword(password: string) {
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
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const { register } = useAuth();
    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        const passwordError = validPassword(form.password)
        if (passwordError) {
            setError(passwordError);
            return;
        }
        setLoading(true)
        try {
           await register(form);
            navigate("/home");

        } catch (err: any) {
            setError(err.response?.data?.error?.message || "ההרשמה נכשלה");
        } finally {
            setLoading(false)
        }
    };
    return (

        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            {loading && <LoadingOverlay />}
            <div className="w-full max-w-md">
                <img src="/ICONS/mytable-logo-terracotta.svg" alt="MyTable" className="mx-auto mb-8 h-11 w-auto" />
                <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
                    <div>
                        <h2 className="page-title">הרשמה</h2>
                        <p className="subtitle">כמה פרטים ואפשר להתחיל</p>
                    </div>
                    <label className="field">
                        <span className="label">שם מלא</span>
                        <input className="input" name="fullName" placeholder="ישראל ישראלי" value={form.fullName} onChange={handleChange} required></input>
                    </label>
                    <label className="field">
                        <span className="label">אימייל</span>
                        <input className="input" name="email" placeholder="name@example.com" type="email" dir="ltr" value={form.email} onChange={handleChange} required></input>
                    </label>
                    <label className="field">
                        <span className="label">סיסמה</span>
                        <input className="input" name="password" placeholder="לפחות 8 תווים, אות וספרה" type="password" value={form.password} onChange={handleChange} required></input>
                    </label>
                    {error && <p className="alert-error">{error}</p>}
                    <button className="btn btn-primary w-full" type="submit">הרשמה</button>
                    <p className="text-center text-sm text-stone-500">רשום כבר? <Link className="font-semibold text-primary hover:underline" to="/login">התחבר</Link></p>
                </form>
            </div>
        </div>

    );
}
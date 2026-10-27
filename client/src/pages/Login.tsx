import { useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingOverlay from "../components/LoadingOverlay";


export default function Login() {

    const [form, setForm] = useState({email: "", password: "" })
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const { login } = useAuth();
    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true)
        try {

            await login(form.email, form.password);
            navigate("/home");

        } catch (err: any) {
            setError(err.response?.data?.error?.message || "ההתחברות נכשלה");
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
                        <h2 className="page-title">התחברות</h2>
                        <p className="subtitle">טוב לראות אותך שוב</p>
                    </div>
                    <label className="field">
                        <span className="label">אימייל</span>
                        <input className="input" name="email" placeholder="name@example.com" type="email" dir="ltr" value={form.email} onChange={handleChange} required></input>
                    </label>
                    <label className="field">
                        <span className="label">סיסמה</span>
                        <input className="input" name="password" placeholder="••••••••" type="password" dir="ltr" value={form.password} onChange={handleChange} required></input>
                    </label>
                    {error && <p className="alert-error">{error}</p>}
                    <button className="btn btn-primary w-full" type="submit">התחבר</button>
                    <p className="text-center text-sm text-stone-500">חדש אצלינו? <Link className="font-semibold text-primary hover:underline" to="/register">הירשם</Link></p>
                </form>
            </div>
        </div>

    );
}
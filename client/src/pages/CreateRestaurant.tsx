import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ResDetails from "./ResDetails";
import EditTables from "./EditTables";
import LoadingOverlay from "../components/LoadingOverlay";


const emptyForm = {
    name: "",
    ownerName: "",
    ownerPhone: "",
    street: "",
    city: "",
    type: "MEAT",
    description: "",
    imageUrl: "",

}

export default function CreateRestaurant() {
    const [form, setForm] = useState(emptyForm)
    const [tableGroups, setTableGroups] = useState([{ capacity: 2, totalTables: 1 }]);
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const { updateUser, user } = useAuth();
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)

    const addTable = () => {
        setTableGroups([...tableGroups, { capacity: 2, totalTables: 1 }]);
    }

    const changeTable = (index: number, field: string, value: string) => {
        const copy = [...tableGroups]
        copy[index] = { ...copy[index], [field]: Number(value) }
        setTableGroups(copy);
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true)
        if (!user.restaurantId) {
            try {
                const res = await api.post("/restaurants", { ...form, tableGroups });
                updateUser({ isManager: true, restaurantId: res.data.restaurant.id })
                setIsEditing(true)
                navigate("/home");
            } catch (err: any) {
                setError(err.response?.data?.message || "יצירת המסעדה נכשלה")
            } finally {
                setLoading(false)
            }

        }
        else {
            try {
                await api.patch(`/restaurants/${user.restaurantId}`, form);
                await api.put(`/restaurants/${user.restaurantId}/table-groups`, { tableGroups });
                navigate("/home");
            } catch (err: any) {
                setError(err.response?.data?.message || "עריכת המסעדה נכשלה")
            } finally {
                setLoading(false)
            }

        }

    }

    useEffect(() => {

        const loadRestaurant = async () => {
            try {
                const res = await api.get(`/restaurants/${user.restaurantId}`);
                const r = res.data.restaurant;
                setForm({
                    name: r.name,
                    ownerName: r.ownerName,
                    ownerPhone: r.ownerPhone,
                    street: r.street,
                    city: r.city,
                    type: r.type,
                    description: r.description,
                    imageUrl: r.imageUrl ?? "",
                });
                setTableGroups(res.data.restaurant.tableGroups)
            } catch (err: any) {
                setError(err.response?.data?.message || "יצירת המסעדה נכשלה")
            } finally {
                setLoading(false)
            }
        }
        loadRestaurant()
    }, [user?.restaurantId])


    const hasRestaurant = !!user?.restaurantId;

    if (hasRestaurant && !isEditing) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                {loading && <LoadingOverlay />}
                <ResDetails
                    restaurant={form}
                    tableGroups={tableGroups}
                    onEdit={() => setIsEditing(true)}
                />
                <EditTables tableGroups={tableGroups} setTableGroups={setTableGroups} />
            </div>

        );
    }
    return (
        <>
            {loading && <LoadingOverlay />}
            <form onSubmit={handleSubmit} className="card mx-auto max-w-3xl space-y-8 p-6 sm:p-8">
                <div>
                    <h2 className="page-title">פרטי המסעדה</h2>
                    <p className="subtitle">הפרטים יוצגו לאורחים שמחפשים מסעדה</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <label className="field">
                        <span className="label">שם המסעדה</span>
                        <input className="input" name="name" placeholder="שם המסעדה" value={form.name} onChange={handleChange} required />
                    </label>
                    <label className="field">
                        <span className="label">שם בעל המסעדה</span>
                        <input className="input" name="ownerName" placeholder="שם בעל המסעדה" value={form.ownerName} onChange={handleChange} required />
                    </label>
                    <label className="field">
                        <span className="label">טלפון</span>
                        <input className="input" name="ownerPhone" placeholder="טלפון" value={form.ownerPhone} onChange={handleChange} required />
                    </label>
                    <div className="field">
                        <span className="label">סוג המסעדה</span>
                        <div className="segmented">
                            <label className="choice"><input className="sr-only" name="type" type="radio" value="MEAT" checked={form.type === "MEAT"} onChange={handleChange} />בשרי</label>
                            <label className="choice"><input className="sr-only" name="type" type="radio" value="DAIRY" checked={form.type === "DAIRY"} onChange={handleChange} />חלבי</label>
                        </div>
                    </div>
                    <label className="field">
                        <span className="label">רחוב</span>
                        <input className="input" name="street" placeholder="רחוב" value={form.street} onChange={handleChange} required />
                    </label>
                    <label className="field">
                        <span className="label">עיר</span>
                        <input className="input" name="city" placeholder="עיר" value={form.city} onChange={handleChange} required />
                    </label>
                    <label className="field sm:col-span-2">
                        <span className="label">תיאור</span>
                        <textarea className="input h-auto min-h-28 py-3" name="description" placeholder="ספר לנו קצת על המסעדה" value={form.description} onChange={handleChange} required />
                    </label>
                    <label className="field sm:col-span-2">
                        <span className="label">תמונה</span>
                        <input className="input" name="imageUrl" type="img" placeholder="קישור לתמונה" value={form.imageUrl} onChange={handleChange} />
                    </label>
                </div>

                <div className="space-y-4">
                    <h3 className="section-title">שולחנות</h3>
                    {
                        tableGroups.map((group, index) => (
                            <div key={index} className="grid grid-cols-2 gap-4 rounded-xl border border-stone-200/70 bg-stone-50/60 p-4">
                                <label className="field">
                                    <span className="label">כיסאות</span>
                                    <input
                                        className="input"
                                        type="number"
                                        min={2}
                                        value={group.capacity}
                                        onChange={(e) => changeTable(index, "capacity", e.target.value)}
                                    />
                                </label>
                                <label className="field">
                                    <span className="label">שולחנות</span>
                                    <input
                                        className="input"
                                        type="number"
                                        min={1}
                                        value={group.totalTables}
                                        onChange={(e) => changeTable(index, "totalTables", e.target.value)}
                                    />
                                </label>
                            </div>
                        ))
                    }
                    <button className="btn btn-secondary" type="button" onClick={addTable}>הוסף שולחן אחר + </button>
                </div>

                {error && <p className="alert-error">{error}</p>}
                <div className="flex flex-wrap gap-3 border-t border-stone-100 pt-6">
                    <button className="btn btn-primary" type="submit">{isEditing ? "שמירת שינויים" : "יצירת מסעדה"}</button>
                    {isEditing && <button className="btn btn-ghost" type="button" onClick={() => setIsEditing(false)}>ביטול</button>}
                </div>
            </form >


        </>


    )
}
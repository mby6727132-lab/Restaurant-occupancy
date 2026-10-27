import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ResDetails from "./ResDetails";
import EditTables from "./EditTables";

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
    console.log(user)
    const [isEditing, setIsEditing] = useState(false)

    const addTable = () => {
        setTableGroups([...tableGroups, { capacity: 2, totalTables: 1 }]);
    }

    const changeTable = (index, field, value) => {
        const copy = [...tableGroups]
        copy[index] = { ...copy[index], [field]: Number(value) }
        setTableGroups(copy);
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!user.restaurantId) {
            try {
                const res = await api.post("/restaurants", { ...form, tableGroups });
                updateUser({ isManager: true, restaurantId: res.data.restaurant.id })
                setIsEditing(true)
                navigate("/home");
            } catch (err) {
                setError(err.response?.data?.message || "יצירת המסעדה נכשלה")
            }

        }
        else {
            try {
                await api.patch(`/restaurants/${user.restaurantId}`, form);
                await api.put(`/restaurants/${user.restaurantId}/table-groups`, { tableGroups });
                navigate("/home");
            } catch (err) {
                setError(err.response?.data?.message || "עריכת המסעדה נכשלה")
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
            } catch (err) {
                setError(err.response?.data?.message || "יצירת המסעדה נכשלה")
            }
        }
        loadRestaurant()
    }, [user?.restaurantId])


    const hasRestaurant = !!user?.restaurantId;

    if (hasRestaurant && !isEditing) {
        return (
            <>
                <ResDetails
                    restaurant={form}
                    tableGroups={tableGroups}
                    onEdit={() => setIsEditing(true)}
                />
                <EditTables tableGroups={tableGroups} />
            </>

        );
    }
    return (
        <>
            <form onSubmit={handleSubmit}>
                <h2>פרטי המסעדה</h2>
                {
                    console.log(isEditing)

                }
                <input name="name" placeholder="שם המסעדה" value={form.name} onChange={handleChange} required />
                <input name="ownerName" placeholder="שם בעל המסעדה" value={form.ownerName} onChange={handleChange} required />
                <input name="ownerPhone" placeholder="טלפון" value={form.ownerPhone} onChange={handleChange} required />
                <input name="street" placeholder="רחוב" value={form.street} onChange={handleChange} required />
                <input name="city" placeholder="עיר" value={form.city} onChange={handleChange} required />
                <label><input name="type" type="radio" value="MEAT" checked={form.type === "MEAT"} onChange={handleChange} />בשרי</label>
                <label><input name="type" type="radio" value="DAIRY" checked={form.type === "DAIRY"} onChange={handleChange} />חלבי</label>
                <textarea name="description" placeholder="ספר לנו קצת על המסעדה" value={form.description} onChange={handleChange} required />
                <input name="image" type="img" placeholder="תמונה" value={form.image} onChange={handleChange} />
                <h3>שולחנות</h3>
                {
                    tableGroups.map((group, index) => (
                        <div key={index}>
                            <label>
                                כיסאות
                                <input
                                    type="number"
                                    min={2}
                                    value={group.capacity}
                                    onChange={(e) => changeTable(index, "capacity", e.target.value)}
                                />
                            </label>
                            <br></br>
                            <label>
                                שולחנות
                                <input
                                    type="number"
                                    min={1}
                                    value={group.totalTables}
                                    onChange={(e) => changeTable(index, "totalTables", e.target.value)}
                                />
                            </label>
                        </div>
                    ))
                }
                <button type="button" onClick={addTable}>הוסף שולחן אחר + </button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit">{isEditing ? "שמירת שינויים" : "יצירת מסעדה"}</button>
                {isEditing && <button type="button" onClick={() => setIsEditing(false)}>ביטול</button>}
            </form >


        </>


    )
}
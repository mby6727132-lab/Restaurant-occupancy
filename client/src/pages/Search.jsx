import { useState } from "react";

const emptyForm = {
    name: "",
    city: "",
    type: "MEAT",
    countEat: ""
}

export default function Search({ restaurants, onSearch }) {

    const [form, setForm] = useState(emptyForm);
    const handleFilter = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSearch = (e) => {
        e.preventDefault()
        const res = restaurants.filter(r => (
            // console.log(r)
            ((form.city === "" || r.city === form.city)
                && (r.name == form.name || form.name == "")
                && (r.type == form.type || form.type == "")
                && (Number(r.occupancy.freeSeats) >= Number(form.countEat) || form.countEat == ""))
        ))
        onSearch(res)
    }

    const handlerClear = () => {
        setForm(emptyForm)
        onSearch(null)
    }

    return (
        <>
            <form>
                <input name="name" placeholder="שם המסעדה" value={form.name} onChange={handleFilter} />
                <input name="city" placeholder="עיר" value={form.city} onChange={handleFilter} />
                <label><input name="type" type="radio" value="DAIRY" checked={form.type === "DAIRY"} onChange={handleFilter} />חלבי</label>
                <label><input name="type" type="radio" value="MEAT" checked={form.type === "MEAT"} onChange={handleFilter} />בשרי</label>
                <input name="countEat" type="number" onChange={handleFilter} />
                <button onClick={handleSearch}>מצא לי מסעדה</button>
                <button type="button" onClick={handlerClear}>ניקוי מסננים</button>
            </form>

        </>
    )
} 
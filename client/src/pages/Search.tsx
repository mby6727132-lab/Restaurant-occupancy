import { useState, type ChangeEvent, type MouseEvent } from "react";

const emptyForm = {
    name: "",
    city: "",
    type: "MEAT",
    countEat: ""
}

export default function Search({ restaurants, onSearch }: { restaurants: any[]; onSearch: (results: any[] | null) => void }) {

    const [form, setForm] = useState(emptyForm);
    const handleFilter = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSearch = (e: MouseEvent<HTMLButtonElement>) => {
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
            <form className="card bg-white/95 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="field">
                        <span className="label">שם המסעדה</span>
                        <input className="input" name="name" placeholder="שם המסעדה" value={form.name} onChange={handleFilter} />
                    </label>
                    <label className="field">
                        <span className="label">עיר</span>
                        <input className="input" name="city" placeholder="עיר" value={form.city} onChange={handleFilter} />
                    </label>
                    <label className="field">
                        <span className="label">מספר סועדים</span>
                        <input className="input" name="countEat" type="number" min={1} placeholder="כמה אתם?" onChange={handleFilter} />
                    </label>
                    <div className="field">
                        <span className="label">סוג</span>
                        <div className="segmented">
                            <label className="choice"><input className="sr-only" name="type" type="radio" value="DAIRY" checked={form.type === "DAIRY"} onChange={handleFilter} />חלבי</label>
                            <label className="choice"><input className="sr-only" name="type" type="radio" value="MEAT" checked={form.type === "MEAT"} onChange={handleFilter} />בשרי</label>
                        </div>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                    <button className="btn btn-primary" onClick={handleSearch}>מצא לי מסעדה</button>
                    <button className="btn btn-ghost" type="button" onClick={handlerClear}>ניקוי מסננים</button>
                </div>
            </form>

        </>
    )
} 
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
import Search from "./Search";
import OccupancyRing from "../components/OccupancyRing";
import { getRestaurantImage, HERO_IMAGE } from "../utils/restaurantImage";
import LoadingOverlay from "../components/LoadingOverlay";

export default function Home() {
    const [restaurants, setRestaurants] = useState<any[]>([])
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<any[] | null>(null);


    useEffect(() => {
        const loadRestaurants = async () => {
            setError("")
            try {
                setLoading(true)
                const res = await api.get("restaurants");
                setRestaurants(res.data.items);
            } catch (err: any) {
                setError(err?.response?.data?.error?.message || "טעינת מסעדות נכשלה")
            } finally {
                setLoading(false)
            }
        }
        loadRestaurants();
    }, [])

    return (
        <div className="space-y-10">
            <section className="hero px-5 pt-14 pb-6 sm:px-10 sm:pt-24 sm:pb-10" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
                <div className="max-w-2xl text-white">
                    <p className="text-sm font-semibold text-[#f6c9b4]">MyTable</p>
                    <h2 className="mt-2 font-display text-4xl leading-tight font-black sm:text-5xl">מוצאים שולחן פנוי, עכשיו</h2>
                    <p className="mt-3 text-base text-white/85 sm:text-lg">כל המסעדות ומצב התפוסה שלהן בזמן אמת</p>
                </div>
                <div className="mt-8 sm:mt-12">
                    <Search restaurants={restaurants} onSearch={setResults} />
                </div>
            </section>

            {loading && <LoadingOverlay />}
            {error && <p className="alert-error">{error}</p>}

            <section className="space-y-5">
                <div>
                    <p className="eyebrow">מה פתוח עכשיו</p>
                    <h2 className="page-title mt-1">מסעדות</h2>
                </div>
                {results !== null && results.length === 0 && <p className="empty-state">לא נמצאו מסעדות תואמות לסינון</p>}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(results ?? restaurants).map((r) => (
                        <Link key={r.id} to={`/home/${r.id}`} className="card group block overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#c2603e]/10">
                            <div className="relative h-44 overflow-hidden bg-cream-dark">
                                <img src={getRestaurantImage(r)} alt={r.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                                <span className={`${r.type === "MEAT" ? "badge badge-meat" : "badge badge-dairy"} absolute top-3 right-3 shadow-sm`}>{r.type === "MEAT" ? "בשרי" : "חלבי"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0">
                                    <h3 className="truncate text-xl font-bold text-stone-900">{r.name}</h3>
                                    <p className="mt-1 text-sm text-stone-500">{r.city}</p>
                                    <p className="mt-3 text-sm text-olive-dark"><span className="font-semibold">{r.occupancy.freeSeats}</span> כיסאות פנויים</p>
                                </div>
                                <OccupancyRing percent={r.occupancy.occupancyPercent} size={68} showLabel />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
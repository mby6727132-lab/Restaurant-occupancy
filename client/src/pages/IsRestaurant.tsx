import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import LoadingOverlay from "../components/LoadingOverlay";
import OccupancyRing from "../components/OccupancyRing";
import { getRestaurantImage } from "../utils/restaurantImage";

type TableGroup = {
    capacity: number;
    totalTables: number;
    occupiedTables: number;
    freeTables: number;
    freeSeats: number;
};

type Occupancy = {
    totalSeats: number;
    occupiedSeats: number;
    freeSeats: number;
    occupancyPercent: number;
    totalTables: number;
    occupiedTables: number;
    freeTables: number;
    freeTablesByCapacity: TableGroup[];
};

type Restaurant = {
    id: string;
    name: string;
    ownerName: string;
    ownerPhone: string;
    street: string;
    city: string;
    location: string;
    description: string;
    type: string;
    imageUrl: string;
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
    occupancy: Occupancy;
};

export default function IsRestaurant() {

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true)
    const { id } = useParams();


    useEffect(() => {
        const loadRestaurant = async () => {
            try {
                const res = await api.get(`/restaurants/${id}`);
                setRestaurant(res.data.restaurant);
            } catch {
                setError("שגיאה בטעינת המסעדה");
            } finally {
                setLoading(false)
            }
        };
        loadRestaurant();
    }, [id]);

    if (error) return <p className="alert-error">{error}</p>;
    if (loading || !restaurant) return <LoadingOverlay />;


    return (
        <div className="space-y-6">
            <section className="hero flex min-h-64 items-end p-6 sm:min-h-96 sm:p-10" style={{ backgroundImage: `url(${getRestaurantImage(restaurant)})` }}>
                <div className="max-w-2xl text-white">
                    <span className={restaurant.type === "MEAT" ? "badge badge-meat" : "badge badge-dairy"}>{restaurant.type === "MEAT" ? "בשרי" : "חלבי"}</span>
                    <h2 className="mt-3 font-display text-4xl leading-tight font-black sm:text-5xl">מסעדת {restaurant.name}</h2>
                    <p className="mt-2 text-white/85">{restaurant.street}, {restaurant.city}</p>
                </div>
            </section>

            <section className="card grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
                <div>
                    <h3 className="section-title">על המסעדה</h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-stone-600">{restaurant.description}</p>
                    <dl className="mt-6 grid max-w-md grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-olive-soft px-3 py-3">
                            <dt className="text-xs text-olive-dark">כיסאות פנויים</dt>
                            <dd className="mt-1 font-display text-2xl font-bold text-olive-dark">{restaurant.occupancy.freeSeats}</dd>
                        </div>
                        <div className="rounded-xl bg-primary-soft px-3 py-3">
                            <dt className="text-xs text-primary-dark">שולחנות פנויים</dt>
                            <dd className="mt-1 font-display text-2xl font-bold text-primary-dark">{restaurant.occupancy.freeTables}</dd>
                        </div>
                        <div className="rounded-xl bg-cream-dark px-3 py-3">
                            <dt className="text-xs text-stone-500">סה״כ כיסאות</dt>
                            <dd className="mt-1 font-display text-2xl font-bold text-stone-700">{restaurant.occupancy.totalSeats}</dd>
                        </div>
                    </dl>
                </div>
                <div className="justify-self-center">
                    <OccupancyRing percent={restaurant.occupancy.occupancyPercent} size={170} showLabel />
                </div>
            </section>

            <section className="card p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="section-title">מפת השולחנות</h3>
                        <p className="subtitle">מבט מלמעלה על המסעדה</p>
                    </div>
                    <div className="legend">
                        <span className="flex items-center gap-2"><span className="legend-dot bg-primary" />פנוי</span>
                        <span className="flex items-center gap-2"><span className="legend-dot bg-stone-200" />תפוס</span>
                    </div>
                </div>
                <div className="floor-plan mt-6 space-y-6">
                    {restaurant.occupancy.freeTablesByCapacity.map((group) => (
                        <div key={group.capacity} className="border-t border-dashed border-[#e0d2bd] pt-6 first:border-0 first:pt-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="font-medium text-stone-800">שולחנות של {group.capacity} כיסאות</h4>
                                <p className="text-sm text-stone-500">
                                    {group.occupiedTables} תפוסים · {group.freeTables} פנויים
                                </p>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-5">
                                {Array.from({ length: group.totalTables }).map((_, i)=> (
                                <div key={i} className="table-seat">
                                    <div className="chairs">
                                        {Array.from({ length: Math.ceil(group.capacity / 2) }).map((_, c) => (
                                            <span key={c} className={i < group.occupiedTables ? "chair chair-occupied" : "chair chair-free"} />
                                        ))}
                                    </div>
                                    <div className={i < group.occupiedTables ? "table-top table-occupied" : "table-top table-free"}></div>
                                    <div className="chairs">
                                        {Array.from({ length: Math.floor(group.capacity / 2) }).map((_, c) => (
                                            <span key={c} className={i < group.occupiedTables ? "chair chair-occupied" : "chair chair-free"} />
                                        ))}
                                    </div>
                                </div>
                                 ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
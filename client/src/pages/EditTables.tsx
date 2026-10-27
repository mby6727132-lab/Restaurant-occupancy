import { useAuth } from "../context/AuthContext"
import api from "../api/axios";
import { useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";

export default function EditTables({ tableGroups, setTableGroups }: { tableGroups: any[]; setTableGroups: (tableGroups: any[]) => void }) {

    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const letters = "אבגד";

    const handleToggle = async (group: any, checked: boolean) => {
        let addOrLess = 0;
        checked ? addOrLess = group.occupiedTables + 1 : addOrLess = group.occupiedTables - 1;
        setLoading(true);
        try{
             const res = await api.patch(`/restaurants/${user.restaurantId}/table-groups/${group.id}`, {occupiedTables: addOrLess});
        setTableGroups(res.data.tableGroups)
        } catch {
            return;
        } finally {
            setLoading(false)
        }

    }

    return (
        <section className="card p-6 sm:p-8">
            {loading && <LoadingOverlay />}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="section-title">עריכת שולחנות תפוסים</h2>
                    <p className="subtitle">לחיצה על שולחן מסמנת אותו כתפוס או כפנוי</p>
                </div>
                <div className="legend">
                    <span className="flex items-center gap-2"><span className="legend-dot bg-primary" />פנוי</span>
                    <span className="flex items-center gap-2"><span className="legend-dot bg-stone-200" />תפוס</span>
                </div>
            </div>
            <div className="floor-plan mt-6 space-y-6">
                {tableGroups.map((group, index) => (
                    <div key={group.id ?? `${group.capacity}-${index}`} className="border-t border-dashed border-[#e0d2bd] pt-6 first:border-0 first:pt-0">
                        <h3 className="mb-3 font-sans text-sm font-medium text-stone-600">שולחנות של {group.capacity} כיסאות</h3>
                        <div className="flex flex-wrap gap-3">
                            {Array.from({ length: group.totalTables }).map((_, i) => {
                                const chairClass = i < group.occupiedTables ? "chair chair-occupied" : "chair chair-free";
                                return (
                                    <label key={i} className="table-pick" aria-label={`שולחן ${letters[i] ?? i + 1}`}>
                                        <input
                                            className="sr-only"
                                            type="checkbox"
                                            checked={i < group.occupiedTables}
                                            onChange={(e) => handleToggle(group, e.target.checked)}
                                        />
                                        <span className="table-seat">
                                            <span className="chairs">
                                                {Array.from({ length: Math.ceil(group.capacity / 2) }).map((_, c) => <span key={c} className={chairClass} />)}
                                            </span>
                                            <span className={i < group.occupiedTables ? "table-top table-occupied" : "table-top table-free"} />
                                            <span className="chairs">
                                                {Array.from({ length: Math.floor(group.capacity / 2) }).map((_, c) => <span key={c} className={chairClass} />)}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )

}
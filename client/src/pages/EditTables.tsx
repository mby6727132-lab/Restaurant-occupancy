import { useAuth } from "../context/AuthContext"
import api from "../api/axios";
import { useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";

export default function EditTables({ tableGroups, setTableGroups }: { tableGroups: any[]; setTableGroups: (tableGroups: any[]) => void }) {

    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const letters = "123456789";

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
            <div className="mt-6 space-y-6">
                {tableGroups.map((group, index) => (
                    <div key={group.id ?? `${group.capacity}-${index}`}>
                        <h3 className="mb-3 text-sm font-medium text-stone-600">שולחנות של {group.capacity} כיסאות</h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: group.totalTables }).map((_, i) => (
                                <label key={i} className="table-chip">
                                    <input
                                        className="sr-only"
                                        type="checkbox"
                                        checked={i < group.occupiedTables}
                                        onChange={(e) => handleToggle(group, e.target.checked)}
                                    />
                                    {letters[i] ?? i + 1}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )

}
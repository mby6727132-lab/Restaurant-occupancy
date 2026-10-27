import { useAuth } from "../context/AuthContext"
import api from "../api/axios";

export default function EditTables({ tableGroups, setTableGroups }) {

    const { user } = useAuth()
    const letters = "אבגד";

    const handleToggle = async (group, checked) => {
        let addOrLess = 0;
        checked ? addOrLess = group.occupiedTables + 1 : addOrLess = group.occupiedTables - 1;
        try{
             const res = await api.patch(`/restaurants/${user.restaurantId}/table-groups/${group.id}`, {occupiedTables: addOrLess});
        console.log(res.data)
        setTableGroups(res.data.tableGroups)
        }catch(err){
            console.log(err);
        }
       
    }

    return (
        <>
            <hr />
            <h2>עריכת שולחנות תפוסים</h2>
            {tableGroups.map((group) => (
                <div key={group.id}>
                    שולחן + {group.capacity} כיסאות
                    {Array.from({ length: group.totalTables }).map((_, i) => (
                        <label key={i}>
                            <input
                                type="checkbox"
                                checked={i < group.occupiedTables}
                                onChange={(e) => handleToggle(group, e.target.checked)}
                            />
                            {letters[i] ?? i + 1}
                        </label>
                    ))}
                </div>
            ))}
        </>
    )

}
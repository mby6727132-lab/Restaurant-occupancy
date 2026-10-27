
export default function ResDetails({ restaurant, tableGroups,onEdit }) {
    return (
        <div>
            <h2>{restaurant.name}</h2>

            <p>בעל המסעדה: {restaurant.ownerName}</p>
            <p>טלפון:{restaurant.ownerPhone}</p>
            <p>כתובת: {restaurant.street}, {restaurant.city}</p>
            <p>סוג: {restaurant.type === "MEAT" ? "בשרי" : "חלבי"}</p>
            <p>תיאור: {restaurant.description}</p>
            <h3>שולחנות</h3>
            {tableGroups.map((group, index) => (
                <p key={index}>{group.totalTables} שולחנות של {group.capacity} כיסאות</p>
            ))}

            <button onClick={onEdit}>עריכה</button>
        </div>
    )

}


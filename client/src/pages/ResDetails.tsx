import type { ReactNode } from "react";

// אייקונים קטנים לשורות הפרטים
const icons: Record<string, ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
    pin: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
    utensils: <><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10" /><path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8H17" /></>,
    table: <><rect x="3" y="8" width="18" height="5" rx="1.5" /><path d="M6 13v6M18 13v6" /></>,
}

function Icon({ name }: { name: string }) {
    return (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name]}
        </svg>
    )
}

// שורת פרט: אייקון ← תווית ← ערך
function DetailRow({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
    return (
        <div className="grid grid-cols-[2.25rem_6rem_1fr] items-center gap-x-3 sm:grid-cols-[2.5rem_7.5rem_1fr]">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary sm:size-10"><Icon name={icon} /></span>
            <dt className="text-sm text-stone-500">{label}</dt>
            <dd className="text-[15px] font-semibold text-stone-900 sm:text-base">{children}</dd>
        </div>
    )
}

export default function ResDetails({ restaurant, tableGroups,onEdit }: { restaurant: any; tableGroups: any[]; onEdit: () => void }) {
    const typeLabel = restaurant.type === "MEAT" ? "בשרי" : "חלבי";
    const totalTables = tableGroups.reduce((sum, g) => sum + Number(g.totalTables || 0), 0);
    const totalSeats = tableGroups.reduce((sum, g) => sum + Number(g.totalTables || 0) * Number(g.capacity || 0), 0);

    return (
        <div className="card p-5 text-right sm:p-8">
            {/* 1. כותרת */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eadfce] pb-5">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="page-title text-2xl sm:text-4xl">{restaurant.name}</h2>
                    <span className={restaurant.type === "MEAT" ? "badge badge-meat" : "badge badge-dairy"}>{typeLabel}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={onEdit}>עריכה</button>
            </div>

            {/* 2. פרטים */}
            <dl className="space-y-4 py-7">
                <DetailRow icon="user" label="בעל המסעדה">{restaurant.ownerName}</DetailRow>
                <DetailRow icon="phone" label="טלפון"><bdi dir="ltr">{restaurant.ownerPhone}</bdi></DetailRow>
                <DetailRow icon="pin" label="כתובת">{restaurant.street}, {restaurant.city}</DetailRow>
                <DetailRow icon="utensils" label="סוג">{typeLabel}</DetailRow>
            </dl>

            {/* 3. תיאור */}
            <div className="border-y border-[#eadfce] py-7">
                <h3 className="section-title text-lg">על המסעדה</h3>
                <p className="mt-3 max-w-2xl text-[15px] leading-loose text-stone-600 sm:text-base">{restaurant.description}</p>
            </div>

            {/* 4. שולחנות */}
            <div className="pt-7">
                <h3 className="section-title text-lg">שולחנות</h3>
                <ul className="mt-4 space-y-3">
                    {tableGroups.map((group, index) => (
                        <li key={group.id ?? index} className="flex items-center gap-3 text-[15px] text-stone-800 sm:text-base">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-olive-soft text-olive-dark sm:size-10"><Icon name="table" /></span>
                            {Number(group.totalTables) === 1
                                ? <span>שולחן אחד של <b className="font-semibold">{group.capacity}</b> כיסאות</span>
                                : <span><b className="font-semibold">{group.totalTables}</b> שולחנות של <b className="font-semibold">{group.capacity}</b> כיסאות</span>}
                        </li>
                    ))}
                </ul>
                <p className="mt-5 rounded-xl bg-cream-dark/70 px-4 py-3 text-sm text-stone-600 sm:text-[15px]">
                    סה״כ: <b className="font-semibold text-stone-900">{totalTables}</b> שולחנות, <b className="font-semibold text-stone-900">{totalSeats}</b> כיסאות
                </p>
            </div>
        </div>
    )

}

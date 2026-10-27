import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
        const { logout,user } = useAuth();
        const navigate = useNavigate();
        const { pathname } = useLocation();
        const handleLogout=()=>{
            logout();
            navigate("/login")
        }

        // איזו אפשרות במתג מסומנת, לפי העמוד הנוכחי
        const isManager = pathname.startsWith("/myRestaurants");
        const isGuest = pathname === "/home" || pathname.startsWith("/home/");

    return (
        <header className="sticky top-0 z-20 border-b border-[#eadfce] bg-page/90 backdrop-blur">
            <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-5 py-3 sm:h-20 sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:py-0">
                <div className="flex items-center gap-3 justify-self-start">
                    <img src="/ICONS/mytable-icon-terracotta.svg" alt="" className="size-11" />
                    <span className="font-display text-2xl font-bold sm:text-[1.7rem]" dir="ltr">
                        <span className="text-primary">My</span><span className="text-stone-800">Table</span>
                    </span>
                </div>

                <div className="col-span-2 row-start-2 segmented justify-self-stretch sm:col-span-1 sm:row-start-1 sm:col-start-2 sm:w-64">
                    <button className={`choice ${isManager ? "bg-white text-primary shadow-sm" : ""}`} onClick={() => navigate("/myRestaurants/new")} aria-current={isManager ? "page" : undefined}>מנהל</button>
                    <button className={`choice ${isGuest ? "bg-white text-primary shadow-sm" : ""}`} onClick={() => navigate("/home")} aria-current={isGuest ? "page" : undefined}>אורח</button>
                </div>

                <div className="flex items-center gap-3 justify-self-end sm:col-start-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-white shadow-sm shadow-primary/30" aria-hidden="true">
                        {user?.fullName?.trim()?.[0] ?? "?"}
                    </span>
                    <h3 className="hidden max-w-40 truncate font-sans text-base text-stone-600 min-[420px]:block sm:max-w-none">שלום, <span className="font-bold text-stone-900">{user?.fullName}</span></h3>
                    <span className="mx-1 hidden h-6 w-px bg-[#e0d2bd] sm:block" />
                    <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-500 transition hover:text-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                            <path d="M10 17l-5-5 5-5" />
                            <path d="M5 12h11" />
                        </svg>
                        התנתק
                    </button>
                </div>
            </div>
        </header>
    )
}

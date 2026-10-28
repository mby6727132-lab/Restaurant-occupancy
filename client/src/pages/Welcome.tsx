import { Link } from "react-router-dom";

export default function Welcome() {
    return (
        <div className="hero flex min-h-screen items-center justify-center rounded-none px-5 py-12" style={{ backgroundImage: "url(/RES/res-2.jpg)" }}>
            <div className="w-full max-w-xl rounded-3xl bg-page/95 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur sm:p-12">
                <img src="/ICONS/mytable-icon-terracotta.svg" alt="MyTable" className="mx-auto size-16" />
                <h1 className="mt-6 font-display text-3xl font-black text-stone-900 sm:text-4xl">ברוכים הבאים ל-MyTable</h1>
                <p className="mt-5 text-base leading-loose text-stone-600 sm:text-lg">
                    כאן תוכלו לדעת מראש איפה מחכה לכם כיסא פנוי במסעדה, בנוח והפעם בשקט.
                    בלי עומס, בלי תורים ובלי הפתעות, רק לבחור מסעדה ולהגיע.
                    התפוסה מוצגת בזמן אמת, כך שתמיד תמצאו את המקום שלכם.
                </p>
                <Link to="/home" className="btn btn-primary mt-8 h-12 px-8 text-base shadow-lg shadow-primary/30">
                    בוא אחריי
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 12H5M11 6l-6 6 6 6" />
                    </svg>
                </Link>
            </div>
        </div>
    )
}

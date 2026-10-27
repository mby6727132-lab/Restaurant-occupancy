import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function MainLayout() {
    return (
        <div className="min-h-screen">
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
                <Outlet />
            </main>
        </div>
    )
}

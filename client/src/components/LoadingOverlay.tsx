export default function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-page/70 backdrop-blur-[2px]" role="status" aria-live="polite">
            <div className="card flex flex-col items-center gap-2 px-8 py-6">
                <img src="/ICONS/loading.gif" alt="" className="size-14" />
                <p className="text-sm font-medium text-stone-600">טוען...</p>
            </div>
        </div>
    )
}

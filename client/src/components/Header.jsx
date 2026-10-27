
export default function Header() {
    return (
        <header>
            <h3>שלום, <p>{user.fullName}</p></h3>
            <button onClick={handleLogout}>התנתק</button>
            <button onClick={() => navigate("/myRestaurants/new")}>מנהל</button>
            <button onClick={() => navigate("/home")}>אורח</button>
        </header>
    )
}
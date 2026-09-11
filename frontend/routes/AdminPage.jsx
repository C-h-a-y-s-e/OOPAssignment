import React from "react";
import { Navigate, useNavigate } from "react-router";
import { API_BASE_URL, fetchUserDetails } from "../api";

export default function AdminPage() {
	const navigate = useNavigate();
	const token = localStorage.getItem("authToken");
	const email = localStorage.getItem("authEmail");
	const [users, setUsers] = React.useState([]);
	const [passwords, setPasswords] = React.useState({});
	const [error, setError] = React.useState("");
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (!token || !email) return;

		async function loadUsers() {
			try {
				const currentUser = await fetchUserDetails(email, token);
				if (currentUser.role?.name?.toLowerCase() !== "admin") {
					navigate("/dashboard", { replace: true });
					return;
				}

				const response = await fetch(`${API_BASE_URL}/api/user`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const result = await response.json();
				if (!response.ok) {
					throw new Error(result.error?.message || "Could not load users");
				}
				setUsers(result.data);
			} catch (loadError) {
				setError(loadError.message);
			} finally {
				setLoading(false);
			}
		}

		loadUsers();
	}, [email, navigate, token]);

	const updatePassword = async (userId) => {
		const password = passwords[userId]?.trim();
		if (!password) {
			window.alert("Error: Please enter a new password.");
			return;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ password }),
			});
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error?.message || "Password update failed");
			}

			setPasswords((current) => ({ ...current, [userId]: "" }));
			window.alert("Password changed successfully.");
		} catch (updateError) {
			window.alert(updateError.message || "Password change failed.");
		}
	};

	const deleteUser = async (userId) => {
		if (!window.confirm("Delete this user?")) return;

		const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});
		const result = await response.json();
		if (!response.ok) throw new Error(result.error?.message || "User deletion failed");
		setUsers((current) => current.filter((user) => user.userId !== userId));
	};

	if (!token || !email) return <Navigate to="/login" replace />;

	return (
		<main className="page-shell">
			<section className="login-card" aria-label="Admin user management">
				<button type="button" onClick={() => navigate("/dashboard")}>Back to dashboard</button>
				<h1>Admin user management</h1>
				{loading && <p>Loading users...</p>}
				{error && <p className="status error">{error}</p>}
				{!loading && !error && users.map((user) => (
					<article key={user.userId}>
						<h2>{user.firstname} {user.surname}</h2>
						<p>{user.email}</p>
						<label htmlFor={`password-${user.userId}`}>New password</label>
						<input
							id={`password-${user.userId}`}
							type="password"
							value={passwords[user.userId] || ""}
							onChange={(event) => setPasswords((current) => ({
								...current,
								[user.userId]: event.target.value,
							}))}
						/>
						<button type="button" onClick={() => updatePassword(user.userId)}>
							Change password
						</button>
						<button type="button" onClick={() => deleteUser(user.userId)}>
							Delete user
						</button>
					</article>
				))}
			</section>
		</main>
	);
}
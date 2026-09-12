import React from "react";
import { Navigate, useNavigate } from "react-router";
import { API_BASE_URL, fetchUserDetails } from "../api";

export default function ViewRequests() {
	const navigate = useNavigate();
	const token = localStorage.getItem("authToken");
	const email = localStorage.getItem("authEmail");
	const [requests, setRequests] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		if (!token || !email) return;

		async function loadRequests() {
			try {
				const user = await fetchUserDetails(email, token);
				const response = await fetch(
					`${API_BASE_URL}/api/leaveRequests/user/${user.userId}`,
					{ headers: { Authorization: `Bearer ${token}` } },
				);

				if (response.status === 204) {
					setRequests([]);
					return;
					//if response status is no content, set requests to an empty array
				}

				const result = await response.json();
				if (!response.ok) {
					throw new Error(result.error?.message || "Could not load requests");
				}
				setRequests(result.data); //if none of the above happened, set requests to the result data
			} catch (loadError) {
				setError(loadError.message || "Could not load requests");
			} finally {
				setLoading(false);
			}
		}

		loadRequests();
	}, [email, token]);

	const cancelRequest = async (requestId) => {
		if (!window.confirm("Cancel this Leave Request?")) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/leaveRequests/${requestId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			const result = response.status === 204 ? {} : await response.json();
			if (!response.ok) {
				throw new Error(result.error?.message || "Could not cancel request");
			}

			setRequests((current) =>
				current.filter((request) => request.id !== requestId),
			);
			//removes the cancelled request with a new array of everything except requestid
			window.alert("Leave Request Cancelled Successfully.");
		} catch (cancelError) {
			window.alert(cancelError.message || "Could not cancel request");
		}
	};

	if (!token || !email) return <Navigate to="/login" replace />;

	return (
		<main className="page-shell">
			<section className="login-card" aria-label="My leave requests">
				<button type="button" onClick={() => navigate("/dashboard")}>
					Return to dashboard
				</button>
				<h1>My Leave Requests</h1>
				{loading && <p>Loading Requests...</p>}
				{error && <p className="status error">{error}</p>}
				{!loading && !error && requests.length === 0 && (
					<p>You Have No Leave Requests.</p>
				)}
				{!loading && !error && requests.map((request) => (
					<article key={request.id}>
						<h2>{request.startDate} to {request.endDate}</h2>
						<p>Status: {request.status}</p>
						<button type="button" onClick={() => cancelRequest(request.id)}>
							Cancel Request
						</button>
					</article>
				))}
			</section>
		</main>
	);
}

import React from "react";
import { Navigate, useNavigate } from "react-router";
import { API_BASE_URL, fetchUserDetails } from "../api";

export default function ManagementPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("authToken");
    const email = localStorage.getItem("authEmail");
    const [requests, setRequests] = React.useState([]);
    //stored leave request from api
    const [managedUsers, setManagedUsers] = React.useState([]);
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!token || !email) return;
// if the user doesnt have either, stop
        async function loadRequests() {
            try {
                const currentUser = await fetchUserDetails(email, token);
                const roleName = currentUser.role?.name?.toLowerCase();
                if (roleName !== "manager" && roleName !== "admin") {
                    navigate("/dashboard", { replace: true });
                    return;
                }
                //checks that the user is either admin or manager

                if (roleName === "manager") {
                    const usersResponse = await fetch(
                        `${API_BASE_URL}/api/userManagement`,
                        { headers: { Authorization: `Bearer ${token}` } },
                    );
                    //only managers need to load in their managed users
                    let assignedEmployees = [];
                    if (usersResponse.status !== 204) { //only read the json if it contains content
                        const usersResult = await usersResponse.json(); //convert response into js
                        if (!usersResponse.ok) {
                            throw new Error(
                                usersResult.error?.message || "Could not load managed users",
                            );
                        }
                        assignedEmployees = usersResult.data; //stores returned manager assignments
                    }
                    setManagedUsers(
                        assignedEmployees
                            .filter(
                                (assignment) =>
                                    assignment.Manager?.userId === currentUser.userId,
                            ) //filters assigned employees to the current manager loggedin
                            .map((assignment) => assignment.User),
                    );
                }
                
                const response = await fetch(
                    roleName === "admin"
                        ? `${API_BASE_URL}/api/leaveRequests/`
                        : `${API_BASE_URL}/api/leaveRequests/manager/${currentUser.userId}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (response.status === 204) {
                    setRequests([]);
                    return;
                } //204 = no content error code
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error?.message || "Could not load requests");
                }
                setRequests(result.data);
            } catch (loadError) {
                setError(loadError.message || "Could not load requests");
            } finally {
                setLoading(false);
            }
        }

        loadRequests();
    }, [email, navigate, token]);

    const updateRequestStatus = async (requestId, status) => {
        //function for approving/denying requests
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/leaveRequests/${requestId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }), //turn approved or deny into JSON
                },
            );
            const result = response.status === 204 ? {} : await response.json();
            if (!response.ok) {
                throw new Error(result.error?.message || "Could not update request");
            }

            setRequests((current) =>
                current.map((request) =>
                    request.id === requestId ? { ...request, status } : request,
            //check for if the request was just updated, if so update its status
                ),
            );
            window.alert(`Request ${status}.`);
        } catch (updateError) {
            window.alert(updateError.message || "Could not update request");
        }
    };

    if (!token || !email) return <Navigate to="/login" replace />;

    return (
        <main className="page-shell">
            <section className="login-card" aria-label="Manager Leave Requests">
                <button type="button" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
                <h1>Leave Requests</h1>
                <h2>Users under your management</h2>
                {!loading && managedUsers.length === 0 && (
                    <p>No users are currently assigned to you.</p>
                )}
                {!loading && managedUsers.map((user) => (
                    <article key={user.userId}>
                        <h3>{user.firstname} {user.surname}</h3>
                        <p>{user.email}</p>
                    </article>
                ))}
                <h2>Leave requests</h2>
                {loading && <p>Loading requests...</p>}
                {error && <p className="status error">{error}</p>}
                {!loading && !error && requests.length === 0 && (
                    <p>No leave requests are currently available.</p>
                )}
                {!loading && !error && requests.map((request) => (
                    <article key={request.id}>
                        <h2>
                            {request.User?.firstname} {request.User?.surname}
                        </h2>
                        <p>{request.User?.email}</p>
                        <p>
                            {request.startDate} to {request.endDate}
                        </p>
                        <p>Status: {request.status}</p>
                        {request.status === "pending" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => updateRequestStatus(request.id, "approved")}
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateRequestStatus(request.id, "denied")}
                                >
                                    Deny
                                </button>
                            </>
                        )}
                    </article>
                ))}
            </section>
        </main>
    );
}
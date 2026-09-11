export const API_BASE_URL = "http://localhost:8900";

export async function fetchUserDetails(email, token) {
    const response = await fetch(
        `${API_BASE_URL}/api/user/email/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    //gets the ysers info from backend
    //email is safe to put in a url with encodecomponent
    if (!response.ok) {
        throw new Error("Could not retrieve user profile");
    }

    const result = await response.json();
    return result.data;
    }
    
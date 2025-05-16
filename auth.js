async function refreshToken() {
  console.log("Attempting to refresh token");
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    console.log("No refresh token found");
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem("token", data.access);
    console.log("Token refreshed successfully");
    return data.access;
  } catch (error) {
    console.error("Token refresh error:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "MAIN.html?auth=login";
    throw error;
  }
}

async function checkAuth() {
  console.log("checkAuth called");
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token) {
    console.log("No token found");
    if (window.location.pathname.includes("admin-dashboard.html")) {
      window.location.href = "MAIN.html?auth=login";
    }
    return;
  }

  try {
    let response = await fetch("http://127.0.0.1:8000/api/profile/update/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 403 || response.status === 401) {
      console.log("Token expired or invalid, attempting to refresh");
      const newToken = await refreshToken();
      response = await fetch("http://127.0.0.1:8000/api/profile/update/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data));

    if (
      window.location.pathname.includes("admin-dashboard.html") &&
      !data.is_staff
    ) {
      console.log("Non-admin attempted to access admin dashboard");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "MAIN.html?auth=login";
      return;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    if (window.location.pathname.includes("admin-dashboard.html")) {
      window.location.href = "MAIN.html?auth=login";
    }
  }
}

function logout() {
  console.log("logout called");
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.location.href = "MAIN.html";
}

document.addEventListener("DOMContentLoaded", checkAuth);

// Expose functions globally
window.checkAuth = checkAuth;
window.logout = logout;
window.refreshToken = refreshToken;

/**
 * Global logout utility for use outside React components (e.g., from axios interceptor)
 */
export const globalLogout = () => {
  console.log("[Auth] Session expired or token invalid. Auto-logging out...");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");

  // Dispatch storage event to notify auth context
  window.dispatchEvent(new Event("storage"));

  // Redirect to login
  setTimeout(() => {
    window.location.href = "/login";
  }, 100);
};

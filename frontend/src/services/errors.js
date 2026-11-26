/** The most useful message from an API error, for toasts and inline errors. */
export function errorMessage(error, fallback = "Something went wrong. Try again.") {
  const data = error?.response?.data;
  if (data?.data && typeof data.data === "object" && !Array.isArray(data.data) && data.message === "Validation failed") {
    return Object.values(data.data).join(" ");
  }
  if (!error?.response && error?.message === "Network Error") {
    return "Can't reach the server. If it was idle, it may need up to a minute to wake up.";
  }
  return data?.message || data?.error || fallback;
}

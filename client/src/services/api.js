export const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
export const BASE_URL = import.meta.env.VITE_API_URL || "";

export const createOrder = async (orderData) => {
  const token = localStorage.getItem("userToken");
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(orderData)
  });
  const data = await res.json();
  
  // Storing the ID for the next payment step
  if (data.success && data.order && data.order._id) {
    localStorage.setItem("lastOrderId", data.order._id);
  }
  
  return data;
};

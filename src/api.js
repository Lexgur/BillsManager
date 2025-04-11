// api.js
const API_URL = 'http://localhost:5000/invoices';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Network response was not ok');
  }
  return response.json();
};

export const saveInvoice = async (invoiceData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData)
  });
  return handleResponse(response);
};

export const loadInvoices = async () => {
  const response = await fetch(API_URL);
  return handleResponse(response); // ✅ returns array directly
};

export const createNewInvoice = () => {
  window.location.reload();
};

export const editInvoiceById = async (id, updatedInvoice) => {
  try {
    const response = await fetch(`https://in3.dev/inv/${id}`, {
      method: "PUT", // Ensure it's a PUT request if you're updating
      body: JSON.stringify(updatedInvoice),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to update invoice");
    return await response.json();
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};

export const getInvoiceById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  return handleResponse(response);
};

export const deleteInvoiceById = async (id, setInvoices) => {
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    const updatedInvoices = await loadInvoices();  // Reload the invoices list
    setInvoices(updatedInvoices);  // Update the state
  } catch (error) {
    console.error('Failed to delete invoice:', error);
  }
};

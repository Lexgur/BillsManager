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

export const editInvoiceById = async (id, data) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Log the response for debugging
    const responseData = await handleResponse(response);
    console.log('Response data:', responseData); // Debugging line
    return responseData;
  } catch (error) {
    console.error('Error editing invoice:', error);
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

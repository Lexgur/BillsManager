import './Invoice.scss';
import React, { useEffect, useState } from 'react';
import { saveInvoice, loadInvoices, createNewInvoice, editInvoiceById, deleteInvoiceById } from '../../api';

const Invoice = () => {
  const [invoice, setInvoice] = useState(null);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [allInvoices, setAllInvoices] = useState([]);
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://in3.dev/inv/');
        if (!response.ok) throw new Error('Failed to fetch invoice');
        const data = await response.json();
        setInvoice(data);
        setTotalDiscount(calculateTotalDiscount(data.items));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, []);

  useEffect(() => {
    loadInvoices()
      .then(invoices => setAllInvoices(invoices))
      .catch(console.error);
  }, []);

  const calculateTotalDiscount = (items) => {
    return items.reduce((total, item) => {
      let discountAmount = 0;
      if (item.discount) {
        if (item.discount.type === 'fixed') {
          discountAmount = item.discount.value;
        } else if (item.discount.type === 'percentage') {
          discountAmount = (item.price * item.discount.value) / 100;
        }
      }
      return total + discountAmount;
    }, 0);
  };

  const getWithoutPvm = (items) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getPvmValue = (sum) => {
    return sum * 0.21;
  };

  const renderCompany = (company, type) => (
    <div className={`company company-${type}`}>
      <h2>{type === 'seller' ? 'Pardavėjas' : 'Pirkėjas'}</h2>
      <p><strong>{company.name}</strong></p>
      <p>{company.address}</p>
      <p>Įmonės kodas: {company.code}</p>
      <p>PVM kodas: {company.vat}</p>
      <p>Telefonas: {company.phone}</p>
      <p>El. paštas: {company.email}</p>
    </div>
  );

  const handleSave = async () => {
    try {
      setLoading(true);
      await saveInvoice(invoice); // Save the invoice
      alert('Sąskaita sėkmingai išsaugota!');
      handleViewAll(); // Reload all invoices after saving
    } catch (err) {
      alert(`Nepavyko išsaugoti sąskaitos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = async (id) => {
    const invoiceToEdit = allInvoices.find(inv => inv.id === id);
    if (!invoiceToEdit) return alert('Sąskaita nerasta.');

    // Make the necessary updates to the invoice
    const updatedInvoice = { ...invoiceToEdit, note: 'Redaguota rankiniu būdu' }; // example update

    try {
      await editInvoiceById(id, updatedInvoice);
      alert('Sąskaita atnaujinta.');
      // Reload the invoices after edit
      loadInvoices()
        .then(invoices => setAllInvoices(invoices))
        .catch(console.error);
    } catch (error) {
      console.error('Klaida redaguojant sąskaitą:', error);
      alert('Nepavyko atnaujinti sąskaitos.');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Ar tikrai norite ištrinti šią sąskaitą?')) return;

    await deleteInvoiceById(id); // Delete the invoice by ID
    setAllInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== id));
    alert('Sąskaita ištrinta.');
    handleViewAll(); // Reload or update the list of invoices
  };

  const handleViewAll = async () => {
    try {
      setLoading(true);
      const invoices = await loadInvoices();
      setAllInvoices(invoices);
      setShowAllInvoices(true);
    } catch (err) {
      alert(`Nepavyko įkelti sąskaitų: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading">Kraunama...</p>;
  if (error) return <p className="error">Klaida: {error}</p>;

  if (showAllInvoices) {
    return (
      <div className="screen">
        <div className="saskaita-app">
          <h1>Visos sąskaitos</h1>
          <button
            className="btn btn-blue"
            onClick={() => setShowAllInvoices(false)}
          >
            Grįžti atgal
          </button>
          <div className="invoices-list">
            {allInvoices.length > 0 ? (
              <table className="items">
                <thead>
                  <tr>
                    <th>Nr.</th>
                    <th>Data</th>
                    <th>Pirkėjas</th>
                    <th>Suma</th>
                    <th>Veiksmai</th> {/* <-- NEW */}
                  </tr>
                </thead>
                <tbody>
                  {allInvoices.map((inv, index) => (
                    <tr key={index}>
                      <td>{inv.number}</td>
                      <td>{inv.date}</td>
                      <td>{inv.company.buyer.name}</td>
                      <td>
                        {(
                          inv.items.reduce((sum, item) => sum + item.price * item.quantity, 0) -
                          calculateTotalDiscount(inv.items) +
                          getPvmValue(inv.items.reduce((sum, item) => sum + item.price * item.quantity, 0)) +
                          inv.shippingPrice
                        ).toFixed(2)} €
                      </td>
                      <td>
                        <button
                          className="btn btn-yellow"
                          onClick={() => handleEditInvoice(inv.id)}
                        >
                          Redaguoti
                        </button>
                        <button
                          className="btn btn-red"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Ištrinti
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Nėra išsaugotų sąskaitų</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals only after invoice is loaded
  const totalQuantity = invoice.items.reduce((acc, item) => acc + item.quantity, 0);
  const withoutPvm = getWithoutPvm(invoice.items);
  const pvm = getPvmValue(withoutPvm);
  const finalSum = withoutPvm - totalDiscount + pvm + invoice.shippingPrice;

  return (
    <div className="screen">
      <div className="saskaita-app">
        <header>
          <div className="top">
            <h1 className="title">Sąskaita faktūra</h1>
          </div>
        </header>

        <div className="invoice-header">
          <p className="sask-number">Nr: {invoice.number}</p>
          <p className="sask-data">Data: {invoice.date}</p>
          <p className="info">Apmokėjimo terminas: {invoice.due_date}</p>
        </div>

        <div className="companies-container">
          {renderCompany(invoice.company.seller, 'seller')}
          {renderCompany(invoice.company.buyer, 'buyer')}
        </div>

        <p className="shipping">Transportavimo kaina: {invoice.shippingPrice} €</p>

        <h2 className="items-header">Prekės</h2>
        <table className="items">
          <thead>
            <tr>
              <th>Nr.</th>
              <th>Aprašymas</th>
              <th>Kiekis</th>
              <th>Kaina</th>
              <th>Nuolaida</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items
              .sort((a, b) => a.price - b.price)
              .map((item, index) => {
                let discountLabel = 'Be nuolaidų';
                if (item.discount) {
                  if (item.discount.type === 'fixed') {
                    discountLabel = `- ${item.discount.value}€`;
                  } else if (item.discount.type === 'percentage') {
                    discountLabel = `- ${item.discount.value}%`;
                  }
                }
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price} €</td>
                    <td>{discountLabel}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <div className="data-total">
          <h3>Bendra informacija</h3>
          <p>Iš viso prekių: {totalQuantity}</p>
          <p>Nuolaidos suma: {totalDiscount.toFixed(2)} €</p>
          <p>Suma be PVM: {withoutPvm.toFixed(2)} €</p>
          <p>PVM (21%): {pvm.toFixed(2)} €</p>
          <p className="total-total">Galutinė suma: {finalSum.toFixed(2)} €</p>
        </div>

        <div className="invoice-actions">
          <button className="btn btn-green" onClick={handleSave} disabled={loading}>
            {loading ? 'Išsaugoma...' : 'Išsaugoti sąskaitą'}
          </button>
          <button className="btn btn-blue" onClick={handleViewAll} disabled={loading}>
            Peržiūrėti visas sąskaitas
          </button>
          <button className="btn btn-red" onClick={createNewInvoice}>
            Nauja sąskaita
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
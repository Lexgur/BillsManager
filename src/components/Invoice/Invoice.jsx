import './Invoice.scss';
import React, { useEffect, useState } from 'react';

const Invoice = () => {
  const [invoice, setInvoice] = useState(null);
  const [totalDiscount, setTotalDiscount] = useState(0);

  useEffect(() => {
    fetch('https://in3.dev/inv/')
      .then(res => res.json())
      .then(data => {
        setInvoice(data);
        setTotalDiscount(calculateTotalDiscount(data.items));
      });
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
    return (sum * 0.21);
  };

  if (!invoice) return <p>Kraunama...</p>;

  const totalQuantity = invoice.items.reduce((acc, item) => acc + item.quantity, 0);
  const withoutPvm = getWithoutPvm(invoice.items);
  const pvm = getPvmValue(withoutPvm);
  const finalSum = withoutPvm - totalDiscount + pvm + invoice.shippingPrice;

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
      </div>
      <button className='btn btn-green'>Išsaugoti sąskaitą</button>
      <button className='btn btn-blue'>Peržiūrėti visas sąskaitas</button>
    </div>
  );
};

export default Invoice;
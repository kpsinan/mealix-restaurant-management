// src/components/BillPanel.jsx
import React, { forwardRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import '../thermal-print.css';

const BillPanel = forwardRef(
  ({ details, settings, discount = 0, onDiscountChange, onPrint }, ref) => {
    if (!details) {
      return null;
    }

    const {
      order = {},
      items: rawItems = [],
      tableName = 'N/A',
      staffName = 'N/A',
    } = details;
    
    // Use dynamic settings with fallbacks for all values
    const restaurantName = settings?.restaurantName || 'SyncServe Restaurant';
    const restaurantAddress = settings?.address || '123 Culinary Lane, Edakkara, Kerala';
    const upiId = settings?.upiId || 'your-upi@id';
    const currencySymbol = settings?.currencySymbol || '₹';
    const currencyCode = settings?.currencyCode || 'INR';

    const normalizedItems = useMemo(() => {
      const items = Array.isArray(rawItems) ? rawItems : [];
      return items.map((it) => {
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? it.rate ?? 0);
        return {
          itemId: it.itemId ?? Math.random(),
          name: String(it.name ?? it.itemName ?? 'Item'),
          notes: String(it.notes ?? it.modifiers ?? it.description ?? ''),
          quantity: Number.isFinite(qty) ? qty : 1,
          price: Number.isFinite(price) ? price : 0,
          amount: Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0,
        };
      });
    }, [rawItems]);

    const { subTotal, grandTotal } = useMemo(() => {
      const computedSubtotal = normalizedItems.reduce((s, it) => s + it.amount, 0);
      const subTotal = Number(order.total ?? computedSubtotal);
      const disc = Number(discount || 0);
      const grandTotal = Math.max(0, subTotal - disc);
      return { subTotal, grandTotal };
    }, [normalizedItems, order.total, discount]);

    const { dateStr, timeStr } = useMemo(() => {
      const now = new Date();
      try {
        const dateObj = new Date(order.createdAt ?? order.date);
        if (isNaN(dateObj.getTime())) return {
            dateStr: now.toLocaleDateString('en-IN'),
            timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'})
        };
        return {
          dateStr: dateObj.toLocaleDateString('en-IN'),
          timeStr: dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'}),
        };
      } catch {
        return { 
            dateStr: now.toLocaleDateString('en-IN'),
            timeStr: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit'})
        };
      }
    }, [order.createdAt, order.date]);

    // UPDATED: upiLink now uses dynamic currencyCode
    const upiLink = useMemo(() => {
      const payeeName = restaurantName.replace(/\s/g, '%20');
      const transactionNote = `Bill%20for%20${tableName}`.replace(/\s/g, '%20');
      return `upi://pay?pa=${upiId}&pn=${payeeName}&am=${grandTotal.toFixed(2)}&cu=${currencyCode}&tn=${transactionNote}`;
    }, [grandTotal, tableName, restaurantName, upiId, currencyCode]); // Added currencyCode dependency
    
    return (
      <div ref={ref} className="thermal-print" aria-label={`Bill for ${tableName}`}>
        <header className="header">
          <div className="logo-placeholder">[Your Logo Here]</div>
          <h1 className="business-name">{restaurantName}</h1>
          <p className="business-details">{restaurantAddress}</p>
          <p className="invoice-title">--- INVOICE ---</p>
        </header>

        <section className="meta-info">
          <div className="meta-row">
            <span>Table: <strong>{tableName}</strong></span>
            <span>Date: {dateStr}</span>
          </div>
          <div className="meta-row">
            <span>Staff: <strong>{staffName}</strong></span>
            <span>Time: {timeStr}</span>
          </div>
        </section>

        <table className="items-table">
          <thead>
            <tr>
              <th className="col-sno">#</th>
              <th className="col-item">ITEM</th>
              <th className="col-qty">QTY</th>
              <th className="col-price">RATE</th>
              <th className="col-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {normalizedItems.length === 0 ? (
              <tr><td colSpan="5" className="no-items">No items in this order.</td></tr>
            ) : (
              normalizedItems.map((item, index) => (
                <tr key={item.itemId}>
                  <td className="col-sno">{index + 1}</td>
                  <td className="col-item">
                    <span className="item-name">{item.name}</span>
                    {item.notes && <span className="item-notes">{item.notes}</span>}
                  </td>
                  <td className="col-qty">{item.quantity}</td>
                  <td className="col-price">{item.price.toFixed(2)}</td>
                  <td className="col-total">{item.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* UPDATED: Totals section now uses dynamic currencySymbol */}
        <section className="totals">
          <div className="total-row">
            <span>Sub Total</span>
            <span>{currencySymbol}{subTotal.toFixed(2)}</span>
          </div>
          <div className="total-row no-print">
            <span>Discount</span>
            <div className="discount-control">
              <span>{currencySymbol}{Number(discount).toFixed(2)}</span>
              <input
                type="number"
                value={discount}
                onChange={onDiscountChange}
                className="discount-input"
                aria-label="Discount amount"
              />
            </div>
          </div>
          <div className="total-row print-only">
            <span>Discount</span>
            <span>{currencySymbol}{Number(discount).toFixed(2)}</span>
          </div>
          <div className="total-row grand-total">
            <span>Grand Total</span>
            <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
          </div>
        </section>

        <div className="actions no-print">
          <button onClick={onPrint} className="print-button">
            Print / Finalize Bill
          </button>
        </div>

        <footer className="footer">
          <div className="qr-code-container">
            {grandTotal > 0 && upiId ? (
              <QRCodeSVG
                value={upiLink}
                size={110}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
            ) : (
              <div className="qr-placeholder">[QR Code Here]</div>
            )}
          </div>
          <p className="footer-message">Thank you for your visit!</p>
          {order.id && <p className="order-id">Order ID: {String(order.id)}</p>}
        </footer>
      </div>
    );
  }
);

export default BillPanel;
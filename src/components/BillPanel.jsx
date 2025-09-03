// src/components/BillPanel.jsx
import React, { forwardRef } from "react";

/**
 * Final, professional BillPanel
 * - stable, non-overlapping table using CSS classes for print layout
 * - numeric columns use tabular-nums and nowrap to avoid mixing/overflow
 * - item cell supports name + small modifiers/description (multi-line)
 * - interactive controls are hidden during print via .no-print
 * - forwardRef exposes DOM for iframe printing
 *
 * Props:
 * - details: { order, items, tableName, staffName }
 * - discount: number
 * - onDiscountChange: (e) => void
 * - onPrint: () => void
 */

const BillPanel = forwardRef(
  (
    {
      details,
      discount = 0,
      onDiscountChange = () => {},
      onPrint = () => {},
    },
    ref
  ) => {
    if (!details) return null;

    const {
      order = {},
      items: rawItems = [],
      tableName = "N/A",
      staffName = "N/A",
    } = details;
    const items = Array.isArray(rawItems) ? rawItems : [];

    // normalize items
    const normalized = items.map((it) => {
      const qty = Number(it.quantity ?? it.qty ?? 1);
      const price = Number(it.price ?? it.rate ?? 0);
      const name = it.name ?? it.itemName ?? "Item";
      const notes = it.notes ?? it.modifiers ?? it.description ?? "";
      return {
        ...it,
        name: String(name),
        notes: String(notes),
        quantity: Number.isFinite(qty) ? qty : 1,
        price: Number.isFinite(price) ? price : 0,
        amount:
          Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0,
      };
    });

    const computedSubtotal = normalized.reduce(
      (s, it) => s + (Number(it.amount) || 0),
      0
    );
    const subTotal = Number(order.total ?? computedSubtotal ?? 0);
    const disc = Number(discount || 0);
    const grandTotal = Number(Math.max(0, subTotal - disc).toFixed(2));

    const safeDate = (d) => {
      try {
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt;
      } catch {
        return null;
      }
    };

    const dateObj = safeDate(order.createdAt ?? order.date);
    const dateStr = dateObj ? dateObj.toLocaleDateString("en-IN") : "";
    const timeStr = dateObj ? dateObj.toLocaleTimeString("en-IN") : "";

    // local CSS for print + layout
    const localStyles = `
      .bill-table { table-layout: fixed; width: 100%; border-collapse: collapse; }
      .bill-table th, .bill-table td { padding: 4px 0; vertical-align: top; }
      .bill-table thead th { font-size: 10px; font-weight: 700; }
      .col-qty, .col-price, .col-total { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
      .col-item { word-break: break-word; white-space: normal; }
      .item-notes { font-size: 11px; color: #555; margin-top: 2px; }
      .sep { border-top: 1px dashed rgba(0,0,0,0.7); margin: 6px 0; height: 1px; }
      .totals { font-size: 11px; }
      .total-strong { font-weight: 800; font-size: 13px; }
      @media print { .no-print { display: none !important; } }
      .bill-panel * { box-sizing: border-box; }
    `;

    return (
      <div
        ref={ref}
        className="bill-panel bill-panel-print bg-white p-3 rounded-sm shadow-sm w-full max-w-[78mm] mx-auto"
        role="region"
        aria-label={`Bill for ${tableName}`}
      >
        <style dangerouslySetInnerHTML={{ __html: localStyles }} />

        {/* header */}
        <div className="text-center mb-2">
          <div className="text-base font-bold">SyncServe</div>
          <div className="text-xs text-gray-600">Invoice</div>
        </div>

        {/* meta */}
        <div className="flex justify-between text-xs mb-3">
          <div>
            <div>
              <span className="font-medium">Table:</span> {tableName}
            </div>
            <div>
              <span className="font-medium">Served by:</span> {staffName}
            </div>
          </div>
          <div className="text-right">
            <div>
              <span className="font-medium">Date:</span> {dateStr}
            </div>
            <div>
              <span className="font-medium">Time:</span> {timeStr}
            </div>
          </div>
        </div>

        {/* items table */}
        <table className="bill-table" aria-label="Bill items">
          <thead>
            <tr>
              <th className="text-left" style={{ width: "8%" }}>#</th>
              <th className="text-left col-item">ITEM</th>
              <th className="text-right col-qty">QTY</th>
              <th className="text-right col-price">RATE</th>
              <th className="text-right col-total">AMT</th>
            </tr>
          </thead>
          <tbody>
            {normalized.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-3 text-xs">
                  No items
                </td>
              </tr>
            ) : (
              normalized.map((it, i) => (
                <tr key={it.itemId ?? i}>
                  <td className="pr-1">{i + 1}</td>
                  <td className="col-item pr-2">
                    <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.05 }}>
                      {it.name}
                    </div>
                    {it.notes ? (
                      <div className="item-notes">{it.notes}</div>
                    ) : null}
                  </td>
                  <td className="col-qty pr-1">{it.quantity}</td>
                  <td className="col-price pr-1">{Number(it.price).toFixed(2)}</td>
                  <td className="col-total">{Number(it.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* separator */}
        <div className="sep" />

        {/* totals block */}
        <div className="totals text-sm">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span>Discount</span>
            <div className="flex items-center gap-2">
              <span style={{ minWidth: 64, textAlign: "right" }}>
                ₹{disc.toFixed(2)}
              </span>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={onDiscountChange}
                className="no-print px-2 py-1 border rounded text-right"
                style={{ width: 88 }}
                aria-label="Discount"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <div className="total-strong">Grand Total</div>
            <div className="total-strong">₹{grandTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* actions */}
        <div className="no-print mt-3">
          <button
            onClick={onPrint}
            className="w-full py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            type="button"
          >
            Print / Finalize
          </button>
        </div>

        {/* footer for print */}
        <div className="footer text-center text-xs mt-3 print:block hidden">
          <div>Thank you for dining with us!</div>
          {order?.id && (
            <div style={{ marginTop: 4, fontSize: 10 }}>
              Order ID: {String(order.id)}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default BillPanel;
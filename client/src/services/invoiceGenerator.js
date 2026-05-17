// ─── Invoice PDF Generator (Shared Utility) ──────────────────────────────────
export function generateInvoiceHTML(order) {
  const invoiceNo = `KAH-${order._id.toString().slice(-8).toUpperCase()}`;
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric"
  });
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const shipping = 0;
  const itemsRows = order.items.map(item => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2000;font-size:14px;color:#e5e7eb;">${item.name}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2000;font-size:13px;color:#9ca3af;text-align:center;">${item.size || "-"}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2000;font-size:13px;color:#9ca3af;text-align:center;">${item.quantity}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2000;font-size:13px;color:#9ca3af;text-align:right;">₹${item.price.toFixed(2)}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #2a2000;font-size:14px;color:#fbbf24;font-weight:700;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const addr = order.customer.address;
  const fullAddress = [addr?.door, addr?.street, addr?.landmark, addr?.district, addr?.state, addr?.pincode]
    .filter(Boolean).join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNo} | Kala Agalya Herbals</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0802; color: #e5e7eb; }
    .page { max-width: 820px; margin: 0 auto; padding: 48px 40px; background: #0d0b03; min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .logo-section {}
    .logo-name { font-size: 26px; font-weight: 900; color: #fbbf24; letter-spacing: 1px; }
    .logo-tagline { font-size: 10px; color: #92400e; text-transform: uppercase; letter-spacing: 4px; margin-top: 4px; }
    .invoice-badge { text-align: right; }
    .invoice-title { font-size: 36px; font-weight: 900; color: #fbbf24; letter-spacing: -1px; }
    .invoice-no { font-size: 13px; color: #78350f; text-transform: uppercase; letter-spacing: 3px; margin-top: 6px;}
    .invoice-date { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .top-bar { height: 3px; background: linear-gradient(90deg, #b45309, #fbbf24, #b45309); border-radius: 2px; margin-bottom: 40px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .info-box { background: #15120a; border: 1px solid #2a1a00; border-radius: 14px; padding: 24px; }
    .info-label { font-size: 9px; font-weight: 800; color: #78350f; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 14px; }
    .info-value { font-size: 15px; font-weight: 700; color: #f3f4f6; line-height: 1.4; }
    .info-sub { font-size: 12px; color: #6b7280; margin-top: 6px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; background: #15120a; border-radius: 14px; overflow: hidden; border: 1px solid #2a1a00; }
    thead { background: linear-gradient(135deg, #451a03, #2a1000); }
    th { padding: 14px 16px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; color: #fbbf24; }
    th:last-child, th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2), th:nth-child(3) { text-align: center; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { background: #15120a; border: 1px solid #2a1a00; border-radius: 14px; padding: 24px 32px; min-width: 280px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; font-size: 13px; color: #9ca3af; }
    .total-row.grand { padding-top: 14px; margin-top: 8px; border-top: 1px solid #2a1a00; font-size: 18px; font-weight: 900; color: #fbbf24; }
    .status-badge { display: inline-block; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; padding: 4px 12px; border-radius: 99px; }
    .payment-id { font-size: 11px; color: #6b7280; margin-top: 8px; word-break: break-all; }
    .footer { text-align: center; padding-top: 32px; border-top: 1px solid #1a1000; }
    .footer-brand { font-size: 16px; font-weight: 900; color: #fbbf24; letter-spacing: 1px; }
    .footer-text { font-size: 10px; color: #4b3800; text-transform: uppercase; letter-spacing: 3px; margin-top: 6px; }
    .footer-note { font-size: 11px; color: #374151; margin-top: 16px; }
    @media print {
      body { background: #0a0802 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px 30px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Download / Print button (hidden on print) -->
  <div class="no-print" style="position:fixed;top:20px;right:20px;z-index:999;display:flex;gap:12px;">
    <button onclick="window.print()" style="cursor:pointer;padding:12px 24px;background:linear-gradient(135deg,#b45309,#fbbf24);color:#0a0802;font-family:'Inter',sans-serif;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:2px;border:none;border-radius:10px;box-shadow:0 0 20px rgba(251,191,36,0.3);">
      ⬇ Download PDF
    </button>
  </div>

  <div class="page">
    <div class="top-bar"></div>

    <div class="header">
      <div class="logo-section">
        <div class="logo-name">🌿 Kala Agalya Herbals</div>
        <div class="logo-tagline">Pure • Natural • Naturopathy</div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-no">#${invoiceNo}</div>
        <div class="invoice-date">Date: ${date}</div>
        <div class="invoice-date" style="margin-top:3px;font-size:10px;color:#6b7280;">Order ID: ${order._id}</div>
        <div style="margin-top:10px;">
          <span class="status-badge">✓ PAID</span>
        </div>
        ${order.paymentId ? `<div class="payment-id">TXN: ${order.paymentId}</div>` : ""}
      </div>
    </div>

    <div class="grid-2">
      <div class="info-box">
        <div class="info-label">Billed To</div>
        <div class="info-value">${order.customer.name}</div>
        <div class="info-sub">
          ${order.customer.email || ""}<br/>
          ${order.customer.phone || ""}
          ${order.customer.altPhone ? ` / ${order.customer.altPhone}` : ""}
        </div>
      </div>
      <div class="info-box">
        <div class="info-label">Shipping Address</div>
        <div class="info-value" style="font-size:13px;">${fullAddress || "Not provided"}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Size</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>GST (5%)</span><span>₹${gst.toFixed(2)}</span></div>
        <div class="total-row"><span>Shipping</span><span style="color:#4ade80;">FREE</span></div>
        <div class="total-row grand"><span>Total</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-brand">Kala Agalya Herbals</div>
      <div class="footer-text">Thank you for your order!</div>
      <div class="footer-note">
        For any queries, contact us at kalaagalyaherbals@gmail.com<br/>
        GSTIN: Applied For &nbsp;•&nbsp; kalaagalyaherbals.in
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function openInvoice(order) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  // Prompt print dialog automatically after load
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 600);
    };
  }
}

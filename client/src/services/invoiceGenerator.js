// ─── Invoice PDF Generator (Shared Utility) ──────────────────────────────────

export function getInvoiceStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg: #0d0b06;
      --card-bg: #141108;
      --card-border: #2e2410;
      --gold-primary: #f59e0b;
      --gold-light: #fbbf24;
      --gold-dark: #b45309;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --emerald: #10b981;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090804;
      color: var(--text-main);
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
      padding: 0;
      margin: 0;
    }

    /* Screen Action Bar */
    .screen-actions {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(14, 12, 6, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #332608;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .screen-actions .left-info {
      font-size: 13px;
      font-weight: 600;
      color: var(--gold-light);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .screen-actions .btn-group {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .action-btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-print {
      background: linear-gradient(135deg, #d97706, #f59e0b);
      color: #000;
      box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
    }
    .btn-print:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.45);
    }
    .btn-close {
      background: #231c0e;
      color: #d1d5db;
      border: 1px solid #3d2f13;
    }
    .btn-close:hover {
      background: #332812;
      color: #fff;
    }

    /* Container */
    .invoice-wrapper {
      max-width: 820px;
      margin: 24px auto 48px;
      padding: 0 16px;
    }

    .invoice-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: clamp(20px, 4.5vw, 44px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      position: relative;
      overflow: hidden;
    }

    .invoice-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #92400e, #f59e0b, #fbbf24, #92400e);
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
    }

    .brand-section {
      flex: 1 1 260px;
    }
    .brand-logo-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(20px, 3.5vw, 26px);
      font-weight: 700;
      color: var(--gold-light);
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: #b45309;
      font-weight: 700;
      margin-top: 4px;
    }
    .brand-contact-info {
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 10px;
      line-height: 1.6;
    }

    .invoice-meta-section {
      text-align: right;
      flex: 1 1 200px;
    }
    .invoice-heading {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(24px, 4vw, 32px);
      font-weight: 800;
      color: var(--gold-primary);
      letter-spacing: 1px;
    }
    .invoice-num {
      font-size: 12px;
      font-weight: 700;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
      font-family: monospace;
    }
    .invoice-date-line {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .badge-paid {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-top: 10px;
    }
    .payment-ref {
      font-size: 10px;
      font-family: monospace;
      color: var(--text-dim);
      margin-top: 6px;
      word-break: break-all;
    }

    /* Grid for Customer & Shipping */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .info-box {
      background: #18150c;
      border: 1px solid #2b220e;
      border-radius: 14px;
      padding: 18px 20px;
    }
    .info-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--gold-dark);
      margin-bottom: 8px;
    }
    .info-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .info-details {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.6;
    }

    /* Items Table */
    .table-container {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--card-border);
      border-radius: 14px;
      margin-bottom: 28px;
      background: #18150c;
      -webkit-overflow-scrolling: touch;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      min-width: 480px;
    }
    thead {
      background: #231b0b;
      border-bottom: 1px solid var(--card-border);
    }
    th {
      padding: 12px 16px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--gold-primary);
    }
    .th-center { text-align: center; }
    .th-right { text-align: right; }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #261e0c;
      font-size: 13px;
    }
    tr:last-child td { border-bottom: none; }
    .td-product { font-weight: 600; color: #f3f4f6; }
    .td-center { text-align: center; font-weight: 600; color: #d1d5db; }
    .td-right { text-align: right; font-weight: 600; color: #d1d5db; font-family: monospace; }
    .td-total { color: var(--gold-light); font-weight: 700; }
    .prod-name { font-size: 13.5px; }
    .prod-size-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      color: #d97706;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.25);
      padding: 1px 7px;
      border-radius: 6px;
      margin-top: 4px;
    }

    /* Summary Section */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .summary-card {
      width: 100%;
      max-width: 320px;
      background: #18150c;
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 10px;
    }
    .summary-row.discount {
      font-size: 12px;
      color: var(--text-dim);
    }
    .summary-row.discount .val {
      text-decoration: line-through;
    }
    .summary-row.grand-total {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--card-border);
      font-size: 16px;
      font-weight: 800;
      color: var(--gold-light);
      font-family: 'Space Grotesk', sans-serif;
    }

    /* Footer */
    .footer-section {
      text-align: center;
      border-top: 1px solid var(--card-border);
      padding-top: 24px;
    }
    .footer-brand {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--gold-primary);
      letter-spacing: 1px;
    }
    .footer-thanks {
      font-size: 12px;
      color: #92400e;
      font-weight: 600;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .footer-info {
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 12px;
      line-height: 1.6;
    }

    /* Responsive Mobile Media Queries */
    @media (max-width: 640px) {
      .screen-actions {
        padding: 10px 14px;
      }
      .screen-actions .left-info {
        display: none;
      }
      .screen-actions .btn-group {
        width: 100%;
        justify-content: space-between;
      }
      .action-btn {
        flex: 1;
        justify-content: center;
        padding: 9px 12px;
        font-size: 11px;
      }
      .invoice-wrapper {
        margin: 12px auto 32px;
        padding: 0 10px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      .invoice-meta-section {
        text-align: left;
        width: 100%;
      }
      .summary-card {
        max-width: 100%;
      }
    }

    /* High Precision Print & PDF Optimization */
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background: #0d0b06 !important;
        color: #f3f4f6 !important;
      }
      .no-print {
        display: none !important;
      }
      .invoice-wrapper {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .invoice-card {
        border: none !important;
        box-shadow: none !important;
        padding: 16px 0 !important;
        background: transparent !important;
      }
      .info-box, .table-container, .summary-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .batch-invoice-item {
        page-break-after: always !important;
        break-after: page !important;
      }
      .batch-invoice-item:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  `;
}

// ─── Render Single Invoice Card HTML ─────────────────────────────────────────
export function renderSingleInvoiceCard(order) {
  const invoiceNo = order.invoiceNumber || (order.orderId ? (order.orderId.startsWith("KAH-") ? order.orderId : `KAH-${order.orderId}`) : `KAH-${order._id ? order._id.toString().slice(-8).toUpperCase() : "ORDER"}`);
  const dateObj = new Date(order.paymentDate || order.orderDate || order.createdAt || Date.now());
  const date = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
  const time = dateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit"
  });

  const subtotal = (order.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const shipping = Number(order.shippingAmount) || 0;
  const crossedTotal = subtotal + gstAmount + shipping;
  const finalAmount = order.totalAmount !== undefined && order.totalAmount !== null ? Number(order.totalAmount) : subtotal + shipping;

  const itemsRows = (order.items || []).map((item) => `
    <tr>
      <td class="td-product">
        <div class="prod-name">${item.name || "Herbal Product"}</div>
        ${item.size ? `<span class="prod-size-badge">${item.size}</span>` : ""}
      </td>
      <td class="td-center">${item.quantity || 1}</td>
      <td class="td-right">₹${(Number(item.price) || 0).toFixed(2)}</td>
      <td class="td-right td-total">₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}</td>
    </tr>
  `).join("");

  const addr = order.customer?.address || {};
  let fullAddress = "Address not provided";
  if (typeof addr === "string") {
    fullAddress = addr;
  } else if (addr.fullAddress) {
    fullAddress = addr.fullAddress;
  } else {
    const addressParts = [addr.door, addr.street, addr.landmark, addr.district, addr.state, addr.pincode].filter(Boolean);
    if (addressParts.length > 0) {
      fullAddress = addressParts.join(", ");
    }
  }

  const customerPhone = order.customer?.phone || order.customer?.mobileNumber || "";
  const customerWhatsApp = order.customer?.whatsappNumber || "";

  return `
  <div class="invoice-wrapper batch-invoice-item">
    <div class="invoice-card">
      
      <!-- Header -->
      <div class="header">
        <div class="brand-section">
          <div class="brand-logo-title">
            <span>🌿</span>
            <span>Kala Agalya Herbals</span>
          </div>
          <div class="brand-sub">Pure • Natural • Naturopathy</div>
          <div class="brand-contact-info">
            kalaagalyaherbals@gmail.com<br/>
            kalaagalyaherbals.in &nbsp;•&nbsp; Tamil Nadu, India
          </div>
        </div>

        <div class="invoice-meta-section">
          <div class="invoice-heading">TAX INVOICE</div>
          <div class="invoice-num">#${invoiceNo}</div>
          <div class="invoice-date-line">Date: ${date} ${time ? `at ${time}` : ''}</div>
          <div class="invoice-date-line" style="font-size:11px;">Order Ref: ${order.orderId || order._id}</div>
          <div>
            <span class="badge-paid">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${order.paymentStatus === "PAID" ? "PAID" : "CONFIRMED"}
            </span>
          </div>
          ${order.paymentId ? `<div class="payment-ref">TXN ID: ${order.paymentId}</div>` : ""}
        </div>
      </div>

      <!-- Customer & Shipping -->
      <div class="info-grid">
        <div class="info-box">
          <div class="info-title">Billed To (Customer)</div>
          <div class="info-name">${order.customer?.name || "Customer"}</div>
          <div class="info-details">
            ${order.customer?.email ? `✉ ${order.customer.email}<br/>` : ""}
            ${customerPhone ? `📞 ${customerPhone}` : ""}
            ${order.customer?.altPhone ? ` / ${order.customer.altPhone}` : ""}
            ${customerWhatsApp && customerWhatsApp !== customerPhone ? `<br/>💬 WhatsApp: ${customerWhatsApp}` : ""}
          </div>
        </div>

        <div class="info-box">
          <div class="info-title">Shipping Delivery Address</div>
          <div class="info-name" style="font-size:13px; font-weight:600;">${order.customer?.name || "Customer"}</div>
          <div class="info-details">${fullAddress}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="th-center">Qty</th>
              <th class="th-right">Unit Price</th>
              <th class="th-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- Totals Summary -->
      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Estimated GST (18%)</span>
            <span style="color:#f59e0b;">Included</span>
          </div>
          <div class="summary-row">
            <span>Shipping & Handling</span>
            <span style="color:${shipping === 0 ? '#34d399' : '#fbbf24'}; font-weight:600;">
              ${shipping === 0 ? 'FREE' : '₹' + shipping.toFixed(2)}
            </span>
          </div>
          <div class="summary-row discount">
            <span>Standard Price</span>
            <span class="val">₹${crossedTotal.toFixed(2)}</span>
          </div>
          <div class="summary-row grand-total">
            <span>Grand Total Paid</span>
            <span>₹${finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div class="footer-brand">Kala Agalya Herbals</div>
        <div class="footer-thanks">Thank you for choosing Natural Wellness!</div>
        <div class="footer-info">
          This is a computer-generated tax invoice. For customer care support or returns, write to us at kalaagalyaherbals@gmail.com.<br/>
          GSTIN: Applied For &nbsp;•&nbsp; kalaagalyaherbals.in
        </div>
      </div>

    </div>
  </div>`;
}

// ─── Generate Single Invoice HTML Document ──────────────────────────────────
export function generateInvoiceHTML(order) {
  const invoiceNo = order.invoiceNumber || (order.orderId ? (order.orderId.startsWith("KAH-") ? order.orderId : `KAH-${order.orderId}`) : `KAH-${order._id ? order._id.toString().slice(-8).toUpperCase() : "ORDER"}`);
  const cardHtml = renderSingleInvoiceCard(order);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>Tax Invoice #${invoiceNo} | Kala Agalya Herbals</title>
  <style>
    ${getInvoiceStyles()}
  </style>
</head>
<body>

  <!-- Screen Action Floating Bar (Hidden when printed to PDF) -->
  <div class="screen-actions no-print">
    <div class="left-info">
      <span>🌿 Kala Agalya Herbals</span>
      <span>•</span>
      <span>Invoice #${invoiceNo}</span>
    </div>
    <div class="btn-group">
      <button class="action-btn btn-close" onclick="window.close()">✕ Close</button>
      <button class="action-btn btn-print" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Download / Print PDF
      </button>
    </div>
  </div>

  ${cardHtml}

</body>
</html>`;
}

// ─── Generate Batch Invoices HTML Document (Multi-Order Single Print) ───────
export function generateBatchInvoicesHTML(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return "";
  const allCardsHtml = orders.map(renderSingleInvoiceCard).join("\n<hr class='no-print' style='border:1px dashed #3a2e12; margin: 30px auto; max-width:820px;' />\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>Batch Invoices (${orders.length} Orders) | Kala Agalya Herbals</title>
  <style>
    ${getInvoiceStyles()}
  </style>
</head>
<body>

  <!-- Screen Action Floating Bar for Batch Printing -->
  <div class="screen-actions no-print">
    <div class="left-info">
      <span>🌿 Kala Agalya Herbals</span>
      <span>•</span>
      <span>Batch Printing: ${orders.length} Invoices</span>
    </div>
    <div class="btn-group">
      <button class="action-btn btn-close" onclick="window.close()">✕ Close</button>
      <button class="action-btn btn-print" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print All Invoices (${orders.length})
      </button>
    </div>
  </div>

  ${allCardsHtml}

</body>
</html>`;
}

// ─── Open Single Invoice Window ─────────────────────────────────────────────
export function openInvoice(order) {
  if (!order) return;
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const win = window.open(url, "_blank");
  if (!win || win.closed || typeof win.closed === "undefined") {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// ─── Open Batch Invoices Window (Print All Selected) ─────────────────────────
export function openBatchInvoices(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return;
  const html = generateBatchInvoicesHTML(orders);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const win = window.open(url, "_blank");
  if (!win || win.closed || typeof win.closed === "undefined") {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

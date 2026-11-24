// ─── 152mm x 102mm Thermal Shipping Label Generator (2-Up Layout) ─────────────
// Format matches Kala Agalya Herbals thermal parcel sticker printer (Custom-152x102-Gap)

/**
 * Clean phone number to 10 digits
 */
function cleanPhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

/**
 * Format items into compact upper-case product summary (e.g. "100ML 1", "200ML 2")
 */
function formatItemSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return "100ML 1";
  return items
    .map((item) => {
      const size =
        item.size && item.size !== "Standard"
          ? item.size.toUpperCase()
          : item.name
          ? item.name.split(" ")[0].toUpperCase()
          : "OIL";
      const qty = item.quantity || 1;
      return `${size} ${qty}`;
    })
    .join(", ");
}

/**
 * Parse address fields into neat printable lines
 */
function parseAddressLines(order) {
  const customer = order.customer || {};
  const addr = customer.address || {};
  const lines = [];

  // If structured address exists
  if (addr.door || addr.street || addr.district) {
    if (addr.door && addr.street) {
      lines.push(`${addr.door}, ${addr.street}`);
    } else if (addr.door) {
      lines.push(addr.door);
    } else if (addr.street) {
      lines.push(addr.street);
    }

    if (addr.landmark) {
      lines.push(`LM. ${addr.landmark}`);
    }

    if (addr.district && addr.state && addr.district !== addr.state) {
      lines.push(`${addr.district}, ${addr.state}`);
    } else if (addr.district) {
      lines.push(addr.district);
    } else if (addr.state) {
      lines.push(addr.state);
    }

    if (addr.pincode) {
      lines.push(`Pincode - ${addr.pincode}`);
    }
  } else if (addr.fullAddress || typeof addr === "string") {
    // Parse unstructured full address
    const full = (addr.fullAddress || addr || "").trim();
    const parts = full.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    parts.forEach((p) => {
      // Check if this part contains pincode
      const pinMatch = p.match(/\b(6\d{5})\b/);
      if (pinMatch && !p.toLowerCase().includes("pincode")) {
        lines.push(`Pincode - ${pinMatch[1]}`);
      } else {
        lines.push(p);
      }
    });
  }

  return lines;
}

/**
 * Render single shipping label HTML card (73mm x 98mm)
 */
function renderSingleShippingLabel(order) {
  if (!order) {
    return `<div class="single-label empty"></div>`;
  }

  const customer = order.customer || {};
  const name = customer.name || "Customer";
  const phone = cleanPhone(customer.mobileNumber || customer.whatsappNumber);
  const itemSummary = formatItemSummary(order.items);
  const addressLines = parseAddressLines(order);

  const addressHtml = addressLines
    .slice(0, 5) // Keep up to 5 lines for optimal thermal fit
    .map((line) => `<div class="address-line">${escapeHtml(line)}</div>`)
    .join("");

  return `
    <div class="single-label">
      <!-- Top Line: TO on left, Product Variant & Qty on right -->
      <div class="label-header">
        <span class="to-text">TO</span>
        <span class="product-summary">${escapeHtml(itemSummary)}</span>
      </div>

      <!-- Center Customer Delivery Details -->
      <div class="customer-address">
        <div class="customer-name">${escapeHtml(name)}</div>
        ${addressHtml}
        <div class="customer-phone">PH.${phone}</div>
      </div>

      <!-- Fixed Sender ("From") Block -->
      <div class="from-block">
        <div class="from-label">From :</div>
        <div class="from-name">Kala Agalya Herbals</div>
        <div class="from-address">TNHB, Ayapakkam</div>
        <div class="from-cell">Cell : 7338758727</div>
      </div>
    </div>
  `;
}

/**
 * Basic HTML escape
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Get CSS styles optimized for 152mm x 102mm thermal printer roll (2-Up)
 */
function getShippingLabelStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: 152mm 102mm;
      margin: 0;
    }

    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      color: #000000;
      background: #f0f0f0;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 0;
    }

    /* Floating Screen Action Bar (hidden on print) */
    .screen-actions {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #1c1a16;
      border-bottom: 2px solid #d97706;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    }
    .screen-actions .left-info {
      font-size: 13px;
      font-weight: 700;
      color: #fbbf24;
      display: flex;
      align-items: center;
      gap: 10px;
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
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-print {
      background: linear-gradient(135deg, #d97706, #f59e0b);
      color: #000;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }
    .btn-print:hover {
      transform: translateY(-1px);
    }
    .btn-close {
      background: #332a15;
      color: #e5e7eb;
      border: 1px solid #55441e;
    }
    .btn-close:hover {
      background: #44371b;
      color: #fff;
    }

    /* Print Preview Wrapper for Screen View */
    .preview-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 10px 60px;
      gap: 20px;
    }

    /* Each 152mm x 102mm Thermal Sheet Container */
    .label-sheet {
      width: 152mm;
      height: 102mm;
      background: #ffffff;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: stretch;
      padding: 3.5mm 4.5mm;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 2px;
      page-break-after: always;
      break-after: page;
      position: relative;
    }

    /* Vertical Dashed Center Guide (hidden on print) */
    .sheet-divider {
      position: absolute;
      top: 5mm;
      bottom: 5mm;
      left: 50%;
      border-left: 1px dashed #d1d5db;
      pointer-events: none;
    }

    /* Single 2-Up Thermal Label Card (approx 71mm x 95mm) */
    .single-label {
      width: 69.5mm;
      height: 95mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: 2.5mm 3mm;
      overflow: hidden;
      background: #ffffff;
    }

    .single-label.empty {
      background: transparent;
    }

    /* ─── Header: TO + Product Summary ────────────────── */
    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-weight: 900;
      margin-bottom: 2mm;
      border-bottom: 1px solid transparent;
    }
    .to-text {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    .product-summary {
      font-size: 12.5pt;
      font-weight: 800;
      text-transform: uppercase;
      text-align: right;
      letter-spacing: 0.3px;
      line-height: 1;
      max-width: 48mm;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    /* ─── Center: Customer Delivery Info ──────────────── */
    .customer-address {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      margin-bottom: 1mm;
      overflow: hidden;
    }
    .customer-name {
      font-size: 11pt;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.2mm;
      word-break: break-word;
    }
    .address-line {
      font-size: 9.5pt;
      font-weight: 500;
      line-height: 1.25;
      color: #000;
      word-break: break-word;
    }
    .customer-phone {
      font-size: 10.5pt;
      font-weight: 800;
      line-height: 1.2;
      margin-top: 1.8mm;
      letter-spacing: 0.3px;
    }

    /* ─── Bottom: Sender ("From") Block ──────────────── */
    .from-block {
      margin-top: auto;
      line-height: 1.25;
      padding-top: 1.5mm;
    }
    .from-label {
      font-size: 9pt;
      font-weight: 700;
    }
    .from-name {
      font-size: 9.5pt;
      font-weight: 800;
    }
    .from-address {
      font-size: 9pt;
      font-weight: 500;
    }
    .from-cell {
      font-size: 9pt;
      font-weight: 700;
    }

    /* ─── PRINT RULES ────────────────────────────────── */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .preview-container {
        padding: 0 !important;
        gap: 0 !important;
      }
      .label-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .sheet-divider {
        display: none !important;
      }
    }
  `;
}

/**
 * Generate complete HTML document for shipping labels
 */
export function generateShippingLabelsHTML(orders) {
  const orderList = Array.isArray(orders) ? orders : [orders];
  if (orderList.length === 0) return "";

  // Pair orders into sheets of 2 (2-Up)
  const sheets = [];
  for (let i = 0; i < orderList.length; i += 2) {
    const leftOrder = orderList[i];
    const rightOrder = orderList[i + 1] || null;
    sheets.push({ leftOrder, rightOrder });
  }

  const sheetsHtml = sheets
    .map(
      ({ leftOrder, rightOrder }) => `
      <div class="label-sheet">
        ${renderSingleShippingLabel(leftOrder)}
        <div class="sheet-divider no-print"></div>
        ${renderSingleShippingLabel(rightOrder)}
      </div>
    `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipping Labels (${orderList.length} Orders - 152x102mm) | Kala Agalya Herbals</title>
  <style>
    ${getShippingLabelStyles()}
  </style>
</head>
<body>

  <!-- Screen Action Floating Bar (Hidden during Print) -->
  <div class="screen-actions no-print">
    <div class="left-info">
      <span>📦 Kala Agalya Herbals</span>
      <span>•</span>
      <span>Shipping Labels: ${orderList.length} Order${orderList.length > 1 ? "s" : ""} (${sheets.length} Sheet${sheets.length > 1 ? "s" : ""} @ 152×102mm)</span>
    </div>
    <div class="btn-group">
      <button class="action-btn btn-close" onclick="window.close()">✕ Close</button>
      <button class="action-btn btn-print" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print Shipping Labels (${orderList.length})
      </button>
    </div>
  </div>

  <div class="preview-container">
    ${sheetsHtml}
  </div>

</body>
</html>`;
}

/**
 * Open Shipping Labels print window directly in browser
 */
export function openShippingLabels(orders) {
  if (!orders) return;
  const list = Array.isArray(orders) ? orders : [orders];
  if (list.length === 0) return;

  const html = generateShippingLabelsHTML(list);
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


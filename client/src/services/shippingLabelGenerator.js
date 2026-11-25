// ─── 102mm x 152mm Thermal Shipping Label Generator (Portrait Layout) ────────
// Custom-designed for Kala Agalya Herbals thermal parcel sticker printer (Portrait 102x152mm / 4"x6")
// Features: Top-left brand logo, bold typography, single customer order per sheet, Portrait default

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
 * Format items into compact upper-case product summary (e.g. "100ML 1", "200ML (2PES) 1")
 */
function formatItemSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return "100ML 1";
  return items
    .map((item) => {
      let label = "";
      if (item.size && item.size !== "Standard") {
        label = item.size.toUpperCase();
      } else if (item.name) {
        const sizeMatch = item.name.match(/(\d+\s*(?:ml|g|kg|l|pcs|pes))/i);
        if (sizeMatch) {
          label = sizeMatch[1].toUpperCase();
        } else {
          label = item.name.split(" ")[0].toUpperCase();
        }
      } else {
        label = "OIL";
      }
      const qty = item.quantity || 1;
      return `${label} ${qty}`;
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
      lines.push(`LM: ${addr.landmark}`);
    }

    const locParts = [addr.district, addr.state].filter(Boolean);
    if (locParts.length > 0) {
      const uniqueLoc = locParts.filter((v, i, a) => a.indexOf(v) === i);
      lines.push(uniqueLoc.join(", "));
    }

    if (addr.pincode) {
      lines.push(`Pincode - ${addr.pincode}`);
    }
  } else if (addr.fullAddress || typeof addr === "string") {
    // Parse unstructured full address
    const full = (addr.fullAddress || addr || "").trim();
    const parts = full.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    parts.forEach((p) => {
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
 * Render single shipping label HTML card (Portrait format: 102mm x 152mm)
 */
function renderSingleShippingLabel(order, logoUrl) {
  if (!order) {
    return `<div class="single-label empty"></div>`;
  }

  const customer = order.customer || {};
  const name = customer.name || "Customer";
  const phone = cleanPhone(customer.mobileNumber || customer.whatsappNumber);
  const itemSummary = formatItemSummary(order.items);
  const addressLines = parseAddressLines(order);

  const addressHtml = addressLines
    .slice(0, 6) // In Portrait (152mm high), we have ample vertical room for up to 6 lines
    .map((line) => {
      const isPin = line.toLowerCase().includes("pincode");
      return `<div class="address-line ${isPin ? "pincode-highlight" : ""}">${escapeHtml(line)}</div>`;
    })
    .join("");

  const logoImgHtml = `<img src="${escapeHtml(logoUrl)}" alt="Kala Agalya Herbals Logo" class="brand-logo" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src='/images/icons/logo.png';}else{this.style.display='none';}" />`;

  return `
    <div class="single-label">
      <!-- Top Line: Logo in left corner + TO, and Product Variant & Qty on right -->
      <div class="label-header">
        <div class="header-left">
          ${logoImgHtml}
          <div class="to-wrapper">
            <span class="to-text">TO</span>
          </div>
        </div>
        <div class="header-right">
          <div class="product-badge">
            <span class="product-summary">${escapeHtml(itemSummary)}</span>
          </div>
        </div>
      </div>

      <!-- Center Customer Delivery Details (Large, Bold, Portrait-spaced) -->
      <div class="customer-address">
        <div class="customer-name">${escapeHtml(name)}</div>
        <div class="address-lines-wrapper">
          ${addressHtml}
        </div>
        <div class="customer-phone">PH.${phone}</div>
      </div>

      <!-- Bottom Sender ("From") Block & Order Reference -->
      <div class="label-footer">
        <div class="from-block">
          <div class="from-label">From :</div>
          <div class="from-name">Kala Agalya Herbals</div>
          <div class="from-address">TNHB, Ayapakkam</div>
          <div class="from-cell">Cell : 7338758727</div>
        </div>
        ${
          order.invoiceNumber || order.orderId
            ? `
          <div class="order-ref-block">
            <div class="order-ref-title">Order Ref</div>
            <div class="order-ref-number">#${escapeHtml(order.invoiceNumber || order.orderId)}</div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

/**
 * Get CSS styles optimized for 102mm x 152mm Portrait thermal label
 */
function getShippingLabelStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
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
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
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
      flex-wrap: wrap;
    }
    .pill-group {
      display: flex;
      align-items: center;
      gap: 5px;
      background: #2a2416;
      padding: 3px 6px;
      border-radius: 8px;
      border: 1px solid #4a3d1f;
      color: #e5e7eb;
      font-size: 11px;
      font-weight: 700;
    }
    .pill-btn {
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid transparent;
      background: #1c1a16;
      color: #fbbf24;
      transition: all 0.15s ease;
    }
    .pill-btn:hover {
      background: #3a3220;
    }
    .pill-btn.active {
      background: #fbbf24;
      color: #000000;
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
      padding: 25px 10px 60px;
      gap: 25px;
    }

    /* ─── DEFAULT: PORTRAIT Container (102mm wide x 152mm high) ─── */
    .label-sheet {
      width: 102mm;
      height: 152mm;
      background: #ffffff;
      box-sizing: border-box;
      padding: 5.5mm 6mm;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 4px;
      page-break-after: always;
      break-after: page;
      position: relative;
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease, height 0.2s ease;
    }

    /* Landscape Mode Switcher Override */
    body.orientation-landscape .label-sheet {
      width: 152mm;
      height: 102mm;
      padding: 4.5mm 6.5mm;
    }

    .single-label {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      background: #ffffff;
    }

    /* ─── Header: Logo in Left Corner + TO + Product Summary ── */
    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2.5mm;
      border-bottom: 1.5px solid #000000;
      margin-bottom: 2.5mm;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 3mm;
    }

    .brand-logo {
      width: 22mm;
      height: 22mm;
      object-fit: contain;
      flex-shrink: 0;
      border-radius: 4px;
    }

    .to-wrapper {
      display: flex;
      align-items: center;
    }

    .to-text {
      font-size: 24pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1;
      color: #000000;
    }

    .header-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .product-badge {
      display: inline-flex;
      align-items: center;
      border: 2px solid #000000;
      border-radius: 4px;
      padding: 1.5mm 3mm;
      background: #ffffff;
      max-width: 52mm;
    }

    .product-summary {
      font-size: 16pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
      color: #000000;
      word-break: break-word;
      text-align: right;
    }

    /* ─── Center: Customer Delivery Info (Generous Vertical Spacing in Portrait) ── */
    .customer-address {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      margin-top: 2mm;
      margin-bottom: 2mm;
      overflow: hidden;
    }

    .customer-name {
      font-size: 20pt;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 2.5mm;
      color: #000000;
      word-break: break-word;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .address-lines-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
    }

    .address-line {
      font-size: 14pt;
      font-weight: 600;
      line-height: 1.35;
      color: #000000;
      word-break: break-word;
    }

    .pincode-highlight {
      font-size: 16pt;
      font-weight: 900;
      margin-top: 0.5mm;
    }

    .customer-phone {
      font-size: 18pt;
      font-weight: 900;
      line-height: 1.2;
      margin-top: 3mm;
      letter-spacing: 0.5px;
      color: #000000;
    }

    /* ─── Bottom: Sender ("From") Block ──────────────── */
    .label-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 2.5mm;
      border-top: 1.5px solid #000000;
      margin-top: auto;
    }

    .from-block {
      line-height: 1.25;
    }

    .from-label {
      font-size: 11pt;
      font-weight: 800;
      color: #000000;
    }

    .from-name {
      font-size: 12.5pt;
      font-weight: 900;
      color: #000000;
    }

    .from-address {
      font-size: 11pt;
      font-weight: 600;
      color: #000000;
    }

    .from-cell {
      font-size: 11.5pt;
      font-weight: 800;
      color: #000000;
    }

    .order-ref-block {
      text-align: right;
      line-height: 1.2;
    }

    .order-ref-title {
      font-size: 9.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #333333;
    }

    .order-ref-number {
      font-size: 12pt;
      font-weight: 900;
      font-family: monospace, Courier, sans-serif;
      color: #000000;
    }

    /* ─── Default Text Sizes: LARGE (Increased for Clarity) ── */
    body, body.size-large {
      .to-text { font-size: 24pt; }
      .product-summary { font-size: 16pt; }
      .customer-name { font-size: 20pt; }
      .address-line { font-size: 14pt; }
      .pincode-highlight { font-size: 16pt; }
      .customer-phone { font-size: 18pt; }
      .from-name { font-size: 12.5pt; }
      .from-cell { font-size: 11.5pt; }
    }

    /* Extra Large Option */
    body.size-xl {
      .to-text { font-size: 26pt; }
      .product-summary { font-size: 18pt; }
      .customer-name { font-size: 22pt; }
      .address-line { font-size: 15pt; }
      .pincode-highlight { font-size: 17pt; }
      .customer-phone { font-size: 20pt; }
      .from-name { font-size: 13.5pt; }
      .from-cell { font-size: 12.5pt; }
    }

    /* Normal Option */
    body.size-normal {
      .to-text { font-size: 20pt; }
      .product-summary { font-size: 14pt; }
      .customer-name { font-size: 17pt; }
      .address-line { font-size: 12.5pt; }
      .pincode-highlight { font-size: 14pt; }
      .customer-phone { font-size: 15.5pt; }
      .from-name { font-size: 11pt; }
      .from-cell { font-size: 10.5pt; }
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
        border: none !important;
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;
}

/**
 * Generate complete HTML document for shipping labels
 */
export function generateShippingLabelsHTML(orders, logoUrl) {
  const orderList = Array.isArray(orders) ? orders : [orders];
  if (orderList.length === 0) return "";

  const resolvedLogoUrl =
    logoUrl ||
    (typeof window !== "undefined" && window.location
      ? `${window.location.origin}/images/icons/logo.png`
      : "/images/icons/logo.png");

  // Each order occupies its own full Portrait sheet (102mm x 152mm)
  const sheetsHtml = orderList
    .map(
      (order) => `
      <div class="label-sheet">
        ${renderSingleShippingLabel(order, resolvedLogoUrl)}
      </div>
    `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipping Labels (${orderList.length} Order${orderList.length > 1 ? "s" : ""} - 102x152mm Portrait) | Kala Agalya Herbals</title>
  <style id="dynamic-page-style">
    @page {
      size: 102mm 152mm portrait;
      margin: 0;
    }
  </style>
  <style>
    ${getShippingLabelStyles()}
  </style>
</head>
<body class="orientation-portrait size-large">

  <!-- Screen Action Floating Bar (Hidden during Print) -->
  <div class="screen-actions no-print">
    <div class="left-info">
      <span>📦 Kala Agalya Herbals</span>
      <span>•</span>
      <span id="sheet-info-text">Shipping Labels: ${orderList.length} Order${orderList.length > 1 ? "s" : ""} (${orderList.length} Sheet${orderList.length > 1 ? "s" : ""} @ 102×152mm Portrait)</span>
    </div>
    <div class="btn-group">
      <!-- Orientation Toggle (Portrait default vs Landscape) -->
      <div class="pill-group">
        <span>Orientation:</span>
        <button type="button" class="pill-btn orient-btn active" onclick="setOrientation('portrait', this)">📄 Portrait (102×152mm)</button>
        <button type="button" class="pill-btn orient-btn" onclick="setOrientation('landscape', this)">📄 Landscape (152×102mm)</button>
      </div>

      <!-- Text Size Selector -->
      <div class="pill-group">
        <span>Text Size:</span>
        <button type="button" class="pill-btn size-btn" onclick="setSize('size-normal', this)">Normal</button>
        <button type="button" class="pill-btn size-btn active" onclick="setSize('size-large', this)">Large (Default)</button>
        <button type="button" class="pill-btn size-btn" onclick="setSize('size-xl', this)">Extra Large</button>
      </div>

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

  <script>
    function setOrientation(orientation, btnEl) {
      const pageStyle = document.getElementById('dynamic-page-style');
      const infoText = document.getElementById('sheet-info-text');
      const totalCount = ${orderList.length};

      if (orientation === 'landscape') {
        pageStyle.innerHTML = '@page { size: 152mm 102mm landscape; margin: 0; }';
        document.body.classList.remove('orientation-portrait');
        document.body.classList.add('orientation-landscape');
        if (infoText) {
          infoText.innerText = 'Shipping Labels: ' + totalCount + ' Order' + (totalCount > 1 ? 's' : '') + ' (' + totalCount + ' Sheet' + (totalCount > 1 ? 's' : '') + ' @ 152×102mm Landscape)';
        }
      } else {
        pageStyle.innerHTML = '@page { size: 102mm 152mm portrait; margin: 0; }';
        document.body.classList.remove('orientation-landscape');
        document.body.classList.add('orientation-portrait');
        if (infoText) {
          infoText.innerText = 'Shipping Labels: ' + totalCount + ' Order' + (totalCount > 1 ? 's' : '') + ' (' + totalCount + ' Sheet' + (totalCount > 1 ? 's' : '') + ' @ 102×152mm Portrait)';
        }
      }

      document.querySelectorAll('.orient-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    }

    function setSize(sizeClass, btnEl) {
      document.body.classList.remove('size-normal', 'size-large', 'size-xl');
      document.body.classList.add(sizeClass);
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    }
  </script>

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

  const logoUrl =
    typeof window !== "undefined" && window.location
      ? `${window.location.origin}/images/icons/logo.png`
      : "/images/icons/logo.png";

  const html = generateShippingLabelsHTML(list, logoUrl);
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

// ─── Thermal Shipping Label Generator (Portrait 100mm x 150mm / 4" x 6") ────
// Custom-engineered for Kala Agalya Herbals thermal parcel sticker printers
// Zero-clipping safe margins (96mm width), full 146mm vertical layout, bold typography

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
 * Gracefully wrap address text into lines of up to maxChars at word boundaries
 */
function wrapAddressText(text, maxChars = 38) {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Parse address fields into clean printable lines and extract pincode
 */
function parseAddressDetails(order) {
  const customer = order.customer || {};
  const addr = customer.address || {};
  let lines = [];
  let pincode = "";

  // 1. Direct pincode field if provided
  if (addr.pincode) {
    pincode = String(addr.pincode).trim();
  }

  // 2. Structured address fields (if door, street, etc. exist)
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
  }

  // 3. Unstructured fullAddress (most common in WhatsApp orders)
  if (lines.length === 0) {
    let full = "";
    if (typeof addr === "string") {
      full = addr.trim();
    } else if (addr.fullAddress) {
      full = addr.fullAddress.trim();
    } else if (order.deliveryAddress) {
      full = String(order.deliveryAddress).trim();
    }

    if (full) {
      // Find 6-digit Indian pincode (starts with 1-9)
      const pinMatch = full.match(/\b([1-9]\d{5})\b/);
      if (pinMatch && !pincode) {
        pincode = pinMatch[1];
      }

      // Clean pincode from address text so it's not repeated
      let cleanedFull = full;
      if (pincode) {
        const pinRegex = new RegExp(`[-–\\s,;]*(?:pincode|pin)?\\s*[:#-]?\\s*${pincode}\\b`, "gi");
        cleanedFull = cleanedFull.replace(pinRegex, "").trim();
        cleanedFull = cleanedFull.replace(/[-–,\\s]+$/, "").trim();
      }

      // Split by commas or newlines if present
      if (cleanedFull.includes("\n") || cleanedFull.includes(",")) {
        const parts = cleanedFull
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        parts.forEach((p) => {
          if (p.length > 40) {
            lines.push(...wrapAddressText(p, 38));
          } else if (p.length > 0) {
            lines.push(p);
          }
        });
      } else {
        // Continuous line with no commas or newlines (e.g. Rajkumar's address)
        lines = wrapAddressText(cleanedFull, 38);
      }
    }
  }

  // Safety fallback: If still empty but raw fullAddress string exists, never drop it!
  if (lines.length === 0) {
    const raw = typeof addr === "string" ? addr : (addr.fullAddress || "");
    if (raw) {
      lines = wrapAddressText(raw, 38);
    }
  }

  return { lines, pincode };
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
 * Render single shipping label HTML card (Portrait format: safe 96mm x 146mm)
 */
function renderSingleShippingLabel(order, logoUrl) {
  if (!order) {
    return `<div class="single-label empty"></div>`;
  }

  const customer = order.customer || {};
  const name = customer.name || "Customer";
  const phone = cleanPhone(customer.mobileNumber || customer.whatsappNumber);
  const itemSummary = formatItemSummary(order.items);
  const { lines, pincode } = parseAddressDetails(order);

  const addressHtml = lines
    .slice(0, 6)
    .map((line) => `<div class="address-line">${escapeHtml(line)}</div>`)
    .join("");

  const logoImgHtml = `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="brand-logo" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src='/images/icons/logo.png';}else{this.style.display='none';}" />`;

  return `
    <div class="single-label">
      <!-- ─── 1. Header (Logo + TO on Left, Product Variant on Right) ─── -->
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

      <!-- ─── 2. Center Customer Delivery Details (Fills Full Height) ─── -->
      <div class="customer-address">
        <div class="customer-name">${escapeHtml(name)}</div>
        
        <div class="address-lines-wrapper">
          ${addressHtml}
        </div>

        ${
          pincode
            ? `<div class="pincode-container">
                 <span class="pincode-badge">PINCODE: ${escapeHtml(pincode)}</span>
               </div>`
            : ""
        }

        <div class="phone-container">
          <span class="phone-label">PH:</span>
          <span class="phone-val">${escapeHtml(phone || "N/A")}</span>
        </div>
      </div>

      <!-- ─── 3. Bottom Sender Block & Order Reference (Anchored at Base) ─── -->
      <div class="label-footer">
        <div class="from-block">
          <div class="from-title">From :</div>
          <div class="from-name">Kala Agalya Herbals</div>
          <div class="from-address">TNHB, Ayapakkam, Chennai</div>
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
 * Get CSS styles optimized for 100mm x 150mm Portrait thermal label
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
      background: #e5e5e5;
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
      gap: 8px;
    }
    .print-tip {
      font-size: 11px;
      color: #d1d5db;
      background: #2a2212;
      border: 1px solid #78350f;
      padding: 3px 8px;
      border-radius: 6px;
      margin-left: 10px;
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

    /* ─── DEFAULT: Safe Portrait Container (96mm width x 146mm height) ─── */
    /* Prevents thermal printer head from clipping left/right edges */
    .label-sheet {
      width: 96mm;
      height: 146mm;
      min-height: 146mm;
      max-height: 146mm;
      background: #ffffff;
      box-sizing: border-box;
      padding: 4.5mm 5mm;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 4px;
      page-break-after: always;
      break-after: page;
      position: relative;
    }

    /* Landscape Mode Switcher Override */
    body.orientation-landscape .label-sheet {
      width: 146mm;
      height: 96mm;
      min-height: 96mm;
      max-height: 96mm;
      padding: 4mm 6mm;
    }

    .single-label {
      width: 100%;
      height: 100%;
      min-height: 137mm;
      position: relative;
      box-sizing: border-box;
      background: #ffffff;
    }

    body.orientation-landscape .single-label {
      min-height: 88mm;
    }

    /* ─── 1. Header: Logo + TO + Product Summary ─── */
    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2mm;
      border-bottom: 2px solid #000000;
      margin-bottom: 2.5mm;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2.5mm;
    }

    .brand-logo {
      width: 20mm;
      height: 20mm;
      object-fit: contain;
      flex-shrink: 0;
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
      max-width: 48mm;
    }

    .product-summary {
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.1;
      color: #000000;
      word-break: break-word;
      text-align: right;
    }

    /* ─── 2. Center: Customer Delivery Info (Fills Vertical Room) ─── */
    .customer-address {
      display: block;
      margin-top: 1.5mm;
      margin-bottom: 3mm;
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
      gap: 1.8mm;
      margin-bottom: 2.5mm;
    }

    .address-line {
      font-size: 13.5pt;
      font-weight: 600;
      line-height: 1.35;
      color: #000000;
      word-break: break-word;
    }

    .pincode-container {
      margin-top: 2mm;
      margin-bottom: 2mm;
    }

    .pincode-badge {
      display: inline-block;
      padding: 1.2mm 3mm;
      border: 1.8px solid #000000;
      border-radius: 4px;
      font-size: 16pt;
      font-weight: 900;
      color: #000000;
      letter-spacing: 0.5px;
      background: #ffffff;
    }

    .phone-container {
      margin-top: 2.5mm;
      display: flex;
      align-items: baseline;
      gap: 2mm;
    }

    .phone-label {
      font-size: 16pt;
      font-weight: 900;
      color: #000000;
    }

    .phone-val {
      font-size: 19pt;
      font-weight: 900;
      color: #000000;
      letter-spacing: 0.5px;
    }

    /* ─── 3. Bottom: Sender ("From") Block (Anchored at Base) ─── */
    .label-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 2.5mm;
      border-top: 2px solid #000000;
      background: #ffffff;
    }

    .from-block {
      line-height: 1.28;
    }

    .from-title {
      font-size: 10.5pt;
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
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #444444;
    }

    .order-ref-number {
      font-size: 11.5pt;
      font-weight: 900;
      font-family: monospace, Courier, sans-serif;
      color: #000000;
    }

    /* ─── Default Text Sizes: LARGE (Increased for Clarity) ── */
    body, body.size-large {
      .to-text { font-size: 24pt; }
      .product-summary { font-size: 15pt; }
      .customer-name { font-size: 20pt; }
      .address-line { font-size: 13.5pt; }
      .pincode-badge { font-size: 16pt; }
      .phone-val { font-size: 19pt; }
      .from-name { font-size: 12.5pt; }
      .from-cell { font-size: 11.5pt; }
    }

    /* Extra Large Option */
    body.size-xl {
      .to-text { font-size: 26pt; }
      .product-summary { font-size: 17pt; }
      .customer-name { font-size: 22pt; }
      .address-line { font-size: 14.5pt; }
      .pincode-badge { font-size: 17pt; }
      .phone-val { font-size: 21pt; }
      .from-name { font-size: 13.5pt; }
      .from-cell { font-size: 12.5pt; }
    }

    /* Normal Option */
    body.size-normal {
      .to-text { font-size: 20pt; }
      .product-summary { font-size: 13pt; }
      .customer-name { font-size: 17pt; }
      .address-line { font-size: 12pt; }
      .pincode-badge { font-size: 14pt; }
      .phone-val { font-size: 16pt; }
      .from-name { font-size: 11pt; }
      .from-cell { font-size: 10.5pt; }
    }

    /* ─── PRINT RULES ────────────────────────────────── */
    @media print {
      html, body {
        width: 100% !important;
        height: auto !important;
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .preview-container {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        gap: 0 !important;
      }
      .label-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        border: none !important;
        margin: 0 auto !important;
        padding: 4mm 4.5mm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      body.orientation-portrait .label-sheet {
        width: 96mm !important;
        height: 146mm !important;
        min-height: 146mm !important;
        max-height: 146mm !important;
      }
      body.orientation-landscape .label-sheet {
        width: 146mm !important;
        height: 96mm !important;
        min-height: 96mm !important;
        max-height: 96mm !important;
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

  // Each order occupies its own full Portrait sheet (96mm x 146mm safe zone)
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
  <title>Shipping Labels (${orderList.length} Order${orderList.length > 1 ? "s" : ""} - Portrait) | Kala Agalya Herbals</title>
  <style id="dynamic-page-style">
    @page {
      size: 100mm 150mm portrait;
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
      <span id="sheet-info-text">Shipping Labels: ${orderList.length} Order${orderList.length > 1 ? "s" : ""} (100×150mm Portrait)</span>
      <span class="print-tip">💡 Printer Tip: In Chrome Print Dialog, set Margins to "None" or "Minimum"</span>
    </div>
    <div class="btn-group">
      <!-- Orientation Toggle (Portrait default vs Landscape) -->
      <div class="pill-group">
        <span>Orientation:</span>
        <button type="button" class="pill-btn orient-btn active" onclick="setOrientation('portrait', this)">📄 Portrait (100×150mm)</button>
        <button type="button" class="pill-btn orient-btn" onclick="setOrientation('landscape', this)">📄 Landscape (150×100mm)</button>
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
        pageStyle.innerHTML = '@page { size: 150mm 100mm landscape; margin: 0; }';
        document.body.classList.remove('orientation-portrait');
        document.body.classList.add('orientation-landscape');
        if (infoText) {
          infoText.innerText = 'Shipping Labels: ' + totalCount + ' Order' + (totalCount > 1 ? 's' : '') + ' (150×100mm Landscape)';
        }
      } else {
        pageStyle.innerHTML = '@page { size: 100mm 150mm portrait; margin: 0; }';
        document.body.classList.remove('orientation-landscape');
        document.body.classList.add('orientation-portrait');
        if (infoText) {
          infoText.innerText = 'Shipping Labels: ' + totalCount + ' Order' + (totalCount > 1 ? 's' : '') + ' (100×150mm Portrait)';
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

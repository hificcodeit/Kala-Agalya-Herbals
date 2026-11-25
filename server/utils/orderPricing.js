const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const SOUTH_INDIA_75 = ["Andhra Pradesh", "Telangana", "Kerala", "Karnataka"];
const TAMIL_NADU = ["Tamil Nadu"];
const PUDUCHERRY = ["Puducherry"];

/**
 * Normalize size labels so minor whitespace/casing differences match safely.
 */
function normalizeSize(size) {
  return String(size || "").replace(/\s+/g, "").toLowerCase();
}

/**
 * Compute authoritative shipping charge on the server from the destination state.
 */
function getShippingAmount(state) {
  const trimmed = String(state || "").trim();
  const matchedState = INDIAN_STATES.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase()
  );

  if (!matchedState) {
    const err = new Error("Please select a valid Indian state for shipping.");
    err.statusCode = 400;
    throw err;
  }

  if (TAMIL_NADU.includes(matchedState)) return 30;
  if (PUDUCHERRY.includes(matchedState)) return 40;
  if (SOUTH_INDIA_75.includes(matchedState)) return 75;
  return 165;
}

/**
 * Resolve authoritative unit price from a Product size subdocument.
 */
function getAuthoritativeUnitPrice(dbSize) {
  const offer = dbSize.offerPrice !== null && dbSize.offerPrice !== undefined
    ? Number(dbSize.offerPrice)
    : null;
  const base = Number(dbSize.price);
  const unitPrice = offer !== null && Number.isFinite(offer) && offer > 0 ? offer : base;

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    const err = new Error(`Invalid price configured for size "${dbSize.size}".`);
    err.statusCode = 400;
    throw err;
  }
  return unitPrice;
}

/**
 * Recompute verified line items, shippingAmount, and totalAmount from DB products.
 * Never trusts client-supplied price, shippingAmount, or totalAmount.
 */
function calculateVerifiedOrder(rawItems, resolvedProductsByKey, state) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    const err = new Error("Order must contain at least one item.");
    err.statusCode = 400;
    throw err;
  }

  const verifiedItems = [];
  let subtotal = 0;

  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object") {
      const err = new Error("Invalid cart item.");
      err.statusCode = 400;
      throw err;
    }

    const quantity = Number(rawItem.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      const err = new Error("Item quantity must be a whole number of at least 1.");
      err.statusCode = 400;
      throw err;
    }

    const requestedSize = String(rawItem.size || "").trim();
    if (!requestedSize) {
      const err = new Error("Each cart item must specify a product size.");
      err.statusCode = 400;
      throw err;
    }

    const product = resolvedProductsByKey(rawItem);
    if (!product || product.isActive === false) {
      const err = new Error(`Product "${rawItem.name || rawItem.productId || "Unknown"}" is unavailable.`);
      err.statusCode = 400;
      throw err;
    }

    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const dbSize =
      sizes.find((s) => s.size === requestedSize) ||
      sizes.find((s) => normalizeSize(s.size) === normalizeSize(requestedSize));

    if (!dbSize) {
      const err = new Error(`Size "${requestedSize}" is unavailable for "${product.name}".`);
      err.statusCode = 400;
      throw err;
    }

    const unitPrice = getAuthoritativeUnitPrice(dbSize);
    subtotal += unitPrice * quantity;

    verifiedItems.push({
      name: product.name,
      size: dbSize.size,
      price: unitPrice,
      quantity,
    });
  }

  const shippingAmount = getShippingAmount(state);
  const totalAmount = Math.round((subtotal + shippingAmount) * 100) / 100;

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    const err = new Error("Calculated order total is invalid.");
    err.statusCode = 400;
    throw err;
  }

  return {
    items: verifiedItems,
    subtotal,
    shippingAmount,
    totalAmount,
  };
}

module.exports = {
  INDIAN_STATES,
  normalizeSize,
  getShippingAmount,
  getAuthoritativeUnitPrice,
  calculateVerifiedOrder,
};


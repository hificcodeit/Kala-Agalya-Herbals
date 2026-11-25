import { BASE_URL } from "../services/api";

export function normalizeSize(size) {
  return String(size || "").replace(/\s+/g, "").toLowerCase();
}

export function sanitizeCartItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object" && item.size)
    .map(({ img, ...rest }) => {
      const qty = Number(rest.quantity);
      const price = Number(rest.price);
      return {
        ...rest,
        quantity: Number.isInteger(qty) && qty >= 1 ? qty : 1,
        price: Number.isFinite(price) && price > 0 ? price : 0,
      };
    });
}

export function syncCartWithProducts(cartItems, products, { includeImage = false } = {}) {
  const activeProducts = (products || []).filter((p) => p.isActive !== false);
  return cartItems
    .map((item) => {
      const dbProd = activeProducts.find(
        (p) =>
          (item.productId && item.productId !== "default" && p._id === item.productId) ||
          (item.id && String(item.id).startsWith(p._id)) ||
          (item.name && p.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
      );
      if (!dbProd) return null;

      let si = dbProd.sizes.findIndex((s) => s.size === item.size);
      if (si === -1) {
        si = dbProd.sizes.findIndex((s) => normalizeSize(s.size) === normalizeSize(item.size));
      }
      if (si === -1) return null;

      const dbSize = dbProd.sizes[si];
      const price =
        dbSize.offerPrice !== null && dbSize.offerPrice !== undefined && Number(dbSize.offerPrice) > 0
          ? Number(dbSize.offerPrice)
          : Number(dbSize.price);
      if (!Number.isFinite(price) || price <= 0) return null;

      const synced = {
        ...item,
        productId: dbProd._id,
        name: dbProd.name,
        size: dbSize.size,
        price,
      };

      if (includeImage) {
        const rawImg = dbProd.images && (dbProd.images[si] || dbProd.images[0]);
        let displayImg = "/images/icons/logo.webp";
        if (rawImg) {
          if (rawImg.startsWith("data:image")) displayImg = rawImg;
          else if (rawImg.startsWith("http") || rawImg.startsWith("/images/")) displayImg = rawImg;
          else displayImg = `${BASE_URL.replace(/\/api$/, "")}${rawImg.startsWith("/") ? rawImg : `/${rawImg}`}`;
        }
        synced.img = displayImg;
      }

      return synced;
    })
    .filter(Boolean);
}


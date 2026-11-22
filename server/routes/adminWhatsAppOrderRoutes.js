const express = require("express");
const router = express.Router();
const whatsappOrderController = require("../controllers/whatsappOrderController");
const adminAuth = require("../middleware/adminAuth");

// Restrict all WhatsApp Order operations to authenticated admins
router.use(adminAuth);

// Bulk import endpoint (before :id parameter to avoid collision)
router.post("/bulk-import", whatsappOrderController.bulkImportWhatsAppOrders);

// Standard CRUD
router.get("/", whatsappOrderController.getAllWhatsAppOrders);
router.post("/", whatsappOrderController.createWhatsAppOrder);
router.get("/:id", whatsappOrderController.getWhatsAppOrder);
router.put("/:id", whatsappOrderController.updateWhatsAppOrder);
router.delete("/:id", whatsappOrderController.deleteWhatsAppOrder);

module.exports = router;


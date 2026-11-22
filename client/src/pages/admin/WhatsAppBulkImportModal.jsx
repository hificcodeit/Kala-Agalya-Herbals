import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { API_URL } from "../../services/api";
import { useToast } from "../../components/Alert";

export default function WhatsAppBulkImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'valid' | 'invalid'
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setFileName("");
    setPreviewData(null);
    setIsParsing(false);
    setIsSubmitting(false);
    setFilterMode("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Helper to normalize phone number
  const cleanPhone = (val) => {
    if (!val) return "";
    const digits = String(val).replace(/\D/g, "");
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  };

  // Read and parse uploaded file (supports .xlsx, .xls, .csv)
  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = uploadedFile.name.substring(uploadedFile.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      addToast("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file", "error");
      return;
    }

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsParsing(true);
    setPreviewData(null);

    try {
      const dataBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to JSON array
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rawRows.length === 0) {
        addToast("Uploaded file is empty. Please check your data.", "error");
        setIsParsing(false);
        return;
      }

      // Send to server for thorough validation against database and duplicate invoice numbers
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/admin/whatsapp-orders/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "preview",
          records: rawRows
        })
      });

      const result = await response.json();
      if (result.success) {
        setPreviewData(result);
        addToast(`File parsed: ${result.validCount} valid, ${result.invalidCount} invalid rows`, "info");
      } else {
        addToast(result.message || "Failed to validate imported records", "error");
      }
    } catch (err) {
      console.error("Error parsing file:", err);
      addToast("Failed to parse uploaded file. Check file format.", "error");
    } finally {
      setIsParsing(false);
    }
  };

  // Submit confirmed valid records to persistent database
  const handleConfirmImport = async () => {
    if (!previewData || previewData.validCount === 0) {
      addToast("No valid records to save", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("adminToken");
      const validRecords = previewData.records
        .filter((r) => r.isValid)
        .map((r) => ({
          "Customer Name": r.customerName,
          Address: r.address,
          "Mobile Number": r.mobileNumber,
          "WhatsApp Number": r.whatsappNumber,
          "Placed Order": r.placedOrder,
          "Total Amount": r.totalAmount,
          "Order Date": r.orderDate,
          "Invoice Number": r.invoiceNumber,
          "Invoice Status": r.invoiceStatus
        }));

      const response = await fetch(`${API_URL}/admin/whatsapp-orders/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "save",
          records: validRecords
        })
      });

      const result = await response.json();
      if (result.success) {
        addToast(`Success! ${result.importedCount} WhatsApp orders imported ✅`, "success");
        onImportSuccess();
        handleClose();
      } else {
        addToast(result.message || "Failed to commit orders to database", "error");
      }
    } catch (error) {
      console.error("Error committing import:", error);
      addToast("Server error during bulk save", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter preview records for display
  const displayedRecords = (previewData?.records || []).filter((r) => {
    if (filterMode === "valid") return r.isValid;
    if (filterMode === "invalid") return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-yellow-500/20 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#FDFBF7] border-b border-yellow-500/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1C1A16] font-grotesk tracking-wide">
                Bulk Import WhatsApp Orders
              </h3>
              <p className="text-xs text-[#8A867E] font-inter">
                Upload Excel (.xlsx, .xls) or CSV (.csv) with instant validation & error checking
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-yellow-500/30 rounded-2xl p-6 bg-[#FDFBF7]/60 hover:bg-yellow-500/5 transition-all text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
              id="whatsapp-bulk-file-input"
            />
            <label
              htmlFor="whatsapp-bulk-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 text-yellow-800 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-yellow-900 font-grotesk">
                {fileName ? `Selected: ${fileName}` : "Click to browse or drop an Excel/CSV file here"}
              </span>
              <span className="text-[11px] text-[#8A867E]">
                Supported formats: .xlsx, .xls, .csv • Max recommended: 500 rows per file
              </span>
            </label>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-3 border-yellow-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs font-semibold text-yellow-900 font-grotesk">
                Validating columns, phone numbers & invoice uniqueness...
              </p>
            </div>
          )}

          {/* Validation Summary Bar */}
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold font-grotesk">Total Rows</p>
                  <p className="text-xl font-black text-gray-800 font-grotesk">{previewData.totalRecords}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                  <p className="text-[10px] text-emerald-600 uppercase font-bold font-grotesk">Valid Rows</p>
                  <p className="text-xl font-black text-emerald-700 font-grotesk">{previewData.validCount}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5">
                  <p className="text-[10px] text-red-500 uppercase font-bold font-grotesk">Invalid Rows</p>
                  <p className="text-xl font-black text-red-700 font-grotesk">{previewData.invalidCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                  <p className="text-[10px] text-amber-700 uppercase font-bold font-grotesk">Ready to Import</p>
                  <p className="text-xl font-black text-amber-800 font-grotesk">
                    {previewData.validCount > 0 ? "Yes" : "None"}
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-grotesk transition-colors ${
                      filterMode === "all" ? "bg-yellow-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Rows ({previewData.records.length})
                  </button>
                  <button
                    onClick={() => setFilterMode("valid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-grotesk transition-colors ${
                      filterMode === "valid" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    Valid Only ({previewData.validCount})
                  </button>
                  <button
                    onClick={() => setFilterMode("invalid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-grotesk transition-colors ${
                      filterMode === "invalid" ? "bg-red-600 text-white" : "bg-red-50 text-red-800 hover:bg-red-100"
                    }`}
                  >
                    Errors Only ({previewData.invalidCount})
                  </button>
                </div>
                <span className="text-xs text-gray-500 font-inter">
                  Showing {displayedRecords.length} records
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 font-bold font-grotesk text-gray-700 sticky top-0">
                    <tr>
                      <th className="p-2.5 text-center">Row</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">WhatsApp</th>
                      <th className="p-2.5">Placed Order</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5">Errors / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-inter">
                    {displayedRecords.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={row.isValid ? "hover:bg-emerald-50/40" : "bg-red-50/30 hover:bg-red-50/60"}
                      >
                        <td className="p-2.5 text-center font-mono font-bold text-gray-500">{row.rowIndex}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✓ Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              ✕ Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-gray-800">{row.customerName || "—"}</td>
                        <td className="p-2.5 font-mono">{row.mobileNumber || "—"}</td>
                        <td className="p-2.5 font-mono">{row.whatsappNumber || "—"}</td>
                        <td className="p-2.5 max-w-[160px] truncate" title={row.placedOrder}>
                          {row.placedOrder || "Standard Herbal Order"}
                        </td>
                        <td className="p-2.5 text-right font-bold text-gray-900">
                          ₹{(Number(row.totalAmount) || 0).toFixed(0)}
                        </td>
                        <td className="p-2.5 text-red-600 font-medium max-w-[200px]">
                          {row.errors && row.errors.length > 0 ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {row.errors.map((e, i) => (
                                <li key={i} className="text-[11px]">{e}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-emerald-700 text-[11px]">Ready for database</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FDFBF7] border-t border-yellow-500/15 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold font-grotesk text-xs uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>

          {previewData && previewData.validCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 font-inter">
                Ready to insert <strong>{previewData.validCount}</strong> valid order(s)
              </span>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold font-grotesk text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm & Save Orders ({previewData.validCount})
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


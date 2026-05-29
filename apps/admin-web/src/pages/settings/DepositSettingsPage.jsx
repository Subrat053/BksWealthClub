import { useState, useEffect } from "react";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import axiosInstance from "../../utils/axiosInstance";

export default function DepositSettingsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    network: "",
    walletAddress: "",
    qrCodeUrl: "",
    instructions: "",
    isActive: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/deposit-credentials");
      setCredentials(res.data?.data || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to fetch credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation for image files
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Only JPG, JPEG, PNG, and WEBP files are allowed.");
      return;
    }

    setUploadLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/uploads/single", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setForm((prev) => ({
        ...prev,
        qrCodeUrl: res.data?.data?.url || "",
      }));
      setSuccessMsg("QR Code uploaded successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "QR Code upload failed.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEdit = (cred) => {
    setForm({
      network: cred.network,
      walletAddress: cred.walletAddress,
      qrCodeUrl: cred.qrCodeUrl,
      instructions: cred.instructions || "",
      isActive: cred.isActive,
    });
    setCurrentId(cred._id);
    setIsEditing(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleAddNewClick = () => {
    setForm({
      network: "",
      walletAddress: "",
      qrCodeUrl: "",
      instructions: "",
      isActive: false,
    });
    setCurrentId(null);
    setIsEditing(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentId(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.network.trim()) {
      setErrorMsg("Network name is required.");
      return;
    }
    if (!form.walletAddress.trim()) {
      setErrorMsg("Wallet address is required.");
      return;
    }
    if (!form.qrCodeUrl) {
      setErrorMsg("QR Code image upload is required.");
      return;
    }

    setSubmitLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (currentId) {
        // Update existing
        await axiosInstance.put(`/admin/deposit-credentials/${currentId}`, form);
        setSuccessMsg("Deposit credential updated successfully!");
      } else {
        // Create new
        await axiosInstance.post("/admin/deposit-credentials", form);
        setSuccessMsg("Deposit credential created successfully!");
      }
      setIsEditing(false);
      setCurrentId(null);
      fetchCredentials();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save credential.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await axiosInstance.patch(`/admin/deposit-credentials/${id}/activate`);
      setSuccessMsg("Credential activated successfully!");
      fetchCredentials();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to activate credential.");
    }
  };

  const activeCred = credentials.find((c) => c.isActive);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deposit Settings"
        subtitle="Configure the deposit networks, wallet addresses, and scan-to-pay QR codes displayed to members."
      />

      {/* Toast Alert Messages */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-semibold shadow-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold shadow-xs">
          {successMsg}
        </div>
      )}

      {/* Main Section */}
      {!isEditing ? (
        <>
          {/* Active Wallet Box Card (Premium design matching requested theme) */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E5E7EB] pb-4 mb-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#FFF4E5] border border-[#F4B860]/40 px-3 py-1 text-xs font-bold text-[#E8A13F] uppercase">
                  Active Wallet Credential
                </span>
                <h3 className="mt-2 text-xl font-bold text-[#111827]">
                  {activeCred ? activeCred.network : "No Active Credential"}
                </h3>
              </div>
              {activeCred && (
                <button
                  onClick={() => handleEdit(activeCred)}
                  className="rounded-xl bg-[#F4B860] px-4 py-2.5 text-xs font-bold text-[#111827] hover:bg-[#E8A13F] transition-all shadow-xs"
                >
                  Edit Credential
                </button>
              )}
            </div>

            {activeCred ? (
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                      Deposit Wallet Address
                    </p>
                    <p className="mt-1 font-mono text-sm break-all font-bold bg-[#FFF4E5] border border-[#F4B860]/30 rounded-xl px-4 py-3 text-[#111827]">
                      {activeCred.walletAddress}
                    </p>
                  </div>
                  {activeCred.instructions && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                        Note/Instructions
                      </p>
                      <p className="mt-1 text-sm text-[#111827] bg-[#FFF4E5] border border-[#F4B860]/20 rounded-xl px-4 py-3 break-all">
                        {activeCred.instructions}
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-[#6B7280]">
                    Last updated:{" "}
                    <span className="font-semibold">
                      {new Date(activeCred.updatedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2 text-center">
                    QR Code Preview
                  </p>
                  <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-xs">
                    <img
                      src={activeCred.qrCodeUrl}
                      alt="QR Code"
                      className="h-32 w-32 object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-[#6B7280]">
                Currently, no wallet credentials are marked active. Users will see a "not configured" status. Use the table below to add or activate one.
              </div>
            )}
          </div>

          {/* History/Credentials Table */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-[#111827]">All Wallet Credentials</h3>
              <button
                onClick={handleAddNewClick}
                className="rounded-xl bg-[#111827] text-white hover:bg-[#1F2937] px-4 py-2.5 text-xs font-bold transition-all shadow-xs"
              >
                + Add Wallet Credential
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 border-b border-[#E5E7EB]">
                  <tr>
                    {["Network", "Address", "QR Code", "Instructions", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#6B7280]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B7280]">
                        Loading credentials...
                      </td>
                    </tr>
                  ) : credentials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B7280]">
                        No credentials created yet. Click "+ Add Wallet Credential" to configure.
                      </td>
                    </tr>
                  ) : (
                    credentials.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 text-sm font-bold text-[#111827]">
                          {c.network}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 max-w-[200px] truncate">
                          {c.walletAddress}
                        </td>
                        <td className="px-6 py-4">
                          <img
                            src={c.qrCodeUrl}
                            alt="QR"
                            className="h-10 w-10 object-contain rounded border border-[#E5E7EB] p-0.5 bg-white"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280] max-w-[200px] truncate">
                          {c.instructions || "—"}
                        </td>
                        <td className="px-6 py-4">
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-[#E5E7EB] px-2.5 py-0.5 text-xs font-bold text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(c)}
                              className="text-[#111827] hover:text-[#F4B860] font-bold text-xs"
                            >
                              Edit
                            </button>
                            {!c.isActive && (
                              <button
                                onClick={() => handleActivate(c._id)}
                                className="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Create/Edit Form (Premium style matching the requested theme values) */
        <div className="max-w-2xl mx-auto rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#111827] border-b border-[#E5E7EB] pb-3 mb-5">
            {currentId ? "Edit Wallet Credential" : "Add Deposit Wallet Credential"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Wallet Network Name *
              </label>
              <input
                type="text"
                value={form.network}
                onChange={(e) => setForm({ ...form, network: e.target.value })}
                placeholder="Example: USDT TRC20"
                className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-slate-50/50 px-4 text-sm text-[#111827] placeholder-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Deposit Wallet Address *
              </label>
              <input
                type="text"
                value={form.walletAddress}
                onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                placeholder="Paste the precise destination wallet address"
                className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-slate-50/50 px-4 text-sm text-[#111827] placeholder-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                QR Code Image *
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {form.qrCodeUrl && (
                  <div className="rounded-xl border border-[#E5E7EB] p-2 bg-white shrink-0">
                    <img
                      src={form.qrCodeUrl}
                      alt="QR Preview"
                      className="h-24 w-24 object-contain"
                    />
                  </div>
                )}
                <div className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-[#6B7280] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-[#E5E7EB] file:text-xs file:font-bold file:bg-white file:text-[#111827] hover:file:bg-[#FFF4E5] cursor-pointer"
                  />
                  <p className="mt-1.5 text-xs text-[#6B7280]">
                    Accepted files: JPG, JPEG, PNG, WEBP (Max 5MB).
                  </p>
                  {uploadLoading && (
                    <span className="text-xs text-[#E8A13F] font-bold block mt-1">
                      Uploading to Cloudinary...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Note / Instructions (Optional)
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Example: Send only USDT TRC20 to this address. Minimim deposit is $75."
                rows={3}
                className="w-full rounded-xl border border-[#E5E7EB] bg-slate-50/50 px-4 py-3 text-sm text-[#111827] placeholder-slate-400 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 transition-all resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-5 w-5 rounded-lg border-[#E5E7EB] text-[#F4B860] accent-[#F4B860] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm font-bold text-[#111827]">
                Set as Active Credential immediately
              </span>
            </label>

            <div className="flex gap-3 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-12 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#FFF4E5] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading || uploadLoading}
                className="flex-1 h-12 rounded-xl bg-[#F4B860] text-[#111827] hover:bg-[#E8A13F] font-bold transition-all disabled:opacity-50"
              >
                {submitLoading ? "Saving..." : "Save Credential"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

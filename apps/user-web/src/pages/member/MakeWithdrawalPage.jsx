import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import { authService } from "../../services/auth.service";
import { twoFactorService } from "../../services/twoFactor.service";
import { walletService } from "../../services/wallet.service";
import TwoFactorOtpModal from "../../components/common/TwoFactorOtpModal";

export default function MakeWithdrawalPage() {
  const [activeTab, setActiveTab] = useState("withdraw"); // "withdraw" | "transfer"
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ success: null, message: "" });
  
  // Wallet summary state
  const [summary, setSummary] = useState(null);

  // Withdrawal form state
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    walletAddress: "",
    network: "TRC20",
    userNote: ""
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    memberId: "",
    amount: "",
    note: ""
  });

  // P2P Transfer receiver validation states
  const [receiverName, setReceiverName] = useState("");
  const [validatingReceiver, setValidatingReceiver] = useState(false);
  const [receiverError, setReceiverError] = useState("");

  const loadData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        authService.getProfile(),
        walletService.getSummary()
      ]);
      const user = pRes?.data?.user || pRes?.data || {};
      setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
      setSummary(wRes?.data || null);
    } catch (error) {
      console.error("Error loading account data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live receiver validation during P2P transfer
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const id = transferForm.memberId.trim().toUpperCase();
      if (id.length >= 4) {
        setValidatingReceiver(true);
        setReceiverName("");
        setReceiverError("");
        try {
          const res = await authService.validateSponsor(id);
          if (res?.data?.active) {
            setReceiverName(res.data.sponsorName);
          } else {
            setReceiverError("Receiver account is inactive or blocked.");
          }
        } catch (error) {
          setReceiverError(error.message || "Invalid member ID or not found.");
        } finally {
          setValidatingReceiver(false);
        }
      } else {
        setReceiverName("");
        setReceiverError("");
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [transferForm.memberId]);

  // Execute Withdrawal request API call
  const executeWithdrawal = async (otpCode = null) => {
    setLoading(true);
    setStatus({ success: null, message: "" });
    try {
      const payload = {
        amount: Number(withdrawForm.amount),
        walletAddress: withdrawForm.walletAddress.trim(),
        network: withdrawForm.network,
        userNote: withdrawForm.userNote.trim()
      };
      if (otpCode) {
        payload.twoFactorCode = otpCode;
      }
      const res = await walletService.requestWithdrawal(payload);
      setStatus({ success: true, message: res.message || "Withdrawal request submitted successfully!" });
      setWithdrawForm({ amount: "", walletAddress: "", network: "TRC20", userNote: "" });
      setShowOtpModal(false);
      loadData(); // Reload available balance
    } catch (error) {
      setStatus({ success: false, message: error.message || "Failed to submit withdrawal request." });
    } finally {
      setLoading(false);
    }
  };

  // Execute Transfer request API call
  const executeTransfer = async (otpCode = null) => {
    setLoading(true);
    setStatus({ success: null, message: "" });
    try {
      const payload = {
        receiverMemberId: transferForm.memberId.trim().toUpperCase(),
        amount: Number(transferForm.amount),
        note: transferForm.note.trim()
      };
      if (otpCode) {
        payload.twoFactorCode = otpCode;
      }
      const res = await walletService.transfer(payload);
      setStatus({ success: true, message: res.message || "Internal transfer completed successfully!" });
      setTransferForm({ memberId: "", amount: "", note: "" });
      setReceiverName("");
      setShowOtpModal(false);
      loadData(); // Reload available balance
    } catch (error) {
      setStatus({ success: false, message: error.message || "Failed to complete transfer." });
    } finally {
      setLoading(false);
    }
  };

  // Form submit router
  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ success: null, message: "" });

    const available = summary?.availableBalance || 0;

    if (activeTab === "withdraw") {
      const amt = Number(withdrawForm.amount);
      if (!amt || amt <= 0) {
        setStatus({ success: false, message: "Please enter a valid withdrawal amount." });
        return;
      }
      if (amt < 10) {
        setStatus({ success: false, message: "Minimum withdrawal amount is 10 USDT." });
        return;
      }
      if (!withdrawForm.walletAddress.trim()) {
        setStatus({ success: false, message: "Wallet payout address is required." });
        return;
      }
      const totalDebit = amt + amt * 0.05;
      if (available - totalDebit < 20) {
        setStatus({
          success: false,
          message: `Blocked: Withdrawal and 5% fee ($${totalDebit.toFixed(2)}) would bring remaining available balance ($${(available - totalDebit).toFixed(2)}) below the required 20 USDT minimum.`
        });
        return;
      }
    } else {
      // P2P Transfer validation
      const amt = Number(transferForm.amount);
      if (!transferForm.memberId.trim()) {
        setStatus({ success: false, message: "Receiver Member ID is required." });
        return;
      }
      if (receiverError || (!receiverName && !validatingReceiver)) {
        setStatus({ success: false, message: "Please provide a valid active Receiver Member ID." });
        return;
      }
      if (!amt || amt <= 0) {
        setStatus({ success: false, message: "Please enter a valid transfer amount." });
        return;
      }
      if (available - amt < 20) {
        setStatus({
          success: false,
          message: `Blocked: Transfer of $${amt.toFixed(2)} would bring remaining available balance ($${(available - amt).toFixed(2)}) below the required 20 USDT minimum.`
        });
        return;
      }
    }

    if (twoFactorEnabled) {
      setShowOtpModal(true);
    } else {
      if (activeTab === "withdraw") {
        await executeWithdrawal();
      } else {
        await executeTransfer();
      }
    }
  };

  const handleOtpConfirm = async (otp) => {
    setLoading(true);
    try {
      await twoFactorService.validate(otp);
      if (activeTab === "withdraw") {
        await executeWithdrawal(otp);
      } else {
        await executeTransfer(otp);
      }
    } catch (error) {
      setStatus({ success: false, message: error.message || "OTP code verification failed." });
      setLoading(false);
    }
  };

  // Helper values
  const availableBal = summary ? summary.availableBalance : 0;
  const wAmount = Number(withdrawForm.amount) || 0;
  const adminCharge = wAmount * 0.05;
  const netDebit = wAmount + adminCharge;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Financial Operations"
        subtitle="Request secure USDT payouts or instantly transfer funds to other platform members"
      />

      {/* Available Balance Visual Summary Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#FFF4E5]/50 blur-xl"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">
            ${availableBal.toFixed(2)} <span className="text-sm font-bold text-[#E8A13F]">USDT</span>
          </h2>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Withdrawable income from Autopool, Sponsor & Level bonuses</p>
        </div>

        {summary && (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Locked In Withdrawal</span>
              <h2 className="mt-2 text-3xl font-extrabold text-[#E8A13F] tracking-tight">
                ${summary.lockedWithdrawalBalance?.toFixed(2) || "0.00"} <span className="text-sm font-bold text-[#E8A13F]">USDT</span>
              </h2>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Requested funds undergoing admin verification</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Paid Out</span>
              <h2 className="mt-2 text-3xl font-extrabold text-emerald-600 tracking-tight">
                ${summary.lifetimeWithdrawn?.toFixed(2) || "0.00"} <span className="text-sm font-bold text-emerald-600">USDT</span>
              </h2>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">Total processed withdrawals successfully settled</p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main interactive form container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Header Tabs switcher */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setActiveTab("withdraw");
                  setStatus({ success: null, message: "" });
                }}
                className={`flex-1 py-4 text-center font-bold transition-all duration-300 ${
                  activeTab === "withdraw"
                    ? "bg-white text-[#E8A13F] border-b-2 border-[#F4B860]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                Withdraw Funds (USDT)
              </button>
              <button
                onClick={() => {
                  setActiveTab("transfer");
                  setStatus({ success: null, message: "" });
                }}
                className={`flex-1 py-4 text-center font-bold transition-all duration-300 ${
                  activeTab === "transfer"
                    ? "bg-white text-[#E8A13F] border-b-2 border-[#F4B860]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                Peer-to-Peer Wallet Transfer
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === "withdraw" ? (
                  /* WITHDRAWAL FORM FIELDS */
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Amount to Withdraw (USDT)">
                      <input
                        value={withdrawForm.amount}
                        onChange={(e) =>
                          setWithdrawForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10"
                        placeholder="Min 10 USDT"
                        type="number"
                        min="10"
                        step="0.01"
                      />
                    </FormField>

                    <FormField label="Network Protocol">
                      <select
                        value={withdrawForm.network}
                        onChange={(e) =>
                          setWithdrawForm((prev) => ({ ...prev, network: e.target.value }))
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10"
                      >
                        <option value="TRC20">USDT - TRC20 (Recommended)</option>
                        <option value="BEP20">USDT - BEP20 (BSC)</option>
                        <option value="ERC20">USDT - ERC20 (Ethereum)</option>
                      </select>
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField label="Receiver Wallet Address">
                        <input
                          value={withdrawForm.walletAddress}
                          onChange={(e) =>
                            setWithdrawForm((prev) => ({ ...prev, walletAddress: e.target.value }))
                          }
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 font-mono text-sm"
                          placeholder="Paste blockchain wallet address"
                        />
                      </FormField>
                    </div>

                    <div className="sm:col-span-2">
                      <FormField label="Transaction Description / Note (Optional)">
                        <input
                          value={withdrawForm.userNote}
                          onChange={(e) =>
                            setWithdrawForm((prev) => ({ ...prev, userNote: e.target.value }))
                          }
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10"
                          placeholder="Description for your audit logs"
                        />
                      </FormField>
                    </div>

                    {/* Live calculations */}
                    {wAmount > 0 && (
                      <div className="sm:col-span-2 p-4 rounded-xl border border-[#F4B860]/30 bg-[#FFF4E5] text-xs grid grid-cols-3 gap-2 text-slate-700">
                        <div>
                          <p className="text-slate-500 font-medium">Admin processing fee (5%)</p>
                          <p className="text-sm font-bold text-slate-855">${adminCharge.toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Total Locked Debit</p>
                          <p className="text-sm font-bold text-[#E8A13F]">${netDebit.toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Remaining Balance</p>
                          <p className={`text-sm font-bold ${availableBal - netDebit < 20 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            ${(availableBal - netDebit).toFixed(2)} USDT
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* WALLET P2P TRANSFER FORM FIELDS */
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FormField label="Receiver Member ID">
                        <div className="relative">
                          <input
                            value={transferForm.memberId}
                            onChange={(e) =>
                              setTransferForm((prev) => ({ ...prev, memberId: e.target.value }))
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10 uppercase font-semibold"
                            placeholder="e.g. BKS00001"
                          />
                          {validatingReceiver && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E8A13F] text-xs animate-pulse font-bold">
                              Validating...
                            </div>
                          )}
                        </div>
                        {receiverName && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Receiver Account Name: <span className="font-extrabold text-emerald-800 ml-0.5">{receiverName}</span>
                          </div>
                        )}
                        {receiverError && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {receiverError}
                          </div>
                        )}
                      </FormField>
                    </div>

                    <FormField label="Amount to Transfer (USDT)">
                      <input
                        value={transferForm.amount}
                        onChange={(e) =>
                          setTransferForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10"
                        placeholder="Enter amount"
                        type="number"
                        min="1"
                        step="0.01"
                      />
                    </FormField>

                    <FormField label="Transfer Description / Note (Optional)">
                      <input
                        value={transferForm.note}
                        onChange={(e) =>
                          setTransferForm((prev) => ({ ...prev, note: e.target.value }))
                        }
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none focus:border-[#F4B860] focus:ring-2 focus:ring-[#F4B860]/10"
                        placeholder="Note receiver will see"
                      />
                    </FormField>

                    {/* Live calculations */}
                    {Number(transferForm.amount) > 0 && (
                      <div className="sm:col-span-2 p-4 rounded-xl border border-[#F4B860]/30 bg-[#FFF4E5] text-xs grid grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <p className="text-slate-500 font-medium">Internal Transfer Fee</p>
                          <p className="text-sm font-bold text-emerald-700">0.00 USDT (FREE)</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium">Remaining Balance</p>
                          <p className={`text-sm font-bold ${availableBal - Number(transferForm.amount) < 20 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            ${(availableBal - Number(transferForm.amount)).toFixed(2)} USDT
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2FA Status Notice Box */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  twoFactorEnabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}>
                  {twoFactorEnabled ? (
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      2FA Google Authenticator is enabled. A verification code will be requested upon submission.
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      Google Authenticator (2FA) is not enabled. Go to Profile Settings to activate it for maximum account security.
                    </span>
                  )}
                </div>

                {/* Action Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-xl shadow-xs transition-transform active:scale-95 duration-200 mt-2"
                  variant={activeTab === "withdraw" ? "danger" : "default"}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing Transaction...
                    </span>
                  ) : activeTab === "withdraw" ? (
                    "Submit Withdrawal Request"
                  ) : (
                    "Confirm P2P Fund Transfer"
                  )}
                </Button>

                {/* Operation result status banner */}
                {status.message && (
                  <div className={`mt-4 p-4 rounded-xl border text-sm text-center font-bold ${
                    status.success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}>
                    {status.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Guidelines Panel */}
        <div className="space-y-6">
          <Card title="System Guidelines">
            <ul className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-[#E8A13F] font-bold">1.</span>
                <div>
                  <strong className="text-slate-800 block mb-0.5 font-bold">Post-Debit Minimum Balance</strong>
                  Both actions (withdrawals and P2P transfers) require that your available wallet balance remains at least <span className="text-[#E8A13F] font-bold">20 USDT</span> after the debit is completed.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E8A13F] font-bold">2.</span>
                <div>
                  <strong className="text-slate-800 block mb-0.5 font-bold">5% Withdrawal Fee</strong>
                  All withdrawals carry a 5% admin charge. This fee is automatically computed and locked at the time you create the request, and permanently settled once the request is PAID.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E8A13F] font-bold">3.</span>
                <div>
                  <strong className="text-slate-800 block mb-0.5 font-bold">Instant Direct Transfers</strong>
                  Platform peer-to-peer transfers are instant. Ensure the Receiver Member ID is verified against the receiver's real name before confirming to avoid transfer errors.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-[#E8A13F] font-bold">4.</span>
                <div>
                  <strong className="text-slate-800 block mb-0.5 font-bold">Approval Processing Times</strong>
                  Withdrawals are audited manually by our finance team and require blockchain Transaction Hash registration. Processing can take up to 24 hours.
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <TwoFactorOtpModal
        open={showOtpModal}
        title={activeTab === "withdraw" ? "Withdrawal OTP Authorization" : "Transfer OTP Authorization"}
        description="Provide the current Google Authenticator token to verify and authorize this financial operation."
        loading={loading}
        onClose={() => {
          if (!loading) setShowOtpModal(false);
        }}
        onSubmit={handleOtpConfirm}
      />
    </div>
  );
}

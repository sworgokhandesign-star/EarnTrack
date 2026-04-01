import React, { useState } from "react";
import { Sparkles, DollarSign, User, Tag, Calendar, FileText, Loader2 } from "lucide-react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { convertToBDT } from "../services/currencyService";
import { extractIncomeData } from "../services/aiService";
import { Income, IncomeType } from "../types";
import { toast } from "sonner";
import { motion } from "motion/react";

interface IncomeFormProps {
  onSuccess: () => void;
  editingIncome?: Income | null;
}

const CURRENCIES = ["USD", "EUR", "BDT", "GBP", "INR", "CAD", "AUD"];
const TYPES: IncomeType[] = ["Thumbnail", "Ads", "Banner", "Other"];

export default function IncomeForm({ onSuccess, editingIncome }: IncomeFormProps) {
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: editingIncome?.amount || "",
    currency: editingIncome?.currency || "USD",
    client: editingIncome?.client || "",
    type: editingIncome?.type || "Thumbnail",
    date: editingIncome?.date || new Date().toISOString().split("T")[0],
    notes: editingIncome?.notes || "",
  });

  const handleAiExtract = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const data = await extractIncomeData(aiInput);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          amount: data.amount || prev.amount,
          currency: data.currency || prev.currency,
          client: data.client || prev.client,
          type: data.type || prev.type,
        }));
        toast.success("Data extracted successfully!");
      }
    } catch (error) {
      toast.error("AI extraction failed");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const convertedAmount = await convertToBDT(Number(formData.amount), formData.currency);
      
      const incomeData = {
        userId: auth.currentUser.uid,
        amount: Number(formData.amount),
        currency: formData.currency,
        convertedAmount,
        client: formData.client,
        type: formData.type,
        date: formData.date,
        notes: formData.notes,
        createdAt: editingIncome?.createdAt || new Date().toISOString(),
      };

      if (editingIncome) {
        await updateDoc(doc(db, "incomes", editingIncome.id), incomeData);
        toast.success("Income updated!");
      } else {
        await addDoc(collection(db, "incomes"), incomeData);
        toast.success("Income added!");
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save income");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{editingIncome ? "Edit Income" : "Add New Income"}</h2>
        <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>AI Powered</span>
        </div>
      </div>

      {!editingIncome && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <label className="text-sm font-medium text-white/70 ml-1">AI Assistant</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder='Try "I got 150 euros from Luc for thumbnails"'
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
            <button
              onClick={handleAiExtract}
              disabled={isAiLoading}
              className="bg-white text-black font-bold px-8 rounded-2xl hover:bg-white/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Extract
            </button>
          </div>
          <p className="text-[10px] text-white/30 ml-1">Type naturally and let AI fill the form for you.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 ml-1">Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 ml-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-[#0f0f0f]">{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 ml-1">Client Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              required
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="e.g. Luc, YouTube Ads"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 ml-1">Income Type</label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as IncomeType })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#0f0f0f]">{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 ml-1">Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 ml-1">Notes (Optional)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-5 h-5 text-white/30" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all min-h-[58px]"
              placeholder="Any extra details..."
            />
          </div>
        </div>

        <div className="md:col-span-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-3xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-orange-500/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : editingIncome ? "Update Entry" : "Save Income Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}

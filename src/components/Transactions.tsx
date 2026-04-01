import React, { useState } from "react";
import { Trash2, Edit3, ExternalLink, Search, Filter } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Income } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import ConfirmModal from "./ConfirmModal";
import { auth } from "../lib/firebase";

function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface TransactionsProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
}

export default function Transactions({ incomes, onEdit }: TransactionsProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    const path = "incomes";
    try {
      await deleteDoc(doc(db, path, deleteId));
      toast.success("Entry deleted successfully");
    } catch (error) {
      handleFirestoreError(error, "delete", path);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this income entry? This action cannot be undone."
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-white/40 mt-1">Manage and review your income history.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className="bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
          <button className="bg-white/5 border border-white/10 p-2 rounded-xl hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-white/30">Date</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-white/30">Client</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-white/30">Type</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-white/30 text-right">Original</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-white/30 text-right">Converted (BDT)</th>
                <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-white/30 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-white/30">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                        <ExternalLink className="w-8 h-8 opacity-20" />
                      </div>
                      <p>No transactions found. Add your first income to get started!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-medium text-white/80">{format(parseISO(income.date), "MMM dd, yyyy")}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{income.client}</span>
                        {income.notes && <span className="text-[10px] text-white/30 truncate max-w-[150px]">{income.notes}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                        income.type === "Thumbnail" ? "bg-orange-500/10 text-orange-400" :
                        income.type === "Ads" ? "bg-blue-500/10 text-blue-400" :
                        income.type === "Banner" ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-purple-500/10 text-purple-400"
                      )}>
                        {income.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-medium text-white/60">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: income.currency }).format(income.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-bold text-white">{formatCurrency(income.convertedAmount)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => onEdit(income)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(income.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400/50 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

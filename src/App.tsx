import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, getDocFromServer, doc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { Income } from "./types";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import IncomeForm from "./components/IncomeForm";
import Transactions from "./components/Transactions";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIncomes([]);
      return;
    }

    const q = query(
      collection(db, "incomes"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Income[];
      setIncomes(data);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setActiveTab("add");
  };

  const handleFormSuccess = () => {
    setActiveTab("dashboard");
    setEditingIncome(null);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => {
      setActiveTab(tab);
      if (tab !== "add") setEditingIncome(null);
    }}>
      {activeTab === "dashboard" && <Dashboard incomes={incomes} />}
      {activeTab === "transactions" && <Transactions incomes={incomes} onEdit={handleEdit} />}
      {activeTab === "add" && (
        <IncomeForm 
          onSuccess={handleFormSuccess} 
          editingIncome={editingIncome} 
        />
      )}
    </Layout>
  );
}

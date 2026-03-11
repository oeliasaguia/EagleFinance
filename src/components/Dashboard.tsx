import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, CreditCard as CardIcon, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

import { User as FirebaseUser } from 'firebase/auth';

interface DashboardProps {
  user: FirebaseUser;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    cards: 0
  });
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch Transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid)
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactions = snapshot.docs.map(doc => doc.data());
      
      let totalIncome = 0;
      let totalExpenses = 0;
      const categories: Record<string, number> = {};
      const monthly: Record<string, { month: string, income: number, expenses: number }> = {};

      transactions.forEach(t => {
        const amount = t.amount || 0;
        if (t.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
          categories[t.category] = (categories[t.category] || 0) + amount;
        }

        const date = new Date(t.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!monthly[month]) {
          monthly[month] = { month, income: 0, expenses: 0 };
        }
        if (t.type === 'income') monthly[month].income += amount;
        else monthly[month].expenses += amount;
      });

      setSummary(prev => ({
        ...prev,
        balance: totalIncome - totalExpenses,
        income: totalIncome,
        expenses: totalExpenses
      }));

      const COLORS = ['#0F172A', '#F59E0B', '#64748B', '#94A3B8', '#CBD5E1'];
      setExpenseData(Object.entries(categories).map(([name, value], idx) => ({
        name,
        value,
        color: COLORS[idx % COLORS.length]
      })));

      setMonthlyData(Object.values(monthly));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Fetch Card Purchases
    const cardPurchasesQuery = query(
      collection(db, 'cardPurchases'),
      where('uid', '==', user.uid)
    );

    const unsubscribeCardPurchases = onSnapshot(cardPurchasesQuery, (snapshot) => {
      const purchases = snapshot.docs.map(doc => doc.data());
      let totalCardExpenses = 0;
      purchases.forEach(p => {
        totalCardExpenses += p.amount || 0;
      });
      setSummary(prev => ({
        ...prev,
        cards: totalCardExpenses
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cardPurchases');
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCardPurchases();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-brand-dark">Dashboard</h1>
        <p className="text-gray-500">Bem-vindo de volta ao seu controle financeiro.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Saldo Total', value: summary.balance, icon: Wallet, color: 'text-brand-dark' },
          { label: 'Receitas (Total)', value: summary.income, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Despesas (Total)', value: summary.expenses, icon: TrendingDown, color: 'text-rose-600' },
          { label: 'Gastos Cartão', value: summary.cards, icon: CardIcon, color: 'text-brand-gold' },
        ].map((card, idx) => (
          <div key={idx} className="glass-card p-6 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl bg-gray-50", card.color)}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-brand-dark">{formatCurrency(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses by Category */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Despesas por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {expenseData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Evolution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Evolução Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip />
                <Bar dataKey="income" fill="#0F172A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

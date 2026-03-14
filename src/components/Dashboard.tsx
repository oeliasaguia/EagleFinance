import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  MoreHorizontal,
  X,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from './Toast';
import { cn, formatCurrency, parseFirestoreDate } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';
import CategoryIcon from './CategoryIcon';

interface DashboardProps {
  user: FirebaseUser;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  type: 'income' | 'expense';
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { showToast } = useToast();
  
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    monthlyChange: 0
  });

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          date: parseFirestoreDate(d.date)
        };
      }) as Transaction[];

      // Sort in memory to avoid index issues
      data.sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactions(data);

      const income = data.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expenses = data.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      setSummary({
        balance: income - expenses,
        income,
        expenses,
        monthlyChange: 12.5 // Mock change for visual
      });
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(data);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const chartData = [
    { name: 'Seg', value: 400 },
    { name: 'Ter', value: 300 },
    { name: 'Qua', value: 600 },
    { name: 'Qui', value: 800 },
    { name: 'Sex', value: 500 },
    { name: 'Sáb', value: 900 },
    { name: 'Dom', value: 700 },
  ];

  const expenses = transactions.filter(t => t.type === 'expense');
  const expenseByCategory = expenses.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
  
  const pieData = Object.keys(expenseByCategory).map((name, index) => ({
    name,
    value: totalExpenses > 0 ? Math.round((expenseByCategory[name] / totalExpenses) * 100) : 0,
    color: [`#000000`, `#1e293b`, `#475569`, `#94a3b8`, `#cbd5e1`][index % 5]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  if (pieData.length === 0) {
    pieData.push({ name: 'Sem dados', value: 100, color: '#f1f5f9' });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Olá, {user.displayName?.split(' ')[0] || 'Usuário'}</h1>
          <p className="text-slate-500 text-xs font-medium">Aqui está o resumo das suas finanças hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Report button removed from here as it is now in the sidebar menu */}
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="modern-card !bg-black text-white border-none shadow-xl shadow-black/20 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
            </div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Saldo Total</p>
            <h2 className="text-3xl font-bold mt-1 tracking-tight">{formatCurrency(summary.balance)}</h2>
            
            {/* Sparkline Chart inside the card */}
            <div className="h-16 w-full mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ffffff" 
                    fill="#ffffff" 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                summary.monthlyChange >= 0 ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"
              )}>
                {summary.monthlyChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(summary.monthlyChange).toFixed(1)}%
              </div>
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Este mês</span>
            </div>
          </div>
        </div>

        <div className="modern-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <p className="stat-label">Receitas</p>
          <h2 className="stat-value text-emerald-600">{formatCurrency(summary.income)}</h2>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight size={12} />
            <span>+8.2% este mês</span>
          </div>
        </div>

        <div className="modern-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <p className="stat-label">Despesas</p>
          <h2 className="stat-value text-rose-600">{formatCurrency(summary.expenses)}</h2>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-rose-600">
            <ArrowDownRight size={12} />
            <span>-3.1% este mês</span>
          </div>
        </div>

        <div className="modern-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <p className="stat-label">Economia Prevista</p>
          <h2 className="stat-value text-blue-600">{formatCurrency(summary.balance * 1.1)}</h2>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600">
            <TrendingUp size={12} />
            <span>Meta de 15%</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="modern-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transações Recentes</h3>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Últimos registros realizados</p>
          </div>
          <button className="text-accent text-xs font-bold hover:underline">Ver tudo</button>
        </div>
        <div className="space-y-2">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  <CategoryIcon 
                    name={categories.find(c => c.name === t.category)?.icon} 
                    size={14} 
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.description}</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{t.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-xs font-bold",
                  t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                )}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
                <p className="text-[9px] font-medium text-slate-400">
                  {t.date.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">Nenhuma transação encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section - Moved to bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 modern-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Fluxo de Caixa</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Acompanhamento semanal</p>
            </div>
            <select className="text-[10px] font-bold bg-slate-50 border-none rounded-lg p-1.5 focus:ring-0">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#000000" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="modern-card">
          <h3 className="text-base font-bold text-slate-900 mb-1">Gastos por Categoria</h3>
          <p className="text-[10px] text-slate-500 font-medium mb-4 uppercase tracking-wider">Distribuição mensal</p>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-[10px] font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

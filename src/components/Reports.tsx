import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  Loader2,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { formatCurrency, cn, parseFirestoreDate } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';
import { useToast } from './Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  user: FirebaseUser;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { showToast } = useToast();

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
      });
      setTransactions(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const filteredTransactions = transactions.filter(t => {
    if (!startDate && !endDate) return true;
    const date = t.date;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start && end) return date >= start && date <= end;
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  const summary = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount;
    else acc.expenses += t.amount;
    acc.balance = acc.income - acc.expenses;
    return acc;
  }, { income: 0, expenses: 0, balance: 0 });

  const handleGeneratePDF = () => {
    if (filteredTransactions.length === 0) {
      showToast('Nenhuma transação encontrada no período selecionado.', 'error');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('EagleFinance - Relatório Financeiro', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
      doc.text(`Usuário: ${user.displayName || user.email}`, 14, 35);
      
      if (startDate || endDate) {
        const period = `${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}`;
        doc.text(`Período: ${period}`, 14, 40);
      }

      // Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Resumo do Período', 14, 55);
      
      autoTable(doc, {
        startY: 60,
        head: [['Saldo Total', 'Receitas', 'Despesas']],
        body: [[
          formatCurrency(summary.balance),
          formatCurrency(summary.income),
          formatCurrency(summary.expenses)
        ]],
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0] }
      });

      // Transactions
      doc.text('Detalhamento de Transações', 14, (doc as any).lastAutoTable.finalY + 15);
      
      const tableData = filteredTransactions.map(t => [
        t.date.toLocaleDateString('pt-BR'),
        t.description,
        t.category,
        t.type === 'income' ? 'Receita' : 'Despesa',
        formatCurrency(t.amount)
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { fontSize: 8 }
      });

      doc.save(`Relatorio_EagleFinance_${new Date().getTime()}.pdf`);
      showToast('Relatório PDF gerado com sucesso!', 'success');
    } catch (error) {
      console.error('PDF Error:', error);
      showToast('Erro ao gerar relatório PDF.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Relatórios</h1>
          <p className="text-slate-500 mt-1 font-medium">Gere relatórios detalhados de suas finanças.</p>
        </div>
        <button 
          onClick={handleGeneratePDF}
          disabled={isLoading || filteredTransactions.length === 0}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-black/20"
        >
          <Download size={18} />
          Exportar PDF
        </button>
      </div>

      <div className="modern-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
            <Filter size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Filtros de Período</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="stat-label">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                className="input-field pl-12"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="stat-label">Data Final</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                className="input-field pl-12"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="modern-card bg-black text-white border-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Saldo</span>
          </div>
          <h2 className="text-2xl font-bold">{formatCurrency(summary.balance)}</h2>
        </div>
        <div className="modern-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpCircle size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receitas</span>
          </div>
          <h2 className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.income)}</h2>
        </div>
        <div className="modern-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownCircle size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Despesas</span>
          </div>
          <h2 className="text-2xl font-bold text-rose-600">{formatCurrency(summary.expenses)}</h2>
        </div>
      </div>

      <div className="modern-card overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Transações no Período</h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            {filteredTransactions.length} registros
          </span>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{t.date.toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{t.description}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase">{t.category}</p>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-sm font-bold text-right",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    Nenhuma transação encontrada para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, Trash2, Edit2, Loader2, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { FixedExpense } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';

import { User as FirebaseUser } from 'firebase/auth';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface FixedExpensesProps {
  user: FirebaseUser;
}

const FixedExpenses: React.FC<FixedExpensesProps> = ({ user }) => {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    dueDay: '1'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'fixedExpenses'),
      where('uid', '==', user.uid)
    );

    const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FixedExpense[];
      
      setExpenses(data.sort((a, b) => a.dueDay - b.dueDay));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fixedExpenses');
    });

    const catQ = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid),
      where('type', '==', 'expense')
    );

    const unsubscribeCategories = onSnapshot(catQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeCategories();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!formData.category) {
      alert('Por favor, selecione ou insira uma categoria.');
      return;
    }

    try {
      const payload = {
        uid: user.uid,
        name: formData.name,
        amount: amount,
        category: formData.category,
        dueDay: parseInt(formData.dueDay),
        updatedAt: serverTimestamp()
      };

      if (editingExpense?.id) {
        await updateDoc(doc(db, 'fixedExpenses', editingExpense.id), payload);
      } else {
        await addDoc(collection(db, 'fixedExpenses'), {
          ...payload,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      setEditingExpense(null);
      setFormData({
        name: '',
        amount: '',
        category: '',
        dueDay: '1'
      });
    } catch (error) {
      handleFirestoreError(error, editingExpense ? OperationType.UPDATE : OperationType.CREATE, 'fixedExpenses');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'fixedExpenses', id), {
        status: currentStatus === 'paid' ? 'pending' : 'paid'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'fixedExpenses');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa fixa?')) return;
    try {
      await deleteDoc(doc(db, 'fixedExpenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'fixedExpenses');
    }
  };

  const openEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      dueDay: expense.dueDay.toString()
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Despesas Fixas</h1>
          <p className="text-gray-500">Acompanhe seus compromissos recorrentes.</p>
        </div>
        <button 
          onClick={() => {
            setEditingExpense(null);
            setFormData({
              name: '',
              amount: '',
              category: categories[0]?.name || '',
              dueDay: '1'
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Nova Despesa Fixa
        </button>
      </header>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="animate-spin text-brand-gold" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenses.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-400 glass-card">
              Nenhuma despesa fixa cadastrada.
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="glass-card p-6 flex flex-col gap-4 relative group">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-3 rounded-xl",
                    expense.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {expense.status === 'paid' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => openEdit(expense)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-dark"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => expense.id && handleDelete(expense.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-brand-dark">{expense.name}</h3>
                  <p className="text-sm text-gray-500">{expense.category} • Vence dia {expense.dueDay}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xl font-bold text-brand-dark">{formatCurrency(expense.amount)}</span>
                  <button 
                    onClick={() => expense.id && toggleStatus(expense.id, expense.status)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                      expense.status === 'paid' 
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                        : "bg-brand-dark text-white hover:bg-brand-dark/90"
                    )}
                  >
                    {expense.status === 'paid' ? 'Pago' : 'Marcar como Pago'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-dark">
                {editingExpense ? 'Editar' : 'Nova'} Despesa Fixa
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-dark transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Nome da Despesa</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Aluguel, Internet..."
                  className="input-field"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Valor Mensal</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  className="input-field"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Categoria</label>
                {categories.length > 0 ? (
                  <select 
                    className="input-field"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Moradia, Serviços..."
                      className="input-field"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                    <p className="text-xs text-brand-gold">Dica: Cadastre categorias na seção "Categorias" para facilitar.</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Dia do Vencimento</label>
                <input 
                  type="number" 
                  min="1"
                  max="31"
                  required
                  className="input-field"
                  value={formData.dueDay}
                  onChange={e => setFormData({...formData, dueDay: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full btn-gold py-4 font-bold text-lg shadow-xl mt-4">
                {editingExpense ? 'Salvar Alterações' : 'Salvar Despesa Fixa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedExpenses;

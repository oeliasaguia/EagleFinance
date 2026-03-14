import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Loader2, X, Tag } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { formatCurrency, cn } from '../lib/utils';
import { Transaction } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';

import { User as FirebaseUser } from 'firebase/auth';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface TransactionListProps {
  type: 'income' | 'expense';
  user: FirebaseUser;
}

const TransactionList: React.FC<TransactionListProps> = ({ type, user }) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    if (!user) return;

    // Fetch Transactions
    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      where('type', '==', type)
    );

    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Fetch Categories
    const catQ = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid),
      where('type', '==', type)
    );

    const unsubscribeCategories = onSnapshot(catQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
    };
  }, [user, type]);

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
        description: formData.description,
        amount: amount,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        type,
        updatedAt: serverTimestamp()
      };

      if (editingTransaction?.id) {
        await updateDoc(doc(db, 'transactions', editingTransaction.id), payload);
        showToast(`${type === 'income' ? 'Receita' : 'Despesa'} atualizada com sucesso!`);
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast(`${type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso!`);
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, editingTransaction ? OperationType.UPDATE : OperationType.CREATE, 'transactions');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      showToast(`${type === 'income' ? 'Receita' : 'Despesa'} excluída com sucesso!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  };

  const openEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      category: t.category,
      date: new Date(t.date).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const defaultCategories = type === 'income' 
    ? ['Salário', 'Investimentos', 'Presentes', 'Vendas', 'Outros']
    : ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Moradia', 'Assinaturas', 'Outros'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">
            {type === 'income' ? 'Receitas' : 'Despesas'}
          </h1>
          <p className="text-gray-500">Gerencie suas {type === 'income' ? 'entradas' : 'saídas'} financeiras.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTransaction(null);
            setFormData({
              description: '',
              amount: '',
              category: categories[0]?.name || '',
              date: new Date().toISOString().split('T')[0]
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Nova {type === 'income' ? 'Receita' : 'Despesa'}
        </button>
      </header>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou categoria..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="input-field md:w-64"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas as Categorias</option>
          {[...new Set(transactions.map(t => t.category))].sort().map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-brand-gold" size={32} />
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-bottom border-gray-100 bg-gray-50/50">
                    <th className="p-4 font-semibold text-gray-600">Descrição</th>
                    <th className="p-4 font-semibold text-gray-600">Categoria</th>
                    <th className="p-4 font-semibold text-gray-600">Data</th>
                    <th className="p-4 font-semibold text-gray-600">Valor</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400">
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                        <td className="p-4 font-medium text-brand-dark">{t.description}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {t.category}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-sm">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className={cn(
                          "p-4 font-bold",
                          type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => openEdit(t)}
                              className="p-2 text-gray-400 hover:text-brand-dark hover:bg-white rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => t.id && setConfirmDelete({ isOpen: true, id: t.id })}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  Nenhuma transação encontrada.
                </div>
              ) : (
                filteredTransactions.map((t) => (
                  <div key={t.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-brand-dark">{t.description}</h3>
                        <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className={cn(
                        "font-bold",
                        type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {t.category}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEdit(t)}
                          className="p-2 text-gray-400 hover:text-brand-dark"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => t.id && setConfirmDelete({ isOpen: true, id: t.id })}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-dark">
                {editingTransaction ? 'Editar' : 'Nova'} {type === 'income' ? 'Receita' : 'Despesa'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-dark transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Salário, Supermercado..."
                  className="input-field"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Valor</label>
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
                <div className="relative">
                  <input 
                    list="category-suggestions"
                    className="input-field"
                    placeholder="Selecione ou digite uma categoria"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required
                  />
                  <datalist id="category-suggestions">
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.name} />
                      ))
                    ) : (
                      defaultCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))
                    )}
                  </datalist>
                </div>
                {categories.length === 0 && (
                  <p className="text-xs text-brand-gold">
                    Dica: Você pode cadastrar categorias personalizadas na seção "Categorias".
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Data</label>
                <input 
                  type="date" 
                  required
                  className="input-field"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full btn-gold py-4 font-bold text-lg shadow-xl mt-4">
                {editingTransaction ? 'Salvar Alterações' : `Salvar ${type === 'income' ? 'Receita' : 'Despesa'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => confirmDelete.id && handleDelete(confirmDelete.id)}
        title={`Excluir ${type === 'income' ? 'Receita' : 'Despesa'}`}
        message={`Tem certeza que deseja excluir esta ${type === 'income' ? 'receita' : 'despesa'}? Esta ação não poderá ser desfeita.`}
      />
    </div>
  );
};

export default TransactionList;

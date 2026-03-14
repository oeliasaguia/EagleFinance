import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Loader2, X, Calendar, 
  Clock, AlertCircle, CheckCircle2, Search
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';
import CategoryIcon from './CategoryIcon';
import { User as FirebaseUser } from 'firebase/auth';

interface FixedExpense {
  id?: string;
  uid: string;
  description: string;
  amount: number;
  dueDate: number;
  category: string;
  status: 'pending' | 'paid';
}

interface FixedExpensesProps {
  user: FirebaseUser;
}

const FixedExpenses: React.FC<FixedExpensesProps> = ({ user }) => {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    dueDate: '1',
    category: '',
    status: 'pending' as 'pending' | 'paid'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'fixed_expenses'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FixedExpense[];
      setExpenses(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fixed_expenses');
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid),
      where('type', '==', 'expense')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        dueDate: parseInt(formData.dueDate),
        uid: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingExpense) {
        await updateDoc(doc(db, 'fixed_expenses', editingExpense.id!), data);
        showToast('Despesa fixa atualizada!', 'success');
      } else {
        await addDoc(collection(db, 'fixed_expenses'), {
          ...data,
          createdAt: serverTimestamp()
        });
        showToast('Despesa fixa adicionada!', 'success');
      }

      setIsModalOpen(false);
      setFormData({ description: '', amount: '', dueDate: '1', category: '', status: 'pending' });
      setEditingExpense(null);
    } catch (error) {
      handleFirestoreError(error, editingExpense ? OperationType.UPDATE : OperationType.CREATE, 'fixed_expenses');
      showToast('Erro ao salvar despesa fixa.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (expense: FixedExpense) => {
    try {
      const newStatus = expense.status === 'paid' ? 'pending' : 'paid';
      await updateDoc(doc(db, 'fixed_expenses', expense.id!), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showToast(`Status alterado para ${newStatus === 'paid' ? 'pago' : 'pendente'}`, 'success');
    } catch (error) {
      showToast('Erro ao alterar status.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteDoc(doc(db, 'fixed_expenses', expenseToDelete));
      showToast('Despesa fixa excluída!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'fixed_expenses');
      showToast('Erro ao excluir despesa fixa.', 'error');
    } finally {
      setIsConfirmOpen(false);
      setExpenseToDelete(null);
    }
  };

  const openEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      dueDate: expense.dueDate.toString(),
      category: expense.category,
      status: expense.status
    });
    setIsModalOpen(true);
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Despesas Fixas</h1>
          <p className="text-slate-500 mt-1 font-medium">Controle seus compromissos mensais recorrentes.</p>
        </div>
        <button 
          onClick={() => {
            setEditingExpense(null);
            setFormData({ description: '', amount: '', dueDate: '1', category: '', status: 'pending' });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nova Despesa Fixa
        </button>
      </div>

      <div className="modern-card">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por descrição..." 
            className="input-field pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 stat-label">Vencimento</th>
                <th className="pb-4 stat-label">Descrição</th>
                <th className="pb-4 stat-label">Categoria</th>
                <th className="pb-4 stat-label text-right">Valor</th>
                <th className="pb-4 stat-label text-center">Status</th>
                <th className="pb-4 stat-label text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Calendar size={14} className="text-slate-400" />
                      Dia {e.dueDate}
                    </div>
                  </td>
                  <td className="py-5">
                    <span className="text-sm font-bold text-slate-900">{e.description}</span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600"
                      )}>
                        <CategoryIcon 
                          name={categories.find(c => c.name === e.category)?.icon} 
                          size={12} 
                        />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {e.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 text-sm font-bold text-right text-rose-600">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="py-5 text-center">
                    <button 
                      onClick={() => toggleStatus(e)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                        e.status === 'paid' 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-amber-50 text-amber-600"
                      )}
                    >
                      {e.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {e.status === 'paid' ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="py-5 text-right">
                    <div className="flex justify-end gap-2 transition-all">
                      <button 
                        onClick={() => openEdit(e)}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-accent-soft rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setExpenseToDelete(e.id!);
                          setIsConfirmOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <div className="text-center py-20">
              <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-400 font-medium">Nenhuma despesa fixa encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="modern-card w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {editingExpense ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="stat-label">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Aluguel, Internet, Netflix..."
                  className="input-field"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Valor Mensal</label>
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
                  <label className="stat-label">Dia do Vencimento</label>
                  <select 
                    className="input-field"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Dia {day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="stat-label">Categoria</label>
                <select 
                  required
                  className="input-field"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingExpense ? 'Salvar Alterações' : 'Confirmar Despesa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Despesa Fixa"
        message="Tem certeza que deseja excluir esta despesa fixa? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default FixedExpenses;

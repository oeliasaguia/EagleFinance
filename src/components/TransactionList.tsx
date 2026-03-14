import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Loader2, 
  X,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { formatCurrency, cn, parseFirestoreDate } from '../lib/utils';
import ConfirmModal from './ConfirmModal';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';
import CategoryIcon from './CategoryIcon';
import { User as FirebaseUser } from 'firebase/auth';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  type: 'income' | 'expense';
}

interface TransactionListProps {
  type: 'income' | 'expense';
  user: FirebaseUser;
}

const TransactionList: React.FC<TransactionListProps> = ({ type, user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    type: type,
    paymentMethod: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      where('type', '==', type)
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [user.uid, type]);

  useEffect(() => {
    const q = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid),
      where('type', '==', type)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(data);
    });

    return () => unsubscribe();
  }, [user.uid, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        uid: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingTransaction) {
        await updateDoc(doc(db, 'transactions', editingTransaction.id), data);
        showToast('Registro atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...data,
          createdAt: serverTimestamp()
        });
        showToast('Registro adicionado com sucesso!', 'success');
      }

      setIsModalOpen(false);
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        type: type,
        paymentMethod: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingTransaction ? OperationType.UPDATE : OperationType.CREATE, 'transactions');
      showToast('Erro ao salvar registro.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteDoc(doc(db, 'transactions', transactionToDelete));
      showToast('Registro excluído com sucesso!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
      showToast('Erro ao excluir registro.', 'error');
    } finally {
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date.toISOString().split('T')[0],
      type: transaction.type,
      paymentMethod: (transaction as any).paymentMethod || ''
    });
    setIsModalOpen(true);
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === '' || t.category === filterCategory)
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {type === 'income' ? 'Minhas Receitas' : 'Minhas Despesas'}
          </h1>
          <p className="text-slate-500 text-xs font-medium">Gerencie seus registros financeiros com facilidade.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTransaction(null);
            setFormData({
              description: '',
              amount: '',
              category: '',
              date: new Date().toISOString().split('T')[0],
              type: type,
              paymentMethod: ''
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Registro
        </button>
      </div>

      <div className="modern-card">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por descrição..." 
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                className="input-field pl-12 pr-10 appearance-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas Categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-3 stat-label whitespace-nowrap">Data</th>
                <th className="pb-3 stat-label whitespace-nowrap">Descrição</th>
                <th className="pb-3 stat-label whitespace-nowrap">Categoria</th>
                <th className="pb-3 stat-label whitespace-nowrap">Pagamento</th>
                <th className="pb-3 stat-label whitespace-nowrap text-right">Valor</th>
                <th className="pb-3 stat-label whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-3 text-sm text-slate-500 font-medium whitespace-nowrap">
                    {t.date.toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3">
                    <span className="text-sm font-bold text-slate-900">{t.description}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center",
                        t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        <CategoryIcon 
                          name={categories.find(c => c.name === t.category)?.icon} 
                          size={12} 
                        />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {t.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-xs font-medium text-slate-500">{(t as any).paymentMethod || '-'}</span>
                  </td>
                  <td className={cn(
                    "py-3 text-sm font-bold text-right whitespace-nowrap",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2 transition-all">
                      <button 
                        onClick={() => openEdit(t)}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-accent-soft rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setTransactionToDelete(t.id);
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
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  )}>
                    <CategoryIcon 
                      name={categories.find(c => c.name === t.category)?.icon} 
                      size={20} 
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.description}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">{t.date.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {(t as any).paymentMethod || 'Não informado'}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEdit(t)}
                    className="p-2 text-slate-400 hover:text-accent"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setTransactionToDelete(t.id);
                      setIsConfirmOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="modern-card w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTransaction ? 'Editar Registro' : 'Novo Registro'}
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
                  placeholder="Ex: Supermercado, Salário..."
                  className="input-field"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Valor</label>
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
                  <label className="stat-label">Data</label>
                  <input 
                    type="date" 
                    required
                    className="input-field"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
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

              <div className="space-y-2">
                <label className="stat-label">Método de Pagamento</label>
                <select 
                  className="input-field"
                  value={formData.paymentMethod}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                >
                  <option value="">Selecione um método</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Pix">Pix</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Boleto">Boleto</option>
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
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingTransaction ? 'Salvar Alterações' : 'Confirmar Registro')}
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
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default TransactionList;

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Loader2, X, Tag, 
  ShoppingBag, Car, Utensils, Heart, GraduationCap, 
  Home, Smartphone, Coffee, Gift, Briefcase, 
  TrendingUp, TrendingDown, DollarSign, CreditCard
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';
import { User as FirebaseUser } from 'firebase/auth';

const ICON_OPTIONS = [
  { name: 'Tag', icon: Tag },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Car', icon: Car },
  { name: 'Utensils', icon: Utensils },
  { name: 'Heart', icon: Heart },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Home', icon: Home },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Coffee', icon: Coffee },
  { name: 'Gift', icon: Gift },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'TrendingDown', icon: TrendingDown },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'CreditCard', icon: CreditCard },
];

const IconRenderer = ({ name, size = 24, strokeWidth = 2, className = "" }: { name: string, size?: number, strokeWidth?: number, className?: string }) => {
  const IconComponent = ICON_OPTIONS.find(i => i.name === name)?.icon || Tag;
  return <IconComponent size={size} strokeWidth={strokeWidth} className={className} />;
};

interface Category {
  id?: string;
  uid: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

interface CategoriesProps {
  user: FirebaseUser;
}

const Categories: React.FC<CategoriesProps> = ({ user }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);
  const { showToast } = useToast();

  const [newCategory, setNewCategory] = useState<Omit<Category, 'uid'>>({
    name: '',
    type: 'expense',
    icon: 'Tag'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...newCategory,
        uid: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id!), data);
        showToast('Categoria atualizada com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'categories'), {
          ...data,
          createdAt: serverTimestamp()
        });
        showToast('Categoria criada com sucesso!', 'success');
      }

      setIsModalOpen(false);
      setNewCategory({ name: '', type: 'expense', icon: 'Tag' });
      setEditingCategory(null);
    } catch (error) {
      handleFirestoreError(error, editingCategory ? OperationType.UPDATE : OperationType.CREATE, 'categories');
      showToast('Erro ao salvar categoria.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete));
      showToast('Categoria excluída com sucesso!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'categories');
      showToast('Erro ao excluir categoria.', 'error');
    } finally {
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      type: category.type,
      icon: category.icon || 'Tag'
    });
    setIsModalOpen(true);
  };

  const createDefaultCategories = async () => {
    setIsCreatingDefaults(true);
    const defaults: Omit<Category, 'uid'>[] = [
      { name: 'Alimentação', type: 'expense', icon: 'Utensils' },
      { name: 'Transporte', type: 'expense', icon: 'Car' },
      { name: 'Lazer', type: 'expense', icon: 'Coffee' },
      { name: 'Saúde', type: 'expense', icon: 'Heart' },
      { name: 'Educação', type: 'expense', icon: 'GraduationCap' },
      { name: 'Salário', type: 'income', icon: 'DollarSign' },
      { name: 'Investimentos', type: 'income', icon: 'TrendingUp' },
    ];

    try {
      for (const cat of defaults) {
        if (!categories.find(c => c.name === cat.name && c.type === cat.type)) {
          await addDoc(collection(db, 'categories'), {
            ...cat,
            uid: user.uid,
            createdAt: serverTimestamp()
          });
        }
      }
      showToast('Categorias padrão criadas!', 'success');
    } catch (error) {
      showToast('Erro ao criar categorias padrão.', 'error');
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categorias</h1>
          <p className="text-slate-500 mt-1 font-medium">Personalize suas categorias de receitas e despesas.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={createDefaultCategories}
            disabled={isCreatingDefaults}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            {isCreatingDefaults ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Padrão
          </button>
          <button 
            onClick={() => {
              setEditingCategory(null);
              setNewCategory({ name: '', type: 'expense', icon: 'Tag' });
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length === 0 ? (
          <div className="col-span-full py-20 text-center modern-card border-dashed">
            <Tag className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-medium">Nenhuma categoria encontrada.</p>
            <button 
              onClick={createDefaultCategories}
              className="text-accent font-bold mt-2 hover:underline"
            >
              Criar categorias padrão
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="modern-card group">
              <div className="flex justify-between items-start">
                <div className={cn(
                  "p-3 rounded-xl transition-all",
                  cat.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  <IconRenderer name={cat.icon || 'Tag'} size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => openEdit(cat)}
                    className="p-2 text-slate-400 hover:text-accent hover:bg-accent-soft rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setCategoryToDelete(cat.id!);
                      setIsConfirmOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                <p className="stat-label mt-1">{cat.type === 'income' ? 'Receita' : 'Despesa'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="modern-card w-full max-w-lg animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="stat-label">Nome da Categoria</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Alimentação, Salário..."
                  className="input-field"
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="stat-label">Tipo</label>
                <select 
                  className="input-field"
                  value={newCategory.type}
                  onChange={e => setNewCategory({...newCategory, type: e.target.value as 'income' | 'expense'})}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="stat-label">Ícone</label>
                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-2 custom-scrollbar bg-slate-50 rounded-xl">
                  {ICON_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon: option.name })}
                      className={cn(
                        "p-3 flex items-center justify-center rounded-xl transition-all",
                        newCategory.icon === option.name 
                          ? "bg-accent text-white shadow-lg shadow-accent/20" 
                          : "text-slate-400 hover:text-slate-900 hover:bg-white"
                      )}
                    >
                      <option.icon size={20} />
                    </button>
                  ))}
                </div>
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
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingCategory ? 'Salvar Alterações' : 'Criar Categoria')}
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
        title="Excluir Categoria"
        message="Tem certeza que deseja excluir esta categoria? Isso não afetará os registros existentes, mas eles ficarão sem categoria."
      />
    </div>
  );
};

export default Categories;

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, X, Tag } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';
import { User as FirebaseUser } from 'firebase/auth';

interface Category {
  id?: string;
  uid: string;
  name: string;
  type: 'income' | 'expense';
}

interface CategoriesProps {
  user: FirebaseUser;
}

const Categories: React.FC<CategoriesProps> = ({ user }) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense'
  });
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'categories'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newCategory.name.trim()) {
      alert('Por favor, insira um nome para a categoria.');
      return;
    }

    try {
      if (editingCategory?.id) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          name: newCategory.name.trim(),
          type: newCategory.type,
          updatedAt: serverTimestamp()
        });
        showToast('Categoria atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'categories'), {
          uid: user.uid,
          name: newCategory.name.trim(),
          type: newCategory.type,
          createdAt: serverTimestamp()
        });
        showToast('Categoria criada com sucesso!');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setNewCategory({ name: '', type: 'expense' });
    } catch (error) {
      handleFirestoreError(error, editingCategory ? OperationType.UPDATE : OperationType.CREATE, 'categories');
    }
  };

  const createDefaultCategories = async () => {
    if (!user || isCreatingDefaults) return;
    setIsCreatingDefaults(true);

    const defaults: { name: string; type: 'income' | 'expense' }[] = [
      { name: 'Salário', type: 'income' },
      { name: 'Investimentos', type: 'income' },
      { name: 'Presentes', type: 'income' },
      { name: 'Outros (Receita)', type: 'income' },
      { name: 'Alimentação', type: 'expense' },
      { name: 'Transporte', type: 'expense' },
      { name: 'Lazer', type: 'expense' },
      { name: 'Saúde', type: 'expense' },
      { name: 'Educação', type: 'expense' },
      { name: 'Moradia', type: 'expense' },
      { name: 'Assinaturas', type: 'expense' },
      { name: 'Outros (Despesa)', type: 'expense' },
    ];

    try {
      const promises = defaults.map(cat => 
        addDoc(collection(db, 'categories'), {
          uid: user.uid,
          name: cat.name,
          type: cat.type,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
      showToast('Categorias padrão criadas com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      showToast('Categoria excluída com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'categories');
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategory({ name: cat.name, type: cat.type });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Categorias</h1>
          <p className="text-gray-500">Personalize suas categorias de receitas e despesas.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setNewCategory({ name: '', type: 'expense' });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </header>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="animate-spin text-brand-gold" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full p-12 text-center glass-card flex flex-col items-center gap-6">
              <div className="p-4 bg-gray-50 rounded-full text-gray-400">
                <Tag size={48} />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-brand-dark">Nenhuma categoria cadastrada</p>
                <p className="text-gray-500">Comece criando suas próprias categorias ou use as sugestões padrão.</p>
              </div>
              <button 
                onClick={createDefaultCategories}
                disabled={isCreatingDefaults}
                className="btn-gold px-8 flex items-center gap-2 disabled:opacity-50"
              >
                {isCreatingDefaults ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                Criar Categorias Padrão
              </button>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="glass-card p-6 flex flex-col gap-4 relative group">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${cat.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Tag size={24} />
                  </div>
                  <div className="flex gap-2 transition-all">
                    <button 
                      onClick={() => openEdit(cat)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-dark"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => cat.id && setConfirmDelete({ isOpen: true, id: cat.id })}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-brand-dark">{cat.name}</h3>
                  <p className="text-sm text-gray-500">
                    {cat.type === 'income' ? 'Receita' : 'Despesa'}
                  </p>
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
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-brand-dark transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Nome da Categoria</label>
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
                <label className="text-sm font-bold text-gray-600">Tipo</label>
                <select 
                  className="input-field"
                  value={newCategory.type}
                  onChange={e => setNewCategory({...newCategory, type: e.target.value as 'income' | 'expense'})}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <button type="submit" className="w-full btn-gold py-4 font-bold text-lg shadow-xl mt-4">
                {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => confirmDelete.id && handleDelete(confirmDelete.id)}
        title="Excluir Categoria"
        message="Tem certeza que deseja excluir esta categoria? Esta ação não poderá ser desfeita."
      />
    </div>
  );
};

export default Categories;

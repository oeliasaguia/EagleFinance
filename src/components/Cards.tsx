import React, { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, Trash2, Edit2, Loader2, X, 
  Wallet, Landmark, Smartphone, Banknote, Globe
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';
import { User as FirebaseUser } from 'firebase/auth';

const CARD_ICONS = [
  { name: 'Wallet', icon: Wallet },
  { name: 'Landmark', icon: Landmark },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Banknote', icon: Banknote },
  { name: 'Globe', icon: Globe },
  { name: 'CreditCard', icon: CreditCard },
];

const IconRenderer = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => {
  const IconComponent = CARD_ICONS.find(i => i.name === name)?.icon || CreditCard;
  return <IconComponent size={size} className={className} />;
};

interface Card {
  id?: string;
  uid: string;
  name: string;
  bank: string;
  limit: number;
  currentBalance: number;
  color: string;
  icon?: string;
}

interface CardsProps {
  user: FirebaseUser;
}

const Cards: React.FC<CardsProps> = ({ user }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  const [newCard, setNewCard] = useState<Omit<Card, 'uid'>>({
    name: '',
    bank: '',
    limit: 0,
    currentBalance: 0,
    color: '#6366f1',
    icon: 'CreditCard'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'cards'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Card[];
      setCards(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cards');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...newCard,
        limit: parseFloat(newCard.limit.toString()),
        currentBalance: parseFloat(newCard.currentBalance.toString()),
        uid: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingCard) {
        await updateDoc(doc(db, 'cards', editingCard.id!), data);
        showToast('Cartão atualizado com sucesso!', 'success');
      } else {
        await addDoc(collection(db, 'cards'), {
          ...data,
          createdAt: serverTimestamp()
        });
        showToast('Cartão adicionado com sucesso!', 'success');
      }

      setIsModalOpen(false);
      setNewCard({ name: '', bank: '', limit: 0, currentBalance: 0, color: '#6366f1', icon: 'CreditCard' });
      setEditingCard(null);
    } catch (error) {
      handleFirestoreError(error, editingCard ? OperationType.UPDATE : OperationType.CREATE, 'cards');
      showToast('Erro ao salvar cartão.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!cardToDelete) return;

    try {
      await deleteDoc(doc(db, 'cards', cardToDelete));
      showToast('Cartão excluído com sucesso!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cards');
      showToast('Erro ao excluir cartão.', 'error');
    } finally {
      setIsConfirmOpen(false);
      setCardToDelete(null);
    }
  };

  const openEdit = (card: Card) => {
    setEditingCard(card);
    setNewCard({
      name: card.name,
      bank: card.bank,
      limit: card.limit,
      currentBalance: card.currentBalance,
      color: card.color,
      icon: card.icon || 'CreditCard'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Cartões</h1>
          <p className="text-slate-500 mt-1 font-medium">Gerencie seus cartões de crédito e contas bancárias.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCard(null);
            setNewCard({ name: '', bank: '', limit: 0, currentBalance: 0, color: '#6366f1', icon: 'CreditCard' });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.length === 0 ? (
          <div className="col-span-full py-20 text-center modern-card border-dashed">
            <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-medium">Nenhum cartão cadastrado.</p>
          </div>
        ) : (
          cards.map((card) => (
            <div 
              key={card.id} 
              className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl transition-all hover:-translate-y-2 group"
              style={{ 
                background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`,
                boxShadow: `0 20px 40px -15px ${card.color}66`
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <IconRenderer name={card.icon || 'CreditCard'} size={28} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => openEdit(card)}
                      className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setCardToDelete(card.id!);
                        setIsConfirmOpen(true);
                      }}
                      className="p-2 bg-white/20 backdrop-blur-md hover:bg-rose-500/40 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-auto">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{card.bank}</p>
                  <h3 className="text-xl font-bold mb-6">{card.name}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Saldo Atual</p>
                      <p className="text-2xl font-bold">{formatCurrency(card.currentBalance)}</p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Limite</p>
                        <p className="text-sm font-bold">{formatCurrency(card.limit)}</p>
                      </div>
                      <div className="w-12 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                        <div className="w-6 h-4 bg-white/30 rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>
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
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Nome do Cartão</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Nubank, Inter..."
                    className="input-field"
                    value={newCard.name}
                    onChange={e => setNewCard({...newCard, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="stat-label">Banco</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Itaú, Bradesco..."
                    className="input-field"
                    value={newCard.bank}
                    onChange={e => setNewCard({...newCard, bank: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Limite</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0,00"
                    className="input-field"
                    value={newCard.limit}
                    onChange={e => setNewCard({...newCard, limit: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="stat-label">Saldo Atual</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0,00"
                    className="input-field"
                    value={newCard.currentBalance}
                    onChange={e => setNewCard({...newCard, currentBalance: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="stat-label">Cor do Cartão</label>
                  <input 
                    type="color" 
                    className="w-full h-12 rounded-xl cursor-pointer bg-transparent border-none"
                    value={newCard.color}
                    onChange={e => setNewCard({...newCard, color: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="stat-label">Ícone</label>
                  <div className="flex gap-2 p-2 bg-slate-50 rounded-xl overflow-x-auto custom-scrollbar">
                    {CARD_ICONS.map((option) => (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setNewCard({ ...newCard, icon: option.name })}
                        className={cn(
                          "p-2 flex-shrink-0 rounded-lg transition-all",
                          newCard.icon === option.name 
                            ? "bg-accent text-white shadow-lg" 
                            : "text-slate-400 hover:text-slate-900 hover:bg-white"
                        )}
                      >
                        <option.icon size={18} />
                      </button>
                    ))}
                  </div>
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
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingCard ? 'Salvar Alterações' : 'Criar Cartão')}
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
        title="Excluir Cartão"
        message="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default Cards;

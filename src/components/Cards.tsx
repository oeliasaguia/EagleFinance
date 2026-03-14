import React, { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, Trash2, Edit2, Loader2, X, 
  Wallet, Landmark, Smartphone, Banknote, Globe, Search
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
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const [newCard, setNewCard] = useState({
    name: '',
    bank: '',
    limit: '',
    currentBalance: '',
    color: '#000000',
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
      const limitNum = parseFloat(newCard.limit.toString()) || 0;
      const balanceNum = parseFloat(newCard.currentBalance.toString()) || 0;

      const data = {
        name: newCard.name,
        bank: newCard.bank,
        limit: limitNum,
        currentBalance: balanceNum,
        color: newCard.color,
        icon: newCard.icon,
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
      setNewCard({ name: '', bank: '', limit: '', currentBalance: '', color: '#000000', icon: 'CreditCard' });
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
      limit: card.limit.toString(),
      currentBalance: card.currentBalance.toString(),
      color: card.color,
      icon: card.icon || 'CreditCard'
    });
    setIsModalOpen(true);
  };

  const filteredCards = cards.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meus Cartões</h1>
          <p className="text-slate-500 text-xs font-medium">Gerencie seus cartões de crédito e contas bancárias.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCard(null);
            setNewCard({ name: '', bank: '', limit: '', currentBalance: '', color: '#000000', icon: 'CreditCard' });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus size={18} />
          Novo Cartão
        </button>
      </div>

      <div className="modern-card">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou banco..." 
            className="input-field pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.length === 0 ? (
            <div className="col-span-full py-10 text-center">
              <CreditCard className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-400 text-sm font-medium">Nenhum cartão encontrado.</p>
            </div>
          ) : (
            filteredCards.map((card) => (
              <div 
                key={card.id} 
                className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3 group transition-all hover:border-accent/20"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${card.color}15`, color: card.color }}
                    >
                      <IconRenderer name={card.icon || 'CreditCard'} size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{card.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{card.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(card.currentBalance)}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Saldo Atual</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite</p>
                    <p className="text-xs font-bold text-slate-600">{formatCurrency(card.limit)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEdit(card)}
                      className="p-2 text-slate-400 hover:text-accent transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setCardToDelete(card.id!);
                        setIsConfirmOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
                    step="0.01"
                    required
                    placeholder="0,00"
                    className="input-field"
                    value={newCard.limit}
                    onChange={e => setNewCard({...newCard, limit: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="stat-label">Saldo Atual</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0,00"
                    className="input-field"
                    value={newCard.currentBalance}
                    onChange={e => setNewCard({...newCard, currentBalance: e.target.value})}
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

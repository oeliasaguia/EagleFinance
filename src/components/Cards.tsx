import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as CardIcon, Edit2, Loader2, X, Trash2, ShoppingBag } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { formatCurrency, cn } from '../lib/utils';
import { CreditCard, CardPurchase } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-errors';
import { useToast } from './Toast';

import { User as FirebaseUser } from 'firebase/auth';

interface CardsProps {
  user: FirebaseUser;
}

const Cards: React.FC<CardsProps> = ({ user }) => {
  const { showToast } = useToast();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [purchases, setPurchases] = useState<CardPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Mastercard',
    limit: '',
    closingDay: '1',
    dueDay: '1'
  });
  const [purchaseData, setPurchaseData] = useState({
    description: '',
    amount: '',
    category: 'Outros',
    date: new Date().toISOString().split('T')[0]
  });
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    if (!user) return;

    // Fetch Cards
    const q = query(
      collection(db, 'cards'),
      where('uid', '==', user.uid)
    );

    const unsubscribeCards = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CreditCard[];
      
      setCards(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error fetching cards:', err);
      setError('Erro ao carregar cartões. Verifique suas permissões.');
      setLoading(false);
    });

    // Fetch Purchases
    const pq = query(
      collection(db, 'cardPurchases'),
      where('uid', '==', user.uid)
    );

    const unsubscribePurchases = onSnapshot(pq, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CardPurchase[];
      setPurchases(data);
    }, (err) => {
      console.error('Error fetching purchases:', err);
    });

    return () => {
      unsubscribeCards();
      unsubscribePurchases();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const limit = parseFloat(formData.limit);
    if (isNaN(limit) || limit <= 0) {
      alert('Por favor, insira um limite válido maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        uid: user.uid,
        name: formData.name,
        brand: formData.brand,
        limit: limit,
        closingDay: parseInt(formData.closingDay),
        dueDay: parseInt(formData.dueDay),
        updatedAt: serverTimestamp()
      };

      if (editingCard?.id) {
        await updateDoc(doc(db, 'cards', editingCard.id), payload);
        showToast('Cartão atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'cards'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast('Cartão cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      setEditingCard(null);
      setFormData({
        name: '',
        brand: 'Mastercard',
        limit: '',
        closingDay: '1',
        dueDay: '1'
      });
    } catch (error) {
      handleFirestoreError(error, editingCard ? OperationType.UPDATE : OperationType.CREATE, 'cards');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCardId) return;

    const amount = parseFloat(purchaseData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'cardPurchases'), {
        uid: user.uid,
        cardId: selectedCardId,
        description: purchaseData.description,
        amount: amount,
        category: purchaseData.category,
        date: new Date(purchaseData.date).toISOString(),
        createdAt: serverTimestamp()
      });

      showToast('Compra registrada com sucesso!');
      setIsPurchaseModalOpen(false);
      setPurchaseData({
        description: '',
        amount: '',
        category: 'Outros',
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedCardId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cardPurchases');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      // Delete the card
      await deleteDoc(doc(db, 'cards', id));
      
      // Delete all purchases associated with this card
      const cardPurchasesRefs = purchases.filter(p => p.cardId === id);
      const deletePromises = cardPurchasesRefs.map(p => 
        p.id ? deleteDoc(doc(db, 'cardPurchases', p.id)) : Promise.resolve()
      );
      await Promise.all(deletePromises);
      
      showToast('Cartão excluído com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cards');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (card: CreditCard) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      brand: card.brand,
      limit: card.limit.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString()
    });
    setIsModalOpen(true);
  };

  const calculateUsedLimit = (cardId: string) => {
    return purchases
      .filter(p => p.cardId === cardId)
      .reduce((acc, p) => acc + p.amount, 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Meus Cartões</h1>
          <p className="text-gray-500">Gerencie seus limites e faturas.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCard(null);
            setFormData({
              name: '',
              brand: 'Mastercard',
              limit: '',
              closingDay: '1',
              dueDay: '1'
            });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Novo Cartão
        </button>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in fade-in">
          <X className="shrink-0" size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="animate-spin text-brand-gold" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-400 glass-card">
              Nenhum cartão cadastrado.
            </div>
          ) : (
            cards.map((card) => {
              const usedLimit = calculateUsedLimit(card.id!);
              const percentage = Math.min((usedLimit / card.limit) * 100, 100);

              return (
                <div key={card.id} className="flex flex-col gap-6">
                  {/* Card Visual */}
                  <div className="relative h-56 w-full rounded-3xl bg-gradient-to-br from-brand-dark to-slate-800 p-8 text-white shadow-xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-brand-gold/20 transition-all duration-700" />
                    
                    <div className="relative h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center">
                            <CardIcon size={20} className="text-brand-gold" />
                          </div>
                          <span className="font-bold text-lg">{card.name}</span>
                        </div>
                        <div className="flex gap-2 transition-all">
                          <button 
                            onClick={() => openEdit(card)}
                            className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => card.id && setConfirmDelete({ isOpen: true, id: card.id })}
                            className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Limite Disponível</p>
                        <p className="text-2xl font-bold tracking-tight">{formatCurrency(card.limit - usedLimit)}</p>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="text-sm">
                          <p className="text-gray-400 text-xs uppercase">Vencimento</p>
                          <p className="font-medium">Dia {card.dueDay}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-brand-gold font-bold italic">{card.brand}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-brand-dark">Resumo da Fatura</h4>
                      <button 
                        onClick={() => {
                          setSelectedCardId(card.id!);
                          setIsPurchaseModalOpen(true);
                        }}
                        className="text-sm text-brand-gold font-bold hover:underline flex items-center gap-1"
                      >
                        <ShoppingBag size={14} />
                        Nova Compra
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Limite Utilizado</span>
                        <span className="font-bold text-brand-dark">{formatCurrency(usedLimit)} / {formatCurrency(card.limit)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            percentage > 90 ? "bg-rose-500" : percentage > 70 ? "bg-amber-500" : "bg-brand-gold"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-xs text-gray-500 uppercase mb-1">Fechamento</p>
                        <p className="font-bold text-brand-dark">Dia {card.closingDay}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-xs text-gray-500 uppercase mb-1">Vencimento</p>
                        <p className="font-bold text-brand-dark">Dia {card.dueDay}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-dark">
                {editingCard ? 'Editar' : 'Novo'} Cartão
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-dark transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Nome do Cartão</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Nubank, Inter..."
                  className="input-field"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Bandeira</label>
                <select 
                  className="input-field"
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                >
                  <option value="Mastercard">Mastercard</option>
                  <option value="Visa">Visa</option>
                  <option value="Elo">Elo</option>
                  <option value="American Express">American Express</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Limite Total</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  className="input-field"
                  value={formData.limit}
                  onChange={e => setFormData({...formData, limit: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Dia Fechamento</label>
                  <input 
                    type="number" 
                    min="1"
                    max="31"
                    required
                    className="input-field"
                    value={formData.closingDay}
                    onChange={e => setFormData({...formData, closingDay: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Dia Vencimento</label>
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
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-gold py-4 font-bold text-lg shadow-xl mt-4 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                {editingCard ? 'Salvar Alterações' : 'Salvar Cartão'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-dark">Nova Compra no Cartão</h2>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-gray-400 hover:text-brand-dark transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddPurchase} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Supermercado, Amazon..."
                  className="input-field"
                  value={purchaseData.description}
                  onChange={e => setPurchaseData({...purchaseData, description: e.target.value})}
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
                  value={purchaseData.amount}
                  onChange={e => setPurchaseData({...purchaseData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Categoria</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Lazer, Alimentação..."
                  className="input-field"
                  value={purchaseData.category}
                  onChange={e => setPurchaseData({...purchaseData, category: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Data</label>
                <input 
                  type="date" 
                  required
                  className="input-field"
                  value={purchaseData.date}
                  onChange={e => setPurchaseData({...purchaseData, date: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-gold py-4 font-bold text-lg shadow-xl mt-4 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                Salvar Compra
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => confirmDelete.id && handleDelete(confirmDelete.id)}
        title="Excluir Cartão"
        message="Tem certeza que deseja excluir este cartão? Todas as compras associadas a ele também serão afetadas."
      />
    </div>
  );
};

export default Cards;

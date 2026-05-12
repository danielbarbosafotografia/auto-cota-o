import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Addon } from '../../types';
import { Loader2, Plus, Trash2, Edit2, Package } from 'lucide-react';

const AdminAdicionais = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Addon>>({
    name: '',
    price: 0,
    description: '',
    active: true
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('addons').select('*').order('name');
    if (data) setAddons(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from('addons').update(formData).eq('id', editingId);
      } else {
        await supabase.from('addons').insert(formData);
      }
      setEditingId(null);
      setFormData({ name: '', price: 0, description: '', active: true });
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Isso irá desativar os serviços atuais e cadastrar apenas os 6 serviços padrão. Deseja continuar?')) return;
    
    setSaving(true);
    try {
      // Desativa todos os atuais
      await supabase.from('addons').update({ active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

      const defaultAddons = [
        { name: 'Alagamento', price: 15.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: 'Guincho de 1000 km', price: 19.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: 'Terceiros até R$ 300.000,00', price: 19.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: '100% vidros/farol/retrovisor/lanterna nacional', price: 19.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: 'Indenização 100% FIPE (veículos com leilão ou sinistro)', price: 39.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: 'Cobertura 100% para todos os vidros, retrovisores, faróis e lanternas (somente nacionais)', price: 19.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: 'Carro assistencial 7 dias', price: 9.90, description: 'Proteção adicional para seu veículo.', active: true },
        { name: 'Carro assistencial 15 dias', price: 15.90, description: 'Proteção adicional para seu veículo.', active: true }
      ];

      for (const addon of defaultAddons) {
        const { data: existing } = await supabase.from('addons').select('id').eq('name', addon.name).maybeSingle();
        if (existing) {
          await supabase.from('addons').update(addon).eq('id', existing.id);
        } else {
          await supabase.from('addons').insert(addon);
        }
      }
      
      fetchData();
      alert('Lista de serviços resetada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao resetar lista.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight italic">
            Serviços <span className="text-primary">Adicionais</span>
          </h1>
          <p className="text-gray-500 font-medium">Gerencie os opcionais oferecidos nas cotações.</p>
        </div>
        <button 
          onClick={handleResetToDefault}
          disabled={saving}
          className="btn-secondary text-sm flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          Resetar para Lista Padrão
        </button>
      </header>

      <div className="card bg-gray-50 border-dashed border-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">Nome do Adicional</label>
            <input 
              type="text" 
              className="input-field bg-white" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="label">Preço (R$)</label>
            <input 
              type="number" 
              className="input-field bg-white" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: Number(e.target.value)})}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
              {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map(addon => (
          <div key={addon.id} className="card flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-primary">
                  <Package size={20} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(addon.id); setFormData(addon); }} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={16} /></button>
                  <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-bold text-secondary text-lg">{addon.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{addon.description || 'Sem descrição'}</p>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-2xl font-black text-primary">R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className={addon.active ? "text-green-500 text-xs font-bold uppercase" : "text-gray-400 text-xs font-bold uppercase"}>
                {addon.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAdicionais;

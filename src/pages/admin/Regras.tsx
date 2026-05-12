import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { PricingRule, VehicleCategory } from '../../types';
import { Save, Loader2, Plus, Trash2, Edit2 } from 'lucide-react';

const AdminRegras = () => {
  const [rules, setRules] = useState<(PricingRule & { category?: VehicleCategory })[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PricingRule>>({
    category_id: '',
    fipe_limit: 0,
    fixed_price: 0,
    percentage_above_limit: 0,
    participation_fixed: 0,
    participation_percentage_above_limit: 0,
    participation_limit: 0,
    tracker_required: false
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('vehicle_categories').select('*');
    const { data: ruleData } = await supabase.from('pricing_rules').select('*, category:vehicle_categories(*)');
    
    if (catData) setCategories(catData);
    if (ruleData) setRules(ruleData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (rule: PricingRule) => {
    setEditingId(rule.id);
    setFormData(rule);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('pricing_rules')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_rules')
          .insert(formData);
        if (error) throw error;
      }
      
      setEditingId(null);
      setFormData({
        category_id: '',
        fipe_limit: 0,
        fixed_price: 0,
        percentage_above_limit: 0,
        participation_fixed: 0,
        participation_percentage_above_limit: 0,
        participation_limit: 0,
        tracker_required: false
      });
      fetchData();
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Erro ao salvar regra.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-black text-secondary uppercase tracking-tight italic">
          Regras de <span className="text-primary">Cálculo</span>
        </h1>
        <p className="text-gray-500 font-medium">Configure os parâmetros do motor de cotação.</p>
      </header>

      {/* Editor Card */}
      <div className="card border-primary/20 bg-primary/5">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
          {editingId ? 'Editar Regra' : 'Nova Regra'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="label">Categoria</label>
            <select 
              className="input-field"
              value={formData.category_id}
              onChange={e => setFormData({...formData, category_id: e.target.value})}
            >
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Limite FIPE (R$)</label>
            <input 
              type="number" 
              className="input-field" 
              value={formData.fipe_limit}
              onChange={e => setFormData({...formData, fipe_limit: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="label">Valor Fixo (Até Limite)</label>
            <input 
              type="number" 
              className="input-field" 
              value={formData.fixed_price}
              onChange={e => setFormData({...formData, fixed_price: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="label">% Acima do Limite (ex: 0.0023)</label>
            <input 
              type="number" 
              step="0.0001"
              className="input-field" 
              value={formData.percentage_above_limit}
              onChange={e => setFormData({...formData, percentage_above_limit: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="label">Participação Fixa</label>
            <input 
              type="number" 
              className="input-field" 
              value={formData.participation_fixed}
              onChange={e => setFormData({...formData, participation_fixed: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="label">Participação % (ex: 0.07)</label>
            <input 
              type="number" 
              step="0.01"
              className="input-field" 
              value={formData.participation_percentage_above_limit}
              onChange={e => setFormData({...formData, participation_percentage_above_limit: Number(e.target.value)})}
            />
          </div>

          <div className="flex items-end pb-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-primary" 
                checked={formData.tracker_required}
                onChange={e => setFormData({...formData, tracker_required: e.target.checked})}
              />
              <span className="font-bold text-secondary text-sm">Rastreador Obrigatório</span>
            </label>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Salvar Regra
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Limite FIPE</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Valor Fixo</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">% Acima</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Participação</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-secondary uppercase text-xs bg-gray-100 px-2 py-1 rounded">{rule.category?.name}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">R$ {Number(rule.fipe_limit).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 font-black text-secondary">R$ {Number(rule.fixed_price).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-gray-500">{(rule.percentage_above_limit * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 font-medium text-gray-500">R$ {Number(rule.participation_fixed).toLocaleString('pt-BR')} / {(rule.participation_percentage_above_limit * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(rule)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRegras;

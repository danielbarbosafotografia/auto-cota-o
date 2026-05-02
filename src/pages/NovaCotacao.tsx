import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';
import { 
  User, 
  Car, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Send,
  Download,
  Save,
  Loader2
} from 'lucide-react';
import type { PricingRule, Addon, VehicleCategory } from '../types';
import { clsx } from 'clsx';

const NovaCotacao = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [client, setClient] = useState({ name: '', whatsapp: '' });
  const [vehicle, setVehicle] = useState({
    plate: '',
    brand: '',
    model: '',
    year: '',
    fipeCode: '',
    fipeValue: '',
    category: ''
  });
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);

  // Metadata State
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const [modelStatus, setModelStatus] = useState<'active' | 'consult' | 'restricted' | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const checkVehicleStatus = async (modelName: string) => {
    if (modelName.length < 3) return;
    const { data } = await supabase
      .from('vehicle_models')
      .select('status')
      .ilike('name', `%${modelName}%`)
      .limit(1);
    
    if (data && data.length > 0) {
      setModelStatus(data[0].status);
    } else {
      setModelStatus('active');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (vehicle.model) checkVehicleStatus(vehicle.model);
    }, 500);
    return () => clearTimeout(timer);
  }, [vehicle.model]);

  const fetchMetadata = async () => {
    const [catRes, ruleRes, addonRes] = await Promise.all([
      supabase.from('vehicle_categories').select('*'),
      supabase.from('pricing_rules').select('*').eq('active', true),
      supabase.from('addons').select('*').eq('active', true)
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (ruleRes.data) setRules(ruleRes.data);
    if (addonRes.data) setAddons(addonRes.data);
  };

  const handleNextStep = () => {
    if (step === 2) {
      performCalculation();
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const performCalculation = () => {
    const selectedCategory = categories.find(c => c.id === vehicle.category);
    const rule = rules.find(r => r.category_id === vehicle.category);
    
    if (rule && selectedCategory) {
      const calc = calculateQuote(
        Number(vehicle.fipeValue),
        rule,
        selectedAddons,
        selectedCategory.name
      );
      setResult(calc);
    }
  };

  const toggleAddon = (addon: Addon) => {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const saveQuote = async () => {
    if (!result) return;
    setSaving(true);
    
    try {
      const slug = Math.random().toString(36).substring(2, 10);
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          seller_id: profile?.id,
          client_name: client.name,
          client_whatsapp: client.whatsapp,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          fipe_code: vehicle.fipeCode,
          fipe_value: Number(vehicle.fipeValue),
          category_id: vehicle.category,
          category_name: result.categoryName,
          base_monthly_value: result.baseMonthlyValue,
          addons_total: result.addonsTotal,
          final_monthly_value: result.finalMonthlyValue,
          participation_value: result.participationValue,
          inspection_fee: 150, // Example fixed fee
          public_slug: slug,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      // Save quote addons
      if (selectedAddons.length > 0) {
        const quoteAddons = selectedAddons.map(a => ({
          quote_id: quote.id,
          addon_id: a.id,
          name: a.name,
          price: a.price
        }));
        await supabase.from('quote_addons').insert(quoteAddons);
      }

      navigate(`/p/${slug}`);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Erro ao salvar cotação.');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = (slug?: string) => {
    if (!result) return;
    const finalSlug = slug || 'TODO';
    const message = `Olá, recebi minha cotação da Auto Excelência e quero seguir com a associação.\n\nVeículo: ${vehicle.brand} ${vehicle.model}\nMensalidade: R$ ${result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nLink da cotação: ${window.location.origin}/p/${finalSlug}`;
    window.open(`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center">
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
              step === i ? "bg-primary text-white" : step > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {step > i ? <Check size={20} /> : i}
            </div>
            {i < 4 && <div className={clsx("w-8 h-1 mx-2 rounded", step > i ? "bg-green-500" : "bg-gray-200")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Dados do Cliente</h2>
              <p className="text-sm text-gray-500">Identifique para quem é esta cotação.</p>
            </div>
          </div>
          
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nome do cliente"
                  value={client.name}
                  onChange={e => setClient({...client, name: e.target.value})}
                />
              </div>
              <div>
                <label className="label">WhatsApp</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="(00) 00000-0000"
                  value={client.whatsapp}
                  onChange={e => setClient({...client, whatsapp: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
              <Car size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Dados do Veículo</h2>
              <p className="text-sm text-gray-500">Insira as informações técnicas para o cálculo.</p>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Placa (Opcional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="AAA-0000"
                  value={vehicle.plate}
                  onChange={e => setVehicle({...vehicle, plate: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select 
                  className="input-field"
                  value={vehicle.category}
                  onChange={e => setVehicle({...vehicle, category: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Marca</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Honda"
                  value={vehicle.brand}
                  onChange={e => setVehicle({...vehicle, brand: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Modelo</label>
                <input 
                  type="text" 
                  className={clsx(
                    "input-field",
                    modelStatus === 'restricted' && "border-red-500",
                    modelStatus === 'consult' && "border-orange-500"
                  )} 
                  placeholder="Ex: Civic"
                  value={vehicle.model}
                  onChange={e => setVehicle({...vehicle, model: e.target.value})}
                />
                {modelStatus === 'restricted' && (
                  <p className="text-xs text-red-500 mt-1 font-bold">Este veículo não é atendido no momento.</p>
                )}
                {modelStatus === 'consult' && (
                  <p className="text-xs text-orange-500 mt-1 font-bold">Este veículo precisa de análise. Consulte o administrador.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ano</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: 2022"
                  value={vehicle.year}
                  onChange={e => setVehicle({...vehicle, year: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Valor FIPE (R$)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0,00"
                  value={vehicle.fipeValue}
                  onChange={e => setVehicle({...vehicle, fipeValue: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Serviços Adicionais</h2>
              <p className="text-sm text-gray-500">Escolha o que incluir na proteção.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {addons.map((addon) => {
              const isSelected = selectedAddons.find(a => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className={clsx(
                    "card p-4 flex items-center justify-between text-left transition-all",
                    isSelected ? "border-primary bg-red-50/50" : "hover:border-gray-300"
                  )}
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{addon.name}</h4>
                    <p className="text-xs text-gray-500">{addon.description || 'Proteção adicional para seu veículo.'}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <p className="font-bold text-secondary">R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <div className={clsx(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary border-primary text-white" : "border-gray-200"
                    )}>
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold">Cotação Finalizada!</h2>
            <p className="text-gray-500">Confira os valores antes de enviar.</p>
          </div>

          <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
            <div className="p-6 bg-secondary text-white">
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Mensal</p>
              <h3 className="text-4xl font-black">R$ {result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Veículo</span>
                <span className="font-bold text-secondary text-right">{vehicle.brand} {vehicle.model} ({vehicle.year})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Valor FIPE</span>
                <span className="font-bold text-secondary">R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Categoria</span>
                <span className="bg-red-50 text-primary text-xs font-black px-2 py-1 rounded uppercase">{result.categoryName}</span>
              </div>
            </div>

            <div className="p-6 space-y-3 bg-gray-50/50">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Resumo Financeiro</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor Base</span>
                <span className="font-medium">R$ {result.baseMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Adicionais</span>
                <span className="font-medium">R$ {result.addonsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-bold">Participação Evento</span>
                <span className="font-bold text-primary">R$ {result.participationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-bold">Adesão/Vistoria</span>
                <span className="font-bold">R$ 150,00</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={saveQuote} 
              disabled={saving}
              className="btn-primary flex items-center justify-center gap-2 py-4"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Salvar Cotação
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleWhatsApp()} className="btn-secondary flex items-center justify-center gap-2 bg-green-50 border-green-200 text-green-700">
                <Send size={18} />
                WhatsApp
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2">
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="fixed bottom-24 left-0 right-0 px-6 md:static md:px-0 md:mt-10 flex justify-between pointer-events-none">
        {step > 1 && step < 4 && (
          <button 
            onClick={handlePrevStep}
            className="btn-secondary bg-white shadow-xl flex items-center gap-2 pointer-events-auto"
          >
            <ChevronLeft size={20} />
            Voltar
          </button>
        )}
        {step < 4 && (
          <button 
            onClick={handleNextStep}
            disabled={
              (step === 1 && (!client.name || !client.whatsapp)) ||
              (step === 2 && (!vehicle.brand || !vehicle.model || !vehicle.fipeValue || !vehicle.category || modelStatus === 'restricted'))
            }
            className={clsx(
              "btn-primary shadow-xl flex items-center gap-2 ml-auto pointer-events-auto",
              ((step === 1 && (!client.name || !client.whatsapp)) || (step === 2 && (!vehicle.brand || !vehicle.model || !vehicle.fipeValue || !vehicle.category || modelStatus === 'restricted'))) && "opacity-50 cursor-not-allowed"
            )}
          >
            Próximo
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NovaCotacao;

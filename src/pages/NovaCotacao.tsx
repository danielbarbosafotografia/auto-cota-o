import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';
import { fetchBrands, fetchModels, fetchYears, fetchFipeValue, type VehicleType, type FipeBrand, type FipeModel, type FipeYear } from '../lib/fipeApi';
import { inferCategory } from '../lib/categoryMapper';
import { 
  ChevronLeft,
  Check,
  Send,
  Save,
  Loader2,
  Copy,
  ArrowLeft,
  Printer
} from 'lucide-react';
import type { PricingRule, Addon, VehicleCategory } from '../types';
import { clsx } from 'clsx';

const NovaCotacao = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // FIPE State
  const [fipeType, setFipeType] = useState<VehicleType>('carros');
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [selectedModelCode, setSelectedModelCode] = useState('');
  const [selectedYearCode, setSelectedYearCode] = useState('');
  const [fipeLoading, setFipeLoading] = useState(false);

  const [modelStatus, setModelStatus] = useState<'active' | 'consult' | 'restricted' | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('consultor_nome');
    if (!savedName) {
      navigate('/dashboard');
      return;
    }
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

  // Load Brands when type changes
  useEffect(() => {
    fetchBrands(fipeType).then(setFipeBrands).catch(console.error);
    setSelectedBrandCode('');
    setFipeModels([]);
    setSelectedModelCode('');
    setFipeYears([]);
    setSelectedYearCode('');
  }, [fipeType]);

  // Load Models when brand changes
  useEffect(() => {
    if (!selectedBrandCode) return;
    fetchModels(fipeType, selectedBrandCode).then(setFipeModels).catch(console.error);
    setSelectedModelCode('');
    setFipeYears([]);
    setSelectedYearCode('');
  }, [selectedBrandCode, fipeType]);

  // Load Years when model changes
  useEffect(() => {
    if (!selectedModelCode) return;
    fetchYears(fipeType, selectedBrandCode, selectedModelCode).then(setFipeYears).catch(console.error);
    setSelectedYearCode('');
  }, [selectedModelCode, selectedBrandCode, fipeType]);

  // Load FIPE value when year changes
  useEffect(() => {
    if (!selectedYearCode) return;
    setFipeLoading(true);
    fetchFipeValue(fipeType, selectedBrandCode, selectedModelCode, selectedYearCode)
      .then((data) => {
        const numericValue = data.Valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
        const { categoryName, status } = inferCategory(data.Marca, data.Modelo, fipeType);
        setModelStatus(status);
        const matchedCategory = categories.find(c => c.name.toUpperCase() === categoryName);

        setVehicle({
          plate: vehicle.plate,
          brand: data.Marca,
          model: data.Modelo,
          year: data.AnoModelo.toString(),
          fipeCode: data.CodigoFipe,
          fipeValue: numericValue,
          category: matchedCategory ? matchedCategory.id : ''
        });
      })
      .catch(console.error)
      .finally(() => setFipeLoading(false));
  }, [selectedYearCode, fipeType, selectedBrandCode, selectedModelCode, categories]);

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
          consultant_name: localStorage.getItem('consultor_nome'),
          consultant_city: localStorage.getItem('consultor_cidade'),
          base_monthly_value: result.fipeComponentValue,
          addons_total: result.boletoValue + result.trackerValue + result.optionalAddonsValue + result.glassValue,
          final_monthly_value: result.finalMonthlyValue,
          participation_value: result.participationValue,
          inspection_fee: 200,
          public_slug: slug,
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      if (selectedAddons.length > 0) {
        const quoteAddons = selectedAddons.map(a => ({
          quote_id: quote.id,
          addon_id: a.id,
          name: a.name,
          price: a.price
        }));
        await supabase.from('quote_addons').insert(quoteAddons);
      }

      setSavedSlug(slug);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Erro ao salvar cotação.');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = (slug?: string) => {
    if (!result) return;
    const finalSlug = slug || savedSlug;
    const message = `Olá! Aqui está a sua cotação da Auto Excelência.

*🚗 VEÍCULO:* ${vehicle.brand} ${vehicle.model}
*💰 MENSALIDADE:* R$ ${result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Confira todos os benefícios e detalhes no link abaixo:
${window.location.origin}/p/${finalSlug}`;

    window.open(`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyLink = () => {
    if (!savedSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/p/${savedSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (savedSlug) {
      window.open(`/p/${savedSlug}`, '_blank');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10 font-sans text-gray-900 antialiased">
      <div className="flex items-center justify-between py-6 mb-8 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">Nova Cotação</h1>
          <p className="text-xs text-gray-400 mt-0.5">{localStorage.getItem('consultor_nome')} • {localStorage.getItem('consultor_cidade')}/SC</p>
        </div>
        <img src="/logo.png" alt="Auto Excelência" className="h-6 w-auto grayscale brightness-0 opacity-20" />
      </div>

      {/* Stepper Minimalista */}
      <div className="flex items-center gap-2 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={clsx(
            "h-1 rounded-full transition-all duration-500",
            step === i ? "flex-[3] bg-primary" : step > i ? "flex-1 bg-green-500" : "flex-1 bg-gray-100"
          )} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome do cliente</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-1 focus:ring-gray-200 transition-all text-sm font-medium" placeholder="Nome completo" value={client.name} onChange={e => setClient({...client, name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">WhatsApp</label>
              <input type="tel" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-1 focus:ring-gray-200 transition-all text-sm font-medium" placeholder="(00) 00000-0000" value={client.whatsapp} onChange={e => setClient({...client, whatsapp: e.target.value})} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex gap-6">
            {(['carros', 'motos', 'caminhoes'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-widest text-gray-400">
                <input type="radio" name="fipeType" value={type} checked={fipeType === type} onChange={() => setFipeType(type)} className="text-primary focus:ring-0" />
                <span className={clsx(fipeType === type && "text-primary")}>{type.replace('oes', 'ão')}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Marca</label>
              <select className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-1 focus:ring-gray-200 text-sm font-medium" value={selectedBrandCode} onChange={e => setSelectedBrandCode(e.target.value)}>
                <option value="">Selecione...</option>
                {fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Modelo</label>
              <select className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-1 focus:ring-gray-200 text-sm font-medium" value={selectedModelCode} onChange={e => setSelectedModelCode(e.target.value)} disabled={!selectedBrandCode}>
                <option value="">Selecione...</option>
                {fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ano</label>
              <select className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-1 focus:ring-gray-200 text-sm font-medium" value={selectedYearCode} onChange={e => setSelectedYearCode(e.target.value)} disabled={!selectedModelCode}>
                <option value="">Selecione...</option>
                {fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Placa</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-1 focus:ring-gray-200 text-sm font-medium uppercase" placeholder="AAA-0000" value={vehicle.plate} onChange={e => setVehicle({...vehicle, plate: e.target.value.toUpperCase()})} />
            </div>
          </div>

          {fipeLoading && <div className="flex justify-center text-primary"><Loader2 className="animate-spin" size={20} /></div>}

          {vehicle.fipeValue && !fipeLoading && (
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor FIPE</p>
                <p className="text-xl font-black">R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoria</p>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">{categories.find(c => c.id === vehicle.category)?.name || '...'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Obrigatórios</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600">Taxa Administrativa</span>
                <span className="text-sm font-black">R$ 13,50</span>
              </div>
              {rules.find(r => r.category_id === vehicle.category)?.tracker_required && (
                <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-600">Rastreador Monitorado</span>
                  <span className="text-sm font-black">R$ 50,00</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Opcionais</h3>
            <div className="grid grid-cols-1 gap-2">
              {addons.map((addon) => {
                const rule = rules.find(r => r.category_id === vehicle.category);
                const n = addon.name.toLowerCase().trim();
                if (n === 'boleto' || n === 'taxa administrativa' || n.includes('boleto')) return null;
                const isTracker = n === 'rastreador';
                if (isTracker && rule?.tracker_required) return null;

                const isSelected = selectedAddons.find(a => a.id === addon.id);
                return (
                  <button key={addon.id} onClick={() => toggleAddon(addon)} className={clsx("p-4 rounded-xl flex items-center justify-between text-left transition-all border", isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-gray-100 hover:border-gray-200")}>
                    <span className="text-sm font-bold text-gray-700">{addon.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-secondary">R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center", isSelected ? "bg-primary border-primary text-white" : "border-gray-100")}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-12 animate-in fade-in duration-500">
          <section className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resumo da Cotação</p>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">{vehicle.brand} {vehicle.model}</h2>
              <p className="text-xs text-gray-500 mt-1">FIPE: R$ {result.fipeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {result.categoryName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mensalidade</p>
              <p className="text-5xl font-black text-secondary">R$ {result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </section>

          {/* Benefícios (Sistema Minimalista) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Benefícios Inclusos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span>•</span> Sem perfil de motorista</li>
                <li className="flex gap-2"><span>•</span> Cobertura nacional</li>
                <li className="flex gap-2"><span>•</span> Roubo, Furto e Incêndio</li>
                <li className="flex gap-2"><span>•</span> Colisão e Granizo</li>
                <li className="flex gap-2"><span>•</span> 100% FIPE (Roubo/Perda Total)</li>
                <li className="flex gap-2"><span>•</span> Terceiros até R$ 200.000,00</li>
                <li className="flex gap-2"><span>•</span> {result.glassPercentage}% Proteção de vidros</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Assistência & Guincho</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span>•</span> Guincho até 500 km</li>
                <li className="flex gap-2"><span>•</span> Pane elétrica / mecânica</li>
                <li className="flex gap-2"><span>•</span> Falta de combustível / Pneu</li>
                <li className="flex gap-2"><span>•</span> Carga de bateria / Chaveiro</li>
                <li className="flex gap-2"><span>•</span> Táxi / Uber em eventos</li>
                <li className="flex gap-2"><span>•</span> Auxílio Funeral</li>
              </ul>
            </div>
          </section>

          {/* Financeiro */}
          <section className="bg-gray-50 rounded-xl p-8 space-y-4 border border-gray-100">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Base Calculada</span>
                <span>R$ {result.fipeComponentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Taxa Administrativa</span>
                <span>R$ 13,50</span>
              </div>
              {result.trackerValue > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Rastreador</span>
                  <span>R$ 50,00</span>
                </div>
              )}
              {result.optionalAddonsValue > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Opcionais Adicionais</span>
                  <span>R$ {result.optionalAddonsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Mensal</p>
                <p className="text-3xl font-black text-secondary">R$ {result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Participação</p>
                <p className="text-lg font-bold text-gray-800">R$ {result.participationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </section>

          {/* Ações */}
          <div className="flex flex-col gap-3 pt-4">
            {!savedSlug ? (
              <button onClick={saveQuote} disabled={saving} className="bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest flex justify-center gap-2 shadow-sm">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar Proposta Oficial
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleWhatsApp()} className="bg-green-500 text-white py-4 rounded-xl font-black uppercase tracking-widest flex justify-center gap-2 shadow-sm">
                    <Send size={18} /> WhatsApp
                  </button>
                  <button onClick={handleCopyLink} className="bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest flex justify-center gap-2 shadow-sm">
                    <Copy size={18} /> {copied ? 'Copiado' : 'Link'}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handlePrint()} className="flex-1 bg-gray-50 text-gray-500 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                    <Printer size={14} className="inline mr-1" /> Imprimir
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                    <ArrowLeft size={14} className="inline mr-1" /> Painel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navegação Inferior Steps 1-3 */}
      {step < 4 && (
        <div className="mt-12 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={handlePrevStep} className="text-gray-300 font-bold text-[10px] uppercase tracking-widest hover:text-gray-500 transition-colors">
              <ChevronLeft size={16} className="inline" /> Voltar
            </button>
          ) : <div />}
          <button 
            onClick={handleNextStep} 
            disabled={(step === 1 && (!client.name || !client.whatsapp)) || (step === 2 && (!vehicle.brand || !vehicle.model || !vehicle.category || modelStatus === 'restricted'))} 
            className="bg-primary text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-sm disabled:opacity-20"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
};

export default NovaCotacao;

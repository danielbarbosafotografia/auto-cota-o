import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';
import { fetchBrands, fetchModels, fetchYears, fetchFipeValue, type VehicleType, type FipeBrand, type FipeModel, type FipeYear } from '../lib/fipeApi';
import { inferCategory } from '../lib/categoryMapper';
import { 
  User, 
  Car, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Send,
  Save,
  Loader2,
  Copy,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Info,
  MapPin,
  FileText,
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
    <div className="max-w-3xl mx-auto pb-10">
      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 mb-8 flex flex-col items-center text-center">
        <p className="text-sm font-semibold text-gray-800">Bem-vindo ao sistema oficial da Auto Excelência.</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <MapPin size={14} className="text-primary" />
          <span>{localStorage.getItem('consultor_nome') || 'Consultor'} — {localStorage.getItem('consultor_cidade') || 'Cidade'}/SC</span>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-10 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300",
              step === i ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : step > i ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
            )}>
              {step > i ? <Check size={24} /> : i}
            </div>
            {i < 4 && <div className={clsx("flex-1 h-1 mx-4 rounded-full transition-colors duration-500", step > i ? "bg-green-500" : "bg-gray-100")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Dados do Cliente</h2>
              <p className="text-gray-500">Identifique para quem é esta cotação.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Nome completo</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 font-medium" 
                  placeholder="Ex: João Silva"
                  value={client.name}
                  onChange={e => setClient({...client, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">WhatsApp</label>
                <input 
                  type="tel" 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 font-medium" 
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
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
              <Car size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Dados do Veículo</h2>
              <p className="text-gray-500">Selecione o veículo para preenchimento automático.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div className="flex gap-6 mb-4">
              {(['carros', 'motos', 'caminhoes'] as const).map(type => (
                <label key={type} className="flex items-center gap-3 cursor-pointer capitalize group">
                  <input type="radio" name="fipeType" className="w-5 h-5 text-primary focus:ring-primary border-gray-300" value={type} checked={fipeType === type} onChange={() => setFipeType(type)} /> 
                  <span className={clsx("font-bold text-sm transition-colors", fipeType === type ? "text-primary" : "text-gray-400 group-hover:text-gray-600")}>
                    {type.replace('oes', 'ão')}
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Marca</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 font-medium" value={selectedBrandCode} onChange={e => setSelectedBrandCode(e.target.value)}>
                  <option value="">Selecione...</option>
                  {fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Modelo</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 font-medium" value={selectedModelCode} onChange={e => setSelectedModelCode(e.target.value)} disabled={!selectedBrandCode}>
                  <option value="">Selecione...</option>
                  {fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Ano</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 font-medium" value={selectedYearCode} onChange={e => setSelectedYearCode(e.target.value)} disabled={!selectedModelCode}>
                  <option value="">Selecione...</option>
                  {fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Placa (Opcional)</label>
                <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 font-medium uppercase" placeholder="AAA-0000" value={vehicle.plate} onChange={e => setVehicle({...vehicle, plate: e.target.value.toUpperCase()})} />
              </div>
            </div>

            {fipeLoading && (
              <div className="flex items-center gap-3 text-primary text-sm font-black justify-center py-6 bg-primary/5 rounded-2xl">
                <Loader2 className="animate-spin" size={20} /> CONSULTANDO TABELA FIPE...
              </div>
            )}

            {vehicle.fipeValue && !fipeLoading && (
              <div className="mt-8 p-6 bg-[#f8fafc] rounded-3xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-white bg-green-500 px-3 py-1.5 rounded-full uppercase tracking-[0.15em]">✓ FIPE Validada</span>
                  <span className="text-xs font-bold text-gray-400">Ref: {vehicle.fipeCode}</span>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor de Mercado</p>
                    <p className="font-black text-2xl text-secondary">R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Categoria</p>
                    <p className="font-black text-xl text-primary">{categories.find(c => c.id === vehicle.category)?.name || 'Desconhecida'}</p>
                  </div>
                </div>
                {modelStatus === 'restricted' && <div className="bg-red-500 text-white p-4 rounded-2xl text-sm font-black mt-6 flex items-center gap-3"><Info size={20} /> ATENÇÃO: VEÍCULO NÃO ACEITO</div>}
                {modelStatus === 'consult' && <div className="bg-orange-500 text-white p-4 rounded-2xl text-sm font-black mt-6 flex items-center gap-3"><Info size={20} /> REQUER CONSULTA PRÉVIA</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
              <Plus size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Serviços Adicionais</h2>
              <p className="text-gray-500">Escolha o que incluir na proteção.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                <ShieldCheck size={16} /> Itens Obrigatórios / Fixos
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {rules.find(r => r.category_id === vehicle.category)?.tracker_required && (
                  <div className="bg-white p-6 rounded-3xl flex items-center justify-between border-2 border-primary/10 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800">Rastreador</h4>
                        <p className="text-xs text-gray-500">Obrigatório para segurança do seu veículo.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl text-secondary">R$ 50,00</p>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Incluso</span>
                    </div>
                  </div>
                )}
                <div className="bg-white p-6 rounded-3xl flex items-center justify-between border-2 border-primary/10 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800">Taxa Administrativa</h4>
                      <p className="text-xs text-gray-500">Emissão, processamento e suporte.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-secondary">R$ 13,50</p>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Obrigatória</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Serviços Opcionais Disponíveis</h3>
              <div className="grid grid-cols-1 gap-4">
                {addons.map((addon) => {
                  const rule = rules.find(r => r.category_id === vehicle.category);
                  const n = addon.name.toLowerCase().trim();
                  if (n === 'boleto' || n === 'taxa administrativa' || n.includes('boleto')) return null;
                  const isTracker = n === 'rastreador';
                  if (isTracker && rule?.tracker_required) return null;

                  const isSelected = selectedAddons.find(a => a.id === addon.id);
                  return (
                    <button key={addon.id} onClick={() => toggleAddon(addon)} className={clsx("group bg-white p-6 rounded-3xl flex items-center justify-between text-left transition-all duration-300 border-2", isSelected ? "border-primary bg-red-50/10 shadow-lg shadow-primary/5" : "border-transparent hover:border-gray-200 hover:shadow-sm")}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", isSelected ? "bg-primary text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100")}>
                          <Plus size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-800">{addon.name}</h4>
                          <p className="text-xs text-gray-500">{addon.description || 'Proteção extra para você.'}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <p className="font-black text-xl text-secondary">R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className={clsx("w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary text-white scale-110" : "border-gray-100 group-hover:border-gray-200")}>
                          {isSelected && <Check size={18} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-2xl mx-auto">
          {/* 1. DADOS DO VEÍCULO */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-b border-gray-50 pb-4">1. Dados do Veículo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Modelo</p>
                <strong className="text-gray-800 text-lg leading-tight block">{vehicle.brand} {vehicle.model}</strong>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Placa</p>
                <strong className="text-gray-800 text-lg block">{vehicle.plate || '---'}</strong>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Valor FIPE</p>
                <strong className="text-gray-800 text-lg block">R$ {result.fipeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </section>

          {/* 2. VALOR DA MENSALIDADE (DESTAQUE PRINCIPAL) */}
          <section className="bg-secondary rounded-[2.5rem] p-12 text-center text-white shadow-2xl shadow-secondary/30 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.4em] mb-4">Total da Mensalidade</p>
              <h2 className="text-7xl font-black mb-4">
                <span className="text-3xl font-medium mr-2">R$</span>
                {result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center justify-center gap-2 text-primary text-sm font-bold bg-white/5 py-2 px-4 rounded-full w-fit mx-auto">
                <ShieldCheck size={16} /> Proteção Ativa 24h
              </div>
            </div>
            {/* Glossy effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full -ml-24 -mb-24"></div>
          </section>

          {/* 3. COMO CHEGAMOS NESSE VALOR */}
          <section className="bg-gray-50 rounded-[2rem] p-8 border border-gray-200/50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 text-center">3. Resumo do Cálculo</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Base FIPE × {result.fipePercentage > 0 ? (result.fipePercentage * 100).toFixed(2) + '%' : 'Valor Fixo'}</span>
                <span className="font-bold text-gray-800">R$ {result.fipeComponentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Taxa Administrativa</span>
                <span className="font-bold text-gray-800">R$ 13,50</span>
              </div>
              {result.trackerValue > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Rastreador Monitorado</span>
                  <span className="font-bold text-gray-800">R$ {result.trackerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              )}
              {result.optionalAddonsValue > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Serviços Adicionais</span>
                  <span className="font-bold text-gray-800">R$ {result.optionalAddonsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 mt-4 flex justify-between items-center">
                <span className="font-black text-gray-900 uppercase tracking-widest text-xs">Total Mensal</span>
                <span className="font-black text-2xl text-secondary">R$ {result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </section>

          {/* 4. COBERTURA DO PLANO */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <ShieldCheck size={18} /> 4. Cobertura do Plano
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Roubo e furto',
                'Colisão',
                'Granizo',
                'Incêndio',
                'Indenização até 100% FIPE',
                'Terceiros até R$ 200.000',
                `${result.glassPercentage}% para vidros`,
                'Proteção para carros rebaixados'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-50">
                  <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center"><Check size={12} strokeWidth={4} /></div>
                  <span className="text-sm font-semibold text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. ASSISTÊNCIA 24H */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Zap size={18} /> 5. Assistência 24h
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Guincho até 500km',
                'Pane elétrica/mecânica',
                'Pneu / combustível',
                'Chaveiro',
                'Táxi / Uber',
                'Hospedagem',
                'Auxílio funeral'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-blue-50/30 rounded-2xl border border-blue-50">
                  <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center"><Check size={12} strokeWidth={4} /></div>
                  <span className="text-sm font-semibold text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 6. ITENS INCLUSOS NO PLANO */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">6. Incluso no Plano</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-700">Taxa Administrativa</span>
                <span className="text-sm font-black text-secondary">R$ 13,50</span>
              </div>
              {result.trackerValue > 0 && (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                  <span className="text-sm font-bold text-gray-700">Rastreador Monitorado</span>
                  <span className="text-sm font-black text-secondary">R$ 50,00</span>
                </div>
              )}
            </div>
          </section>

          {/* 7. OPCIONAIS SELECIONADOS */}
          {result.optionalAddonsValue > 0 && (
            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-6">7. Opcionais Contratados</h3>
              <div className="grid grid-cols-1 gap-3">
                {selectedAddons.filter(a => {
                  const n = a.name.toLowerCase().trim();
                  return n !== 'boleto' && n !== 'rastreador' && n !== 'taxa administrativa' && !n.includes('boleto');
                }).map(a => (
                  <div key={a.id} className="flex justify-between items-center p-4 bg-orange-50/20 rounded-2xl border border-orange-100/50">
                    <span className="text-sm font-bold text-gray-700">+ {a.name}</span>
                    <span className="text-sm font-black text-orange-600">R$ {Number(a.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 8. CONSULTOR RESPONSÁVEL */}
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center text-primary font-black text-2xl">
              {(localStorage.getItem('consultor_nome') || 'C')[0]}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultor Responsável</p>
              <h4 className="text-lg font-black text-gray-800">{localStorage.getItem('consultor_nome')}</h4>
              <p className="text-xs text-gray-500">{localStorage.getItem('consultor_cidade')}/SC</p>
            </div>
          </section>

          {/* 9. BOTÕES DE AÇÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
            {!savedSlug ? (
              <button onClick={saveQuote} disabled={saving} className="btn-primary py-5 rounded-[1.5rem] flex items-center justify-center gap-3 text-lg col-span-full shadow-xl shadow-primary/20">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />} 
                <span className="font-black uppercase tracking-widest">Gerar Proposta Oficial</span>
              </button>
            ) : (
              <>
                <button onClick={() => handleWhatsApp()} className="bg-green-500 hover:bg-green-600 text-white py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 transition-all">
                  <Send size={24} /> <span className="font-black uppercase tracking-widest">WhatsApp</span>
                </button>
                <button onClick={handleCopyLink} className="btn-primary py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all">
                  <Copy size={24} /> <span className="font-black uppercase tracking-widest">{copied ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
                <button onClick={() => handlePrint()} className="bg-white border-2 border-gray-100 text-gray-600 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                  <Printer size={20} /> <span className="font-bold uppercase tracking-widest text-xs">Imprimir</span>
                </button>
                <button onClick={() => navigate('/dashboard')} className="bg-white border-2 border-gray-100 text-gray-400 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                  <ArrowLeft size={20} /> <span className="font-bold uppercase tracking-widest text-xs">Painel</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-12 flex justify-between items-center px-4">
          {step > 1 ? (
            <button onClick={handlePrevStep} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 transition-colors">
              <ChevronLeft size={24} /> Voltar
            </button>
          ) : <div />}
          <button 
            onClick={handleNextStep} 
            disabled={(step === 1 && (!client.name || !client.whatsapp)) || (step === 2 && (!vehicle.brand || !vehicle.model || !vehicle.category || modelStatus === 'restricted'))} 
            className="bg-primary text-white px-10 py-5 rounded-3xl font-black uppercase tracking-[0.15em] flex items-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
          >
            Próximo <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NovaCotacao;

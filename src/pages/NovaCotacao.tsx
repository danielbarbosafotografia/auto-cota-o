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
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Send,
  Save,
  Loader2,
  Copy,
  ArrowLeft,
  ShieldCheck
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

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6 flex flex-col items-center text-center">
        <p className="text-sm font-medium text-gray-700">Bem-vindo ao sistema oficial da Auto Excelência.</p>
        <p className="text-sm text-gray-600 mt-1">Você está acessando como <strong className="text-primary">{localStorage.getItem('consultor_nome') || 'Consultor'}</strong> — <strong className="text-primary">{localStorage.getItem('consultor_cidade') || 'Cidade'}/SC</strong>.</p>
        <p className="text-sm text-gray-600 mt-1">Comece gerando uma nova cotação.</p>
      </div>

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
          
          <div className="card p-6">
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
              <h2 className="text-xl font-bold">Dados do Veículo (Tabela FIPE)</h2>
              <p className="text-sm text-gray-500">Selecione o veículo para preenchimento automático.</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex gap-4 mb-4">
              {(['carros', 'motos', 'caminhoes'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input type="radio" name="fipeType" value={type} checked={fipeType === type} onChange={() => setFipeType(type)} /> {type.replace('oes', 'ão')}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Marca</label>
                <select className="input-field" value={selectedBrandCode} onChange={e => setSelectedBrandCode(e.target.value)}>
                  <option value="">Selecione...</option>
                  {fipeBrands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Modelo</label>
                <select className="input-field" value={selectedModelCode} onChange={e => setSelectedModelCode(e.target.value)} disabled={!selectedBrandCode}>
                  <option value="">Selecione...</option>
                  {fipeModels.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ano</label>
                <select className="input-field" value={selectedYearCode} onChange={e => setSelectedYearCode(e.target.value)} disabled={!selectedModelCode}>
                  <option value="">Selecione...</option>
                  {fipeYears.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Placa (Opcional)</label>
                <input type="text" className="input-field uppercase" placeholder="AAA-0000" value={vehicle.plate} onChange={e => setVehicle({...vehicle, plate: e.target.value.toUpperCase()})} />
              </div>
            </div>

            {fipeLoading && (
              <div className="flex items-center gap-2 text-primary text-sm font-semibold justify-center py-4">
                <Loader2 className="animate-spin" size={16} /> Consultando FIPE...
              </div>
            )}

            {vehicle.fipeValue && !fipeLoading && (
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded uppercase tracking-wider">✓ FIPE Validada</span>
                  <span className="text-xs text-gray-500">Cód: {vehicle.fipeCode}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Valor FIPE</p>
                    <p className="font-bold text-lg text-secondary">R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Categoria Automática</p>
                    <p className="font-bold text-primary">{categories.find(c => c.id === vehicle.category)?.name || 'Desconhecida'}</p>
                  </div>
                </div>
                {modelStatus === 'restricted' && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-bold mt-4">⚠️ Este veículo NÃO É ACEITO.</div>}
                {modelStatus === 'consult' && <div className="bg-orange-100 text-orange-700 p-3 rounded-lg text-sm font-bold mt-4">⚠️ Este veículo requer CONSULTA PRÉVIA.</div>}
              </div>
            )}
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

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} /> Itens Obrigatórios / Fixos
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {rules.find(r => r.category_id === vehicle.category)?.tracker_required && (
                  <div className="card p-4 flex items-center justify-between border-primary bg-red-50/30">
                    <div>
                      <h4 className="font-bold text-gray-800">Rastreador</h4>
                      <p className="text-xs text-gray-500">Obrigatório para esta categoria.</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary">R$ 50,00</p>
                      <span className="text-[10px] font-bold text-primary uppercase">Incluso</span>
                    </div>
                  </div>
                )}
                <div className="card p-4 flex items-center justify-between border-primary bg-red-50/30">
                  <div>
                    <h4 className="font-bold text-gray-800">Taxa Administrativa</h4>
                    <p className="text-xs text-gray-500">Emissão e processamento.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-secondary">R$ 13,50</p>
                    <span className="text-[10px] font-bold text-primary uppercase">Obrigatória</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Serviços Opcionais</h3>
              <div className="grid grid-cols-1 gap-3">
                {addons.map((addon) => {
                  const rule = rules.find(r => r.category_id === vehicle.category);
                  const isTracker = addon.name.toLowerCase().trim() === 'rastreador';
                  if (isTracker && rule?.tracker_required) return null;
                  const n = addon.name.toLowerCase().trim();
                  if (n === 'boleto' || n === 'taxa administrativa' || n.includes('boleto')) return null;

                  const isSelected = selectedAddons.find(a => a.id === addon.id);
                  return (
                    <button key={addon.id} onClick={() => toggleAddon(addon)} className={clsx("card p-4 flex items-center justify-between text-left transition-all", isSelected ? "border-primary bg-red-50/50" : "hover:border-gray-300")}>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{addon.name}</h4>
                        <p className="text-xs text-gray-500">{addon.description || 'Proteção adicional.'}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-bold text-secondary">R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className={clsx("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", isSelected ? "bg-primary border-primary text-white" : "border-gray-200")}>
                          {isSelected && <Check size={14} />}
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
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold">Cotação Finalizada!</h2>
            <p className="text-gray-500 text-sm">Confira os detalhes da proteção abaixo.</p>
          </div>

          <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
            <div className="p-6 space-y-4 text-center border-b border-gray-100">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-left">
                <div><span className="text-gray-500 block text-xs">Modelo</span><strong className="text-gray-800">{vehicle.brand} {vehicle.model}</strong></div>
                <div><span className="text-gray-500 block text-xs">Placa</span><strong className="text-gray-800">{vehicle.plate || '---'}</strong></div>
                <div><span className="text-gray-500 block text-xs">Valor FIPE</span><strong className="text-gray-800">R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div><span className="text-gray-500 block text-xs">Taxa Administrativa</span><strong className="text-gray-800">R$ 13,50</strong></div>
                <div><span className="text-gray-500 block text-xs">Adesão</span><strong className="text-gray-800">R$ 200,00</strong></div>
              </div>
            </div>

            <div className="p-8 bg-secondary text-white text-center relative overflow-hidden">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Mensalidade Total</p>
              <h3 className="text-5xl font-black">R$ {result.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -mr-16 -mt-16"></div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={14} /> 1. Inclusos no Plano (Padrão)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Proteção contra Roubo e Furto',
                    'Proteção contra Colisão e Incêndio',
                    'Assistência 24h em todo Brasil',
                    'Cobertura para terceiros até R$ 200.000,00',
                    `${result.glassPercentage}% de proteção para retrovisor, para-brisa e faróis`,
                    'Sem perfil de condutor'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                      <Check size={14} className="text-green-500" /> {item}
                    </div>
                  ))}
                </div>
              </div>

              {(result.trackerValue > 0 || result.boletoValue > 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} /> 2. Itens Obrigatórios
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {result.trackerValue > 0 && (
                      <div className="flex justify-between items-center text-sm font-bold text-gray-700 bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <span>✔ Rastreador</span>
                        <span className="text-secondary">R$ {result.trackerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-bold text-gray-700 bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <span>✔ Taxa administrativa</span>
                      <span className="text-secondary">R$ {result.boletoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.optionalAddonsValue > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                    <Plus size={14} /> 3. Opcionais Selecionados
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedAddons.filter(a => {
                      const n = a.name.toLowerCase();
                      return n !== 'boleto' && n !== 'rastreador' && n !== 'taxa administrativa';
                    }).map(a => (
                      <div key={a.id} className="flex justify-between items-center text-sm text-gray-600 bg-orange-50/30 p-2 rounded-lg border border-orange-100/50">
                        <span>+ {a.name}</span>
                        <span className="font-bold">R$ {Number(a.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 bg-gray-50/80 space-y-4 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Resumo da Mensalidade</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Valor FIPE</span><span className="font-medium">R$ {result.fipeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between text-sm"><span>Categoria</span><span className="font-medium">{result.categoryType} ({result.categoryName})</span></div>
                  {result.fipePercentage > 0 && <div className="flex justify-between text-sm"><span>Percentual</span><span className="font-medium">{(result.fipePercentage * 100).toFixed(2)}%</span></div>}
                  <div className="flex justify-between text-sm"><span>Base</span><span className="font-medium">R$ {result.fipeComponentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between text-sm"><span>Taxa Adm.</span><span className="font-medium">R$ {result.boletoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  {result.trackerValue > 0 && <div className="flex justify-between text-sm"><span>Rastreador</span><span className="font-medium">R$ {result.trackerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                  {result.glassValue > 0 && <div className="flex justify-between text-sm"><span>Vidros (Extra)</span><span className="font-medium">R$ {result.glassValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                  <div className="flex justify-between text-sm"><span>Vidros (%)</span><span className="font-medium">{result.glassPercentage}%</span></div>
                  {result.optionalAddonsValue > 0 && <div className="flex justify-between text-sm"><span>Opcionais</span><span className="font-medium">R$ {result.optionalAddonsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
                </div>
                <div className="pt-4 border-t border-dashed border-gray-300 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-gray-400 uppercase">Participação</span><span className="font-bold">R$ {result.participationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-400 uppercase">Adesão</span><span className="font-bold text-gray-700">R$ 200,00</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            {!savedSlug ? (
              <button onClick={saveQuote} disabled={saving} className="btn-primary py-4 flex justify-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Salvar Cotação
              </button>
            ) : (
              <>
                <button onClick={handleCopyLink} className="btn-primary py-4 flex justify-center gap-2">
                  <Copy size={20} /> {copied ? 'Copiado!' : 'Copiar Link'}
                </button>
                <button onClick={() => handleWhatsApp()} className="btn-secondary py-3 flex justify-center gap-2 bg-green-50 border-green-200 text-green-700">
                  <Send size={18} /> WhatsApp
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary py-3 flex justify-center gap-2">
                  <ArrowLeft size={18} /> Voltar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-10 flex justify-between">
          {step > 1 && <button onClick={handlePrevStep} className="btn-secondary flex items-center gap-2"><ChevronLeft size={20} /> Voltar</button>}
          <button onClick={handleNextStep} disabled={(step === 1 && (!client.name || !client.whatsapp)) || (step === 2 && (!vehicle.brand || !vehicle.model || !vehicle.category || modelStatus === 'restricted'))} className="btn-primary flex items-center gap-2 ml-auto">Próximo <ChevronRight size={20} /></button>
        </div>
      )}
    </div>
  );
};

export default NovaCotacao;

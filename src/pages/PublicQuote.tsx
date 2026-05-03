import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteAddon, PricingRule } from '../types';
import { ShieldCheck, MessageSquare, Send, Check, CheckCircle2, Car, MapPin, Zap, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';

const PublicQuote = () => {
  const { slug } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [addons, setAddons] = useState<QuoteAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [slug]);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('public_slug', slug)
        .single();

      if (error) throw error;
      setQuote(data);

      const { data: addonsData } = await supabase
        .from('quote_addons')
        .select('*')
        .eq('quote_id', data.id);
      if (addonsData) setAddons(addonsData);

      if (data.category_id) {
        const { data: ruleData } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('category_id', data.category_id)
          .single();
        
        if (ruleData) {
          const result = calculateQuote(
            Number(data.fipe_value),
            ruleData as PricingRule,
            addonsData as any,
            data.category_name
          );
          setCalcResult(result);
        }
      }

    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preparando proposta...</p>
        </div>
      </div>
    );
  }

  if (!quote || !calcResult) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Cotação não encontrada</h1>
        <p className="text-gray-500 text-sm mb-6">Este link pode estar expirado ou incorreto.</p>
        <button onClick={() => window.location.href = 'https://autoexcelencia.com.br'} className="text-primary font-bold text-sm">Acessar site oficial</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = `Olá! Revisei minha cotação da Auto Excelência.

*🚗 VEÍCULO:* ${quote.brand} ${quote.model}
*💰 MENSALIDADE:* R$ ${Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Gostaria de dar andamento na contratação.`;

    window.open(`https://wa.me/55${quote.client_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20 font-sans text-gray-900 antialiased selection:bg-primary/20">
      {/* Header Fixo */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-5 flex items-center justify-between">
          <img src="/logo.png" alt="Auto Excelência" className="h-8 w-auto object-contain" />
          <button onClick={handleWhatsApp} className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest py-2.5 px-5 rounded-full flex items-center gap-2 transition-all shadow-md shadow-green-500/20">
            <MessageSquare size={14} /> Contratar
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Card Valor Principal - Foco na Conversão */}
        <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Mensalidade do seu Plano</p>
            <h1 className="text-5xl md:text-6xl font-black text-secondary mb-3">
              <span className="text-2xl font-medium text-gray-400 mr-1.5">R$</span>
              {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h1>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full uppercase tracking-widest">
              <ShieldCheck size={14} /> Proteção completa 24h
            </div>
          </div>
        </section>

        {/* Dados do Veículo */}
        <section className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Car size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-0.5">Veículo Protegido</p>
              <h2 className="text-lg font-bold text-gray-800 leading-tight">{quote.brand} {quote.model}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Ano: {quote.year} • Placa: {quote.plate || '---'}</p>
            </div>
          </div>
          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Valor FIPE Referência</p>
            <p className="text-lg font-bold text-gray-800">R$ {Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </section>

        {/* Benefícios Diagramados */}
        <section className="space-y-5 pt-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest ml-2">Vantagens do Plano</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Benefícios Inclusos */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:border-green-200 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="font-black text-gray-800 text-sm uppercase tracking-widest">Cobertura do Veículo</h4>
              </div>
              <ul className="space-y-3.5 text-[13px] text-gray-600 font-medium">
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Sem perfil de motorista</li>
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Cobertura em todo território nacional</li>
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Indenização p/ furto, roubo, colisão e granizo</li>
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Indenização 100% da FIPE (roubo/perda total)</li>
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Cobertura p/ terceiros até R$ 200.000,00</li>
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> {calcResult.glassPercentage}% proteção de vidros, retrovisores e faróis</li>
                <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Proteção para carros rebaixados</li>
              </ul>
            </div>

            <div className="space-y-5">
              {/* Guincho */}
              <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:border-green-200 transition-colors">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <h4 className="font-black text-gray-800 text-sm uppercase tracking-widest">Guincho 24h</h4>
                </div>
                <ul className="space-y-3 text-[13px] text-gray-600 font-medium">
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Livre para eventos</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Até 500 km p/ panes (ida e volta)</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Cobertura pane seca, pneu furado e pane elétrica</li>
                </ul>
              </div>

              {/* Assistências Diversas */}
              <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm hover:border-green-200 transition-colors">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={18} />
                  </div>
                  <h4 className="font-black text-gray-800 text-sm uppercase tracking-widest">Assistências Inclusas</h4>
                </div>
                <ul className="space-y-3 text-[13px] text-gray-600 font-medium">
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Carga de bateria no local</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Chaveiro (reembolso até R$ 100,00)</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Táxi/Uber p/ retorno (até R$ 150,00)</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Hospedagem em viagem (até R$ 100,00/dia)</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Auxílio funeral (reembolso até R$ 3.000,00)</li>
                  <li className="flex gap-3 items-start"><Check size={16} className="text-green-500 shrink-0 mt-0.5" strokeWidth={3} /> Monitoramento Rastreador</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Opcionais Extra se houver */}
        {addons.filter(a => {
            const n = a.name.toLowerCase().trim();
            return !(n === 'boleto' || n === 'taxa administrativa' || n.includes('boleto') || n === 'rastreador');
        }).length > 0 && (
          <section className="bg-gray-50 rounded-[1.5rem] p-6 border border-gray-100">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Serviços Opcionais Selecionados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {addons.filter(a => {
                  const n = a.name.toLowerCase().trim();
                  return !(n === 'boleto' || n === 'taxa administrativa' || n.includes('boleto') || n === 'rastreador');
              }).map((addon, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white p-3 rounded-xl border border-gray-100">
                  <Plus size={14} className="text-primary" /> {addon.name}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Participação */}
        <div className="text-center px-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">Cota de participação em sinistro: <strong className="text-gray-800">R$ {Number(quote.participation_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
        </div>

        {/* CTA Conversão */}
        <section className="pt-2">
          <button onClick={handleWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 transition-all">
            <Send size={20} /> Finalizar Contratação
          </button>
        </section>

        {/* Rodapé / Consultor */}
        <section className="flex flex-col items-center pt-8 border-t border-gray-200 mt-8 gap-3 pb-8">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-gray-100 shadow-sm">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-sm">
              {(quote.consultant_name || 'C')[0]}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Consultor Responsável</p>
              <p className="text-xs font-bold text-gray-800">{quote.consultant_name}</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest">
            Proposta válida até {format(new Date(new Date(quote.created_at).getTime() + 7 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}
          </p>
        </section>
      </main>
    </div>
  );
};

export default PublicQuote;

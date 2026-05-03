import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteAddon, PricingRule } from '../types';
import { ShieldCheck, CheckCircle2, MessageSquare, Zap, Printer, Copy, Send } from 'lucide-react';
import { format } from 'date-fns';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';

const PublicQuote = () => {
  const { slug } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [addons, setAddons] = useState<QuoteAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [copied, setCopied] = useState(false);

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
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-xs font-black text-primary uppercase tracking-widest">Preparando sua cotação...</p>
        </div>
      </div>
    );
  }

  if (!quote || !calcResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="text-primary" size={40} />
        </div>
        <h1 className="text-2xl font-black mb-2">Cotação expirada</h1>
        <p className="text-gray-500 mb-6">O link pode estar expirado ou incorreto.</p>
        <button onClick={() => window.location.href = 'https://autoexcelencia.com.br'} className="btn-primary">Acessar site oficial</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = `Olá! Recebi minha cotação da Auto Excelência e gostaria de seguir com a contratação.

*🚗 DADOS DO VEÍCULO*
Modelo: ${quote.brand} ${quote.model}
Placa: ${quote.plate || '---'}
Valor FIPE: R$ ${Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

*💰 TOTAL DA MENSALIDADE: R$ ${Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

Confira os detalhes no link oficial: ${window.location.href}`;

    window.open(`https://wa.me/55${quote.client_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 font-sans selection:bg-primary/10">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Auto Excelência" className="h-10 w-auto object-contain" />
          </div>
          <button onClick={handleWhatsApp} className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest py-2.5 px-5 rounded-full flex items-center gap-2 transition-all">
            <MessageSquare size={14} /> Falar com Consultor
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* 1. DADOS DO VEÍCULO */}
        <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-b border-gray-50 pb-4">1. Dados do Veículo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Modelo</p>
              <strong className="text-gray-800 text-lg leading-tight block">{quote.brand} {quote.model}</strong>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Placa</p>
              <strong className="text-gray-800 text-lg block">{quote.plate || '---'}</strong>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Valor FIPE</p>
              <strong className="text-gray-800 text-lg block">R$ {Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </section>

        {/* 2. VALOR DA MENSALIDADE */}
        <section className="bg-secondary rounded-[2.5rem] p-12 text-center text-white shadow-2xl shadow-secondary/30 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.4em] mb-4">Total da Mensalidade</p>
            <h2 className="text-7xl font-black mb-4">
              <span className="text-3xl font-medium mr-2">R$</span>
              {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center justify-center gap-2 text-primary text-sm font-bold bg-white/5 py-2 px-4 rounded-full w-fit mx-auto">
              <ShieldCheck size={16} /> Proteção Garantida
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        </section>

        {/* 3. COMO CHEGAMOS NESSE VALOR */}
        <section className="bg-gray-50 rounded-[2rem] p-8 border border-gray-200/50">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 text-center">3. Resumo do Cálculo</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Base FIPE ({calcResult.categoryType})</span>
              <span className="font-bold text-gray-800">R$ {calcResult.fipeComponentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Taxa Administrativa</span>
              <span className="font-bold text-gray-800">R$ 13,50</span>
            </div>
            {calcResult.trackerValue > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Rastreador Monitorado</span>
                <span className="font-bold text-gray-800">R$ {calcResult.trackerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {calcResult.optionalAddonsValue > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Serviços Opcionais</span>
                <span className="font-bold text-gray-800">R$ {calcResult.optionalAddonsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="pt-4 border-t border-gray-200 mt-4 flex justify-between items-center">
              <span className="font-black text-gray-900 uppercase tracking-widest text-xs">Total Mensal</span>
              <span className="font-black text-2xl text-secondary">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
              `${calcResult.glassPercentage}% para vidros`,
              'Proteção para carros rebaixados'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-50">
                <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center"><CheckCircle2 size={12} /></div>
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
                <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center"><CheckCircle2 size={12} /></div>
                <span className="text-sm font-semibold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. ITENS INCLUSOS */}
        <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">6. Incluso no Plano</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
              <span className="text-sm font-bold text-gray-700">Taxa Administrativa</span>
              <span className="text-sm font-black text-secondary">R$ 13,50</span>
            </div>
            {calcResult.trackerValue > 0 && (
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-700">Rastreador Monitorado</span>
                <span className="text-sm font-black text-secondary">R$ 50,00</span>
              </div>
            )}
          </div>
        </section>

        {/* 7. OPCIONAIS */}
        {calcResult.optionalAddonsValue > 0 && (
          <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-6">7. Opcionais Contratados</h3>
            <div className="grid grid-cols-1 gap-3">
              {addons.filter(a => {
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
            {(quote.consultant_name || 'C')[0]}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultor Especialista</p>
            <h4 className="text-lg font-black text-gray-800">{quote.consultant_name}</h4>
            <p className="text-xs text-gray-500">{quote.consultant_city}/SC</p>
          </div>
        </section>

        {/* 9. BOTÕES DE AÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={handleWhatsApp} className="bg-green-500 hover:bg-green-600 text-white py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 transition-all font-black uppercase tracking-widest">
            <Send size={24} /> Contratar Agora
          </button>
          <button onClick={handleCopyLink} className="btn-primary py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all font-black uppercase tracking-widest">
            <Copy size={24} /> {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
          <button onClick={handlePrint} className="bg-white border-2 border-gray-100 text-gray-600 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-bold uppercase tracking-widest text-xs col-span-full">
            <Printer size={20} /> Imprimir Proposta
          </button>
        </div>

        <div className="text-center pt-8">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            Cotação gerada em {format(new Date(quote.created_at), 'dd/MM/yyyy')} • Válida por 7 dias
          </p>
        </div>
      </main>
    </div>
  );
};

export default PublicQuote;

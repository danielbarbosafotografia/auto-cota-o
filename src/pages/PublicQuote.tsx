import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteAddon, PricingRule } from '../types';
import { ShieldCheck, Car, CheckCircle2, MessageSquare, Plus } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quote || !calcResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="text-primary" size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Cotação não encontrada</h1>
        <p className="text-gray-500 mb-6">O link pode estar expirado ou incorreto.</p>
        <button onClick={() => window.location.href = '/'} className="btn-primary">Ir para o início</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = `Olá! Quero seguir com a minha associação da Auto Excelência.

*🚗 DADOS DA COTAÇÃO*
Modelo: ${quote.brand} ${quote.model}
Placa: ${quote.plate || '---'}
Código FIPE: ${quote.fipe_code || '---'}
Valor FIPE: R$ ${Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Participação Evento: R$ ${Number(quote.participation_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Adesão/Vistoria: R$ ${Number(quote.inspection_fee || 200).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Data: ${format(new Date(quote.created_at), 'dd/MM/yyyy')}

*🎯 TOTAL DA MENSALIDADE: R$ ${Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

✔️ Proteção Completa
✔️ Assistência 24h
Link oficial: ${window.location.href}`;

    window.open(`https://wa.me/55${quote.client_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-white border-b border-gray-200 py-6 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Auto Excelência" className="h-10 sm:h-12 w-auto max-w-[160px] sm:max-w-[200px] object-contain" />
          </div>
          <button onClick={handleWhatsApp} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
            <MessageSquare size={14} /> Falar com Consultor
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Car size={20} /></div>
            <h2 className="text-lg font-bold text-gray-800">Dados da Cotação</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div><span className="text-gray-500 block text-xs">Modelo</span><strong className="text-gray-800">{quote.brand} {quote.model}</strong></div>
              <div><span className="text-gray-500 block text-xs">Placa</span><strong className="text-gray-800">{quote.plate || '---'}</strong></div>
              <div><span className="text-gray-500 block text-xs">Código FIPE</span><strong className="text-gray-800">{quote.fipe_code || '---'}</strong></div>
              <div><span className="text-gray-500 block text-xs">Valor FIPE</span><strong className="text-gray-800">R$ {Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div><span className="text-gray-500 block text-xs">Participação de evento</span><strong className="text-gray-800">R$ {Number(quote.participation_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div><span className="text-gray-500 block text-xs">Adesão e vistoria</span><strong className="text-gray-800">R$ {Number(quote.inspection_fee || 200).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div><span className="text-gray-500 block text-xs">Taxa Administrativa</span><strong className="text-gray-800">R$ 13,50</strong></div>
              <div><span className="text-gray-500 block text-xs">Data da cotação</span><strong className="text-gray-800">{format(new Date(quote.created_at), 'dd/MM/yyyy')}</strong></div>
            </div>

            <div className="mt-6 bg-secondary text-white rounded-2xl p-6 text-center shadow-xl shadow-secondary/20 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total da mensalidade</p>
                <h3 className="text-5xl font-black text-white">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-40"></div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 p-5 flex items-center gap-3">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg"><CheckCircle2 size={20} /></div>
            <h2 className="text-lg font-bold text-gray-800">1. Proteção Inclusa (Padrão)</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                'Proteção contra Roubo e Furto',
                'Proteção contra Colisão e Incêndio',
                'Assistência 24h em todo Brasil',
                'Cobertura para terceiros até R$ 200.000,00',
                `${calcResult.glassPercentage}% de proteção para retrovisor, para-brisa e faróis`,
                'Sem perfil de condutor',
                'Indenização até 100% da FIPE',
                'Sem limite de quilometragem guincho (eventos)'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {(calcResult.trackerValue > 0 || calcResult.boletoValue > 0) && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><ShieldCheck size={20} /></div>
              <h2 className="text-lg font-bold text-gray-800">2. Itens Obrigatórios</h2>
            </div>
            <div className="p-6 space-y-3">
              {calcResult.trackerValue > 0 && (
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-blue-600" />
                    <div><p className="font-bold text-gray-800">Rastreador</p></div>
                  </div>
                  <span className="font-bold text-secondary">R$ {calcResult.trackerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-blue-600" />
                  <div><p className="font-bold text-gray-800">Taxa Administrativa</p></div>
                </div>
                <span className="font-bold text-secondary">R$ {calcResult.boletoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </section>
        )}

        {calcResult.optionalAddonsValue > 0 && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 border-b border-orange-100 p-5 flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Plus size={20} /></div>
              <h2 className="text-lg font-bold text-gray-800">3. Opcionais Contratados</h2>
            </div>
            <div className="p-6 space-y-3">
              {addons.filter(a => {
                const n = a.name.toLowerCase();
                return n !== 'boleto' && n !== 'rastreador' && n !== 'taxa administrativa';
              }).map(addon => (
                <div key={addon.id} className="flex justify-between items-center p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                  <div className="flex items-center gap-3">
                    <Plus size={18} className="text-orange-500" />
                    <span className="font-bold text-gray-800">{addon.name}</span>
                  </div>
                  <span className="font-bold text-orange-600">+ R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden text-white">
          <div className="p-8 space-y-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] text-center">Resumo da Mensalidade</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-300"><span>Valor FIPE</span><span className="font-bold">R$ {calcResult.fipeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm text-gray-300"><span>Categoria</span><span className="font-bold">{calcResult.categoryType} ({calcResult.categoryName})</span></div>
              {calcResult.fipePercentage > 0 && <div className="flex justify-between text-sm text-gray-300"><span>Percentual</span><span className="font-bold">{(calcResult.fipePercentage * 100).toFixed(2)}%</span></div>}
              <div className="flex justify-between text-sm text-gray-300"><span>Base</span><span className="font-bold">R$ {calcResult.fipeComponentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm text-gray-300"><span>Taxa Adm.</span><span className="font-bold">R$ {calcResult.boletoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              {calcResult.trackerValue > 0 && <div className="flex justify-between text-sm text-gray-300"><span>Rastreador</span><span className="font-bold">R$ {calcResult.trackerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
              {calcResult.glassValue > 0 && <div className="flex justify-between text-sm text-gray-300"><span>Vidros (Extra)</span><span className="font-bold">R$ {calcResult.glassValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
              <div className="flex justify-between text-sm text-gray-300"><span>Vidros (%)</span><span className="font-bold">{calcResult.glassPercentage}%</span></div>
              {calcResult.optionalAddonsValue > 0 && <div className="flex justify-between text-sm text-gray-300"><span>Opcionais</span><span className="font-bold">R$ {calcResult.optionalAddonsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>}
            </div>

            <div className="pt-6 border-t border-gray-700 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Valor Total</p>
                <p className="text-3xl font-black">R$ {calcResult.finalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <button onClick={handleWhatsApp} className="bg-primary hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary/20">
                CONTRATAR
              </button>
            </div>
          </div>
        </section>

        <div className="pt-4 space-y-4 text-center">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4">
            <p className="text-sm text-gray-500 font-medium italic">"Garantimos o melhor atendimento e a proteção mais completa para você rodar tranquilo."</p>
            {(quote as any).consultant_name && (
              <div className="flex items-center justify-center gap-2 text-left">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-primary font-bold">{(quote as any).consultant_name?.[0]}</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{(quote as any).consultant_name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Consultor Especialista</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Cotação válida por 7 dias a partir de {format(new Date(quote.created_at), 'dd/MM/yyyy')}.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PublicQuote;

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteAddon, PricingRule } from '../types';
import { Send, Check } from 'lucide-react';
import { format } from 'date-fns';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';

const PublicQuote = () => {
  const { slug } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [, setAddons] = useState<QuoteAddon[]>([]);
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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carregando cotação oficial...</p>
        </div>
      </div>
    );
  }

  if (!quote || !calcResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Cotação não encontrada</h1>
        <p className="text-gray-500 text-sm mb-6">Este link pode estar expirado.</p>
        <button onClick={() => window.location.href = 'https://autoexcelencia.com.br'} className="text-primary font-bold text-sm">Voltar ao início</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = `Olá! Recebi minha cotação da Auto Excelência.

*🚗 VEÍCULO:* ${quote.brand} ${quote.model}
*💰 MENSALIDADE:* R$ ${Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

Confira os detalhes: ${window.location.href}`;

    window.open(`https://wa.me/55${quote.client_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-sans antialiased text-gray-900">
      {/* Header Minimalista */}
      <header className="border-b border-gray-100 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
          <img src="/logo.png" alt="Auto Excelência" className="h-8 w-auto grayscale brightness-0" />
          <div className="flex gap-4">
            <button onClick={handleCopyLink} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              {copied ? 'Copiado' : 'Copiar Link'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        {/* Resumo Principal */}
        <section className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{quote.brand} {quote.model}</h1>
              <p className="text-sm text-gray-500 mt-1">Placa: <span className="font-mono">{quote.plate || '---'}</span> • FIPE: R$ {Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mensalidade</p>
              <p className="text-4xl font-black text-secondary">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </section>

        {/* Grade de Benefícios (Objetivo e Minimalista) */}
        <section className="grid grid-cols-1 gap-10">
          {/* Benefícios Inclusos */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Benefícios Inclusos</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                'Sem perfil de motorista',
                'Cobertura nacional',
                'Furto, Roubo e Incêndio',
                'Colisão, Granizo e Colisão',
                '100% da FIPE (Roubo/Perda Total)',
                'Terceiros até R$ 200.000,00',
                `${calcResult.glassPercentage}% Proteção de vidros`,
                'Proteção p/ carros rebaixados'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {/* Guincho */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Guincho</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span>•</span> Livre para eventos</li>
                <li className="flex gap-2"><span>•</span> Até 500 km (ida/volta) p/ panes</li>
                <li className="flex gap-2"><span>•</span> Falta de combustível / Pneu furado</li>
                <li className="flex gap-2"><span>•</span> Pane elétrica e mecânica</li>
              </ul>
            </div>

            {/* Assistência Diversas */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Assistência Diversas</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span>•</span> Carga de bateria / Chaveiro</li>
                <li className="flex gap-2"><span>•</span> Táxi / Uber até R$ 150,00</li>
                <li className="flex gap-2"><span>•</span> Hospedagem até R$ 100,00/dia</li>
                <li className="flex gap-2"><span>•</span> Auxílio funeral até R$ 3.000,00</li>
                <li className="flex gap-2"><span>•</span> Rastreador</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Resumo Financeiro (Sistema) */}
        <section className="bg-gray-50 rounded-2xl p-8 border border-gray-100 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Base Calculada (FIPE)</span>
              <span className="font-medium">R$ {calcResult.fipeComponentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxa Administrativa</span>
              <span className="font-medium">R$ 13,50</span>
            </div>
            {calcResult.trackerValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rastreador Monitorado</span>
                <span className="font-medium">R$ 50,00</span>
              </div>
            )}
            {calcResult.optionalAddonsValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Opcionais Adicionais</span>
                <span className="font-medium">R$ {calcResult.optionalAddonsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
          
          <div className="pt-6 border-t border-gray-200 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Final Mensal</p>
              <p className="text-3xl font-black text-secondary">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cota de Participação</p>
              <p className="text-lg font-bold text-gray-800">R$ {Number(quote.participation_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </section>

        {/* Ações e Rodapé */}
        <div className="space-y-8 pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleWhatsApp} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-sm">
              <Send size={18} /> Prosseguir via WhatsApp
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                {(quote.consultant_name || 'C')[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{quote.consultant_name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{quote.consultant_city}/SC</p>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">
              Válido até {format(new Date(new Date(quote.created_at).getTime() + 7 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicQuote;

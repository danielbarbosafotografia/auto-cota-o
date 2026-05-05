import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteAddon, PricingRule } from '../types';
import { ShieldCheck, Car, CheckCircle2, MessageSquare, Plus, Wrench, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { calculateQuote } from '../lib/calculator';
import type { CalculationResult } from '../lib/calculator';

// Addons que não devem aparecer na cotação pública
const shouldHideAddonPublic = (name: string): boolean => {
  const n = name.toLowerCase().trim();
  if (n.includes('boleto')) return true;
  if (n.includes('taxa administrativa')) return true;
  if (n.includes('rastreador')) return true;
  if (n === 'alagamento') return true;
  if (n.includes('hospitalidade')) return true;
  if (n.includes('diária') || n.includes('diarias') || n.includes('diárias')) return true;
  if (n.includes('guincho') && n.includes('1000')) return true;
  if (n.includes('terceiros') && (n.includes('3000') || n.includes('300'))) return true;
  // Vidros/farol/retrovisor/lanterna são embutidos no cálculo — não aparecem como opcional
  if (n.includes('vidro') || n.includes('farol') || n.includes('retrovisor') || n.includes('lanterna')) return true;
  return false;
};

const PublicQuote = () => {
  const { slug } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [addons, setAddons] = useState<QuoteAddon[]>([]);
  const [allAddons, setAllAddons] = useState<any[]>([]);
  const [trackerRequired, setTrackerRequired] = useState(false);
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

      const { data: allAddonsData } = await supabase
        .from('addons')
        .select('*')
        .eq('active', true)
        .order('name');

      if (allAddonsData) setAllAddons(allAddonsData);

      if (data.category_id) {
        const { data: rule } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('category_id', data.category_id)
          .single();
        if (rule) {
          setTrackerRequired(rule.tracker_required);
          const result = calculateQuote(
            Number(data.fipe_value),
            rule as PricingRule,
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

  // Rastreador aparece se obrigatório pela regra OU se foi contratado como addon
  const hasTracker = trackerRequired || addons.some(a => a.name.toLowerCase().includes('rastreador'));

  const handleWhatsApp = () => {
    const message = `Olá! Quero seguir com a minha associação da Auto Excelência.

*🚗 DADOS DA COTAÇÃO*
Modelo: ${quote.brand} ${quote.model}
Placa: ${quote.plate || '---'}
Código FIPE: ${quote.fipe_code || '---'}
Valor FIPE: R$ ${Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Valor Mensal: R$ ${Number(quote.base_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Adesão/Vistoria: R$ ${Number(quote.inspection_fee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Data: ${format(new Date(quote.created_at), 'dd/MM/yyyy')}

*🎯 TOTAL DA MENSALIDADE: R$ ${Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

${hasTracker ? '✔️ Rastreador incluso\n' : ''}✔️ Proteção Completa
✔️ Assistência 24h

Link oficial: ${window.location.href}`;

    window.open(`https://wa.me/55${quote.client_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* Header */}
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

      {/* Rastreador destaque (visível no topo quando contratado) */}
      {hasTracker && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <div className="bg-primary text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg shadow-primary/20">
            <CheckCircle2 size={22} className="shrink-0" />
            <span className="font-bold text-sm">Rastreador incluso nesta cotação</span>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* 🚗 Dados da cotação */}
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
              <div><span className="text-gray-500 block text-xs">Valor mensal</span><strong className="text-gray-800">R$ {Number(quote.base_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div><span className="text-gray-500 block text-xs">Adesão e vistoria</span><strong className="text-gray-800">R$ {Number(quote.inspection_fee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
              <div><span className="text-gray-500 block text-xs">Data da cotação</span><strong className="text-gray-800">{format(new Date(quote.created_at), 'dd/MM/yyyy')}</strong></div>
              {(quote as any).consultant_name && (
                <>
                  <div className="col-span-2 border-t border-gray-100 pt-3 mt-2">
                    <span className="text-primary font-bold block text-xs uppercase tracking-widest mb-1">Responsável pelo Atendimento</span>
                    <strong className="text-gray-800">{(quote as any).consultant_name} — {(quote as any).consultant_city}/SC</strong>
                  </div>
                </>
              )}
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

        {/* 🛡️ Benefícios inclusos */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center gap-3">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg"><ShieldCheck size={20} /></div>
            <h2 className="text-lg font-bold text-gray-800">Proteção / Cobertura Inclusa</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                'Sem perfil de motorista',
                'Cobertura em todo território nacional',
                'Indenização p/ furto, roubo, colisão e granizo',
                'Indenização 100% da FIPE (roubo ou perda total)',
                'Cobertura p/ terceiros até R$ 200.000,00',
                `${calcResult.glassPercentage}% proteção de vidros, retrovisores e faróis`,
                'Proteção para carros rebaixados',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 🚨 Assistência / Guincho */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center gap-3">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Wrench size={20} /></div>
            <h2 className="text-lg font-bold text-gray-800">Assistência / Guincho (24h)</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                'Guincho: até 500 km (ida e volta) — 1 utilização a cada 30 dias',
                'Cobertura pane seca, pneu furado e pane elétrica',
                'Carga de bateria no local',
                'Chaveiro: reembolso em reais (1 utilização a cada 30 dias)',
                'Táxi / Uber / Hospedagem: somente em caso de evento',
                'Auxílio funeral (reembolso até R$ 5.000,00)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Phone size={18} className="shrink-0 mt-0.5 text-orange-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ➕ Benefícios opcionais */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><Plus size={20} /></div>
            <h2 className="text-lg font-bold text-gray-800">Benefícios Opcionais</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Veja os opcionais que você adquiriu e os demais disponíveis:</p>
            <div className="space-y-3">
              {allAddons.filter(a => !shouldHideAddonPublic(a.name)).length > 0 ? (
                allAddons.filter(a => !shouldHideAddonPublic(a.name)).map(addon => {
                  const isContracted = addons.some(a => a.addon_id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      className={`flex justify-between items-center p-3 rounded-xl border ${
                        isContracted
                          ? 'bg-green-50/50 border-green-200'
                          : 'bg-gray-50 border-gray-100 opacity-70 grayscale'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isContracted ? 'text-green-800 font-bold' : 'text-gray-500'}`}>
                        {addon.name}
                      </span>
                      <span className={`text-sm font-bold ${isContracted ? 'text-green-600' : 'text-gray-400'}`}>
                        {isContracted && '✓ '}
                        + R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-4 text-gray-400 text-sm">Nenhum adicional cadastrado.</div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="pt-4 space-y-4">
          <button
            onClick={handleWhatsApp}
            className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
          >
            <MessageSquare size={24} />
            Quero me associar agora
          </button>

          {(quote as any).consultant_name && (
            <p className="text-center text-xs text-gray-500">
              Consultor: <strong className="text-gray-700">{(quote as any).consultant_name}</strong> — {(quote as any).consultant_city}/SC
            </p>
          )}
        </div>

      </main>
    </div>
  );
};

export default PublicQuote;

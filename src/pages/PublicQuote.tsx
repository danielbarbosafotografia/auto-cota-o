import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteAddon } from '../types';
import { ShieldCheck, Car, Phone, Calendar, CheckCircle2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PublicQuote = () => {
  const { slug } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [addons, setAddons] = useState<QuoteAddon[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!quote) {
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
    const message = `Olá, recebi minha cotação da Auto Excelência e quero seguir com a associação.\n\nVeículo: ${quote.brand} ${quote.model}\nPlaca: ${quote.plate || 'Não informada'}\nMensalidade: R$ ${Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nLink da cotação: ${window.location.href}`;
    window.open(`https://wa.me/55${quote.client_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight uppercase italic">Auto <span className="text-primary">Excelência</span></h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Proteção Veicular</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-gray-400 font-medium">Data da cotação</p>
            <p className="font-bold text-secondary">{format(new Date(quote.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Main Card */}
        <section className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          <div className="p-8 sm:p-12 text-center bg-secondary text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Mensalidade Total</p>
              <h2 className="text-6xl font-black mb-4">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-light px-4 py-2 rounded-full text-sm font-bold border border-primary/30">
                <CheckCircle2 size={16} />
                Proteção Ativa 24h
              </div>
            </div>
            {/* Abstract Background Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary rounded-full blur-[80px] opacity-20"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-10"></div>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            {/* Vehicle Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100 pb-2">Informações do Veículo</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <Car size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Marca / Modelo</p>
                      <p className="font-bold text-secondary text-lg">{quote.brand} {quote.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Placa / Ano</p>
                      <p className="font-bold text-secondary text-lg">{quote.plate || '---'} • {quote.year}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100 pb-2">Valores de Referência</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Valor FIPE</p>
                      <p className="font-bold text-secondary text-lg">R$ {Number(quote.fipe_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-primary">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Participação Evento</p>
                      <p className="font-bold text-primary text-lg">R$ {Number(quote.participation_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Addons List */}
            {addons.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100 pb-2">Serviços Adicionais Inclusos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="font-semibold text-gray-700">{addon.name}</span>
                      <span className="text-gray-400 font-bold">R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Summary Table */}
            <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Valor Base Mensal</span>
                <span className="text-secondary font-bold">R$ {Number(quote.base_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Adicionais Contratados</span>
                <span className="text-secondary font-bold">R$ {Number(quote.addons_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-gray-200">
                <span className="text-gray-800 font-black uppercase tracking-tight">Investimento Mensal</span>
                <span className="text-primary text-2xl font-black">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 pt-2">
                <span>Taxa de Adesão/Vistoria (Única)</span>
                <span>R$ {Number(quote.inspection_fee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 sm:p-12 bg-white border-t border-gray-100">
            <button 
              onClick={() => handleWhatsApp()}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/30"
            >
              <MessageSquare size={24} />
              Quero me associar agora
            </button>
            <p className="text-center mt-6 text-gray-400 text-sm font-medium">
              Fale com seu consultor pelo WhatsApp para ativar sua proteção.
            </p>
          </div>
        </section>

        {/* Benefits Footer */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4 text-primary">
              <ShieldCheck size={24} />
            </div>
            <h4 className="font-bold text-secondary mb-1">Proteção Completa</h4>
            <p className="text-xs text-gray-500">Roubo, furto, colisão e fenômenos da natureza.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4 text-primary">
              <Phone size={24} />
            </div>
            <h4 className="font-bold text-secondary mb-1">Assistência 24h</h4>
            <p className="text-xs text-gray-500">Guincho, socorro mecânico e chaveiro em todo Brasil.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4 text-primary">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-bold text-secondary mb-1">Sem Análise</h4>
            <p className="text-xs text-gray-500">Não consultamos SPC/Serasa e sem perfil de condutor.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicQuote;

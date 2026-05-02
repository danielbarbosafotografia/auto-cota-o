import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  PlusCircle, 
  TrendingUp, 
  FileText, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Quote } from '../types';
import { clsx } from 'clsx';

const Dashboard = () => {
  const { profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    month: 0,
    sent: 0
  });
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (quotesData) setQuotes(quotesData);

      // Fetch Stats
      const { count: totalCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });

      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: monthCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth);

      setStats({
        total: totalCount || 0,
        month: monthCount || 0,
        sent: totalCount || 0 // Assuming all are sent for now
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', profile?.id);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
          {onboardingStep === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <ShieldCheck className="text-primary" size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Auto Cotação</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                Faça cotações em poucos segundos e envie tudo pronto para seu cliente.
              </p>
              <button 
                onClick={() => setOnboardingStep(2)}
                className="btn-primary w-full"
              >
                Começar
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500 w-full">
              <h2 className="text-2xl font-bold mb-8">Como funciona</h2>
              <div className="space-y-8 text-left mb-12">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">1. Preencha os dados</h3>
                    <p className="text-sm text-gray-500">Insira as informações do veículo e do cliente.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-primary">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">2. Confirme adicionais</h3>
                    <p className="text-sm text-gray-500">Escolha a categoria e serviços extras.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-primary">
                    <Send size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">3. Gere e envie</h3>
                    <p className="text-sm text-gray-500">Gere a proposta e envie direto no WhatsApp.</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setOnboardingStep(3)}
                className="btn-primary w-full"
              >
                Entendi
              </button>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500 w-full">
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500" size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Vamos criar sua primeira cotação?</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                Você pode preencher pela placa ou manualmente pelos dados do veículo.
              </p>
              <button 
                onClick={completeOnboarding}
                className="btn-primary w-full"
              >
                Criar cotação agora
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={clsx(
                "h-1.5 rounded-full transition-all duration-300",
                onboardingStep === s ? "w-8 bg-primary" : "w-2 bg-gray-200"
              )} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Olá, {profile?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500">Veja o resumo de suas atividades hoje.</p>
        </div>
        <Link to="/nova-cotacao" className="btn-primary flex items-center justify-center gap-2">
          <PlusCircle size={20} />
          Nova Cotação
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-primary">
          <p className="text-sm font-medium text-gray-500 mb-1">Total de cotações</p>
          <p className="text-3xl font-bold text-secondary">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-1">Cotações do mês</p>
          <p className="text-3xl font-bold text-secondary">{stats.month}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-1">Cotações enviadas</p>
          <p className="text-3xl font-bold text-secondary">{stats.sent}</p>
        </div>
      </div>

      {/* Recent Quotes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Últimas cotações
          </h2>
          <Link to="/historico" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
            Ver tudo
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {quotes.length > 0 ? (
            quotes.map((quote) => (
              <Link 
                key={quote.id} 
                to={`/p/${quote.public_slug}`} 
                className="card hover:shadow-md transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary">{quote.model}</h3>
                    <p className="text-sm text-gray-500">
                      {quote.client_name} • {format(new Date(quote.created_at), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{quote.category_name}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-500">Nenhuma cotação realizada ainda.</p>
              <Link to="/nova-cotacao" className="text-primary font-semibold mt-2 hover:underline">
                Comece criando sua primeira!
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp, 
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Settings,
  Package,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import type { Quote } from '../../types';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    monthQuotes: 0,
    totalSellers: 0,
    topSeller: { name: '...', count: 0 }
  });
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { count: totalQuotes } = await supabase.from('quotes').select('*', { count: 'exact', head: true });
      
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: monthQuotes } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth);

      const { count: totalSellers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');

      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalQuotes: totalQuotes || 0,
        monthQuotes: monthQuotes || 0,
        totalSellers: totalSellers || 0,
        topSeller: { name: 'Aguardando dados', count: 0 }
      });

      if (quotes) setRecentQuotes(quotes);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight italic">
            Painel <span className="text-primary">Administrativo</span>
          </h1>
          <p className="text-gray-500 font-medium">Controle total de regras, vendedores e cotações.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/regras" className="btn-secondary text-sm py-2">Editar Regras</Link>
          <Link to="/admin/adicionais" className="btn-primary text-sm py-2">Configurar Adicionais</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white border-l-4 border-l-primary group hover:shadow-lg transition-all cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <span className="text-[10px] font-black text-primary bg-red-50 px-2 py-1 rounded-full uppercase">Geral</span>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cotações</p>
          <p className="text-3xl font-black text-secondary">{stats.totalQuotes}</p>
        </div>

        <div className="card bg-white border-l-4 border-l-blue-500 group hover:shadow-lg transition-all cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase">Este Mês</span>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Cotações do Mês</p>
          <p className="text-3xl font-black text-secondary">{stats.monthQuotes}</p>
        </div>

        <div className="card bg-white border-l-4 border-l-green-500 group hover:shadow-lg transition-all cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full uppercase">Ativos</span>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Vendedores</p>
          <p className="text-3xl font-black text-secondary">{stats.totalSellers}</p>
        </div>

        <div className="card bg-white border-l-4 border-l-orange-500 group hover:shadow-lg transition-all cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <BarChart3 size={20} />
            </div>
            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-full uppercase">Top</span>
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Melhor Vendedor</p>
          <p className="text-xl font-black text-secondary truncate">{stats.topSeller.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-secondary flex items-center gap-2 uppercase tracking-tight italic">
              <Clock className="text-primary" size={20} />
              Cotações Recentes
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Veículo</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Valor</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-secondary group-hover:text-primary transition-colors">{quote.model}</p>
                        <p className="text-xs text-gray-400 font-medium uppercase">{quote.brand}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">{quote.client_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-secondary">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-400 uppercase">{format(new Date(quote.created_at), "dd/MM/yy")}</span>
                      </td>
                    </tr>
                  ))}
                  {recentQuotes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Nenhuma cotação ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-black text-secondary flex items-center gap-2 uppercase tracking-tight italic">
            <Settings className="text-primary" size={20} />
            Ações Rápidas
          </h2>

          <div className="space-y-3">
            <Link to="/admin/regras" className="card flex items-center gap-4 hover:border-primary transition-all group">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-secondary">Regras de Cálculo</h4>
                <p className="text-xs text-gray-400">Edite taxas e percentuais.</p>
              </div>
              <ArrowUpRight className="text-gray-300 group-hover:text-primary" size={20} />
            </Link>

            <Link to="/admin/adicionais" className="card flex items-center gap-4 hover:border-primary transition-all group">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                <Package size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-secondary">Serviços Extras</h4>
                <p className="text-xs text-gray-400">Gerencie os opcionais.</p>
              </div>
              <ArrowUpRight className="text-gray-300 group-hover:text-primary" size={20} />
            </Link>

            <div className="card bg-orange-50 border-orange-100 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-orange-700">
                <AlertTriangle size={20} />
                <span className="font-bold text-sm uppercase tracking-wider">Atenção</span>
              </div>
              <p className="text-sm text-orange-600 font-medium leading-relaxed">
                Verifique as regras de cálculo e adicionais para garantir que os valores estão corretos.
              </p>
              <Link to="/admin/regras" className="text-orange-700 font-black text-xs uppercase tracking-widest hover:underline text-left">
                Verificar regras
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

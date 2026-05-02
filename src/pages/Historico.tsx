import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Quote } from '../types';
import { FileText, Search, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Historico = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchQuotes = async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setQuotes(data);
      setLoading(false);
    };
    fetchQuotes();
  }, []);

  const filteredQuotes = quotes.filter(q => 
    q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-secondary">Histórico de Cotações</h1>
        <p className="text-gray-500">Acompanhe todas as propostas enviadas.</p>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou veículo..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary px-4">
          <Filter size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {filteredQuotes.map(quote => (
          <Link key={quote.id} to={`/p/${quote.public_slug}`} className="card hover:shadow-md transition-all flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-secondary">{quote.model}</h3>
                <p className="text-sm text-gray-500">{quote.client_name} • {format(new Date(quote.created_at), "dd/MM/yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-primary">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{quote.category_name}</p>
              </div>
              <ExternalLink size={20} className="text-gray-300 group-hover:text-primary" />
            </div>
          </Link>
        ))}

        {filteredQuotes.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">Nenhuma cotação encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historico;

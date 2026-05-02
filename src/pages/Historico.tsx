import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Quote } from '../types';
import { FileText, Search, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const CONSULTANTS = [
  'Todos',
  'Douglas',
  'Leandro',
  'Rafael',
  'Grazi',
  'Guilherme',
  'Mikaio',
  'Yara',
];

const Historico = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize filter with the logged in consultant, or 'Todos' if none
  const [selectedConsultant, setSelectedConsultant] = useState(
    localStorage.getItem('consultor_nome') || 'Todos'
  );

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

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type casting because we added consultant_name dynamically in SQL, it might not be typed yet
    const consultantName = (q as any).consultant_name || '';
    
    const matchesConsultant = selectedConsultant === 'Todos' || consultantName === selectedConsultant;

    return matchesSearch && matchesConsultant;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-secondary">Histórico de Cotações</h1>
        <p className="text-gray-500">Acompanhe todas as propostas enviadas.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select 
            className="input-field pl-10 cursor-pointer appearance-none"
            value={selectedConsultant}
            onChange={e => setSelectedConsultant(e.target.value)}
          >
            {CONSULTANTS.map(c => (
              <option key={c} value={c}>{c === 'Todos' ? 'Todos os consultores' : c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredQuotes.map(quote => {
          const cName = (quote as any).consultant_name;
          const cCity = (quote as any).consultant_city;

          return (
            <Link key={quote.id} to={`/p/${quote.public_slug}`} className="card hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors flex-shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-secondary">{quote.model}</h3>
                  <p className="text-sm text-gray-500">{quote.client_name} • {format(new Date(quote.created_at), "dd/MM/yyyy")}</p>
                  {(cName || cCity) && (
                    <p className="text-xs text-primary font-medium mt-1">Consultor: {cName || 'Não ind.'} — {cCity || 'SC'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 justify-between sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="font-bold text-primary text-lg sm:text-base">R$ {Number(quote.final_monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{quote.category_name}</p>
                </div>
                <ExternalLink size={20} className="text-gray-300 group-hover:text-primary flex-shrink-0" />
              </div>
            </Link>
          );
        })}

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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout, AdminLayout } from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NovaCotacao from './pages/NovaCotacao';
import Historico from './pages/Historico';
import Clientes from './pages/Clientes';
import Perfil from './pages/Perfil';
import PublicQuote from './pages/PublicQuote';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminVendedores from './pages/admin/Vendedores';
import AdminRegras from './pages/admin/Regras';
import AdminAdicionais from './pages/admin/Adicionais';
import AdminMarcas from './pages/admin/Marcas';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/p/:slug" element={<PublicQuote />} />

          {/* Protected Seller Routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nova-cotacao" element={<NovaCotacao />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/perfil" element={<Perfil />} />
            
            {/* Admin Routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/vendedores" element={<AdminVendedores />} />
              <Route path="/admin/regras" element={<AdminRegras />} />
              <Route path="/admin/adicionais" element={<AdminAdicionais />} />
              <Route path="/admin/marcas" element={<AdminMarcas />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [idioma, setIdioma] = useState(localStorage.getItem('idioma') || 'pt-BR');
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // ✅ Axios instance com headers dinâmicos
  const API = useMemo(() => {
    return axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/api`,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(idioma && { 'Accept-Language': idioma })
      }
    });
  }, [token, idioma]);

  // ✅ Verifica autenticação ao carregar
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const savedUser = localStorage.getItem('user');
        const savedCompanies = localStorage.getItem('companies');
        const savedSelectedCompany = localStorage.getItem('selectedCompany');
        const savedSelectedUnit = localStorage.getItem('selectedUnit');

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
        if (savedSelectedCompany) setSelectedCompany(JSON.parse(savedSelectedCompany));
        if (savedSelectedUnit) setSelectedUnit(JSON.parse(savedSelectedUnit));
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // ✅ Login
  const login = async ({ login, password, idioma }) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        login,
        password,
        idioma
      });

      const token = data.data.token;
      const userData = data.data.user;
      const idiomaUser = data.data.idioma || idioma;
      const companiesList = data.data.companies || [];

      localStorage.setItem('token', token);
      localStorage.setItem('idioma', idiomaUser);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('companies', JSON.stringify(companiesList));

      setUser(userData);
      setToken(token);
      setIdioma(idiomaUser);
      setCompanies(companiesList);

      return data;
    } catch (error) {
      const mensagem = error.response?.data?.message || 'Erro no login';
      throw new Error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('idioma');
    localStorage.removeItem('user');
    localStorage.removeItem('companies');
    localStorage.removeItem('selectedCompany');
    localStorage.removeItem('selectedUnit');
    setUser(null);
    setToken('');
    setIdioma('pt-BR');
    setCompanies([]);
    setSelectedCompany(null);
    setSelectedUnit(null);
  };

  // ✅ Selecionar empresa/unidade
  const selectCompanyAndUnit = async (companyId, unitId) => {
    try {
      const { data } = await API.post('/auth/select-company-unit', {
        companyId,
        unitId
      });

      const selectedCompanyData = data.data.selectedCompany;
      const selectedUnitData = data.data.selectedUnit;

      setSelectedCompany(selectedCompanyData);
      setSelectedUnit(selectedUnitData);

      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompanyData));
      localStorage.setItem('selectedUnit', JSON.stringify(selectedUnitData));

      const newToken = data.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao selecionar empresa/unidade');
    }
  };

  // ✅ Atualiza o usuário após editar perfil
  const refreshUser = async () => {
    if (!user?.login) return;

    try {
      const { data } = await API.get(`/usuarios/${user.login}`);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao atualizar usuário no contexto:', error);
    }
  };

  // ✅ Atualiza headers globais fallback
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        idioma,
        companies,
        selectedCompany,
        selectedUnit,
        login,
        logout,
        selectCompanyAndUnit,
        loading,
        API,
        isAuthenticated: !!user,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

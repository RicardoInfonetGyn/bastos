import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function RoiPage() {
  const { user, token, selectedCompany, selectedUnit } = useAuth();

  if (!user || !token || !selectedCompany || !selectedUnit) {
    return <div className="p-4 text-danger">Usuário ou empresa/unidade não definidos</div>;
  }

  const baseUrl = 'https://dashcorpobueno.chatntsi.app.br/public/dashboard/0c83c730-1a2b-4a64-861c-10a2bf88d32e';
  const urlParams = new URLSearchParams({
    empresa: selectedCompany.id,
    
    filtro_de_data: 'thisday',
    tab: '15-call-center',
    token: token,
    user: user.login
  });

  const iframeUrl = `${baseUrl}?${urlParams.toString()}`;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard ROI</h1>
      <div className="w-full h-[80vh] border rounded shadow">
        <iframe
          src={iframeUrl}
          title="Dashboard ROI"
          className="w-full h-full border-0 rounded"
        />
      </div>
    </div>
  );
}

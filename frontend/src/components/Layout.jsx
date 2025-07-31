import React from 'react';
import { Outlet } from 'react-router-dom';
import Menu from './Menu';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white">
      {/* Menu lateral sempre visível em desktop, toggle em mobile */}
      <Menu />

      {/* Conteúdo principal com margem no desktop */}
      <main className="flex-1 p-4 transition-all duration-300 md:ml-64">
        <Outlet />
      </main>
    </div>
  );
}

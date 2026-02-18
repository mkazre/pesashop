import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CodeSnippetInjector from './CodeSnippetInjector';
import { useUIStore } from '@/store';
import classNames from 'classnames';

const Layout = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <>
      <CodeSnippetInjector environment="admin" />
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Header />
      
      <main
        className={classNames(
          'pt-16 transition-all duration-300 min-h-screen',
          {
            'ml-64': sidebarOpen,
            'ml-20': !sidebarOpen,
          }
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  );
};

export default Layout;

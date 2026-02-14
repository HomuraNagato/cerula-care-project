import { ReactNode } from 'react';
import Navbar from './Navbar';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <Navbar />
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">{children}</main>
  </div>
);

export default Layout;

import { Link } from 'react-router-dom';

const Navbar = () => (
  <header className="bg-slate-900 border-b border-slate-800">
    <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
      <Link to="/patients" className="text-xl font-semibold tracking-wide">
        Cerula Care Admin
      </Link>
      <nav className="flex gap-3 text-sm">
        <Link className="hover:text-white" to="/patients">
          Patients
        </Link>
        <button className="text-slate-400 hover:text-white">Help</button>
      </nav>
    </div>
  </header>
);

export default Navbar;

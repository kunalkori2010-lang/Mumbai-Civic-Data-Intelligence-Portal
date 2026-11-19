import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Droplets,
  FileSpreadsheet,
  GitBranch,
  Home,
  LayoutDashboard,
  MapPinned,
  Menu,
  PieChart,
  Search,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Workflow,
  X,
} from 'lucide-react';
import { CivicEmblem } from './CivicEmblem.tsx';
import { useRole } from '../context/RoleContext.tsx';
import type { UserRole } from '../shared/types.ts';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'Civic Data' | 'BI & Engineering' | 'Local Economy' | 'System';
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home Dashboard', icon: LayoutDashboard, group: 'Civic Data' },
  { path: '/explorer', label: 'BMC Data Explorer', icon: Database, group: 'Civic Data' },
  { path: '/connections', label: 'Water Connections', icon: Droplets, group: 'Civic Data' },
  { path: '/wards', label: 'Ward Analytics', icon: MapPinned, group: 'Civic Data' },
  { path: '/powerbi', label: 'Power BI Analytics', icon: BarChart3, group: 'BI & Engineering' },
  { path: '/analytics', label: 'Advanced Analytics', icon: PieChart, group: 'BI & Engineering' },
  { path: '/etl', label: 'Data Processing & ETL', icon: Workflow, group: 'BI & Engineering' },
  { path: '/quality', label: 'Data Quality', icon: ShieldCheck, group: 'BI & Engineering' },
  { path: '/sources', label: 'Data Sources', icon: BookOpen, group: 'BI & Engineering' },
  { path: '/businesses', label: 'Business Connect', icon: Briefcase, group: 'Local Economy' },
  { path: '/impact', label: 'Business Impact', icon: TrendingUp, group: 'Local Economy' },
  { path: '/workflow', label: 'System Workflow', icon: GitBranch, group: 'System' },
  { path: '/import', label: 'Data Import Centre', icon: UploadCloud, group: 'System' },
  { path: '/exports', label: 'Reports & Exports', icon: FileSpreadsheet, group: 'System' },
  { path: '/about', label: 'About Project', icon: CheckCircle2, group: 'System' },
];

const ROLES: UserRole[] = ['Public Visitor', 'Data Analyst', 'Administrator', 'Retailer'];

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ type: string; title: string; subtitle: string; route: string }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const { role, setRole, apiFetch } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const currentNav = NAV_ITEMS.find((n) => n.path === location.pathname) || NAV_ITEMS[0];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setSearchOpen(true);
        }
      } catch {
        // ignore transient search error
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, role, apiFetch]);

  const groups: NavItem['group'][] = ['Civic Data', 'BI & Engineering', 'Local Economy', 'System'];

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-[#0F172A]">
      {/* Government-style Dark Navy Top Header (Reference Screenshot Style) */}
      <header className="bg-[#294370] text-white border-b border-[#1D3256]">
        <div className="px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md bg-[#1E3256] hover:bg-[#162642] text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <CivicEmblem className="w-11 h-11 shrink-0" />
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold tracking-tight leading-tight text-white truncate font-display">
                  Mumbai Civic Data Intelligence Portal
                </div>
                <div className="text-xs text-slate-200 truncate">
                  BMC Data Management, Smart Locality Analytics &amp; Business Connect
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Global Smart Search */}
            <div ref={searchBoxRef} className="relative">
              <div className="flex items-center bg-[#1C3054] border border-[#3B5B92] rounded-md px-3 py-1.5 w-60 sm:w-72">
                <Search className="w-4 h-4 text-slate-300 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wards, fields, businesses..."
                  className="bg-transparent text-xs text-white placeholder-slate-300 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setSearchOpen(false);
                    }}
                    className="text-slate-300 hover:text-white ml-1"
                    aria-label="Clear global search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchOpen && searchResults.length > 0 && (
                <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white text-slate-900 border border-slate-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                    Global Search Results ({searchResults.length})
                  </div>
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(item.route);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">{item.title}</span>
                        <span className="text-[11px] text-[#1E3A8A] font-medium shrink-0">{item.type}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role Selector */}
            <div className="flex items-center gap-2 bg-[#1C3054] border border-[#3B5B92] rounded-md px-2.5 py-1">
              <label htmlFor="portal-role-select" className="text-[11px] text-slate-300 whitespace-nowrap">
                Role:
              </label>
              <select
                id="portal-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-[#1C3054] text-xs font-medium text-white focus:outline-none cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dark Navigation & Breadcrumb Strip (Inspired by Screenshot Black Bar) */}
        <div className="bg-[#0B111E] text-slate-200 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#182640]">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="p-1.5 rounded bg-[#182235] hover:bg-[#23324D] text-white transition-colors shrink-0"
              title="Home Dashboard"
            >
              <Home className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <span className="text-slate-400">Portal</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white truncate">{currentNav.label}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            <span>Academic Community Engagement Project | Independent Prototype</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono-tabular text-amber-300">Snapshot: March 2025 (24 Wards)</span>
          </div>
        </div>
      </header>

      {/* Main Shell: Collapsible Left Sidebar + Content Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ${
            collapsed ? 'w-[68px]' : 'w-64'
          } shrink-0`}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
            {!collapsed && (
              <span className="text-xs font-semibold text-slate-500 tracking-tight">
                Navigation Modules
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:inline-flex p-1.5 rounded hover:bg-slate-100 text-slate-600 ml-auto"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
            {groups.map((group) => {
              const items = NAV_ITEMS.filter((i) => i.group === group);
              return (
                <div key={group}>
                  {!collapsed && (
                    <div className="px-2.5 mb-1 text-[11px] font-semibold text-slate-400">
                      {group}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          title={collapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                              isActive
                                ? 'bg-[#1E3A8A] text-white'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`
                          }
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Not an official BMC portal</div>
              <div>Data sourced from Praja May 2025 RTI Report (Table 5, p. 14).</div>
            </div>
          )}
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">
          <div className="max-w-[1360px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

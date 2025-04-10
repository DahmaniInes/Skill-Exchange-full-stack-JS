import { useState } from 'react';
import { 
  BarChart, Map, Palette, Package, ShoppingCart, 
  Calendar, FileText, Heart, Github, ChevronRight, Menu
} from 'lucide-react';

export default function ProSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <div className="flex gap-6">
      {/* Light Theme */}
      <div className={`${darkMode ? 'hidden' : 'flex'} flex-col h-screen bg-white shadow-lg rounded-lg transition-all`}
           style={{ width: collapsed ? '80px' : '240px' }}>
        
        {/* Header */}
        <div className="p-5 flex items-center">
          <div className="bg-blue-500 text-white rounded p-1">
            <p className="font-bold text-lg">P</p>
          </div>
          {!collapsed && <p className="ml-2 font-semibold text-gray-700">Pro Sidebar</p>}
          <button onClick={toggleCollapsed} className="ml-auto text-gray-500">
            <Menu size={20} />
          </button>
        </div>
        
        {/* Main Menu */}
        <div className="px-3">
          <p className="text-xs text-gray-500 mb-2 mt-4 px-2">{!collapsed && 'General'}</p>
          
          <ul className="space-y-1">
            <MenuItem 
              icon={<BarChart size={20} />} 
              title="Charts" 
              collapsed={collapsed} 
              badge="1"
            />
            <MenuItem 
              icon={<Map size={20} />} 
              title="Maps" 
              collapsed={collapsed} 
            />
            <MenuItem 
              icon={<Palette size={20} />} 
              title="Theme" 
              collapsed={collapsed} 
            />
            <MenuItem 
              icon={<Package size={20} />} 
              title="Components" 
              collapsed={collapsed} 
            />
            <MenuItem 
              icon={<ShoppingCart size={20} />} 
              title="E-commerce" 
              collapsed={collapsed} 
            />
          </ul>
          
          <p className="text-xs text-gray-500 mb-2 mt-6 px-2">{!collapsed && 'Extra'}</p>
          
          <ul className="space-y-1">
            <MenuItem 
              icon={<Calendar size={20} />} 
              title="Calendar" 
              collapsed={collapsed}
              tag="New"
            />
            <MenuItem 
              icon={<FileText size={20} />} 
              title="Documentation" 
              collapsed={collapsed} 
            />
            <MenuItem 
              icon={<Heart size={20} />} 
              title="Examples" 
              collapsed={collapsed} 
            />
          </ul>
        </div>
        
        {/* Footer */}
        <div className="mt-auto p-4">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 text-white text-center">
            {!collapsed && (
              <>
                <h3 className="font-bold">Pro Sidebar</h3>
                <p className="text-xs text-blue-100 mb-3">v1.0.0 released</p>
              </>
            )}
            <button className="bg-white text-blue-600 text-xs px-3 py-1 rounded-md">
              {!collapsed ? "View code" : <Github size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Dark Theme */}
      <div className={`${darkMode ? 'flex' : 'hidden'} flex-col h-screen bg-gray-900 shadow-lg rounded-lg transition-all`}
           style={{ width: collapsed ? '80px' : '240px' }}>
        
        {/* Header */}
        <div className="p-5 flex items-center">
          <div className="bg-blue-500 text-white rounded p-1">
            <p className="font-bold text-lg">P</p>
          </div>
          {!collapsed && <p className="ml-2 font-semibold text-white">Pro Sidebar</p>}
          <button onClick={toggleCollapsed} className="ml-auto text-gray-400">
            <Menu size={20} />
          </button>
        </div>
        
        {/* Main Menu */}
        <div className="px-3">
          <p className="text-xs text-gray-400 mb-2 mt-4 px-2">{!collapsed && 'General'}</p>
          
          <ul className="space-y-1">
            <MenuItem 
              icon={<BarChart size={20} />} 
              title="Charts" 
              collapsed={collapsed} 
              badge="1"
              dark={true}
            />
            <MenuItem 
              icon={<Map size={20} />} 
              title="Maps" 
              collapsed={collapsed}
              dark={true}
            />
            <MenuItem 
              icon={<Palette size={20} />} 
              title="Theme" 
              collapsed={collapsed}
              dark={true}
            />
            <MenuItem 
              icon={<Package size={20} />} 
              title="Components" 
              collapsed={collapsed}
              dark={true}
            />
            <MenuItem 
              icon={<ShoppingCart size={20} />} 
              title="E-commerce" 
              collapsed={collapsed}
              dark={true}
            />
          </ul>
          
          <p className="text-xs text-gray-400 mb-2 mt-6 px-2">{!collapsed && 'Extra'}</p>
          
          <ul className="space-y-1">
            <MenuItem 
              icon={<Calendar size={20} />} 
              title="Calendar" 
              collapsed={collapsed}
              tag="New"
              dark={true}
            />
            <MenuItem 
              icon={<FileText size={20} />} 
              title="Documentation" 
              collapsed={collapsed}
              dark={true}
            />
            <MenuItem 
              icon={<Heart size={20} />} 
              title="Examples" 
              collapsed={collapsed}
              dark={true}
            />
          </ul>
        </div>
        
        {/* Footer */}
        <div className="mt-auto p-4">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 text-white text-center">
            {!collapsed && (
              <>
                <h3 className="font-bold">Pro Sidebar</h3>
                <p className="text-xs text-blue-100 mb-3">v1.0.0 released</p>
              </>
            )}
            <button className="bg-white text-blue-600 text-xs px-3 py-1 rounded-md">
              {!collapsed ? "View code" : <Github size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Theme Toggle for Demo */}
      <button 
        onClick={toggleTheme} 
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full"
      >
        {darkMode ? "Light" : "Dark"}
      </button>
    </div>
  );
}

// MenuItem Component
function MenuItem({ icon, title, collapsed, badge, tag, dark = false }) {
  return (
    <li className={`flex items-center p-2 rounded-lg ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors cursor-pointer`}>
      <div className={`${dark ? 'text-gray-300' : 'text-gray-600'}`}>
        {icon}
      </div>
      
      {!collapsed && (
        <>
          <span className={`ml-3 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{title}</span>
          
          {badge && (
            <div className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {badge}
            </div>
          )}
          
          {tag && (
            <div className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded">
              {tag}
            </div>
          )}
          
          {!badge && !tag && (
            <ChevronRight size={16} className={`ml-auto ${dark ? 'text-gray-400' : 'text-gray-400'}`} />
          )}
        </>
      )}
    </li>
  );
}
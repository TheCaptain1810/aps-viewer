import { useState } from "react";

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-20 z-20 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-md shadow-lg transition-all duration-300 ${
          isOpen ? "left-80" : "left-0"
        }`}
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-20 left-0 h-full bg-white shadow-lg border-r border-gray-200 transition-transform duration-300 z-10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "320px" }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            APS Viewer Controls
          </h2>
          <p className="text-sm text-gray-600">Manage buckets and models</p>
        </div>

        {/* Sidebar Content */}
        <div className="p-4 overflow-y-auto h-full pb-20 sidebar-content">
          <div className="space-y-6">{children}</div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-5 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;

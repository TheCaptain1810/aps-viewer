const SidebarSection = ({ title, children, icon }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center mb-3">
        {icon && <span className="mr-2 text-lg">{icon}</span>}
        <h3 className="text-md font-medium text-gray-800">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default SidebarSection;

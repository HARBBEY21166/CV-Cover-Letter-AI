import { FileEdit } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileEdit className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-800">CV & Cover Letter AI</h1>
        </div>
        <a href="#" className="text-sm text-primary hover:text-primary-800 transition-colors">
          Help
        </a>
      </div>
    </header>
  );
}

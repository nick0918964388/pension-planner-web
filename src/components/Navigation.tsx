import { Link, useLocation } from "react-router-dom";
import { Calculator, TrendingUp } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex space-x-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive("/")
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            模擬成功率
          </Link>
          <Link
            to="/reverse"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive("/reverse")
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="h-4 w-4" />
            計算所需退休金
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

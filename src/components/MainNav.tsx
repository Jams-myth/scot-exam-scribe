
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth"; 
import { useAdmin } from "@/lib/hooks/useAdmin";

const MainNav = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isAdmin } = useAdmin();
  
  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <nav className="flex gap-6 items-center">
          <NavLink to="/" className="text-lg font-bold">
            Exam Vault
          </NavLink>
          <NavLink
            to="/exams"
            className={({ isActive }) =>
              isActive ? "text-foreground font-medium" : "text-muted-foreground"
            }
          >
            Browse Exams
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink
                to="/questions"
                className={({ isActive }) =>
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }
              >
                Questions
              </NavLink>
              <NavLink
                to="/papers"
                className={({ isActive }) =>
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }
              >
                Papers
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }
              >
                Upload
              </NavLink>
              {/* Admin-only navigation items */}
              {isAdmin && (
                <NavLink
                  to="/admin/upload-exams"
                  className={({ isActive }) =>
                    isActive 
                      ? "text-foreground font-medium bg-purple-100 px-3 py-1 rounded-md" 
                      : "text-purple-700 bg-purple-50 px-3 py-1 rounded-md hover:bg-purple-100"
                  }
                >
                  Admin: Upload Exams
                </NavLink>
              )}
            </>
          )}
        </nav>
        <div>
          {isAuthenticated ? (
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <NavLink to="/login">Login</NavLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainNav;


import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Book, Upload, Home, ListOrdered, File, LogOut } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { logout } from "@/services/auth";

const MainNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout: clearAuthState } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout(); // Clear localStorage token
    clearAuthState(); // Reset auth state
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2 mr-8">
            <Book className="h-6 w-6" />
            <span className="font-bold text-xl">Scot Exam Scribe</span>
          </Link>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/") && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/papers">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/papers") && "bg-accent text-accent-foreground"
                    )}
                  >
                    <File className="mr-2 h-4 w-4" />
                    Papers
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/questions">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/questions") && "bg-accent text-accent-foreground"
                    )}
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Questions
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/upload">
                  <NavigationMenuLink 
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/upload") && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Paper
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {isAuthenticated && (
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
};

export default MainNav;

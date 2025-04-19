import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Book, Upload, Home, ListOrdered } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const MainNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
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
              <Link to="/exams">
                <NavigationMenuLink 
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/exams") && "bg-accent text-accent-foreground"
                  )}
                >
                  <Book className="mr-2 h-4 w-4" />
                  Exams
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
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};

export default MainNav;

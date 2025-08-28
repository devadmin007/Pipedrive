import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, NavLink } from 'react-router-dom';
import { useAuthCheck, useAuthStore } from '@/lib/auth';
import { Bell, Home, Users, User2, LogOut, BarChart3, ChevronDown, Menu, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const { isAuthenticated, user } = useAuthCheck();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Leads', href: '/leads', icon: BarChart3 },
    ...(user.role === 'admin' ? [{ name: 'Users', href: '/users', icon: Users }] : []),
    { name: 'Profile', href: '/profile', icon: User2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItems = () => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }: { isActive: boolean }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent',
              isActive ? 'bg-accent text-accent-foreground' : 'transparent'
            )
          }
          onClick={() => setOpen(false)}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center gap-2 pb-4 pt-2">
                    <div className="font-semibold">CRM Dashboard</div>
                  </div>
                  <NavItems />
                  <Button onClick={handleLogout} variant="ghost" className="mt-auto flex items-center gap-3 px-3 justify-start">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="font-bold text-xl">CRM Dashboard</div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 flex items-center gap-2 px-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1">
        {!isMobile && (
          <aside className="fixed left-0 top-16 z-20 hidden h-[calc(100vh-4rem)] w-64 flex-col overflow-y-auto border-r bg-background px-4 py-6 sm:flex">
            <div className="flex flex-col gap-2">
              <NavItems />
              <Button onClick={handleLogout} variant="ghost" className="mt-auto flex items-center gap-3 px-3 justify-start">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </aside>
        )}
        <main className="flex-1 overflow-auto p-4 sm:p-6 sm:ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
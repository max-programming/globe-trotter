import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { getSessionQuery } from "~/lib/queries/get-session-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Loader2,
  LogOutIcon,
  SettingsIcon,
  User,
  UserIcon,
  Home,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSignOut } from "~/lib/mutations/auth/use-sign-out";
import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

export const Header = () => {
  const { data: session } = useQuery(getSessionQuery);
  const { mutate: signOut, isPending } = useSignOut();

  return (
    <>
      <div className="flex items-center justify-between p-4 h-20 bg-transparent">
        <div className="flex items-center gap-8">
          <div className="h-10 w-auto">
            <Link to="/">
              <img
                src="/images/logo.png"
                alt="logo"
                className="max-h-10 w-auto object-contain"
              />
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                "[&.active]:bg-primary/10 [&.active]:text-primary"
              )}
            >
              <Home className="w-4 h-4" />
              <span>My Trips</span>
            </Link>
            <Link
              to="/community"
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                "[&.active]:bg-primary/10 [&.active]:text-primary"
              )}
            >
              <Users className="w-4 h-4" />
              <span>Community</span>
            </Link>
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 size-11 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Avatar className="border-3 border-primary shadow-lg h-full w-full">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* user details */}
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-base font-medium">{session?.user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <UserIcon className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/profile" className="cursor-pointer">
                <SettingsIcon className="h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={e => {
                e.preventDefault();
                signOut();
              }}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOutIcon className="h-4 w-4" />
                  <span>Logout</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

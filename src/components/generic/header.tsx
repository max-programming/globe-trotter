import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { getSessionQuery } from "~/lib/queries/get-session-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Loader2,
  LogOutIcon,
  SettingsIcon,
  User,
  UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSignOut } from "~/lib/mutations/auth/use-sign-out";

export const Header = () => {
  const { data: session } = useQuery(getSessionQuery);
  const { mutate: signOut, isPending } = useSignOut();

  return (
    <>
      <div className="flex items-center justify-between p-4 h-20 bg-transparent">
        <div className="flex items-center gap-2">
          <div className="h-10 w-auto">
            <img
              src="/images/logo.png"
              alt="logo"
              className="max-h-10 w-auto object-contain"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="p-0 size-11 rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
            <DropdownMenuItem>
              <UserIcon className="h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="h-4 w-4" />
              Profile Setting
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                signOut();
              }}
              disabled={isPending}
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

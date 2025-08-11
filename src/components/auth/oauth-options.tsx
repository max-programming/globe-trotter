import { SiGoogle } from "@icons-pack/react-simple-icons";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth-client";

function OauthOptions() {
  const { mutate: signInWithGoogle, isPending } = useMutation({
    mutationFn: () => authClient.signIn.social({ provider: "google" }),
  });

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        type="button"
        className="w-full h-10 border-2 hover:bg-primary-50 transition-all duration-200 hover:border-primary-200 hover:shadow-md group cursor-pointer"
        onClick={() => signInWithGoogle()}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="font-medium">Signing in...</span>
          </>
        ) : (
          <>
            <SiGoogle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Continue with Google</span>
          </>
        )}
      </Button>
      <div className="relative flex items-center gap-4">
        <Separator className="flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs font-medium text-muted-foreground bg-card px-3 py-1 rounded-full border">
          Or continue with email
        </span>
        <Separator className="flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </div>
  );
}

export { OauthOptions };

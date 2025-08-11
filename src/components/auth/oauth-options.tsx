import { SiGithub } from "@icons-pack/react-simple-icons";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

function OauthOptions() {
  function handleGithubAuth() {
    // TODO: Implement GitHub OAuth
    console.log(`GitHub attempt`);
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={handleGithubAuth}
      >
        <SiGithub className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
      <div className="relative flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs uppercase">Or continue with</span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}

export { OauthOptions };

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Card, CardContent } from "~/components/ui/card";
import { signInSchema, type SignInFormData } from "./auth-schemas";
import { Link } from "@tanstack/react-router";
import { OauthOptions } from "./oauth-options";
import { useSignIn } from "~/lib/mutations/auth/use-sign-in";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";

export function SignInForm() {
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const signInMutation = useSignIn(form);

  function handleSubmit(data: SignInFormData) {
    signInMutation.mutate(data);
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4">
        <div className="space-y-1 text-center mb-4">
          <h2 className="text-2xl font-bold">Sign in</h2>
        </div>
        <OauthOptions />
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="m@example.com"
                      {...field}
                      disabled={signInMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={signInMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={signInMutation.isPending}
            >
              {signInMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm text-muted-foreground mt-4">
          Don’t have an account?{" "}
          <Link
            to="/sign-up"
            className="underline underline-offset-4 hover:text-primary"
          >
            Register
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

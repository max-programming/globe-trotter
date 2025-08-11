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
import { AlertCircleIcon, LogIn } from "lucide-react";

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
    <div className="space-y-4">
      {/* Compact Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
          <LogIn className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue your adventure
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="mb-6">
            <OauthOptions />
          </div>

          {form.formState.errors.root && (
            <Alert
              variant="destructive"
              className="mb-6 border-l-4 border-l-destructive"
            >
              <AlertCircleIcon className="h-4 w-4" />
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Account Details
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                          placeholder="Enter your password"
                          className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                          disabled={signInMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full h-11 text-white font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <LogIn className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground mt-3 border-t border-border/50 pt-4">
            Don't have an account?{" "}
            <Link
              to="/sign-up"
              className="font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center space-x-1 group"
            >
              <span>Create account</span>
              <svg
                className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

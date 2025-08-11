import { Outlet } from "@tanstack/react-router";

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Outlet />
      </div>
    </div>
  );
}

export { AuthLayout };

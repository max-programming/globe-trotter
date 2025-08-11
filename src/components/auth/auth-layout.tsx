import { Outlet } from "@tanstack/react-router";

function AuthLayout() {
  return (
    <div>
      {/* Background decorative elements */}
      {/* <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" /> */}

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export { AuthLayout };

// Add blob animation keyframes to the global styles if not already present
// This can be added to the CSS file or as a style tag

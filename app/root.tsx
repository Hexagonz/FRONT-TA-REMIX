import {
  ErrorResponse,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import "./tailwind.css";
import { ToastContainer } from "react-toastify";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
  ];
}
// export your middleware as array of functions that Remix will call
// wrap middleware in serverOnly$ to prevent it from being bundled in the browser
// since remix doesn't know about middleware yet

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-inter">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
      <Outlet />
  );
}

export function ErrorBoundary() {
  const routeError = useRouteError();

  if (isRouteErrorResponse(routeError)) {
    const response = routeError as ErrorResponse;
    return (
      <>
        <div className="bg-gradient-to-t from-teal-200 to-teal-500 w-full h-dvh flex items-center justify-center *:text-white text-xl">
          <h1>
            {response.statusText} | {response.status}
          </h1>
        </div>
      </>
    );
  }
  const error = routeError as Error;
  return (
    <>
      <h1>ERROR!</h1>
      <p>{error.message}</p>
      <pre>{error.stack}</pre>
    </>
  );
}

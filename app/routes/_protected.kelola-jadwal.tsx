import { MetaFunction } from "@remix-run/node";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useMatches } from "@remix-run/react";
import Sidebar from "~/components/ui/dashboard";

export const meta: MetaFunction = () => {
  return [{ title: "Kelola Jadwal | Presenta" }];
};

export async function loader({ context }: LoaderFunctionArgs) {
  return null;
}

export default function Jadwal() {
  const matches = useMatches();
  const pathNow = matches[matches.length - 1].pathname;
  return (
    <div className="bg-[#00BBA7] w-full h-dvh bg-opacity-10 relative flex">
      <div className="fixed">
        <Sidebar pathNow={pathNow} />
      </div>
      <div className="ml-[49vh] flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

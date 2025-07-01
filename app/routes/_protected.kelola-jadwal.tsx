import { json, MetaFunction } from "@remix-run/node";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useMatches } from "@remix-run/react";
import Sidebar from "~/components/ui/dashboard";
import { getUserFromSession } from "~/services/session.services";

export const meta: MetaFunction = () => {
  return [{ title: "Kelola Jadwal | Presenta" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromSession(request);
  return json({ user });
}

export default function Jadwal() {
  const matches = useMatches();
  const pathNow = matches[matches.length - 1].pathname;
  const { user } = useLoaderData<typeof loader>();
  return (
    <div className="bg-[#00BBA7] w-full min-h-screen bg-opacity-10 relative flex">
      <div className="fixed">
        <Sidebar pathNow={pathNow} role={user?.role || ""} />
      </div>
      <div className="ml-[49vh] flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

import { CalendarCheck, Home, User } from "@mynaui/icons-react";
import { MetaFunction, LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import BottomNavbar from "~/components/ui/bottom-navbar";
import { getSession } from "~/services/session.services";

export const meta: MetaFunction = () => {
  return [{ title: "Absensi Siswa | Profile" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const role = session.get("role");
  const username = session.get("username");
  const name = session.get("name");
  return json({ role, username, name });
}

export type ProfileLoaderType = typeof loader;

export default function Profile() {
  const { role } = useLoaderData<typeof loader>();
  return (
    <div className="flex-col items-center justify-center bg-slate-100">
      <Outlet />
      <BottomNavbar role={role} />
    </div>
  );
}

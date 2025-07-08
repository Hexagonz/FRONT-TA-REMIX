import { CalendarCheck, Home, User } from "@mynaui/icons-react";
import { MetaFunction, LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import BottomNavbar from "~/components/ui/bottom-navbar";
import { getSession } from "~/services/session.services";

export const meta: MetaFunction = () => {
  return [{ title: "Absensi Siswa | Riwayat" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const role = session.get("role");

  return json({ role });
}

export default function Riwayat() {
  const { role } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-100">
      <Outlet />
      <BottomNavbar role={role} />
    </div>
  );
}

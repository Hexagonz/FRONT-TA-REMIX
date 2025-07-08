import { CalendarCheck, Home, User } from "@mynaui/icons-react";
import { MetaFunction, LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import BottomNavbar from "~/components/ui/bottom-navbar";
import { getSession } from "~/services/session.services";

export const meta: MetaFunction = () => {
  return [{ title: "Presensi Guru | Home" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const role = session.get("role") as string;
  if (role == "siswa") {
    throw new Response("Forbidden", {
      statusText: "Akses Ditolak",
      status: 403,
    });
  }
  return json({ role });
}

export default function Absensi() {
  const { role } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen flex flex-col items-center  bg-slate-100">
      <Outlet />
      <BottomNavbar role={role} />
    </div>
  );
}

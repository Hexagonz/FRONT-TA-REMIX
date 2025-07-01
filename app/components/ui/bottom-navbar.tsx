import { CalendarCheck, Home, User } from "@mynaui/icons-react";
import { Link, useLocation } from "@remix-run/react";

export default function BottomNavbar() {
  const location = useLocation();
  const pathNow = location.pathname;

  const navItems = [
    { path: "/absensi", Icon: Home },
    { path: "/riwayat", Icon: CalendarCheck },
    { path: "/profile", Icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full h-14 shadow-lg border-t border-slate-300 bg-white z-50">
      <div className="flex justify-around items-center h-full text-slate-600">
        {navItems.map(({ path, Icon }) => {
          const isActive = pathNow === path || pathNow.startsWith(path + "/");
          return (
            <Link
              key={path}
              to={path}
              className={`group flex flex-col items-center justify-center transition-all duration-200 ${
                isActive ? "text-slate-500" : "hover:text-slate-500"
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-all duration-200 group-hover:stroke-[2.5] ${
                  isActive ? "stroke-[2.5]" : ""
                }`}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

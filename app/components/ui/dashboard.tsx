import {
  AcademicHat,
  Archive,
  Book,
  Home,
  Logout,
  Presentation,
  UsersGroup,
} from "@mynaui/icons-react";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { User } from "lucide-react";

import AlertComponent from "~/components/ui/alert-component";



export default function Sidebar({ pathNow }: { pathNow: string }) {
  const navigate = useNavigate();
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", Icon: Home },
    { path: "/data-siswa", label: "Data Siswa", Icon: UsersGroup },
    { path: "/data-guru", label: "Data Guru", Icon: Archive },
    { path: "/data-jurusan", label: "Data Jurusan", Icon: AcademicHat },
    { path: "/data-kelas", label: "Data Kelas", Icon: Presentation },
    { path: "/mata-pelajaran", label: "Mata Pelajaran", Icon: Book },
    { path: "/kelola-user", label: "Kelola User", Icon: User },
  ];


  return (
    <div className="bg-white w-[45vh] h-screen shadow-[5px_5px_4px_0px_rgba(93,93,93,0.1)]">
      <h1 className="text-[#5D5D5D] font-bold text-center text-[30px] pt-2">
        <Link to="/dashboard">PRESENTA</Link>
      </h1>
      <span className="block w-full h-[2px] bg-[#5D5D5D] bg-opacity-15"></span>
      <div className="flex flex-col h-[88dvh] justify-between">
        <div className="text-[#00BBA7] flex flex-col space-y-2 mt-4 items-center *:pr-10 *:items-center *:flex *:justify-center *:gap-x-1">
          {menuItems.map(({ path, label, Icon }) => {
            const isActive = pathNow.includes(path) || pathNow.includes(`${path}/`);
            return (
              <Link
                key={path}
                to={path}
                className={`w-11/12 py-[10px] rounded-[10px] flex items-center group hover:bg-[#00BBA7] hover:bg-opacity-10 ${
                  isActive ? "bg-[#00BBA7] bg-opacity-10" : ""
                } ${
                  path.includes("/mata-pelajaran")
                    ? "pl-8"
                    : path.includes("/data-jurusan")
                    ? "pl-6"
                    : ""
                }`}
              >
                <Icon
                  className={`transition-all duration-200 group-hover:stroke-[2.5] ${
                    isActive ? "stroke-[2.5]" : ""
                  }`}
                />
                <p
                  className={`transition-all duration-200 group-hover:font-bold ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {label}
                </p>
              </Link>
            );
          })}
        </div>
        <div className="group ml-11 w-max">
          <AlertComponent
            className="flex items-center justify-center bg-transparent border-none text-[#5D5D5D] shadow-none hover:text-[#5D5D5D] hover:bg-transparent transition-all duration-200 group-hover:font-bold"
            text="Logout"
            Icon={Logout}
            classIcon="transition-all duration-200 group-hover:stroke-[2.5]"
            alertTitle="Anda Yakin Ingin Keluar?"
            onClick={() => {navigate('/logout')}}
            color="#00BBA7"
          />
        </div>
      </div>
    </div>
  );
}

import {
  ArrowLongRight,
  HomeSmile,
  User,
  UsersGroup,
} from "@mynaui/icons-react";
import { Link } from "@remix-run/react";
import React from "react";
import { Calendar } from "~/components/ui/calendar";
import Navbar from "~/components/ui/navbar";
import logo from "~/src/img/sma.png";
export default function Index() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="*:mx-2">
      <Navbar title="Dasboard" />
      <div className="flex gap-5">
        <div className="flex my-3 gap-5 *:w-[300px] *:h-[160px] *:bg-white *:rounded-[10px] *:shadow-md ">
          <div className="flex gap-2 items-center justify-start pl-10">
            <div className="relative w-10 h-10 flex justify-center items-center bg-[#4F6FFF] bg-opacity-10 rounded-full">
              <User className="rounded-full text-[#4F6FFF] absolute z-10 mx" />
            </div>
            <div className="*:font-bold *:text-[#5D5D5D]">
              <h1 className="text-base">100</h1>
              <p className="text-xs">Siswa</p>
            </div>
          </div>
        </div>
        <div className="flex my-3 gap-5 *:w-[300px] *:h-[160px] *:bg-white *:rounded-[10px] *:shadow-md ">
          <div className="flex gap-2 items-center justify-start pl-10">
            <div className="relative w-10 h-10 flex justify-center items-center bg-[#8E51FF] bg-opacity-10 rounded-full">
              <UsersGroup className="rounded-full text-[#8E51FF] absolute z-10 mx" />
            </div>
            <div className="*:font-bold *:text-[#5D5D5D]">
              <h1 className="text-base">20</h1>
              <p className="text-xs">Guru</p>
            </div>
          </div>
        </div>
        <div className="flex my-3 gap-5 *:w-[300px] *:h-[160px] *:bg-white *:rounded-[10px] *:shadow-md ">
          <div className="flex gap-2 items-center justify-start pl-10">
            <div className="relative w-10 h-10 flex justify-center items-center bg-[#E7000B] bg-opacity-10 rounded-full">
              <HomeSmile className="rounded-full text-[#E7000B] absolute z-10 mx" />
            </div>
            <div className="*:font-bold *:text-[#5D5D5D]">
              <h1 className="text-base">2</h1>
              <p className="text-xs">Ruang Kelas</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="w-[620px] h-[300px] bg-white rounded-[10px] shadow-md mr-5"></div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border w-[25%] mx-auto text-[#00BBA7] shadow-md"
        />
      </div>
      <div className="w-[96%] bg-white rounded-[10px] shadow-md my-5">
        <div className="flex py-5 justify-around">
          <div className="my-auto">
            <h1 className="text-[32px] font-bold text-[#484646]">
              Memantau aktivitas
              <br /> presensi secara
              <span className="text-[#00BBA7]">real-time.</span>
            </h1>
            <p className="text-[#5D5D5D] text-[10px] font-bold">
              Presensi SMANTA – Sistem Presensi Digital SMA Negeri 3 Pontianak
            </p>
              <Link
                to="#"
                className="flex items-center gap-x-2 underline text-[10px] text-[#00BBA7] font-bold my-5"
              >
                Baca Selengkapnya
                <ArrowLongRight className="text-[#00BBA7] w-4 h-4"/>
              </Link>
          </div>
          <div className="bg-[#25CAB8] rounded-full bg-opacity-40">
            <img src={logo} alt="sma" className="w-72 h-72" />
          </div>
        </div>
      </div>
    </div>
  );
}

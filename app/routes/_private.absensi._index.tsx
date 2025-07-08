import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { axios } from "~/services/axios.services";
import { getSession } from "~/services/session.services";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("access_token");
  const username = session.get("username");

  try {
    const { data } = await axios.get("/presensi", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const filter = data.data.filter(
      (item: any) => item.siswa.nisn === username
    );

    return json({ data: filter, token });
  } catch (error: any) {
    console.log(error.response);
    return json({ data: error?.data || [] });
  }
}

export default function Index() {
  const { data } = useLoaderData<typeof loader>();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  };
  const formatted = new Intl.DateTimeFormat("id-ID", options).format(now);

  const formatTime = (isoTime: string) => {
    return isoTime.substring(11, 16).replace(":", ".");
  };

  function gabungTanggalDenganJam(tanggal: Date, waktuISO: string) {
    const jam = new Date(waktuISO);
    const hasil = new Date(tanggal);
    hasil.setHours(jam.getUTCHours());
    hasil.setMinutes(jam.getUTCMinutes());
    hasil.setSeconds(0);
    hasil.setMilliseconds(0);
    return hasil;
  }
  const hariSekarang = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
  }).format(now);

  const jadwalHariIni = useMemo(() => {
    return data.filter((item: any) => item.jadwal.hari === hariSekarang);
  }, [data, now]);

  return (
    <div className="w-full h-screen pb-20 overflow-y-scroll [&::-webkit-scrollbar]:hidden scrollbar-hide">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-[#5D5D5D] ml-4 mt-4">
          Presensi Hari Ini
        </h1>
        <h1 className="font-bold text-[#5D5D5D] mr-4 mt-4 text-xs">
          {formatted}
        </h1>
      </div>

      {jadwalHariIni.length === 0 ? (
        <div className="text-center text-gray-500 mt-10 font-medium">
          Tidak ada jadwal hari ini
        </div>
      ) : (
        <div className="mt-4">
          <h2 className="ml-6 font-semibold text-[#444]">
            Hari {hariSekarang}
          </h2>

          {jadwalHariIni.map((presensi: any) => {
            const jadwal = presensi.jadwal;
            const jamMulai = gabungTanggalDenganJam(now, jadwal.jam_mulai);
            const jamSelesai = gabungTanggalDenganJam(now, jadwal.jam_selesai);

            const presensiAktif = now >= jamMulai && now <= jamSelesai;

            return (
              <div
                key={presensi.id_presensi}
                className="w-11/12 my-3 mx-auto rounded-md p-4 shadow-md bg-white relative"
              >
                <h1 className="font-bold text-[#333]">
                  {jadwal.guru.nama_guru} | {jadwal.guru.mapel.deskripsi}
                </h1>

                <p className="text-sm font-medium mt-1">
                  Kelas: {jadwal.kelas.kelas_romawi}{" "}
                  {presensi.siswa.jurusan.nama_jurusan}{" "}
                  {jadwal.ruang.nomor_ruang}
                </p>

                {/* Status Badge */}
                <div className="mt-1">
                  <span className="text-sm text-gray-700 mr-1">Status:</span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      presensi.progres === "idle"
                        ? "bg-red-100 text-red-700"
                        : presensi.progres === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {presensi.progres === "idle"
                      ? "Belum Absen"
                      : presensi.progres === "pending"
                      ? "Menunggu"
                      : "Sudah Absen"}
                  </span>
                </div>

                <p className="text-xs text-gray-700 mt-1">
                  Pukul: {formatTime(jadwal.jam_mulai)} -{" "}
                  {formatTime(jadwal.jam_selesai)} WIB
                </p>

                {presensiAktif && !presensi.status && (
                  <Link
                    to={`/absensi/start?id=${jadwal.id_jadwal}`}
                    className="absolute bottom-3 right-3 px-4 py-2 bg-green-500 text-white text-sm rounded-md font-medium hover:bg-green-600 transition"
                  >
                    Absen
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

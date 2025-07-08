import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { axios } from "~/services/axios.services";
import { getSession } from "~/services/session.services";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("access_token");
  const username = session.get("username");
  const name = session.get("name");

  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [jadwalRes, presensiRes] = await Promise.all([
      axios.get("/jadwal", { headers }),
      axios.get("/presensi", { headers }),
    ]);

    const jadwalData = jadwalRes.data.data;
    const presensiData = presensiRes.data.data;

    const filterJadwal = jadwalData.filter(
      (a: any) => a.guru.nip === username || a.guru.nama_guru === name
    );

    // Hitung jumlah siswa per id_kelas
    const jumlahSiswaPerKelas: Record<number, number> = {};
    presensiData.forEach((item: any) => {
      const id_kelas = item.jadwal.kelas?.id_kelas;
      if (!id_kelas) return;
      jumlahSiswaPerKelas[id_kelas] = (jumlahSiswaPerKelas[id_kelas] || 0) + 1;
    });

    return json({ data: filterJadwal, jumlahSiswaPerKelas });
  } catch (error: any) {
    console.error(error.response);
    return json({ data: [], jumlahSiswaPerKelas: {} });
  }
}

export default function Index() {
  const { data, jumlahSiswaPerKelas } = useLoaderData() as {
    data: any[];
    jumlahSiswaPerKelas: Record<number, number>;
  };

  const now = new Date();
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

  const getPresensiStatus = (jadwal: any): "dimulai" | "berakhir" | "belum" => {
    const now = new Date();
    const hariNow = now
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toLowerCase();
    const hariJadwal = jadwal.hari.toLowerCase();

    const jamMulai = new Date();
    const jamSelesai = new Date();

    jamMulai.setHours(parseInt(jadwal.jam_mulai.substring(11, 13)));
    jamMulai.setMinutes(parseInt(jadwal.jam_mulai.substring(14, 16)));
    jamMulai.setSeconds(0);

    jamSelesai.setHours(parseInt(jadwal.jam_selesai.substring(11, 13)));
    jamSelesai.setMinutes(parseInt(jadwal.jam_selesai.substring(14, 16)));
    jamSelesai.setSeconds(0);

    if (hariNow !== hariJadwal) return "belum";
    if (now >= jamSelesai) return "berakhir";
    if (now >= jamMulai) return "dimulai";
    return "belum";
  };

  const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const jadwalPerHari: Record<string, typeof data> = {};
  urutanHari.forEach((hari) => {
    jadwalPerHari[hari] = data.filter((item: any) => item.hari === hari);
  });

  return (
    <div className="w-full h-screen pb-20 overflow-y-scroll [&::-webkit-scrollbar]:hidden scrollbar-hide">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-[#5D5D5D] ml-4 mt-4">
          Jadwal Minggu Ini
        </h1>
        <h1 className="font-bold text-[#5D5D5D] mr-4 mt-4 text-xs">
          {formatted}
        </h1>
      </div>

      {urutanHari.map(
        (hari) =>
          jadwalPerHari[hari].length > 0 && (
            <div key={hari} className="mt-4">
              <h2 className="ml-6 font-semibold text-[#444]">Hari {hari}</h2>

              {jadwalPerHari[hari].map((jadwal: any) => {
                const status = getPresensiStatus(jadwal);
                return (
                  <div
                    key={jadwal.id_jadwal}
                    className="w-11/12 my-3 mx-auto rounded-md bg-white p-4 shadow-md space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="font-bold text-[#545353]">
                          Kelas {jadwal.kelas.kelas_romawi}{" "}
                          {jadwal.ruang.jurusan.nama_jurusan}{" "}
                          {jadwal.kelas.nama_kelas}{" "}
                          <span className="font-normal">|</span>{" "}
                          {jadwal.guru.mapel.nama_mapel}
                        </h1>
                        <p className="text-xs font-medium text-[#545353] mt-1">
                          Pukul: {formatTime(jadwal.jam_mulai)} -{" "}
                          {formatTime(jadwal.jam_selesai)} WIB
                        </p>
                        <p className="text-xs font-medium text-[#545353] py-1">
                          Jumlah Siswa:{" "}
                          {jumlahSiswaPerKelas[jadwal.kelas.id_kelas] ?? 0}{" "}
                          orang
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                          status === "dimulai"
                            ? "bg-green-100 text-green-700"
                            : status === "berakhir"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status === "dimulai"
                          ? "Presensi Dimulai"
                          : status === "berakhir"
                          ? "Presensi Berakhir"
                          : "Belum Dimulai"}
                      </span>
                    </div>

                    {/* Tombol Lihat */}
                    <div className="flex justify-end">
                      <Link
                        to={`/presensi/view?id=${jadwal.id_jadwal}`}
                        className="px-4 py-2 bg-white text-[#545353] text-sm rounded-md font-medium border border-slate-300 shadow hover:shadow-md transition hover:bg-slate-200"
                      >
                        Lihat
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}
    </div>
  );
}

import Navbar from "~/components/ui/navbar";
import { Button } from "~/components/ui/button";
import { Plus } from "@mynaui/icons-react";
import { Input } from "~/components/ui/input";
import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { axios } from "~/services/axios.services";
import { sessionStorage } from "~/services/session.services";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const token = session.get("access_token");

  try {
    const [kelasRes, jadwalRes] = await Promise.all([
      axios.get("/kelas", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("/jadwal", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    return json({
      token,
      kelas: kelasRes.data.data,
      jadwal: jadwalRes.data.data,
    });
  } catch (error) {
    const err = error as AxiosError;
    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch data",
      },
      { status: err.response?.status || 500 }
    );
  }
}

function romawiKeAngka(romawi: string): number {
  const nilai: { [key: string]: number } = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  for (let i = 0; i < romawi.length; i++) {
    const now = nilai[romawi[i]];
    const next = nilai[romawi[i + 1]];
    if (next && now < next) {
      total += next - now;
      i++;
    } else {
      total += now;
    }
  }
  return total;
}

export default function Index() {
  const { token, kelas = [], jadwal = [] } = useLoaderData<typeof loader>() as {
    token: string;
    kelas?: any[];
    jadwal?: any[];
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const data = params.get("success");
    if (data) {
      toast.success(
        data === "1"
          ? "Sukses Menambahkan Jadwal"
          : data === "2"
          ? "Sukses Mengedit Jadwal"
          : "Sukses Menghapus Jadwal",
        {
          position: "top-center",
          autoClose: 2997,
          transition: Bounce,
        }
      );
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [location]);

  const filteredKelas = kelas.filter((k) =>
    [k.nama_kelas, k.kelas_romawi].some((v) =>
      v?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const kelasRomawiTerurut = Array.from(
    new Set(filteredKelas.map((k) => k.kelas_romawi))
  ).sort((a, b) => romawiKeAngka(a) - romawiKeAngka(b));

  const jurusanUnik = Array.from(
    new Set(jadwal.map((j: any) => j.ruang?.jurusan?.nama_jurusan))
  );

  return (
    <div className="*:mx-2">
      <Navbar title="Kelola Data Jadwal" />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-4 text-[#5D5D5D] pt-2">
          <p className="text-sm">Search: </p>
          <Input
            className="bg-white rounded-none w-60"
            placeholder="Cari Jadwal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link to="/kelola-jadwal/add">
          <Button className="mr-4 bg-[#00BBA7] hover:bg-[#00BBA7AA] *:font-bold">
            <Plus className="stroke-[2.5]" /> Tambah Jadwal
          </Button>
        </Link>
      </div>

      <div className="my-5 w-[96%] mx-auto py-4">
        {kelasRomawiTerurut.map((kelasRomawi) => {
          return (
            <div key={kelasRomawi} className="mb-10">
              <div className="text-slate-500 font-bold text-lg">
                Kelas {kelasRomawi}
              </div>
              <div className="w-full h-px bg-slate-400 mb-4" />

              <div className="flex flex-wrap gap-6">
                {jurusanUnik.map((namaJurusan) => {
                  // ambil ruang yg memiliki jadwal untuk kelas dan jurusan tsb
                  const ruangUntukKelasDanJurusan = jadwal
                    .filter(
                      (j) =>
                        j.kelas?.kelas_romawi === kelasRomawi &&
                        j.ruang?.jurusan?.nama_jurusan === namaJurusan
                    )
                    .map((j) => j.ruang)
                    .filter(
                      (v, i, a) =>
                        a.findIndex((t) => t.id_ruang === v.id_ruang) === i
                    );

                  if (ruangUntukKelasDanJurusan.length === 0) return null;

                  return ruangUntukKelasDanJurusan.map((r: any) => (
                    <div
                      key={r.id_ruang}
                      className="bg-white min-h-[10rem] w-48 rounded-lg shadow-lg p-4 text-slate-600 flex flex-col justify-between items-center"
                    >
                      <div className="font-semibold text-xl text-center">
                       {kelasRomawi} {r.jurusan?.nama_jurusan} {r.nomor_ruang}
                      </div>

                      <div className="mt-4">
                        <Link
                          to={`/kelola-jadwal/view?ruang=${r.id_ruang}&jurusan=${r.jurusan?.nama_jurusan}&kelas=${kelasRomawi}`}
                        >
                          <Button className="bg-[#00BBA7] hover:bg-[#00BBA7AA] text-white text-xs px-2 py-1">
                            Lihat Jadwal
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ));
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ToastContainer />
    </div>
  );
}

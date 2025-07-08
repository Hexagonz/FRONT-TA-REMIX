import { ArrowLeft, Eye } from "@mynaui/icons-react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { axios, axiosPy } from "~/services/axios.services";
import { getSession } from "~/services/session.services";
import { useEffect, useState } from "react";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("access_token");

  if (!id) throw new Response("ID tidak ditemukan", { status: 400 });

  const headers = { Authorization: `Bearer ${token}` };

  let jadwal: any;
  try {
    const res = await axios.get(`/jadwal/${id}`, { headers });
    jadwal = res.data.data;
    if (!jadwal) throw new Error();
  } catch (err: any) {
    console.error("❌ Gagal ambil jadwal:", err.response?.data || err.message);
    throw new Response("Jadwal tidak ditemukan", { status: 404 });
  }

  let siswa: any[] = [];
  try {
    const ruang = jadwal.ruang;
    if (!ruang?.id_jurusan || !jadwal.id_kelas || !jadwal.id_ruang) {
      throw new Response("Data ruang tidak lengkap", { status: 400 });
    }

    const siswaRes = await axios.get(
      `/siswa/filter?id_jurusan=${ruang.id_jurusan}&id_kelas=${jadwal.id_kelas}&id_ruang=${jadwal.id_ruang}`,
      { headers }
    );
    siswa = siswaRes.data.data || [];
  } catch (err: any) {
    console.warn(
      "⚠️ Gagal ambil data siswa:",
      err.response?.data || err.message
    );
  }

  let presensi: any[] = [];
  try {
    const presensiRes = await axios.get(`/presensi/jadwal/${id}`, { headers });
    presensi = presensiRes.data.data || [];
  } catch (err: any) {
    console.warn(
      "⚠️ Gagal ambil data presensi:",
      err.response?.data || err.message
    );
  }

  return json({ data: jadwal, siswa, presensi, token });
}

export default function ViewJadwal() {
  const navigate = useNavigate();
  const { data, siswa, presensi, token } = useLoaderData<typeof loader>();
  const [hydrated, setHydrated] = useState(false);
  const [absensiAktif, setAbsensiAktif] = useState(false);
  const [loading, setLoading] = useState(false);
  const [absenMulaiJam, setAbsenMulaiJam] = useState<string | null>(null);
  const [presensiDimulai, setPresensiDimulai] = useState(false);
  const [imageDetail, setImageDetail] = useState<{ [id: number]: any }>({});
  const [loadingImageId, setLoadingImageId] = useState<number | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const formatTime = (iso: string) => iso.substring(11, 16).replace(":", ".");

  const getImage = async ({
    nama,
    nim,
    mapel,
    tanggal,
  }: {
    nama: string;
    nim: string;
    mapel: string;
    tanggal: Date;
  }) => {
    try {
      const formattedDate = tanggal.toISOString().split("T")[0];
      const response = await axiosPy.get(
        `/get-absensi-detail?nama_siswa=${encodeURIComponent(
          nama
        )}&nim=${encodeURIComponent(nim)}&mapel=${encodeURIComponent(
          mapel.toLowerCase()
        )}&tanggal=${formattedDate}`
      );
      return response.data;
    } catch (error: any) {
      console.error("[Get Image Error]", error);
      return {
        data: {
          images: [],
        },
        error: true,
        message: error?.response?.data?.error || "Gagal mengambil data absensi",
      };
    }
  };

  const fetchImageDetail = async (item: any) => {
    setLoadingImageId(item.id_siswa);
    const tanggal = new Date(item.uploaded_at);

    const res = await getImage({
      nama: item.siswa.nama_siswa,
      nim: item.siswa.nisn,
      mapel: data.guru.mapel.deskripsi,
      tanggal,
    });

    setImageDetail((prev) => ({
      ...prev,
      [item.id_siswa]: res.data?.images || [],
    }));
    setLoadingImageId(null);
  };

  async function handlePreparePresensi() {
    try {
      setLoading(true);

      if (!token) {
        toast.error("Token tidak ditemukan!");
        return;
      }

      const res = await axios.post(
        "/presensi/prepare",
        { id_jadwal: data.id_jadwal },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const now = new Date();
      const jamMulai = now.toTimeString().substring(0, 5).replace(":", ".");
      setAbsenMulaiJam(jamMulai);

      toast.success(res.data.message || "Presensi berhasil disiapkan!", {
        position: "top-center",
        autoClose: 3000,
        theme: "light",
        transition: Bounce,
        className: "toast-mobile",
      });

      navigate(`/presensi/view?id=${data.id_jadwal}`, { replace: true });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Terjadi kesalahan saat membuat presensi",
        {
          position: "top-center",
          autoClose: 3000,
          theme: "light",
          transition: Bounce,
          className: "toast-mobile",
        }
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const getTodayTime = (iso: string): Date => {
      const [hour, minute] = iso.substring(11, 16).split(":").map(Number);
      const now = new Date();
      now.setHours(hour, minute, 0, 0);
      return new Date(now);
    };

    const isSameWeekAndDay = (d1: Date, d2: Date) => {
      const getWeekNumber = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear =
          (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
      return (
        getWeekNumber(d1) === getWeekNumber(d2) &&
        d1.getFullYear() === d2.getFullYear() &&
        d1.getDay() === d2.getDay()
      );
    };

    const checkAbsensi = () => {
      const now = new Date();
      const hariNow = now
        .toLocaleDateString("id-ID", { weekday: "long" })
        .toLowerCase();
      const hariJadwal = data.hari.toLowerCase();
      const mulai = getTodayTime(data.jam_mulai);

      const isSameDay = hariNow === hariJadwal;
      const inWaktu = now >= mulai;

      setAbsensiAktif(isSameDay && inWaktu);

      const todayPresensi = presensi.find((p: any) => {
        const presensiDate = new Date(p.tanggal);
        return isSameWeekAndDay(presensiDate, now);
      });

      if (todayPresensi) {
        const waktu = new Date(todayPresensi.tanggal);
        const jam = waktu.toTimeString().substring(0, 5).replace(":", ".");
        setPresensiDimulai(true);
        setAbsenMulaiJam(jam);
      } else {
        setPresensiDimulai(false);
        setAbsenMulaiJam("");
      }
    };

    checkAbsensi();
    const interval = setInterval(checkAbsensi, 1000);
    return () => clearInterval(interval);
  }, [data, presensi]);

  return (
    <div className="w-full">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="flex items-start pt-6 gap-x-24">
        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(-1);
          }}
          className="text-[#5D5D5D] hover:text-slate-500 ml-5"
        >
          <ArrowLeft className="stroke-[2.5]" />
        </Link>
        <h1 className="text-sm font-bold text-[#5D5D5D]">Detail Jadwal</h1>
      </div>

      <div
        className="w-11/12 my-3 mx-auto rounded-md p-4 relative"
        style={{
          boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                    0 2px 4px -2px rgba(0, 0, 0, 0.1),
                    0 -4px 6px -1px rgba(0, 0, 0, 0.1), 
                    0 -2px 4px -2px rgba(0, 0, 0, 0.1)`,
        }}
      >
        <p className="text-sm font-bold text-[#545353]">
          Guru : {data.guru.nama_guru}
        </p>
        <p className="text-sm font-bold text-[#545353] mb-2">
          Mata Pelajaran: {data.guru.mapel.deskripsi} (
          {data.guru.mapel.nama_mapel})
        </p>
        <p className="text-sm text-[#545353]">Hari: {data.hari}</p>
        <p className="text-sm text-[#545353]">
          Jam: {formatTime(data.jam_mulai)} - {formatTime(data.jam_selesai)} WIB
        </p>
        <p className="text-sm text-[#545353] mb-4">
          Kelas: {data.kelas.kelas_romawi} {data.ruang.jurusan.nama_jurusan}{" "}
          {data.ruang.nomor_ruang}
        </p>
        {hydrated && presensiDimulai && absenMulaiJam && (
          <p className="text-xs text-slate-500 mt-2">
            Presensi Dimulai:{" "}
            <span className="font-semibold">{absenMulaiJam} WIB</span>
          </p>
        )}

        <Button
          className={`absolute right-2 bottom-2 ${
            !absensiAktif || loading || presensiDimulai || siswa.length === 0
              ? "cursor-not-allowed opacity-50"
              : ""
          }`}
          disabled={
            !absensiAktif || loading || presensiDimulai || siswa.length === 0
          }
          title={
            siswa.length === 0
              ? "Tidak bisa mulai presensi karena data siswa kosong"
              : presensiDimulai
              ? "Presensi sudah dimulai"
              : !absensiAktif
              ? `Absensi hanya aktif pada hari ${data.hari}, pukul ${formatTime(
                  data.jam_mulai
                )} - ${formatTime(data.jam_selesai)} WIB`
              : ""
          }
          onClick={handlePreparePresensi}
        >
          {loading
            ? "Memproses..."
            : presensiDimulai
            ? "Presensi Berjalan"
            : siswa.length === 0
            ? "Siswa Kosong"
            : absensiAktif
            ? "Mulai Absensi"
            : "Belum Dimulai"}
        </Button>
      </div>

      <div className="w-11/12 mx-auto mt-6 mb-10">
        <h2 className="text-sm font-semibold mb-2 text-[#545353]">
          Daftar Siswa
        </h2>
        <Table className="*:text-[#545353]">
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">No</TableHead>
              <TableHead className="font-bold text-left">Nama Siswa</TableHead>
              {presensiDimulai && (
                <>
                  <TableHead className="font-bold text-left">Status</TableHead>
                  <TableHead className="font-bold text-left">Action</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {presensiDimulai && presensi.length > 0 ? (
              presensi.map((item: any) => (
                <TableRow key={item.id_siswa}>
                  <TableCell>{item.siswa.no_absen}</TableCell>
                  <TableCell>{item.siswa.nama_siswa}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded font-medium text-[10px] ${
                        item.progres === "idle"
                          ? "bg-red-100 text-red-700"
                          : item.progres === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.progres === "idle"
                        ? "-"
                        : item.progres === "pending"
                        ? "Menunggu"
                        : "Hadir"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
                          onClick={() => fetchImageDetail(item)}
                        >
                          <Eye className="text-[#4F6FFF]" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby={`desc-${item.id_siswa}`}>
                        <DialogHeader>
                          <DialogTitle>Detail Presensi</DialogTitle>
                        </DialogHeader>

                        <div
                          id={`desc-${item.id_siswa}`}
                          className="text-sm text-gray-600 space-y-1"
                        >
                          <div>
                            <span className="font-semibold">Nama:</span>{" "}
                            {item.siswa.nama_siswa}
                          </div>
                          <div>
                            <span className="font-semibold">No Absen:</span>{" "}
                            {item.siswa.no_absen}
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>
                            {item.status == null
                              ? "-"
                              : item.status == "masuk"
                              ? "Hadir"
                              : item.status === "izin"
                              ? "Izin"
                              : "Alpa"}
                          </div>

                          {imageDetail[item.siswa.id_siswa]?.length > 0 ? (
                            imageDetail[item.siswa.id_siswa].map(
                              (img: any, idx: number) => (
                                <img
                                  key={idx}
                                  src={`http://127.0.0.1:5005/${img.url}`}
                                  alt={`Presensi ${item.siswa.nama_siswa}`}
                                  className="w-36 h-auto rounded shadow mx-auto"
                                />
                              )
                            )
                          ) : (
                            <div className="text-sm text-gray-400 mt-2">
                              Tidak ada gambar ditemukan
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Tutup</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : siswa.length > 0 ? (
              siswa.map((item: any) => (
                <TableRow key={item.id_siswa}>
                  <TableCell>{item.no_absen}</TableCell>
                  <TableCell>{item.nama_siswa}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={presensiDimulai ? 4 : 2}
                  className="text-center text-sm text-gray-500"
                >
                  Siswa tidak ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { axios } from "~/services/axios.services";
import { sessionStorage } from "~/services/session.services";
import { ArrowLeft, EditOne, Trash } from "@mynaui/icons-react";
import { Link } from "@remix-run/react";
import { Card, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import AlertComponent from "~/components/ui/alert-component";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const ruang = url.searchParams.get("ruang");
  const jurusan = url.searchParams.get("jurusan")?.toLowerCase();
  const kelas = url.searchParams.get("kelas")?.toLowerCase();

  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const token = session.get("access_token");

  const { data } = await axios.get("/jadwal", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const filtered = data.data.filter((item: any) => {
    return (
      item.ruang.id_ruang === Number(ruang) &&
      item.ruang.jurusan.nama_jurusan.toLowerCase() === jurusan &&
      item.kelas.kelas_romawi.toLowerCase() === kelas
    );
  });

  return json({ data: filtered, kelas, ruang, jurusan, token });
}

export default function ViewJadwal() {
  const { data, token, ruang, kelas, jurusan } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const jadwalPerHari: { [hari: string]: any[] } = {};
  urutanHari.forEach((hari) => {
    jadwalPerHari[hari] = data
      .filter((j: any) => j.hari.toLowerCase() === hari.toLowerCase())
      .sort(
        (a: any, b: any) =>
          new Date(a.jam_mulai).getTime() - new Date(b.jam_mulai).getTime()
      );
  });

  const handleDelete = async (
    id_jadwal: string,
    searchParams: URLSearchParams
  ) => {
    try {
      await axios.delete(`/jadwal/${id_jadwal}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      navigate(
        `/kelola-jadwal/view?kelas=${kelas}&ruang=${ruang}&jurusan=${jurusan}&success=delete`,
        { replace: true }
      );
    } catch (error) {
      console.error("Gagal menghapus jadwal:", error);
    }
  };
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-x-4">
          <Link
            to="/kelola-jadwal"
            className="text-[#5D5D5D] hover:text-[#00BBA7]"
          >
            <ArrowLeft className="stroke-[2.5]" />
          </Link>
          <h1 className="text-2xl font-bold text-[#5D5D5D]">
            Lihat Jadwal - {kelas?.toUpperCase()} {jurusan?.toUpperCase()}{" "}
            {ruang}
          </h1>
        </div>

        <Link
          to={`/kelola-jadwal/tambah-jadwal?kelas=${kelas}&jurusan=${jurusan}&ruang=${ruang}`}
          className="bg-[#00BBA7] text-white px-4 py-2 rounded-full hover:bg-[#00BBA7aa] text-sm font-semibold transition-all"
        >
          + Tambah Jadwal
        </Link>
      </div>

      {urutanHari.map((hari) => {
        const jadwals = jadwalPerHari[hari];
        if (!jadwals || jadwals.length === 0) return null;

        return (
          <Card key={hari} className="mb-6 shadow-md border border-gray-200">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-[#5D5D5D] mb-4 flex justify-between items-center">
                Hari {hari}
                <Link
                  to={`/kelola-jadwal/tambah-hari?kelas=${kelas}&jurusan=${jurusan}&ruang=${ruang}&hari=${hari}`}
                  className="bg-[#00BBA7] text-white px-3 py-1 rounded-full text-sm hover:bg-[#00BBA7aa]"
                >
                  + Tambah Jadwal Hari Ini
                </Link>
              </h2>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#25CAB8]/10 text-[#5D5D5D] font-semibold">
                    <TableHead>No</TableHead>
                    <TableHead className="text-center">Jam Mulai</TableHead>
                    <TableHead className="text-center">Jam Selesai</TableHead>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Guru</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead className="pl-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jadwals.map((jadwal: any, index: number) => (
                    <TableRow key={jadwal.id_jadwal}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-center">
                        {jadwal.jam_mulai.slice(11, 16)}
                      </TableCell>
                      <TableCell className="text-center">
                        {jadwal.jam_selesai.slice(11, 16)}
                      </TableCell>
                      <TableCell>{jadwal.guru.mapel.nama_mapel}</TableCell>
                      <TableCell>{jadwal.guru.nama_guru}</TableCell>
                      <TableCell>
                        {jadwal.ruang.jurusan.nama_jurusan}{" "}
                        {jadwal.ruang.nomor_ruang}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {/* Edit Button */}
                        <Button
                          asChild
                          className="bg-[#FFBA0033] rounded hover:bg-[#FFBA00] *:hover:text-white"
                        >
                          <Link to={`/kelola-jadwal/edit/${jadwal.id_jadwal}`}>
                            <EditOne className="text-[#FFBA00]" />
                          </Link>
                        </Button>

                        {/* Delete Button */}
                        <AlertComponent
                          className="bg-[#FB2C3633] rounded hover:bg-[#FB2C36] *:hover:text-white"
                          Icon={Trash}
                          classIcon="text-[#FB2C36]"
                          alertTitle="Anda Yakin Ingin Menghapus Data Jadwal Ini?"
                          onClick={() =>
                            handleDelete(jadwal.id_jadwal, searchParams)
                          }
                          color="#FB2C36"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

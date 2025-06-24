import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import Navbar from "~/components/ui/navbar";
import { Button } from "~/components/ui/button";
import { EditOne, Eye, Plus, Filter } from "@mynaui/icons-react";
import { Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import AlertComponent from "~/components/ui/alert-component";
import { Input } from "~/components/ui/input";
import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import axios from "~/services/axios.services";
import { sessionStorage } from "~/services/session.services";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export async function loader({ request }: LoaderFunctionArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  const token = session.get("access_token");

  try {
    const { data } = await axios.get("/siswa", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return json({
      token,
      data,
    });
  } catch (error) {
    const err = error as AxiosError;

    console.error(
      "Gagal fetch Siswas:",
      err.response?.status,
      err.response?.data
    );

    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch Siswa",
        data: err.response?.data,
      },
      { status: err.response?.status || 500 }
    );
  }
}

export default function Index() {
  const { token, data } = useLoaderData<typeof loader>() as {
    data: any;
    token: string;
  };
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState<string[]>([]);
  const [selectedJurusan, setSelectedJurusan] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const kelasList = Array.from(
    new Set(data.data.map((s: any) => s.kelas.nama_kelas))
  );
  const jurusanList = Array.from(
    new Set(data.data.map((s: any) => s.jurusan.nama_jurusan))
  );

  const filteredSiswas = data.data
    .filter((siswa: any) => {
      const matchesSearch = [
        siswa.nama_siswa,
        siswa.nisn,
        siswa.absen,
        siswa.kelas.nama_kelas,
        siswa.jurusan.nama_jurusan,
      ].some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesKelas =
        selectedKelas.length === 0 ||
        selectedKelas.includes(siswa.kelas.nama_kelas);
      const matchesJurusan =
        selectedJurusan.length === 0 ||
        selectedJurusan.includes(siswa.jurusan.nama_jurusan);

      return matchesSearch && matchesKelas && matchesJurusan;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "nama_asc")
        return a.nama_siswa.localeCompare(b.nama_siswa);
      if (sortBy === "nama_desc")
        return b.nama_siswa.localeCompare(a.nama_siswa);
            if (sortBy === "absen_asc")
        return a.no_absen - b.no_absen;
      if (sortBy === "absen_desc")
        return b.no_absen - a.no_absen;
      if (sortBy === "nisn_asc") return parseInt(a.nisn) - parseInt(b.nisn);
      if (sortBy === "nisn_desc") return parseInt(b.nisn) - parseInt(a.nisn);
      return 0;
    });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const data = params.get("success");
    if (data) {
      toast.success(
        data === "1"
          ? "Sukses Menambahkan Siswa Baru"
          : data === "2"
          ? "Sukses Mengedit Data Siswa"
          : "Sukses Menghapus Data Siswa",
        {
          position: "top-center",
          autoClose: 2997,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        }
      );
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [location]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/siswa/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          withCredentials: true,
        },
      });
      navigate("/data-siswa?success=3", { replace: true });
    } catch (error) {
      console.error("Gagal hapus:", error);
    }
  };

  return (
    <div className="*:mx-2">
      <Navbar title="Kelola Data Siswa" />
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center pt-2 text-[#5D5D5D]">
        <div className="flex flex-wrap items-center gap-4">
          <h1>Serach: </h1>
          <Input
            className="bg-white rounded-none w-60"
            placeholder="Cari Nama / NISN / Kelas / Jurusan"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="relative inline-block">
            <Button
              variant="outline"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="mr-1" /> Filter
            </Button>

            {showFilter && (
              <div className="absolute z-10 top-full mt-2 right-0 w-64 p-3 border rounded bg-white shadow space-y-2">
                <div>
                  <p className="text-sm font-semibold">Filter Jurusan:</p>
                  {jurusanList.map((j: any) => (
                    <label key={j} className="flex gap-1 items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedJurusan.includes(j)}
                        className="appearance-none w-4 h-4 border border-gray-400 rounded-sm bg-white checked:bg-[#00BBA7] checked:border-transparent focus:outline-none"
                        onChange={(e) => {
                          setSelectedJurusan((prev) =>
                            e.target.checked
                              ? [...prev, j]
                              : prev.filter((item) => item !== j)
                          );
                        }}
                      />
                      {j}
                    </label>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold">Filter Kelas:</p>
                  {kelasList.map((k: any) => (
                    <label key={k} className="flex gap-1 items-center text-sm">
                      <input
                        type="checkbox"
                        className="appearance-none w-4 h-4 border border-gray-400 rounded-sm bg-white checked:bg-[#00BBA7] checked:border-transparent focus:outline-none"
                        checked={selectedKelas.includes(k)}
                        onChange={(e) => {
                          setSelectedKelas((prev) =>
                            e.target.checked
                              ? [...prev, k]
                              : prev.filter((item) => item !== k)
                          );
                        }}
                      />
                      {k}
                    </label>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold">Urutkan:</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full bg-white outline-none"
                  >
                    <option value="">Default</option>
                    <option value="nama_asc">Nama (A - Z)</option>
                    <option value="nama_desc">Nama (Z - A)</option>
                    <option value="absen_asc">Absen (1 - 10)</option>
                    <option value="absen_desc">Absen (10 - 1)</option>
                    <option value="nisn_asc">NISN Terendah</option>
                    <option value="nisn_desc">NISN Tertinggi</option>
                  </select>
                </div>
                <div className="pt-1 text-right">
                  <button
                    onClick={() => setShowFilter(false)}
                    className="bg-[#00BBA7] text-white px-3 py-1 rounded hover:bg-[#00BBA7cc] text-sm"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <Link to="/data-siswa/add">
          <Button className="mr-4 bg-[#00BBA7] hover:bg-[#00BBA7AA] *:font-bold">
            <Plus className="stroke-[2.5]" /> Tambah Data Siswa
          </Button>
        </Link>
      </div>

      <div className="w-[97%] bg-white h-max rounded-lg shadow-sm my-5 *:text-[#5D5D5D] ">
        <Table>
          {filteredSiswas.length === 0 && (
            <TableCaption className="bg-transparent pb-2">
              Data tidak ditemukan
            </TableCaption>
          )}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] text-left pl-10">
                Nama Siswa
              </TableHead>
              <TableHead className="text-center">NISN</TableHead>
              <TableHead className="text-center">Jurusan</TableHead>
              <TableHead className="text-center">Kelas</TableHead>
              <TableHead className="text-center">No Absen</TableHead>
              <TableHead className="text-right pr-12">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="*:text-center">
            {filteredSiswas.map((siswa: any) => (
              <TableRow key={siswa.id_siswa}>
                <TableCell className="flex justify-start items-center gap-x-2 text-left">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  {siswa.nama_siswa}
                </TableCell>
                <TableCell className="text-center">{siswa.nisn}</TableCell>
                <TableCell className="text-center">
                  {siswa.jurusan.nama_jurusan}
                </TableCell>
                <TableCell className="text-center">
                  {siswa.kelas.nama_kelas}
                </TableCell>
                <TableCell className="text-center">{siswa.no_absen}</TableCell>
                <TableCell className="text-right  w-max *:w-8 *:h-8 *:mx-1">
                  <Button
                    asChild
                    className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
                  >
                    <Link to={`/data-siswa/view/${siswa.id_siswa}`}>
                      <Eye className="text-[#4F6FFF] " />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-[#FFBA0033] rounded hover:bg-[#FFBA00] *:hover:text-white"
                  >
                    <Link to={`/data-siswa/${siswa.id_siswa}`}>
                      <EditOne className="text-[#FFBA00]" />
                    </Link>
                  </Button>
                  <AlertComponent
                    className="bg-[#FB2C3633] rounded hover:bg-[#FB2C36] *:hover:text-white"
                    Icon={Trash}
                    classIcon="text-[#FB2C36]"
                    alertTitle="Anda Yakin Ingin Menghapus Data Tersebut?"
                    onClick={() => handleDelete?.(siswa.id_siswa)}
                    color="#FB2C36"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ToastContainer />
    </div>
  );
}

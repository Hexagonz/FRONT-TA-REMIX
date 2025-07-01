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
import { EditOne, Eye, Plus } from "@mynaui/icons-react";
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
import { axios } from "~/services/axios.services";
import { sessionStorage } from "~/services/session.services";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PaginationControls } from "~/components/ui/pagination-controls";

export async function loader({ request }: LoaderFunctionArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  const token = session.get("access_token");

  try {
    const { data } = await axios.get("/ruang-kelas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return json({
      token,
      data,
    });
  } catch (error) {
    console.log(error);
    const err = error as AxiosError;

    console.error(
      "Gagal fetch ruangan:",
      err.response?.status,
      err.response?.data
    );

    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch ruangan",
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const filteredRuangans = data.data.filter((ruangan: any) =>
    [ruangan.nomor_ruang, ruangan.jurusan.nama_jurusan].some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredRuangans.slice(startIndex, endIndex);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const data = params.get("success");
    if (data) {
      toast.success(
        data === "1"
          ? "Sukses Menambahkan ruangan Baru"
          : data === "2"
          ? "Sukses Mengedit Data ruangan"
          : "Sukses Menghapus Data ruangan",
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
      await axios.delete(`/ruang-kelas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          withCredentials: true,
        },
      });
      navigate("/data-ruangan?success=3", { replace: true });
    } catch (error) {
      console.error("Gagal hapus:", error);
    }
  };
  return (
    <div className="*:mx-2">
      <Navbar title="Kelola Data ruangan" />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-4 text-[#5D5D5D] pt-2">
          <p className="text-sm">Search: </p>
          <Input
            className="bg-white rounded-none w-60"
            placeholder="Cari Ruangan"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link to="/data-ruangan/add">
          <Button className="mr-4 bg-[#00BBA7] hover:bg-[#00BBA7AA] *:font-bold">
            <Plus className="stroke-[2.5]" /> Tambah Data Ruangan
          </Button>
        </Link>
      </div>
      <div className="w-[97%] bg-white h-max rounded-lg shadow-sm my-5 *:text-[#5D5D5D] ">
        <Table>
          {filteredRuangans.length == 0 ? (
            <TableCaption className="bg-transparent pb-2">
              Data tidak ditemukan
            </TableCaption>
          ) : null}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[190px] text-center">
                No Ruangan
              </TableHead>
              <TableHead className="w-[600px] text-center">Jurusan</TableHead>
              <TableHead className="text-right pr-12">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="*:text-center">
            {currentData.map((ruangan: any) => (
              <TableRow key={ruangan.id_ruang}>
                <TableCell className="flex justify-center items-center gap-x-2">
                  <Avatar>
                    <AvatarFallback className="font-bold text-[#00BBA7]">
                      {ruangan.nomor_ruang}
                    </AvatarFallback>
                  </Avatar>
                  Ruangan {ruangan.nomor_ruang}
                </TableCell>
                <TableCell className="text-center">
                  {ruangan.jurusan.nama_jurusan}
                </TableCell>
                <TableCell className="text-right  w-max *:w-8 *:h-8 *:mx-1">
                  <Button
                    asChild
                    className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
                  >
                    <Link to={`/data-ruangan/view/${ruangan.id_ruang}`}>
                      <Eye className="text-[#4F6FFF] " />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-[#FFBA0033] rounded hover:bg-[#FFBA00] *:hover:text-white"
                  >
                    <Link to={`/data-ruangan/${ruangan.id_ruang}`}>
                      <EditOne className="text-[#FFBA00]" />
                    </Link>
                  </Button>
                  <AlertComponent
                    className="bg-[#FB2C3633] rounded hover:bg-[#FB2C36] *:hover:text-white"
                    Icon={Trash}
                    classIcon="text-[#FB2C36]"
                    alertTitle="Anda Yakin Ingin Menghapus Data Tersebut?"
                    onClick={() => handleDelete?.(ruangan.id_ruang)}
                    color="#FB2C36"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={filteredRuangans.length}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        setRowsPerPage={setRowsPerPage}
        setCurrentPage={setCurrentPage}
      />
      <ToastContainer />
    </div>
  );
}

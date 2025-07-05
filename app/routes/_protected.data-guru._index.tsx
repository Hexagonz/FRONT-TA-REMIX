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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const token = session.get("access_token");

  try {
    const { data } = await axios.get("/guru", {
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

    return json(
      {
        token,
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch Guru",
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const filteredGurus = data.data.filter((guru: any) =>
    [
      guru.nama_guru,
      guru.nip,
      guru.mapel.nama_mapel,
      guru.mapel.deskripsi,
    ].some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredGurus.slice(startIndex, endIndex);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const data = params.get("success");
    if (data) {
      toast.success(
        data === "1"
          ? "Sukses Menambahkan Guru Baru"
          : data === "2"
          ? "Sukses Mengedit Data Guru"
          : data === "3"
          ? "Sukses Menghapus Data Guru"
          : "Sukses Import Data Guru",
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
      await axios.delete(`/guru/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          withCredentials: true,
        },
      });
      navigate("/data-guru?success=3", { replace: true });
    } catch (error) {
      console.error("Gagal hapus:", error);
    }
  };
  const handleImport = async (file: File) => {
    console.log(token);
    if (
      !file ||
      file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      toast.error("File harus format .xlsx", { autoClose: 2500 });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("/guru/import", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate("/data-guru?success=4", { replace: true });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal mengimpor data guru",
        {
          autoClose: 2500,
        }
      );
    }
  };

  return (
    <div className="*:mx-2">
      <Navbar title="Kelola Data Guru" />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-4 text-[#5D5D5D] pt-2">
          <p className="text-sm">Search: </p>
          <Input
            className="bg-white rounded-none w-60"
            placeholder="Cari Guru"
            value={searchTerm}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                setShowConfirm(true); // Tampilkan alert konfirmasi
              }
            }}
          />
        </div>
        <div className="flex gap-x-2 mr-4">
          {/* Import Excel Button + Dialog */}
          {/* Tombol Import + Input File */}
          <form
            encType="multipart/form-data"
            className="relative inline-block overflow-hidden"
          >
            <Button className="bg-[#0077cc] hover:bg-[#005fa3]">
              📁 Import Excel
            </Button>
            <input
              type="file"
              accept=".xlsx"
              key={Date.now()}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (
                  file.type !==
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ) {
                  toast.error("File harus format .xlsx", {
                    autoClose: 2500,
                  });
                  return;
                }

                setSelectedFile(file);
                setShowConfirm(true); // Baru setelah file valid, buka dialog
              }}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </form>
          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Import</AlertDialogTitle>
                <AlertDialogDescription>
                  Yakin ingin mengimpor data guru dari file{" "}
                  <span className="font-semibold">{selectedFile?.name}</span>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selectedFile) {
                      handleImport(selectedFile);
                      setShowConfirm(false);
                    }
                  }}
                  className="bg-[#00BBA7] hover:bg-[#00BBA7aa]"
                >
                  Import
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link to="/data-guru/add">
            <Button className="bg-[#00BBA7] hover:bg-[#00BBA7AA] *:font-bold">
              <Plus className="stroke-[2.5]" /> Tambah Data Guru
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-[97%] bg-white h-max rounded-lg shadow-sm my-5 *:text-[#5D5D5D] ">
        <Table>
          {filteredGurus.length == 0 ? (
            <TableCaption className="bg-transparent pb-2">
              Data tidak ditemukan
            </TableCaption>
          ) : null}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] text-left pl-10">
                Nama Guru
              </TableHead>
              <TableHead className="text-center">NIP</TableHead>
              <TableHead className="text-center">Mata Pelajaran</TableHead>
              <TableHead className="text-center">Deskripsi</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="*:text-center">
            {currentData.map((guru: any) => (
              <TableRow key={guru.id_guru}>
                <TableCell className="flex justify-start items-center gap-x-2 text-left">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  {guru.nama_guru}
                </TableCell>
                <TableCell className="text-center">{guru.nip}</TableCell>
                <TableCell className="text-center">
                  {guru.mapel.nama_mapel}
                </TableCell>
                <TableCell className="text-center ">
                  {guru.mapel.deskripsi}
                </TableCell>
                <TableCell className="text-right  w-max *:w-8 *:h-8 *:mx-1">
                  <Button
                    asChild
                    className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white"
                  >
                    <Link to={`/data-guru/view/${guru.id_guru}`}>
                      <Eye className="text-[#4F6FFF] " />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-[#FFBA0033] rounded hover:bg-[#FFBA00] *:hover:text-white"
                  >
                    <Link to={`/data-guru/${guru.id_guru}`}>
                      <EditOne className="text-[#FFBA00]" />
                    </Link>
                  </Button>
                  <AlertComponent
                    className="bg-[#FB2C3633] rounded hover:bg-[#FB2C36] *:hover:text-white"
                    Icon={Trash}
                    classIcon="text-[#FB2C36]"
                    alertTitle="Anda Yakin Ingin Menghapus Data Tersebut?"
                    onClick={() => handleDelete?.(guru.id_guru)}
                    color="#FB2C36"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        totalItems={filteredGurus.length}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        setRowsPerPage={setRowsPerPage}
        setCurrentPage={setCurrentPage}
      />
      <ToastContainer />
    </div>
  );
}

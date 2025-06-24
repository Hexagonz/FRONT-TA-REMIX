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

    console.error(
      "Gagal fetch Gurus:",
      err.response?.status,
      err.response?.data
    );

    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch Guru",
        data: err.response?.data
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
  const filteredGurus = data.data.filter((guru: any) =>
    [guru.nama_guru, guru.nip, guru.mapel.nama_mapel, guru.mapel.deskripsi].some((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const data = params.get("success");
    if (data) {
      toast.success(
        data === "1"
          ? "Sukses Menambahkan Guru Baru"
          : data === "2"
          ? "Sukses Mengedit Data Guru"
          : "Sukses Menghapus Data Guru",
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
  return (
    <div className="*:mx-2">
      <Navbar title="Kelola Data Guru" />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-x-4 text-[#5D5D5D] pt-2">
          <p className="text-sm">Search: </p>
          <Input
            className="bg-white rounded-none w-60"
            placeholder="Cari Nama Guru"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link to="/data-guru/add">
          <Button className="mr-4 bg-[#00BBA7] hover:bg-[#00BBA7AA] *:font-bold">
            <Plus className="stroke-[2.5]" /> Tambah Data
          </Button>
        </Link>
      </div>
      <div className="w-[97%] bg-white h-max rounded-lg shadow-sm my-5 *:text-[#5D5D5D] ">
        <Table>
          {(filteredGurus.length == 0 ? <TableCaption className="bg-transparent pb-2">Data tidak ditemukan</TableCaption> : null)}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] text-left pl-10">Nama Guru</TableHead>
              <TableHead className="text-center">NIP</TableHead>
              <TableHead className="text-center">Mata Pelajaran</TableHead>
              <TableHead className="text-center">Deskripsi</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="*:text-center">
            {filteredGurus.map((guru: any) => (
              <TableRow key={guru.id_guru}>
                <TableCell className="flex justify-start items-center gap-x-2 text-left">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  {guru.nama_guru}
                </TableCell>
                <TableCell className="text-center">{guru.nip}</TableCell>
                <TableCell className="text-center">{guru.mapel.nama_mapel}</TableCell>
                <TableCell className="text-center ">{guru.mapel.deskripsi}</TableCell>
                <TableCell className="text-right  w-max *:w-8 *:h-8 *:mx-1">
                  <Button asChild className="bg-[#4F6FFF33] rounded hover:bg-[#4F6FFF] *:hover:text-white">
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
      <ToastContainer />
    </div>
  );
}

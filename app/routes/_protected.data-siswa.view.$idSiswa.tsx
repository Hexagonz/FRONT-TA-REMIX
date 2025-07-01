import { ArrowLeft } from "@mynaui/icons-react";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useNavigation,
} from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
  Form as RemixForm,
} from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useEffect, useState } from "react";
import { axios, axiosPy } from "~/services/axios.services";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AxiosError } from "axios";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { sessionStorage } from "~/services/session.services";
import { LoaderKelasJurusan, LoaderSuccess } from "~/@types/type";

const addSchema = z.object({
  nama_siswa: z.string(),
  nisn: z.string(),
  no_absen: z.coerce.number().int(),
  id_kelas: z.coerce.number().int(),
  id_jurusan: z.coerce.number().int(),
  id_ruang: z.coerce.number().int(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = params.idSiswa;
  const cookie = request.headers.get("cookie");
  const session = await sessionStorage.getSession(cookie);
  const token = session.get("access_token");

  try {
    const { data: siswa } = await axios.get("/siswa/" + id, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { data: listJurusan } = await axios.get("/jurusan", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { data: listKelas } = await axios.get("/kelas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { data: listRuang } = await axios.get("/ruang-kelas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { data: foto } = await axiosPy.get(
      "/get-images?id_siswa=" +
        siswa.data.nisn +
        "&nama_siswa=" +
        siswa.data.nama_siswa
    );
    return json({
      status: true,
      message: "Berhasil mengambil data jurusan dan kelas",
      data: {
        jurusan: listJurusan.data,
        kelas: listKelas.data,
        ruang: listRuang.data,
        siswa: siswa,
        foto: foto,
      },
    });
  } catch (error) {
    const err = error as AxiosError;

    console.error("Gagal fetch:", err.response?.status, err.response?.data);

    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch",
        data: {
          jurusan: [],
          kelas: [],
        },
      },
      { status: err.response?.status || 500 }
    );
  }
}

export default function ViewSiswa() {
  const data = useLoaderData<LoaderKelasJurusan>();
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    data.data.foto.data.images
  );
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: "onSubmit",
    defaultValues: {
      nama_siswa: data.data.siswa?.data.nama_siswa,
      nisn: data.data.siswa?.data.nisn,
      no_absen: data.data.siswa?.data.no_absen,
      id_kelas: data.data.siswa?.data.id_kelas,
      id_jurusan: data.data.siswa?.data.id_jurusan,
      id_ruang: data.data.siswa?.data.id_ruang,
    },
  });
  useEffect(() => {
    const fetchImagesAsFiles = async () => {
      const fetchedFiles: File[] = [];
      const fullPreviewUrls: string[] = [];

      for (const imageUrl of previewUrls) {
        try {
          const fullUrl = imageUrl.startsWith("http")
            ? imageUrl
            : `http://localhost:5005/${imageUrl}`;

          const response = await axiosPy.get(fullUrl, {
            responseType: "blob",
          });

          const blob = response.data as Blob;
          const contentType = response.headers["content-type"] || blob.type;
          const filename = fullUrl.split("/").pop() || "image.jpeg";
          const file = new File([blob], filename, { type: contentType });

          fetchedFiles.push(file);
          fullPreviewUrls.push(fullUrl);
        } catch (err) {
          console.error("Gagal fetch file dari URL:", imageUrl, err);
        }
      }

      setFiles(fetchedFiles);
      setPreviewUrls(fullPreviewUrls);
    };

    fetchImagesAsFiles();
  }, [data]);
  const handlePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(e.target.files || []);
    const newFiles = inputFiles.filter(
      (file) =>
        file.type.startsWith("image/") &&
        !files.some((f) => f.name === file.name && f.size === file.size)
    );

    const newUrls = newFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };
  return (
    <div className="*:mx-2 flex justify-center mb-4">
      <RemixForm {...form}>
        <form
          method="get"
          className="bg-white space-y-5 w-[40%] px-4 rounded-xl shadow-md mt-5 pb-8"
        >
          <div className="flex items-start pt-6 gap-x-20">
            <Link
              to="/data-siswa"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold text-center">
              View Data siswa
            </h1>
          </div>
          <FormField
            control={form.control}
            name="nama_siswa"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Nama </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="focus:border-[#25CAB8]"
                    type="text"
                    placeholder="Nama siswa"
                    disabled
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nisn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">
                  Nomor Induk Siswa Nasional
                </FormLabel>
                <FormControl>
                  <Input
                    className="focus:border-[#25CAB8]"
                    {...field}
                    inputMode="numeric"
                    disabled
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="no_absen"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">No Absen</FormLabel>
                <Input
                  {...field}
                  className="focus:border-[#25CAB8]"
                  type="number"
                  placeholder="No Absen Siswa"
                  disabled
                />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id_kelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Kelas</FormLabel>
                <KelasSelect field={field} />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id_jurusan"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Jurusan</FormLabel>
                <JurusanSelect field={field} />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id_ruang"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Ruangan</FormLabel>
                <RuanganSelect field={field} />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div>
            <div className="mb-2 text-[#5D5D5D] font-medium">
              Foto Siswa
            </div>
            <div className="grid grid-cols-3 gap-3">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-40 border rounded overflow-hidden group"
                >
                  <img
                    src={url}
                    alt={`preview-${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      </RemixForm>
    </div>
  );
}

export function JurusanSelect({ field }: { field: any }) {
  const data = useLoaderData<LoaderKelasJurusan>();

  return (
    <Select
      onValueChange={field.onChange}
      defaultValue={field.value.toString()}
      disabled
    >
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Jurusan" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {data.data.jurusan.map((jurusan: any) => (
          <SelectItem
            key={jurusan.id_jurusan}
            value={jurusan.id_jurusan.toString()}
          >
            {jurusan.nama_jurusan} - {jurusan.deskripsi}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function KelasSelect({ field }: { field: any }) {
  const data = useLoaderData<LoaderKelasJurusan>();

  return (
    <Select
      onValueChange={field.onChange}
      defaultValue={field.value.toString()}
      disabled
    >
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kelas" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {data.data.kelas.map((kelas: any) => (
          <SelectItem key={kelas.id_kelas} value={kelas.id_kelas.toString()}>
            {kelas.nama_kelas} - {kelas.kelas_romawi}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RuanganSelect({ field }: { field: any }) {
  const data = useLoaderData<LoaderKelasJurusan>();
  const ruangList = data.data.ruang;
  return (
    <Select
      onValueChange={field.onChange}
      defaultValue={field.value.toString()}
      disabled
    >
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kelas" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {ruangList.map((ruang: any) => (
          <SelectItem key={ruang.id_ruang} value={ruang.id_ruang.toString()}>
            {ruang.jurusan.nama_jurusan} - {ruang.nomor_ruang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import { ArrowLeft, Plus, X } from "@mynaui/icons-react";
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
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const addSchema = z.object({
  nama_siswa: z
    .string()
    .min(3, { message: "Min 3 dan Max 60 huruf nama siswa" })
    .max(60, { message: "Min 3 dan Max 60 huruf nama siswa" }),
  nisn: z
    .string()
    .min(8, { message: "Min 8 dan Max 15 huruf NISN siswa" })
    .max(15, { message: "Min 8 dan Max 15 huruf NISN siswa" }),
  no_absen: z.coerce.number({ message: "No Absen harus angka" }).int(),
  id_kelas: z.coerce.number({ message: "Kelas harus diisi" }).int(),
  id_jurusan: z.coerce.number({ message: "Jurusan harus diisi" }).int(),
  id_ruang: z.coerce.number({ message: "Ruangan harus diisi" }).int(),
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
export async function action({ request, params }: ActionFunctionArgs) {
  const id = params.idSiswa;
  const formData = await request.formData();
  const rawData = {
    nama_siswa: formData.get("nama_siswa"),
    nisn: formData.get("nisn"),
    no_absen: formData.get("no_absen"),
    id_kelas: formData.get("id_kelas"),
    id_jurusan: formData.get("id_jurusan"),
    id_ruang: formData.get("id_ruang"),
  };

  const parsed = addSchema.safeParse(rawData);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    let session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    const token = session.get("access_token");
    const { data } = await axios.put("/siswa/" + id, parsed.data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return redirect("/data-siswa" + "?success=2");
  } catch (error: any) {
    console.log(error.response?.data);
    const detail = error.response?.data;
    return json(
      {
        error: {
          server: ["Gagal mengirim data ke backend"],
        },
        detail,
      },
      { status: 500 }
    );
  }
}

export default function EditSiswa() {
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const data = useLoaderData<LoaderKelasJurusan>();
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    data.data.foto.data.images
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

  const onSubmit = async (data: z.infer<typeof addSchema>) => {
    setIsLoading(true);
    if (files.length == 0) {
      toast.error("Minimal satu gambar wajib diupload.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setIsLoading(false);
      return;
    }

    try {
      if (filesToDelete.length > 0) {
        await axiosPy.post("/delete-images", {
          nama_siswa: data.nama_siswa,
          filenames: filesToDelete,
        });
        console.log("File yang dihapus:", filesToDelete);
      }

      const formUpload = new FormData();
      formUpload.append("nama_siswa", data.nama_siswa);
      formUpload.append("id_siswa", data.nisn);
      for (let i = 0; i < files.length; i++) {
        formUpload.append("images", files[i]);
      }

      await axiosPy.post("/update-images", formUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });


      const formData = new FormData();
      for (const key in data) {
        formData.append(key, String(data[key as keyof typeof data]));
      }

      fetcher.submit(formData, {
        method: "post",
      });

      toast.success("Data siswa dan gambar berhasil diperbarui!", {
        position: "top-center",
      });
      setIsLoading(true);
    } catch (err: any) {
      console.error("Gagal upload gambar:", err.response?.data || err.message);
      toast.error("Gagal mengirim data ke server!", {
        position: "top-center",
      });
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (actionData?.error) {
      for (const [key, messages] of Object.entries(actionData.error)) {
        form.setError(key as any, {
          type: "manual",
          message: messages?.[0],
        });
      }
    }
  }, [actionData]);
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

  const handleRemove = (index: number) => {
    const filename = files[index].name;
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setFilesToDelete((prev) => [...prev, filename]);
  };

  return (
    <div className="*:mx-2 flex justify-center">
      <RemixForm {...form}>
        <form
          method="post"
          className="bg-white space-y-5 w-[40%] px-4 rounded-xl shadow-md mt-5 pb-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex items-start pt-6 gap-x-20">
            <Link
              to="/data-siswa"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold text-center">
              Edit Data siswa
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
                    placeholder="NISN (Angka)"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9]/g,
                        ""
                      );
                      field.onChange(e);
                    }}
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
                  min={1}
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
          {/* Upload Gambar */}
          <div>
            <div className="mb-2 text-[#5D5D5D] font-medium">
              Upload Foto Siswa
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Tombol upload */}
              <label
                htmlFor="images"
                className="flex items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-500 transition"
              >
                <Plus className="w-8 h-8 text-gray-400" />
              </label>
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
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={handlePreview}
              className="hidden"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#00BBA7] hover:bg-slate-100 hover:text-[#00BBA7] rounded-full"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </RemixForm>
      <ToastContainer />
    </div>
  );
}

export function JurusanSelect({ field }: { field: any }) {
  const data = useLoaderData<LoaderKelasJurusan>();

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Jurusan" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {data.data.jurusan.map((jurusan: any) => (
          <SelectItem key={jurusan.id_jurusan} value={jurusan.id_jurusan}>
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

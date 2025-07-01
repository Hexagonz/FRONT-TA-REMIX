import { ArrowLeft, Plus, X } from "@mynaui/icons-react";
import {
  Link,
  useActionData,
  useFetcher,
  useNavigation,
} from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
import {
  Jurusan,
  Kelas,
  LoaderKelasJurusan,
  LoaderSuccess,
  RuangKelas,
} from "~/@types/type";
import { Card, CardContent } from "~/components/ui/card";
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const addSchema = z.object({
  nama_siswa: z
    .string()
    .min(3, { message: "Min 3 dan Max 60 huruf nama siswa" })
    .max(60, { message: "Min 3 dan Max 60 huruf nama siswa" }),
  nisn: z.coerce
    .string()
    .min(8, { message: "Min 8 dan Max 15 huruf NISN siswa" })
    .max(15, { message: "Min 8 dan Max 15 huruf NISN siswa" }),
  no_absen: z.coerce.number({ message: "No Absen harus angka" }).int(),
  id_kelas: z.coerce.number({ message: "Kelas harus diisi" }).int(),
  id_jurusan: z.coerce.number({ message: "Jurusan harus diisi" }).int(),
  id_ruang: z.coerce.number({ message: "Ruangan harus diisi" }).int(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("cookie");
  const session = await sessionStorage.getSession(cookie);
  const token = session.get("access_token");

  let jurusan: Jurusan[] = [];
  let kelas: Kelas[] = [];
  let ruang: RuangKelas[] = [];
  let errors: string[] = [];

  // Ambil jurusan
  try {
    const res = await axios.get("/jurusan", {
      headers: { Authorization: `Bearer ${token}` },
    });
    jurusan = res.data.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(
      "Gagal fetch jurusan:",
      err.response?.status,
      err.response?.data
    );
    errors.push("jurusan");
  }

  // Ambil kelas
  try {
    const res = await axios.get("/kelas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    kelas = res.data.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(
      "Gagal fetch kelas:",
      err.response?.status,
      err.response?.data
    );
    errors.push("kelas");
  }

  // Ambil ruang kelas
  try {
    const res = await axios.get("/ruang-kelas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    ruang = res.data.data;
  } catch (error) {
    const err = error as AxiosError;
    console.error(
      "Gagal fetch ruang kelas:",
      err.response?.status,
      err.response?.data
    );
    errors.push("ruang");
  }

  const success = errors.length < 3;

  return json({
    status: success,
    message:
      errors.length === 0
        ? "Berhasil mengambil semua data"
        : `Gagal mengambil data: ${errors.join(", ")}`,
    data: { jurusan, kelas, ruang },
  });
}

export async function action({ request }: ActionFunctionArgs) {
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
    // Ambil token dari session
    const cookie = request.headers.get("cookie");
    const session = await sessionStorage.getSession(cookie);
    const token = session.get("access_token");

    const siswaResponse = await axios.post("/siswa", parsed.data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const siswa = siswaResponse.data;

    return redirect("/data-siswa?success=1");
  } catch (error: any) {
    console.error("Gagal:", error.response?.data || error.message);
    return json(
      {
        error: {
          server: ["Gagal mengirim data atau upload gambar"],
        },
        detail: error.response?.data,
      },
      { status: 500 }
    );
  }
}

export default function AddSiswa() {
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: "onSubmit",
    defaultValues: {
      nama_siswa: "",
      nisn: "",
      no_absen: undefined,
      id_kelas: undefined,
      id_jurusan: undefined,
      id_ruang: undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof addSchema>) => {
    setIsLoading(true);
    const imagesInput = document.getElementById("images");
    if (!(imagesInput instanceof HTMLInputElement)) {
      alert("Elemen input gambar tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const files = imagesInput.files;

    if (!files || files.length === 0) {
      toast.error("Minimal satu gambar wajib diupload.", {
        position: "top-center",
        autoClose: 5000,
        transition: Bounce,
      });
      setIsLoading(false);
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("nama_siswa", data.nama_siswa);
    uploadFormData.append("id_siswa", data.nisn);

    for (const file of files) {
      uploadFormData.append("images", file);
    }

    try {
      await axiosPy.post("/upload-images", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error: any) {
      toast.error("Gagal upload gambar.", {
        position: "top-center",
        autoClose: 5000,
        transition: Bounce,
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, String(data[key as keyof typeof data]));
    }

    fetcher.submit(formData, { method: "post" });
  };

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
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (actionData?.error) {
      for (const [key, messages] of Object.entries(actionData.error)) {
        form.setError(key as any, {
          type: "manual",
          message: messages?.[0],
        });
      }
    }

    if (!actionData?.error && fetcher.state === "idle" && fetcher.data) {
      toast.success("Berhasil menambahkan data siswa!", {
        position: "top-center",
        autoClose: 3000,
        transition: Bounce,
      });

      form.reset();
      setFiles([]);
      setPreviewUrls([]);
    }
  }, [actionData, fetcher.state]);

  return (
    <div>
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
                Tambah Data siswa
              </h1>
            </div>

            {/* === INPUT FORM === */}
            <FormField
              control={form.control}
              name="nama_siswa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#5D5D5D]">Nama</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nama siswa"
                      className="focus:border-[#25CAB8]"
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
                  <FormLabel className="text-[#5D5D5D]">NISN</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="NISN"
                      inputMode="numeric"
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        field.onChange(e);
                      }}
                      className="focus:border-[#25CAB8]"
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
                    type="number"
                    min={1}
                    placeholder="No Absen"
                    className="focus:border-[#25CAB8]"
                  />
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* === SELECT INPUT === */}
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

            {/* === UPLOAD IMAGE === */}
            <div>
              <div className="mb-2 text-[#5D5D5D] font-medium">
                Upload Foto Siswa
              </div>
              <div className="grid grid-cols-3 gap-3">
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

            {/* === SUBMIT BUTTON === */}
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
      </div>
      <ToastContainer />
    </div>
  );
}
export function JurusanSelect({ field }: { field: any }) {
  const data = useLoaderData<LoaderKelasJurusan>();
  const jurusanList = data.data.jurusan;

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Jurusan" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {jurusanList.map((jurusan: any) => (
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
  const kelasList = data.data.kelas;
  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kelas" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {kelasList.map((kelas: any) => (
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
    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

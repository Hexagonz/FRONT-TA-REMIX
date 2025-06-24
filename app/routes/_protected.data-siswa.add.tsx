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
import { useEffect } from "react";
import axios from "~/services/axios.services";
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
});

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("cookie");
  const session = await sessionStorage.getSession(cookie);
  const token = session.get("access_token");

  try {
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
    return json({
      status: true,
      message: "Berhasil mengambil data jurusan dan kelas",
      data: {
        jurusan: listJurusan.data,
        kelas: listKelas.data,
      },
    });
  } catch (error) {
    const err = error as AxiosError;

    console.error("Gagal fetch:", err.response?.status, err.response?.data);

    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch",
      },
      { status: err.response?.status || 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const rawData = {
    nama_siswa: formData.get("nama_siswa"),
    nisn: formData.get("nisn"),
    no_absen: formData.get("no_absen"),
    id_kelas: formData.get("id_kelas"),
    id_jurusan: formData.get("id_jurusan"),
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
    const { data } = await axios.post("/siswa", parsed.data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(data);
    return redirect("/data-siswa" + "?success=1");
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

export default function AddSiswa() {
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const onSubmit = (data: z.infer<typeof addSchema>) => {
    const formData = new FormData();

    for (const key in data) {
      const value = data[key as keyof typeof data];

      if (typeof value === "object" && value !== null) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }

    fetcher.submit(formData, { method: "post" });
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
  }, [actionData]);

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: "onSubmit",
    defaultValues: {
      nama_siswa: "",
      nisn: "",
      no_absen: undefined,
      id_kelas: undefined,
      id_jurusan: undefined,
    },
  });

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
              Tambah Data siswa
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

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#00BBA7] hover:bg-slate-100 hover:text-[#00BBA7] rounded-full"
              disabled={navigation.state === "submitting"}
            >
              Simpan
            </Button>
          </div>
        </form>
      </RemixForm>
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
    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

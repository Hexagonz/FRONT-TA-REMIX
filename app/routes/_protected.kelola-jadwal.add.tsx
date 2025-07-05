import { ArrowLeft } from "@mynaui/icons-react";
import {
  useFetcher,
  useNavigation,
  Link,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { axios } from "~/services/axios.services";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { LoaderFunctionArgs } from "@remix-run/node";
import { sessionStorage } from "~/services/session.services";

const addSchema = z.object({
  id_kelas: z.string().min(1, { message: "Kelas wajib dipilih" }),
  id_guru: z.string().min(1, { message: "Guru wajib dipilih" }),
  id_ruang: z.string().min(1, { message: "Ruang wajib dipilih" }),
  hari: z.enum(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"], {
    errorMap: () => ({ message: "Hari wajib dipilih" }),
  }),
  jam_mulai: z
    .string()
    .min(1, { message: "Jam mulai wajib diisi" })
    .refine((val) => val >= "07:00", {
      message: "Jam mulai tidak boleh kurang dari jam 07:00",
    }),
  jam_selesai: z
    .string()
    .min(1, { message: "Jam selesai wajib diisi" })
    .refine((val) => val >= "07:00", {
      message: "Jam selesai tidak boleh kurang dari jam 07:00",
    }),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const token = session.get("access_token");

  const [guruRes, kelasRes, ruangRes] = await Promise.all([
    axios.get("/guru", { headers: { Authorization: `Bearer ${token}` } }),
    axios.get("/kelas", { headers: { Authorization: `Bearer ${token}` } }),
    axios.get("/ruang-kelas", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  return json({
    guruList: guruRes.data.data,
    kelasList: kelasRes.data.data,
    ruangList: ruangRes.data.data,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const rawData = {
    id_kelas: formData.get("id_kelas"),
    id_guru: formData.get("id_guru"),
    id_ruang: formData.get("id_ruang"),
    hari: formData.get("hari"),
    jam_mulai: formData.get("jam_mulai"),
    jam_selesai: formData.get("jam_selesai"),
  };

  const parsed = addSchema.safeParse(rawData);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const cookie = request.headers.get("cookie");
    const session = await sessionStorage.getSession(cookie);
    const token = session.get("access_token");

    await axios.post(
      "/jadwal",
      {
        ...parsed.data,
        id_kelas: Number(parsed.data.id_kelas),
        id_guru: Number(parsed.data.id_guru),
        id_ruang: Number(parsed.data.id_ruang),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return redirect("/kelola-jadwal?success=1");
  } catch (error: any) {
    console.error(
      "Gagal simpan jadwal:",
      error.response?.data || error.message
    );
    return json(
      {
        error: {
          server: ["Gagal menyimpan data jadwal"],
        },
        detail: error.response?.data,
      },
      { status: 500 }
    );
  }
}

export default function AddJadwal() {
  const { guruList, kelasList, ruangList } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      id_guru: "",
      id_kelas: "",
      id_ruang: "",
      hari: undefined,
      jam_mulai: "",
      jam_selesai: "",
    },
  });

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

  const onSubmit = (data: z.infer<typeof addSchema>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="flex justify-center">
      <Form {...form}>
        <form
          method="post"
          className="bg-white space-y-5 w-[40%] px-4 rounded-xl shadow-md mt-5 pb-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex items-start pt-6 gap-x-20">
            <Link
              to="/kelola-jadwal"
              className="text-[#5D5D5D] hover:text-[#00BBA7]"
            >
              <ArrowLeft className="stroke-[2.5]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold">Tambah Jadwal</h1>
          </div>

          {/* Guru */}
          <FormField
            control={form.control}
            name="id_guru"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guru</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Guru" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {guruList.map((guru: any) => (
                      <SelectItem
                        key={guru.id_guru}
                        value={String(guru.id_guru)}
                      >
                        {guru.nama_guru} - {guru.mapel?.nama_mapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Kelas */}
          <FormField
            control={form.control}
            name="id_kelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Kelas</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {kelasList.map((kelas: any) => (
                      <SelectItem
                        key={kelas.id_kelas}
                        value={String(kelas.id_kelas)}
                      >
                        {kelas.kelas_romawi} - {kelas.nama_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ruang */}
          <FormField
            control={form.control}
            name="id_ruang"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Ruang</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Ruang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ruangList.map((ruang: any) => (
                      <SelectItem
                        key={ruang.id_ruang}
                        value={String(ruang.id_ruang)}
                      >
                        {ruang.jurusan.nama_jurusan} {ruang.nomor_ruang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jam_mulai"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Jam Mulai</FormLabel>
                <FormControl>
                  <Input type="time"{...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Jam Selesai */}
          <FormField
            control={form.control}
            name="jam_selesai"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Jam Selesai</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hari"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Hari</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl className="focus:border-[#25CAB8]">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hari" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map(
                      (hari) => (
                        <SelectItem key={hari} value={hari}>
                          {hari}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#00BBA7] hover:bg-slate-100 hover:text-[#00BBA7] rounded-full"
            >
              Simpan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

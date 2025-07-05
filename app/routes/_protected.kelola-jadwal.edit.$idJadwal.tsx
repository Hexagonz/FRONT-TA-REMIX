import { ArrowLeft } from "@mynaui/icons-react";
import {
  useFetcher,
  useNavigation,
  Link,
  useActionData,
  useLoaderData,
  useParams,
  useSearchParams,
  useNavigate,
} from "@remix-run/react";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { axios } from "~/services/axios.services";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
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
import { sessionStorage } from "~/services/session.services";

const editSchema = z.object({
  id_kelas: z.string(),
  id_guru: z.string(),
  id_ruang: z.string(),
  hari: z.enum(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]),
  jam_mulai: z.string(),
  jam_selesai: z.string(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const token = session.get("access_token");

  const id = params.idJadwal;

  const [jadwalRes, guruRes, kelasRes, ruangRes] = await Promise.all([
    axios.get(`/jadwal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    axios.get("/guru", { headers: { Authorization: `Bearer ${token}` } }),
    axios.get("/kelas", { headers: { Authorization: `Bearer ${token}` } }),
    axios.get("/ruang-kelas", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  return json({
    jadwal: jadwalRes.data.data,
    guruList: guruRes.data.data,
    kelasList: kelasRes.data.data,
    ruangList: ruangRes.data.data,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const id = params.idJadwal;

  const data = {
    id_kelas: formData.get("id_kelas"),
    id_guru: formData.get("id_guru"),
    id_ruang: formData.get("id_ruang"),
    hari: formData.get("hari"),
    jam_mulai: formData.get("jam_mulai"),
    jam_selesai: formData.get("jam_selesai"),
  };

  const parsed = editSchema.safeParse(data);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    const token = session.get("access_token");

    await axios.put(
      `/jadwal/${id}`,
      {
        ...parsed.data,
        id_kelas: Number(parsed.data.id_kelas),
        id_guru: Number(parsed.data.id_guru),
        id_ruang: Number(parsed.data.id_ruang),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { data: jadwalData } = await axios.get(`/jadwal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const kelasParam = jadwalData.data.kelas.kelas_romawi;
    const ruangParam = jadwalData.data.ruang.nomor_ruang;
    const jurusanParam = jadwalData.data.ruang.jurusan.nama_jurusan;
    return redirect(
      `/kelola-jadwal/view?kelas=${kelasParam}&ruang=${ruangParam}&jurusan=${jurusanParam}`
    );
  } catch (error: any) {
    console.log(error);
    return json(
      {
        error: {
          server: ["Gagal mengubah data jadwal"],
        },
        detail: error.response?.data,
      },
      { status: 500 }
    );
  }
}

export default function EditJadwal() {
  const { jadwal, guruList, kelasList, ruangList } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      id_kelas: String(jadwal.kelas.id_kelas),
      id_guru: String(jadwal.guru.id_guru),
      id_ruang: String(jadwal.ruang.id_ruang),
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai.slice(11, 16),
      jam_selesai: jadwal.jam_selesai.slice(11, 16),
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

  const onSubmit = (data: z.infer<typeof editSchema>) => {
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
              to="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(-1);
              }}
              className="text-[#5D5D5D] hover:text-[#00BBA7]"
            >
              <ArrowLeft className="stroke-[2.5]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold">Edit Jadwal</h1>
          </div>

          {/* GURU */}
          <FormField
            control={form.control}
            name="id_guru"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guru</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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

          {/* KELAS */}
          <FormField
            control={form.control}
            name="id_kelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kelas</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled
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

          {/* RUANG */}
          <FormField
            control={form.control}
            name="id_ruang"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ruang</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled
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

          {/* JAM MULAI */}
          <FormField
            control={form.control}
            name="jam_mulai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Mulai</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* JAM SELESAI */}
          <FormField
            control={form.control}
            name="jam_selesai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Selesai</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* HARI */}
          <FormField
            control={form.control}
            name="hari"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hari</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled
                >
                  <FormControl>
                    <SelectTrigger className="pointer-events-none opacity-50">
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#00BBA7] hover:bg-slate-100 hover:text-[#00BBA7] rounded-full"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

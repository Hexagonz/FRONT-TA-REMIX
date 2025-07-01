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
import { axios } from "~/services/axios.services";
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

const addSchema = z.object({
  nomor_ruang: z.coerce.number({ message: "Nomor Ruang harus angka" }).int(),
  id_jurusan: z.coerce.number({ message: "Jurusan harus angka" }).int(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = params.idRuangan;
  const cookie = request.headers.get("cookie");
  const session = await sessionStorage.getSession(cookie);
  const token = session.get("access_token");

  try {
    const { data: listJurusan } = await axios.get("/jurusan", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { data: detailMapel } = await axios.get("/ruang-kelas/" + id, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return json({
      status: true,
      message: "Berhasil mengambil data guru dan mapel",
      data: {
        list: listJurusan.data,
        detail: detailMapel.data,
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
          list: [],
          detail: {},
        },
      },
      { status: err.response?.status || 500 }
    );
  }
}

export default function ViewRuangan() {
  const navigation = useNavigation();
  const data = useLoaderData<typeof loader>();

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    mode: "onSubmit",
    defaultValues: {
      nomor_ruang: data.data.detail.nomor_ruang,
      id_jurusan: data.data.detail.id_jurusan,
    },
  });

  return (
    <div className="*:mx-2 flex justify-center items-center h-5/6">
      <RemixForm {...form}>
        <form
          method="get"
          className="bg-white space-y-5 w-[40%] px-4 rounded-xl shadow-md mt-5 pb-8"
        >
          <div className="flex items-start pt-6 gap-x-20">
            <Link
              to="/data-ruangan"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold text-center">
              View Data Ruangan
            </h1>
          </div>
          <FormField
            control={form.control}
            name="nomor_ruang"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">No Ruangan</FormLabel>
                <Input
                  {...field}
                  className="focus:border-[#25CAB8]"
                  type="number"
                  placeholder="No Ruangan"
                  disabled
                />
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
        </form>
      </RemixForm>
    </div>
  );
}

function JurusanSelect({ field }: { field: any }) {
  const loaderData = useLoaderData<typeof loader>();

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
        {loaderData.data.list.map((jurusan: any) => (
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

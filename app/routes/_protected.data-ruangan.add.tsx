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

export async function loader({ request }: LoaderFunctionArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  const token = session.get("access_token");

  try {
    const { data } = await axios.get("/jurusan", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return json({
      data,
    });
  } catch (error) {
    const err = error as AxiosError;

    console.error("Gagal fetch s:", err.response?.status, err.response?.data);

    return json(
      {
        status: false,
        message: err.response?.data || "Terjadi kesalahan saat fetch ",
        data: err.response?.data,
      },
      { status: err.response?.status || 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const rawData = {
    nomor_ruang: formData.get("nomor_ruang"),
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
    const { data } = await axios.post("/ruang-kelas", parsed.data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(data);
    return redirect("/data-ruangan" + "?success=1");
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

export default function AddRuangan() {
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
      nomor_ruang: undefined,
      id_jurusan: undefined,
    },
  });

  return (
    <div className="*:mx-2 flex justify-center items-center h-5/6">
      <RemixForm {...form}>
        <form
          method="post"
          className="bg-white space-y-5 w-[40%] px-4 rounded-xl shadow-md mt-5 pb-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex items-start pt-6 gap-x-20">
            <Link
              to="/data-ruangan"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold text-center">
              Tambah Data Ruangan
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
                  min={1}
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

function JurusanSelect({ field }: { field: any }) {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl className="focus:border-[#25CAB8]">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Jurusan" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {loaderData.data.data.map((jurusan: any) => (
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

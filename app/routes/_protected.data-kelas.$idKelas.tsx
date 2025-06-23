import { ArrowLeft } from "@mynaui/icons-react";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
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
import { sessionStorage } from "~/services/session.services";
import { LoaderFunctionArgs } from "@remix-run/node";

const addSchema = z.object({
  nama_kelas: z
    .string()
    .min(1, { message: "Min 1 dan Max 5 Kelas" })
    .max(5, { message: "Min 1 dan Max 5 Kelas" }),
  kelas_romawi: z
    .string()
    .min(1, { message: "Min 1 dan Max 5 huruf Romawi Kelas" })
    .max(5, { message: "Min 1 dan Max 5 huruf Romwai Kelas" }),
});

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.idKelas;
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  const token = session.get("access_token");
  const {data} = await axios.get('/kelas/' + id, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return { data };
}


export async function action({ request,params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const id = params.idKelas;
  const rawData = {
    nama_kelas: formData.get("nama_kelas"),
    kelas_romawi: formData.get("kelas_romawi"),
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
    const { data } = await axios.put("/kelas/"+ id, parsed.data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(data);
    return redirect("/data-kelas" + "?success=2");
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

export default function EditKelas() {
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const {data} = useLoaderData<typeof loader>();

  const onSubmit = (data: z.infer<typeof addSchema>) => {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof typeof data]);
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
      nama_kelas: data.data.nama_kelas,
      kelas_romawi: data.data.kelas_romawi,
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
              to="/data-kelas"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold ">Edit Data Kelas</h1>
          </div>
          <FormField
            control={form.control}
            name="nama_kelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Nama</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="focus:border-[#25CAB8]"
                    type="text"
                    inputMode="numeric"
                    placeholder="Nama Kelas (Angka)"
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
            name="kelas_romawi"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Romawi Kelas</FormLabel>
                <FormControl>
                  <Input
                    className="focus:border-[#25CAB8]"
                    {...field}
                    placeholder="Romawi (Huruf)"
                    onChange={(e) => {
                      const onlyLetters = e.target.value.replace(
                        /[^a-zA-Z\s]/g,
                        ""
                      );
                      field.onChange(onlyLetters);
                    }}
                  />
                </FormControl>
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

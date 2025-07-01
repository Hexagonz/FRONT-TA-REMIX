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
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useEffect } from "react";
import { axios } from "~/services/axios.services";
import { sessionStorage } from "~/services/session.services";

const addSchema = z.object({
  nama_jurusan: z.string(),
  deskripsi: z.string(),
});

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.idJurusan;
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  const token = session.get("access_token");
  const { data } = await axios.get("/jurusan/" + id, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return { data };
}

export default function AddMataPelajaran() {
  const { data } = useLoaderData<typeof loader>();

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      nama_jurusan: data.data.nama_jurusan,
      deskripsi: data.data.deskripsi,
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
              to="/data-jurusan"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold ">View Data Jurusan</h1>
          </div>
          <FormField
            control={form.control}
            name="nama_jurusan"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Nama</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="focus:border-[#25CAB8]"
                    disabled
                    type="text"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deskripsi"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Deskripsi</FormLabel>
                <FormControl>
                  <Input
                    className="focus:border-[#25CAB8]"
                    {...field}
                    disabled
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </form>
      </RemixForm>
    </div>
  );
}

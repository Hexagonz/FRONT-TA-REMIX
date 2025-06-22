import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useLocation } from "@remix-run/react";
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
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
  Form as RemixForm,
} from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
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
import { sessionStorage } from "~/services/session.services";

const addSchema = z.object({
  username: z.string(),
  name: z.string(),
  role: z.enum(["siswa", "guru", "admin"]),
  password: z.string(),
  password_confirmation: z.string(),
});

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.userId;
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  const token = session.get("access_token");
  const { data } = await axios.get("/users/" + id, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return { data };
}

export default function ViewKelolaUser() {
  const { data } = useLoaderData<typeof loader>();

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      username: data.data.username,
      name: data.data.name,
      role: data.data.role,
      password: data.data.password,
      password_confirmation: data.data.password,
    },
  });

  return (
    <div className="*:mx-2 flex justify-center">
      <RemixForm {...form}>
        <form
          method="post"
          className="bg-white space-y-5 w-[40%] px-4 rounded-xl shadow-md mt-5 pb-14"
        >
          <div className="flex items-start pt-6 gap-x-20">
            <Link
              to="/kelola-user"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold text-center">
              Lihat Data User
            </h1>
          </div>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="focus:border-[#25CAB8]"
                    type="text"
                    disabled
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Nama</FormLabel>
                <FormControl>
                  <Input
                    className="focus:border-[#25CAB8]"
                    {...field}
                    placeholder="Nama lengkap"
                    disabled
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled
                >
                  <FormControl className="focus:border-[#25CAB8]">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="siswa">Siswa</SelectItem>
                    <SelectItem value="guru">Guru</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    placeholder="Password"
                    disabled
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password_confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">
                  Konfirmasi Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    placeholder="Confirmation password"
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

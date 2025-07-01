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

const addSchema = z
  .object({
    username: z
      .string()
      .min(8, { message: "Min 8 angka NISN" })
      .regex(/^\d+$/, { message: "Hanya boleh angka" }),
    name: z.string().min(4, { message: "Min 4 huruf nama" }),
    role: z.enum(["siswa", "guru", "admin"], {
      errorMap: () => ({ message: "Role wajib dipilih" }),
    }),
    password: z.string().min(8, { message: "Min 8 karakter password" }),
    password_confirmation: z
      .string()
      .min(8, { message: "Min 8 karakter konfirmasi password" }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi password tidak cocok",
  });

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const rawData = {
    username: formData.get("username"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password"),
    password_confirmation: formData.get("password_confirmation"),
  };

  const parsed = addSchema.safeParse(rawData);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const data = await axios.post("/register", parsed.data);
    console.log(data);
    return redirect("/kelola-user" + "?success=1");
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

export default function AddKelolaUser() {
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();

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
      username: "",
      name: "",
      role: undefined,
      password: "",
      password_confirmation: "",
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
              to="/kelola-user"
              className="h-min pl-1 items-center text-center *:text-[#5D5D5DAA] w-max  px-3   *:hover:cursor-pointer"
            >
              <ArrowLeft className="stroke-[2.5] hover:text-[#00BBA7]" />
            </Link>
            <h1 className="text-[#5D5D5D] font-bold text-center">
              Tambah Data User
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#5D5D5D]">Nama</FormLabel>
                <FormControl>
                  <Input
                    className="focus:border-[#25CAB8]"
                    {...field}
                    placeholder="Nama lengkap"
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
                  <Input type="password" {...field} placeholder="Password" />
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

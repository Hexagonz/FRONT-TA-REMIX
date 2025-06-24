import { Button } from "~/components/ui/button";
import book from "~/src/img/book.png";
import { Input } from "~/components/ui/input";
import { FormProvider, useForm } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";
import { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  json,
  MetaFunction,
  redirect,
  useNavigation,
  Form as RemixForm,
  useLoaderData,
  useActionData,
} from "@remix-run/react";
import { sessionStorage } from "~/services/session.services";
import { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.services";
import axios from "axios";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Login | Presenta" }];
};

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  })      .regex(/^[^\s<>'"\\/]+$/),
  password: z.string().min(8, {
    message: "Password must be at least 2 characters.",
  }),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await authenticator.authenticate("user-pass", request);
    const { access_token, refresh_token, role } = user;
    let session = await sessionStorage.getSession(
      request.headers.get("cookie")
    );
    session.set("access_token", access_token);
    session.set("refresh_token", refresh_token);
    session.set("role", role);
    return redirect("/dashboard", {
      headers: [
        ["Set-Cookie", await sessionStorage.commitSession(session)],
        [
          "Set-Cookie",
          `refreshToken=${user.refresh_token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=3600;`,
        ],
      ],
    });
  } catch (error: any) {
    console.log(error)
    if (axios.isAxiosError(error)) {
      const serverResponse = error.response?.data;
      return json(
        { error: serverResponse },
        { status: error.response?.status || 500 }
      );
    }
    return json({ error: "Unexpected error occurred" }, { status: 500 });
  }
}

export async function loader({ request }: ActionFunctionArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  let user = session.get("access_token");
  if (user) return redirect("/dashboard");
  return json({ user });
}

export default function Index() {
  return (
    <main className="bg-gradient-to-t from-teal-200 to-teal-500 w-full h-dvh flex items-center justify-center">
      <div className="box w-[55%] h-3/4 bg-white shadow-lg rounded-[5px] flex">
        <div className="title flex pr-10 bg-gradient-to-t from-teal-200 to-teal-500 justify-center items-center rounded-l-[5px]">
          <img src={book} alt="book" className="w-28 h-28" />
          <div className="titles m-0">
            <h1 className="font-inter text-[45px] text-white font-bold m-0 leading-tight">
              PRESENTA
            </h1>
            <p className="text-xs text-white m-0 leading-tight">
              Presensi SMA Negeri Tiga Pontianak
            </p>
          </div>
        </div>
        <div className="login mx-auto my-auto w-2/5">
          <ProfileForm />
        </div>
      </div>
    </main>
  );
}

export function ProfileForm() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  return (
    <FormProvider {...form}>
      <h1 className="text-[#25CAB8] font-bold text-[25px] mb-2 font-inter">
        Login
      </h1>
      <RemixForm method="post" className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Username"
                  {...field}
                  className="focus:border-[#25CAB8] placeholder:text-gray-400 h-10"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password"
                  {...field}
                  className="focus:border-[#25CAB8] placeholder:text-gray-400 h-10 "
                />
              </FormControl>
              <FormMessage className="text-[10px] " />
            </FormItem>
          )}
        />
        <div
          className="flex items-end justify-between"
          style={{ marginTop: "8px" }}
        >
          <div className="flex items-center gap-x-2">
            {/* <Checkbox className="accent-[#25CAB8]" /> */}
            <p className="text-gray-400 text-[12px]">Remember me</p>
          </div>
          <a href="#" className="underline text-[#25CAB8] text-[12px]">
            Forgot Password?
          </a>
        </div>
        <div className="flex flex-col items-center justify-center">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#25CAB8] w-10/12 align-middle hover:bg-slate-100 hover:text-[#25CAB8]"
          >
            {isLoading ? "Loading..." : "Sign In"}
          </Button>
        </div>
      </RemixForm>
    </FormProvider>
  );
}

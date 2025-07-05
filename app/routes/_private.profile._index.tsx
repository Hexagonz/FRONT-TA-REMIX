import { Form, useLocation, useMatches, useNavigate } from "@remix-run/react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Logout, User, Lock } from "@mynaui/icons-react";
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { getSession, destroySession } from "~/services/session.services";
import AlertComponent from "~/components/ui/alert-component";
import { useEffect, useRef } from "react";
import type { ProfileLoaderType } from "./_private.profile";
import { ProfileLoaderData } from "~/@types/type";
import { Bounce, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    const session = await getSession(request.headers.get("cookie"));
    const headers = new Headers();
    headers.append("Set-Cookie", await destroySession(session));
    headers.append(
      "Set-Cookie",
      "refreshToken=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax"
    );
    throw redirect("/login", { headers });
  }

  return null;
}

export default function Index() {
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const matches = useMatches();

  const profile = matches.find((m) => m.id === "routes/_private.profile")
    ?.data as ProfileLoaderData | undefined;
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get("success");

    if (success === "1") {
      toast.success("Password berhasil direset", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        className: "toast-mobile",
        transition: Bounce,
      });

      const newURL = new URL(window.location.href);
      newURL.searchParams.delete("success");
      window.history.replaceState({}, "", newURL.toString());
    }
  }, [location]);
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4  py-2 -mt-6">
      <Card className="shadow-xl w-full max-w-md">
        <CardHeader className="flex flex-col items-center justify-center gap-2">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
            <User className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-semibold">{profile?.name}</h1>
          <p className="text-sm text-gray-500">@{profile?.username}</p>
        </CardHeader>

        <CardContent className="space-y-2 mt-4">
          <div>
            <Label className="text-sm text-gray-600">Nama Lengkap</Label>
            <p className="text-base">{profile?.name}</p>
          </div>

          <div>
            <Label className="text-sm text-gray-600">Username</Label>
            <p className="text-base">{profile?.username}</p>
          </div>

          <div>
            <Label className="text-sm text-gray-600">Role</Label>
            <p className="text-base capitalize">{profile?.role}</p>
          </div>

          {/* 🔒 Tombol Ganti Password */}
          <div className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => navigate("/profile/reset-password")} // arahkan ke halaman ubah password
            >
              <Lock className="w-4 h-4" />
              Reset Password
            </Button>
          </div>

          {/* 🚪 Form logout dengan konfirmasi */}
          <Form ref={formRef} method="post" className="pt-4">
            <input type="hidden" name="intent" value="logout" />
            <AlertComponent
              text="Logout"
              Icon={Logout}
              alertTitle="Anda Yakin Ingin Keluar?"
              onClick={() => formRef.current?.submit()}
              className="w-full justify-center text-white bg-red-500 hover:bg-red-600 transition-all"
              classIcon="mr-2"
              color="#EF4444"
            />
          </Form>
        </CardContent>
      </Card>
      <ToastContainer toastClassName="toast-mobile" />
    </div>
  );
}

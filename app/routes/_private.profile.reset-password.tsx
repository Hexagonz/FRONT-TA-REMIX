import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { getSession } from "~/services/session.services";
import { axios } from "~/services/axios.services";
import { ArrowLeft } from "@mynaui/icons-react";

// ✅ Schema Zod
const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    password_confirmation: z.string().min(8, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Password dan konfirmasi tidak cocok",
    path: ["password_confirmation"],
  });

type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;

// ✅ Action Function
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);
  const parseResult = ResetPasswordSchema.safeParse(rawData);

  if (!parseResult.success) {
    return json(
      {
        errors: parseResult.error.flatten().fieldErrors,
        values: rawData,
      },
      { status: 400 }
    );
  }

  const session = await getSession(request.headers.get("cookie"));
  const token = session.get("access_token");
  if (!token) {
    return json(
      {
        errors: { general: ["Token tidak ditemukan di cookie"] },
        values: rawData,
      },
      { status: 401 }
    );
  }

  try {
    const resetTokenResponse = await axios.post(
      "/request-reset-password",
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const resetToken = resetTokenResponse?.data?.data?.token;

    // Step 2: Kirim reset password pakai token dari atas
    await axios.post(
      "/reset-password",
      {
        token: resetToken,
        password: parseResult.data.password,
        password_confirmation: parseResult.data.password_confirmation,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return redirect("/profile?success=1");
  } catch (error: any) {
    console.error("❌ Reset password error:", error?.response?.data || error);

    const errorMessage =
      error?.response?.data?.errors?.message ??
      "Gagal reset password. Silakan coba lagi.";

    return json(
      {
        errors: { general: [errorMessage] },
        values: rawData,
      },
      { status: 400 }
    );
  }
}

// ✅ Component
export default function ResetPasswordPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const {
    register,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordType>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    if (actionData?.values) {
      Object.entries(actionData.values).forEach(([key, value]) =>
        setValue(key as keyof ResetPasswordType, value as string)
      );
    }
  }, [actionData, setValue]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="grid grid-cols-3 items-center">
            {/* Tombol kembali di kiri */}
            <Link
              to="/profile"
              className="justify-self-start text-[#5D5D5DAA] hover:text-slate-500 transition"
            >
              <ArrowLeft className="stroke-[2.5] w-5 h-5" />
            </Link>

            {/* Judul di tengah */}
            <h2 className="text-lg font-semibold text-center  text-[#333]">
              Reset Password
            </h2>

            {/* Kosong di kanan untuk menyeimbangkan grid */}
            <div />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form method="post" className="space-y-4">
            <div>
              <Label htmlFor="password">Password Baru</Label>
              <Input type="password" id="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
              <Input
                type="password"
                id="password_confirmation"
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-red-500">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting"
                ? "Menyimpan..."
                : "Reset Password"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

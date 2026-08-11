import React from "react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[], password?: string[] }>({});
  const { login } = useAuth();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Berhasil masuk! Mengarahkan...");
      }
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.statusCode === 422 && response?.errors?.fieldErrors) {
        setFieldErrors(response.errors.fieldErrors);
        toast.error(response.message || "Validasi gagal. Periksa kembali isian Anda.");
      } else if (response?.message) {
        toast.error(response.message);
      } else {
        toast.error("Login gagal. Periksa koneksi Anda.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <React.Fragment>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="grid min-h-screen lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hidden lg:flex lg:flex-col lg:justify-center lg:px-20 text-white"
            style={{
              backgroundImage:
                "radial-gradient(circle at top, rgba(14,165,233,0.25), transparent 40%), linear-gradient(135deg, #0f172a, #111827)",
            }}
          >
            <h1 className="text-4xl font-extrabold">
              Platform Pemeliharaan Armada
            </h1>
            <p className="mt-4 max-w-md text-slate-300">
              Pantau antrian perbaikan, kesehatan armada, dan aktivitas operator
              dalam satu pusat kontrol terpadu.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="flex items-center justify-center px-6 py-12"
          >
            <div className="w-full max-w-md rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-8 shadow-2xl backdrop-blur">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/70 p-1">
                  <Image
                    src="/images/icon.png"
                    alt="ENG Group"
                    width={88}
                    height={88}
                    className="rounded-xl"
                  />
                </div>
                <h2 className="text-2xl font-bold">Selamat Datang Kembali</h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Masukkan kredensial Anda untuk melanjutkan
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  error={fieldErrors.email?.[0]}
                />
                <InputField
                  label="Kata Sandi"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  error={fieldErrors.password?.[0]}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </React.Fragment>
  );
}

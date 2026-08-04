import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppButton } from "../components/ui/AppButton";
import { AppInput } from "../components/ui/AppInput";
import { setCredentials } from "../features/auth/auth.slice";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useLoginMutation } from "../services/authApi";

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await login({
        email,
        password,
      }).unwrap();

      dispatch(setCredentials(response.data));
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.log("LOGIN_ERROR:", JSON.stringify(error, null, 2));

      const message =
        error?.data?.message ??
        error?.error ??
        "No se pudo iniciar sesión. Revisa tus credenciales.";

      alert(message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Sales Control
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Accede al panel web usando tu usuario ADMIN o SELLER.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <AppInput
            label="Correo"
            type="email"
            placeholder="admin@test.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <AppInput
            label="Contraseña"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <AppButton type="submit" className="w-full" isLoading={isLoading}>
            Entrar
          </AppButton>
        </form>
      </section>
    </main>
  );
}

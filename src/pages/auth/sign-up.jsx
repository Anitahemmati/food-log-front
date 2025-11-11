import { Card, Input, Button, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signUp } from "@/api";
import { saveSession } from "@/utils/auth";
import { useMeal } from "@/context/meal";

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUp() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshMeals } = useMeal();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const trimmedEmail = form.email.trim();
    setLoading(true);

    signUp({
      email: trimmedEmail,
      password: form.password,
    })
      .then((response) => {
        const resolvedEmail = response?.user?.email || trimmedEmail;
        saveSession({
          token: response?.token,
          email: resolvedEmail,
          provider: "password",
          userId: response?.user?.id || null,
        });
        refreshMeals().catch(() => undefined);
        navigate("/dashboard/home");
      })
      .catch((err) => {
        setError(
          err?.data?.message ||
            err?.data?.error ||
            err?.message ||
            "We could not create your account. Please try again."
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.2),transparent_40%)]" />
      <Card className="w-full max-w-lg border border-white/50 bg-white/80 shadow-2xl shadow-orange-200/40 backdrop-blur">
        <div className="flex flex-col items-center gap-4 px-8 pt-10 text-center">
          <img
            src="/icons/food-log-icon-192.png"
            alt="Food Log"
            className="h-20 w-20 rounded-3xl border border-orange-200 bg-white p-3 shadow-lg shadow-orange-200/50"
          />
          <Typography variant="h3" className="font-semibold text-[var(--food-primary-dark)]">
            Create your account
          </Typography>
          <Typography variant="small" className="text-slate-500">
            Sign up to capture meals, view predictions, and track insights.
          </Typography>
        </div>
        <form className="space-y-6 px-8 pb-10 pt-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Typography variant="small" className="text-left font-medium text-slate-600">
              Email
            </Typography>
            <Input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              size="lg"
              placeholder="email@domain.com"
              className="rounded-2xl !border-orange-100 focus:!border-[var(--food-primary)]"
              labelProps={{ className: "hidden" }}
            />
          </div>
          <div className="space-y-2">
            <Typography variant="small" className="text-left font-medium text-slate-600">
              Password
            </Typography>
            <Input
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              size="lg"
              placeholder="********"
              className="rounded-2xl !border-orange-100 focus:!border-[var(--food-primary)]"
              labelProps={{ className: "hidden" }}
            />
          </div>
          <div className="space-y-2">
            <Typography variant="small" className="text-left font-medium text-slate-600">
              Confirm password
            </Typography>
            <Input
              name="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              size="lg"
              placeholder="********"
              className="rounded-2xl !border-orange-100 focus:!border-[var(--food-primary)]"
              labelProps={{ className: "hidden" }}
            />
          </div>
          {error && (
            <Typography variant="small" color="red" className="font-medium">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--food-primary)] py-3 text-base font-semibold shadow-lg shadow-orange-300/40 transition hover:bg-[var(--food-primary-dark)]"
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>
          <Typography variant="small" className="text-center text-slate-500">
            Already on Food Log?
            <Link to="/sign-in" className="ml-1 font-medium text-[var(--food-primary)]">
              Sign in
            </Link>
          </Typography>
        </form>
      </Card>
    </section>
  );
}

export default SignUp;

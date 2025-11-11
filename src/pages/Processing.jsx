import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { useMeal } from "@/context/meal";
import { predictMeal } from "@/api";

export default function Processing() {
  const { capture, setAnalysis, setCapture } = useMeal();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let redirectTimeout;

    if (!capture?.file) {
      navigate("/dashboard/home", { replace: true });
      return () => undefined;
    }

    const processMeal = async () => {
      try {
        const prediction = await predictMeal(capture.file, {
          capturedAt: capture?.capturedAt,
        });
        if (!prediction) {
          throw new Error("Prediction failed. No data returned from server.");
        }

        const inferredCalories =
          prediction?.calories ?? prediction?.nutrition_facts?.calories ?? null;
        const normalizedAnalysis = {
          meal: prediction?.meal || prediction?.food || "Logged Meal",
          ingredients: prediction?.ingredients || [],
          calories: inferredCalories,
          image: prediction?.image_url || prediction?.image,
          raw: prediction,
          previewUrl: capture.previewUrl,
          capturedAt:
            capture?.capturedAt ||
            prediction?.consumed_at ||
            prediction?.timestamp ||
            prediction?.metadata?.meal_date ||
            null,
        };

        setAnalysis(normalizedAnalysis);
        redirectTimeout = setTimeout(() => navigate("/result", { replace: true }), 3000);
      } catch (err) {
        setError(
          err.message || "We could not analyze this meal. Please try again."
        );
        setCapture(null);
        setAnalysis(null);
        redirectTimeout = setTimeout(
          () => navigate("/dashboard/home", { replace: true }),
          2500
        );
      }
    };

    processMeal();

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [capture, navigate, setAnalysis, setCapture]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md border border-orange-100/60 bg-white/90 shadow-xl shadow-orange-200/40 backdrop-blur">
        <CardBody className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-orange-200 bg-orange-50">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--food-primary)] border-t-transparent" />
          </div>
          <div className="space-y-2">
            <Typography variant="h4" className="text-[var(--food-primary-dark)]">
              Processing...
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Analyzing your meal...
            </Typography>
          </div>
          {error && (
            <Typography variant="small" color="red">
              {error}
            </Typography>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Typography,
} from "@material-tailwind/react";
import { useMeal } from "@/context/meal";
import { resolveBackendImage } from "@/api";
import { formatMealDate } from "@/utils/meals";

const formatPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
};

export default function Result() {
  const { capture, analysis, setCapture, setAnalysis, refreshMeals } = useMeal();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!analysis) {
      navigate("/dashboard/home", { replace: true });
    }
  }, [analysis, navigate]);

  const imageSrc = useMemo(() => {
    if (analysis?.previewUrl) return analysis.previewUrl;
    if (capture?.previewUrl) return capture.previewUrl;
    const backendImage = analysis?.image || analysis?.image_url;
    if (backendImage) return resolveBackendImage(backendImage);
    return "/img/home-decor-1.jpeg";
  }, [analysis, capture]);

  const ingredients = analysis?.ingredients || [];
  const calories = analysis?.calories;
  const mealName = analysis?.meal || "Logged Meal";
  const mealDate = analysis?.capturedAt
    ? formatMealDate(analysis.capturedAt)
    : analysis?.raw?.timestamp
    ? formatMealDate(analysis.raw.timestamp)
    : null;
  const metadata = analysis?.metadata || analysis?.raw?.metadata || {};
  const hfDiagnostics = analysis?.hfDiagnostics || metadata?.hf_space || null;
  const inferenceSource =
    analysis?.inferenceSource ||
    analysis?.raw?.inference_source ||
    metadata?.inference_source ||
    null;
  const mlServiceError =
    analysis?.mlServiceError ||
    analysis?.raw?.ml_service_error ||
    metadata?.ml_service_error ||
    null;
  const nutritionFacts = useMemo(() => {
    const facts =
      analysis?.nutritionFacts ||
      analysis?.raw?.nutrition_facts ||
      metadata?.nutrition_facts ||
      {};
    return {
      calories: facts?.calories ?? calories ?? null,
      carbohydrates: facts?.carbohydrates ?? null,
      proteins: facts?.proteins ?? null,
      fats: facts?.fats ?? null,
    };
  }, [analysis, calories, metadata]);
  const macroEntries = [
    { key: "calories", label: "Calories", value: nutritionFacts.calories, unit: "Cal" },
    { key: "carbohydrates", label: "Carbs", value: nutritionFacts.carbohydrates, unit: "g" },
    { key: "proteins", label: "Protein", value: nutritionFacts.proteins, unit: "g" },
    { key: "fats", label: "Fat", value: nutritionFacts.fats, unit: "g" },
  ];
  const showInsights = Boolean(inferenceSource || hfDiagnostics || mlServiceError);
  const readableInferenceSource = inferenceSource
    ? String(inferenceSource).replace(/[_-]/g, " ")
    : null;
  const hfConfidence = formatPercent(hfDiagnostics?.confidence);
  const hfThreshold = formatPercent(hfDiagnostics?.threshold);

  const resetFlow = () => {
    setCapture(null);
    setAnalysis(null);
  };

  const handleCancel = () => {
    resetFlow();
    navigate("/dashboard/home", { replace: true });
  };

  const handleSave = async () => {
    if (!analysis) return;
    setError("");
    setSaving(true);

    try {
      await refreshMeals();
      resetFlow();
      navigate("/dashboard/home", { replace: true });
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "Unable to save this meal right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-3xl border border-orange-100/60 bg-white/90 shadow-2xl shadow-orange-200/50 backdrop-blur">
        <CardBody className="flex flex-col gap-8 p-8 sm:p-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Typography variant="h4" className="text-[var(--food-primary-dark)]">
                {mealName}
              </Typography>
              <div className="overflow-hidden rounded-3xl border border-orange-100/60 bg-orange-50/60 shadow-inner">
                <img
                  src={imageSrc}
                  alt={mealName}
                  className="h-64 w-full object-cover"
                />
              </div>
              {mealDate && (
                <Typography variant="small" className="text-slate-500">
                  Logged for {mealDate}
                </Typography>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <Typography variant="small" className="font-semibold uppercase text-slate-500">
                  Ingredients
                </Typography>
                <ul className="mt-2 space-y-2">
                  {ingredients.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="rounded-xl border border-orange-50 bg-orange-50/60 px-4 py-2 text-sm font-medium text-[var(--food-primary-dark)]"
                    >
                      {ingredient}
                    </li>
                  ))}
                  {!ingredients.length && (
                    <li className="rounded-xl border border-dashed border-orange-200 px-4 py-3 text-sm font-semibold text-orange-500">
                      Sorry! Unfortunately, we cannot analyze your picture!
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-teal-50 px-5 py-4 text-[var(--food-primary)] shadow-inner">
                <Typography variant="small" className="uppercase tracking-wide text-[var(--food-primary-dark)]">
                  Estimated Nutrition
                </Typography>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {macroEntries.map((entry) => (
                    <div
                      key={entry.key}
                      className="rounded-xl border border-orange-100/70 bg-white/70 px-3 py-2 text-left shadow-sm"
                    >
                      <p className="text-[11px] font-semibold uppercase text-slate-500">
                        {entry.label}
                      </p>
                      <p className="text-lg font-semibold text-[var(--food-primary-dark)]">
                        {entry.value ?? "—"}
                        {entry.value != null && entry.unit ? ` ${entry.unit}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {showInsights && (
                <div className="rounded-2xl border border-orange-100 bg-white/80 px-5 py-4 text-left shadow-inner shadow-orange-100/60">
                  <Typography variant="small" className="uppercase tracking-wide text-[var(--food-primary-dark)]">
                    Model Insights
                  </Typography>
                  <div className="mt-3 space-y-2 text-sm">
                    {readableInferenceSource && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Source</span>
                        <span className="font-semibold capitalize text-[var(--food-primary-dark)]">
                          {readableInferenceSource}
                        </span>
                      </div>
                    )}
                    {hfDiagnostics?.label && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Top label</span>
                        <span className="font-semibold text-[var(--food-primary-dark)]">
                          {hfDiagnostics.label}
                        </span>
                      </div>
                    )}
                    {hfConfidence && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Confidence</span>
                        <span className="font-semibold text-[var(--food-primary-dark)]">
                          {hfConfidence}
                        </span>
                      </div>
                    )}
                    {hfThreshold && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Threshold</span>
                        <span className="font-semibold text-[var(--food-primary-dark)]">
                          {hfThreshold}
                        </span>
                      </div>
                    )}
                    {mlServiceError && (
                      <div className="rounded-xl border border-red-100 bg-red-50/80 px-3 py-2 text-xs text-red-700">
                        {mlServiceError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {error && (
            <Typography variant="small" color="red" className="font-medium">
              {error}
            </Typography>
          )}
        </CardBody>
        <CardFooter className="flex flex-col gap-3 border-t border-orange-100/60 bg-orange-50/60 px-8 py-6 sm:flex-row sm:justify-end">
          <Button
            variant="outlined"
            color="orange"
            onClick={handleCancel}
            className="w-full border-orange-200 text-[var(--food-primary-dark)] hover:bg-orange-50 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            color="orange"
            onClick={handleSave}
            disabled={saving}
            className="w-full font-semibold shadow-lg shadow-orange-300/40 sm:w-auto"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

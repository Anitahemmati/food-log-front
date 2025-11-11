import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { useMeal } from "@/context/meal";
import { predictMeal, PREDICT_ERROR_CODES } from "@/api";

const formatPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
};

export default function Processing() {
  const { capture, setAnalysis, setCapture } = useMeal();
  const [error, setError] = useState("");
  const [lowConfidenceDetails, setLowConfidenceDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let redirectTimeout;

    if (!capture?.file) {
      navigate("/dashboard/home", { replace: true });
      return () => undefined;
    }

    const processMeal = async () => {
      setError("");
      setLowConfidenceDetails(null);
      try {
        const prediction = await predictMeal(capture.file, {
          capturedAt: capture?.capturedAt,
        });
        if (!prediction) {
          throw new Error("Prediction failed. No data returned from server.");
        }

        const inferredCalories =
          prediction?.calories ?? prediction?.nutrition_facts?.calories ?? null;
        const metadata = prediction?.metadata || {};
        const nutritionFacts = prediction?.nutrition_facts || {};
        const hfDiagnostics = metadata?.hf_space || null;
        const normalizedAnalysis = {
          meal: prediction?.meal || prediction?.food || "Logged Meal",
          ingredients: prediction?.ingredients || [],
          calories: inferredCalories,
          image: prediction?.image_url || prediction?.image,
          nutritionFacts: {
            calories:
              inferredCalories ??
              nutritionFacts?.calories ??
              metadata?.calories ??
              null,
            carbohydrates: nutritionFacts?.carbohydrates ?? null,
            proteins: nutritionFacts?.proteins ?? null,
            fats: nutritionFacts?.fats ?? null,
          },
          metadata,
          inferenceSource:
            prediction?.inference_source || metadata?.inference_source || null,
          mlServiceError:
            prediction?.ml_service_error || metadata?.ml_service_error || null,
          hfDiagnostics,
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
        setLowConfidenceDetails(null);
        redirectTimeout = setTimeout(() => navigate("/result", { replace: true }), 3000);
      } catch (err) {
        if (err?.code === PREDICT_ERROR_CODES.LOW_CONFIDENCE) {
          setLowConfidenceDetails(err.details || null);
          setError(
            err.details?.details ||
              err.message ||
              "We detected a meal but the confidence is below the required threshold."
          );
        } else {
          setLowConfidenceDetails(null);
          setError(
            err.message || "We could not analyze this meal. Please try again."
          );
        }
        setCapture(null);
        setAnalysis(null);
        const redirectDelay =
          err?.code === PREDICT_ERROR_CODES.LOW_CONFIDENCE ? 4000 : 2500;
        redirectTimeout = setTimeout(
          () => navigate("/dashboard/home", { replace: true }),
          redirectDelay
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
            <div className="w-full rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-left">
              <Typography variant="small" className="font-semibold text-[var(--food-primary-dark)]">
                {error}
              </Typography>
              {lowConfidenceDetails && (
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {lowConfidenceDetails.label && (
                    <div className="flex items-center justify-between">
                      <span>Top label</span>
                      <span className="font-semibold text-[var(--food-primary-dark)]">
                        {lowConfidenceDetails.label}
                      </span>
                    </div>
                  )}
                  {lowConfidenceDetails.confidence != null && (
                    <div className="flex items-center justify-between">
                      <span>Confidence</span>
                      <span className="font-semibold text-[var(--food-primary-dark)]">
                        {formatPercent(lowConfidenceDetails.confidence) || "—"}
                      </span>
                    </div>
                  )}
                  {lowConfidenceDetails.threshold != null && (
                    <div className="flex items-center justify-between">
                      <span>Threshold</span>
                      <span className="font-semibold text-[var(--food-primary-dark)]">
                        {formatPercent(lowConfidenceDetails.threshold) || "—"}
                      </span>
                    </div>
                  )}
                  {lowConfidenceDetails.details && (
                    <p className="pt-2 text-[11px] text-slate-500">
                      {lowConfidenceDetails.details}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

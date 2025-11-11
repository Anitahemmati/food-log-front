import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
} from "@material-tailwind/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useMeal } from "@/context/meal";
import { useMaterialTailwindController } from "@/context";
import { MealCaptureDialog } from "@/components/meal-capture/MealCaptureDialog";
import { formatMealDate, parseMealDate } from "@/utils/meals";

const colorPalette = {
  dark: { primary: "#f97316", secondary: "#fb923c" },
  white: { primary: "#f97316", secondary: "#22d3ee" },
  green: { primary: "#10b981", secondary: "#34d399" },
  blue: { primary: "#0ea5e9", secondary: "#38bdf8" },
  red: { primary: "#f97316", secondary: "#fb923c" },
  pink: { primary: "#ec4899", secondary: "#f472b6" },
  default: { primary: "#f97316", secondary: "#22d3ee" },
};

export default function FoodLogDashboard() {
  const { setCapture, setAnalysis, meals, mealsLoading, mealsError } = useMeal();
  useEffect(() => {
    console.groupCollapsed("[Dashboard] meals from context");
    console.log(meals);
    console.groupEnd();
  }, [meals]);
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const navigate = useNavigate();

  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  const openCaptureDialog = () => setIsCaptureOpen(true);
  const closeCaptureDialog = () => setIsCaptureOpen(false);

  const handleCaptureConfirm = async ({ file, previewUrl, capturedAt }) => {
    setCapture({ file, previewUrl, capturedAt });
    setAnalysis(null);
    navigate("/processing");
  };
  const normalizedMeals = useMemo(() => {
    if (!Array.isArray(meals)) return [];

    return meals
      .map((item) => {
        const dateValue =
          item.consumed_at ||
          item.metadata?.meal_date ||
          item.timestamp ||
          item.created_at ||
          item.date;
        const parsedDate = parseMealDate(dateValue);
        if (!parsedDate) {
          console.warn("[Dashboard] unable to parse date", {
            raw: dateValue,
            item,
          });
        }
        if (!parsedDate) return null;
        const calories =
          item.calories ?? item.nutrition_facts?.calories ?? null;
        return {
          id: item.id,
          name: item.name || item.food || "Meal",
          date: parsedDate,
          calories: Number.isFinite(calories) ? Number(calories) : 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [meals]);

  const chartData = useMemo(() => {
    if (!normalizedMeals.length) {
      return {
        categories: [],
        series: [],
      };
    }

    const totalsByDay = new Map();
    normalizedMeals.forEach((meal) => {
      const key = meal.date.toISOString().slice(0, 10);
      const current = totalsByDay.get(key) || {
        date: meal.date,
        calories: 0,
      };
      current.calories += meal.calories;
      totalsByDay.set(key, current);
    });

    const orderedTotals = Array.from(totalsByDay.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const recentTotals = orderedTotals.slice(-10);

    return {
      categories: recentTotals.map((entry) => formatMealDate(entry.date)),
      series: recentTotals.map((entry) => entry.calories),
    };
  }, [normalizedMeals]);

  const summary = useMemo(() => {
    if (!normalizedMeals.length) {
      return {
        totalMeals: 0,
        totalCalories: 0,
        averageCalories: 0,
        latestMeal: null,
      };
    }

    const totalMeals = normalizedMeals.length;
    const totalCalories = normalizedMeals.reduce(
      (sum, meal) => sum + meal.calories,
      0
    );
    const latestMeal = normalizedMeals[normalizedMeals.length - 1];
    return {
      totalMeals,
      totalCalories,
      averageCalories: Math.round(totalCalories / totalMeals),
      latestMeal,
    };
  }, [normalizedMeals]);

  useEffect(() => {
    console.groupCollapsed("[Dashboard] normalized meals");
    console.log(normalizedMeals);
    console.groupEnd();
  }, [normalizedMeals]);

  useEffect(() => {
    console.groupCollapsed("[Dashboard] chart data");
    console.log(chartData);
    console.groupEnd();
  }, [chartData]);

  useEffect(() => {
    console.groupCollapsed("[Dashboard] summary");
    console.log(summary);
    console.groupEnd();
  }, [summary]);

  const chartTheme = colorPalette[sidenavColor] || colorPalette.default;

  const chartConfig = useMemo(
    () => ({
      type: "area",
      height: 280,
      series: [
        {
          name: "Calories",
          data: chartData.series,
        },
      ],
      options: {
        chart: {
          toolbar: { show: false },
          foreColor: "#4f5464",
        },
        stroke: {
          curve: "smooth",
          width: 3,
        },
        colors: [chartTheme.primary],
        dataLabels: { enabled: false },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 0.8,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            colorStops: [
              {
                offset: 0,
                color: chartTheme.primary,
                opacity: 0.45,
              },
              {
                offset: 100,
                color: chartTheme.secondary,
                opacity: 0.05,
              },
            ],
          },
        },
        grid: {
          borderColor: "#e9edf5",
          strokeDashArray: 6,
        },
        xaxis: {
          categories: chartData.categories,
          labels: {
            rotate: -45,
            style: { fontSize: "12px", fontWeight: 500 },
          },
          axisBorder: { color: "#d5dae5" },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            formatter: (value) => `${value} kcal`,
            style: { fontSize: "12px", fontWeight: 500 },
          },
        },
        tooltip: {
          theme: "light",
          y: {
            formatter: (value) => `${value} kcal`,
          },
        },
      },
    }),
    [chartData, chartTheme]
  );

  return (
    <>
      <div className="space-y-8 pb-32 sm:pb-28">
        <Card className="border border-orange-100/60 bg-white/80 shadow-lg shadow-orange-100/60">
          <CardHeader
            floated={false}
            shadow={false}
            className="rounded-none px-4 py-5 sm:px-6"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Typography variant="h5" className="text-[var(--food-primary-dark)]">
                  Weekly Calorie Tracker
                </Typography>
                <Typography variant="small" className="text-slate-500">
                  Snapshot of your intake over the last seven days
                </Typography>
              </div>
            </div>
          </CardHeader>
          <CardBody className="px-0 pb-6 pt-0 sm:px-2">
            {mealsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Typography variant="small" className="text-slate-500">
                  Loading calorie data...
                </Typography>
              </div>
            ) : chartData.series.length ? (
              <Chart {...chartConfig} />
            ) : (
              <div className="flex h-64 items-center justify-center">
                <Typography variant="small" className="text-slate-500">
                  {mealsError || "Log your first meal to see the chart."}
                </Typography>
              </div>
            )}
          </CardBody>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-orange-100/60 bg-white/85 shadow-lg shadow-orange-100/40">
            <CardBody className="space-y-1">
              <Typography variant="small" className="uppercase text-slate-500">
                Meals logged
              </Typography>
              <Typography variant="h3" className="font-semibold text-[var(--food-primary-dark)]">
                {summary.totalMeals}
              </Typography>
            </CardBody>
          </Card>
          <Card className="border border-orange-100/60 bg-white/85 shadow-lg shadow-orange-100/40">
            <CardBody className="space-y-1">
              <Typography variant="small" className="uppercase text-slate-500">
                Total calories
              </Typography>
              <Typography variant="h3" className="font-semibold text-[var(--food-primary-dark)]">
                {summary.totalCalories.toLocaleString()} kcal
              </Typography>
            </CardBody>
          </Card>
          <Card className="border border-orange-100/60 bg-white/85 shadow-lg shadow-orange-100/40">
            <CardBody className="space-y-1">
              <Typography variant="small" className="uppercase text-slate-500">
                Avg meal calories
              </Typography>
              <Typography variant="h3" className="font-semibold text-[var(--food-primary-dark)]">
                {summary.averageCalories || 0} kcal
              </Typography>
            </CardBody>
          </Card>
          <Card className="border border-orange-100/60 bg-white/85 shadow-lg shadow-orange-100/40">
            <CardBody className="space-y-1">
              <Typography variant="small" className="uppercase text-slate-500">
                Latest meal
              </Typography>
              {summary.latestMeal ? (
                <div>
                  <Typography variant="h6" className="font-semibold text-[var(--food-primary-dark)]">
                    {summary.latestMeal.name}
                  </Typography>
                  <Typography variant="small" className="text-slate-500">
                    {formatMealDate(summary.latestMeal.date)}
                  </Typography>
                </div>
              ) : (
                <Typography variant="small" className="text-slate-500">
                  Log a meal to see details.
                </Typography>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 sm:px-6">
        <Button
          color="orange"
          onClick={openCaptureDialog}
          aria-label="Log a meal"
          className="flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[var(--food-primary)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-orange-300/50 transition-all duration-300 hover:bg-[var(--food-primary-dark)] hover:shadow-xl sm:w-auto sm:px-8"
        >
          <PlusIcon className="h-5 w-5" />
          Log Meal
        </Button>
      </div>

      <MealCaptureDialog
        open={isCaptureOpen}
        onClose={closeCaptureDialog}
        onConfirm={handleCaptureConfirm}
      />
    </>
  );
}

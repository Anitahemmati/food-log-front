import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { fetchMealHistory } from "@/api";
import { AUTH_EVENT, getToken } from "@/utils/auth";

const MealContext = createContext(null);
MealContext.displayName = "MealContext";

export function MealProvider({ children }) {
  const [capture, setCapture] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState("");

  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    []
  );

  const refreshMeals = useCallback(async () => {
    setMealsLoading(true);
    setMealsError("");
    try {
      const data = await fetchMealHistory();
      console.groupCollapsed("[MealProvider] fetched history");
      console.log("items", data);
      console.groupEnd();
      if (isMounted.current) {
        setMeals(data);
        console.info("[MealProvider] state updated", {
          count: Array.isArray(data) ? data.length : null,
        });
      }
      return data;
    } catch (error) {
      console.error("[MealProvider] history fetch failed", error);
      if (isMounted.current) {
        setMeals([]);
        setMealsError(
          error?.message || "Unable to load meals from the server right now."
        );
      }
      throw error;
    } finally {
      if (isMounted.current) {
        setMealsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = getToken();
      console.info("[MealProvider] auth change detected", { hasToken: Boolean(token) });
      if (!token) {
        if (isMounted.current) {
          setMeals([]);
          setMealsError("");
        }
        return;
      }

      refreshMeals().catch(() => undefined);
    };

    handleAuthChange();

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener(AUTH_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
    };
  }, [refreshMeals]);

  const value = useMemo(
    () => ({
      capture,
      setCapture,
      analysis,
      setAnalysis,
      meals,
      refreshMeals,
      mealsLoading,
      mealsError,
    }),
    [analysis, capture, meals, mealsError, mealsLoading, refreshMeals]
  );

  return <MealContext.Provider value={value}>{children}</MealContext.Provider>;
}

MealProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useMeal() {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error("useMeal must be used within a MealProvider.");
  }
  return context;
}

export default MealProvider;

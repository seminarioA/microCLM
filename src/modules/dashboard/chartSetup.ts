import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

Chart.defaults.font.family = "Kanit, sans-serif";

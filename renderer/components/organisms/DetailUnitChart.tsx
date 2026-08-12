import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DetailUnitChart({ 
  chartData, 
  chartOptions 
}: { 
  chartData: any; 
  chartOptions: any; 
}) {
  return (
    <Bar data={chartData} options={chartOptions} />
  );
}

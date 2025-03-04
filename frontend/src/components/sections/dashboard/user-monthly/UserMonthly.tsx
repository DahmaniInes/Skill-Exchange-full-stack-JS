import CardContainer from 'components/common/CardContainter';
import UserMonthlyChart from 'components/sections/dashboard/user-monthly/UserMonthlyChart.tsx';
import { UserMonthlyDataType } from 'data/user-monthly-chart.ts';
import ReactECharts from 'echarts-for-react';
import { useChartResize } from 'providers/useEchartResize';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const UserMonthly = () => {
  const chartRef = useRef<ReactECharts>(null);
  const [chartData, setChartData] = useState<UserMonthlyDataType>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useChartResize(chartRef);

  // Fetch balance data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/monthly');
        setChartData(response.data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch balance data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
      <CardContainer title="Balance History">
        <UserMonthlyChart chartRef={chartRef} seriesData={chartData} />
      </CardContainer>
  );
};

export default UserMonthly;
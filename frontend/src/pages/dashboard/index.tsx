import { Grid } from '@mui/material';
import WeeklyActivity from 'components/sections/dashboard/activity/WeeklyActivity';
import UserMonthly from 'components/sections/dashboard/user-monthly/UserMonthly.tsx';
import MyCards from 'components/sections/dashboard/creditCards/MyCards';
import ExpenseStatistics from 'components/sections/dashboard/expense/ExpenseStatistics';
import RecentTransactions from 'components/sections/dashboard/transactions/RecentTransaction';
import QuickTransfer from 'components/sections/dashboard/transfer/QuickTransfer';
import UserTable from 'components/sections/dashboard/user-table/UserManagementTable.tsx';

const Dashboard = () => {
  return (
    <Grid container spacing={{ xs: 2.5, sm: 3 }} mb={3}>
      {/* ------------- Card section ---------------- */}
      <Grid item xs={12} xl={8} zIndex={1}>
        <MyCards />
      </Grid>
      <Grid item xs={12} xl={4} zIndex={1}>
        <RecentTransactions />
      </Grid>

      {/* ------------- Chart section ---------------- */}
      <Grid item xs={12} lg={8} zIndex={1}>
        <WeeklyActivity />
      </Grid>
      <Grid item xs={12} lg={4}>
        <ExpenseStatistics />
      </Grid>

      {/* ------------- Slider section ---------------- */}
      <Grid item xs={12} lg={6} xxl={4} zIndex={1}>
        <QuickTransfer />
      </Grid>
      <Grid item xs={12} lg={6} xxl={8} zIndex={1}>
        <UserMonthly />
      </Grid>

      {/* ------------- Data-Grid section ---------------- */}
      <Grid item xs={12}>
        <UserTable />
      </Grid>
    </Grid>
  );
};

export default Dashboard;

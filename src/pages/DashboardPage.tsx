import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="dashboard-page">
      <h2>Welcome {user?.loginName}</h2>
    </section>
  );
}

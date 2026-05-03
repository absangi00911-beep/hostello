"use client";

import styles from "./analytics.module.css";

interface AnalyticsProps {
  monthlyData: Array<{ month: string; revenue: number; bookings: number }>;
  statusBreakdown: Record<string, number>;
  reviewDistribution: Record<number, number>;
  avgRating: number;
  totalRevenue: number;
  totalBookings: number;
}

export default function Analytics({
  monthlyData,
  statusBreakdown,
  reviewDistribution,
  avgRating,
  totalRevenue,
  totalBookings,
}: AnalyticsProps) {
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));
  const maxBookings = Math.max(...monthlyData.map((d) => d.bookings));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics & Performance</h1>
        <p className={styles.subtitle}>Track your hostel performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Revenue</p>
          <p className={styles.metricValue}>PKR {totalRevenue.toLocaleString()}</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Bookings</p>
          <p className={styles.metricValue}>{totalBookings}</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Average Rating</p>
          <div className={styles.rating}>
            <p className={styles.metricValue}>{avgRating}</p>
            <span className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < Math.floor(avgRating) ? styles.fillStar : styles.emptyStar}>
                  ★
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Revenue Chart */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Revenue & Bookings (12 Months)</h2>
          <div className={styles.chart}>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.colorRevenue}`}></span>
                <span>Revenue</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.colorBookings}`}></span>
                <span>Bookings</span>
              </div>
            </div>

            <div className={styles.bars}>
              {monthlyData.map((data, idx) => {
                const revenueHeight = (data.revenue / maxRevenue) * 100 || 0;
                const bookingsHeight = (data.bookings / maxBookings) * 100 || 0;

                return (
                  <div key={idx} className={styles.barGroup}>
                    <div className={styles.barContainer}>
                      <div
                        className={`${styles.bar} ${styles.barRevenue}`}
                        style={{ height: `${revenueHeight}%` }}
                        title={`${data.month}: PKR ${data.revenue.toLocaleString()}`}
                      ></div>
                      <div
                        className={`${styles.bar} ${styles.barBookings}`}
                        style={{ height: `${bookingsHeight}%` }}
                        title={`${data.month}: ${data.bookings} bookings`}
                      ></div>
                    </div>
                    <span className={styles.barLabel}>{data.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Booking Status */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Booking Status</h2>
          <div className={styles.statusChart}>
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;

              const statusColors: Record<string, string> = {
                PENDING: "#f59e0b",
                CONFIRMED: "#10b981",
                COMPLETED: "#3b82f6",
                CANCELLED: "#ef4444",
              };

              return (
                <div key={status} className={styles.statusItem}>
                  <div className={styles.statusHeader}>
                    <span className={styles.statusName}>{status}</span>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progress}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: statusColors[status],
                      }}
                    ></div>
                  </div>
                  <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Distribution */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Review Distribution</h2>
        <div className={styles.reviewChart}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviewDistribution[rating] || 0;
            const total = Object.values(reviewDistribution).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={rating} className={styles.reviewItem}>
                <span className={styles.reviewLabel}>
                  {rating} {Array.from({ length: rating }).map((_, i) => "★").join("")}
                </span>
                <div className={styles.reviewBar}>
                  <div
                    className={styles.reviewFill}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className={styles.reviewCount}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

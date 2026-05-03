import Link from "next/link";
import styles from "./stat-card.module.css";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  link?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  link,
}: StatCardProps) {
  const content = (
    <div className={styles.card}>
      <div className={styles.iconBox}>{icon}</div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.value}>{value}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className={styles.cardLink}>
        {content}
      </Link>
    );
  }

  return content;
}

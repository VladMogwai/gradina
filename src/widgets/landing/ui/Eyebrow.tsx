import styles from "../styles/Eyebrow.module.scss";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

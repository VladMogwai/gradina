import styles from "../styles/EditorShell.module.scss";

export function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.card}>{children}</div>
    </div>
  );
}

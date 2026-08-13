"use client";

import { LoginForm } from "@/features/auth";
import { BackgroundVideo } from "@/shared/ui/BackgroundVideo";
import styles from "../styles/LoginScreen.module.scss";

export function LoginScreen() {
  return (
    <div className={styles.screen}>
      <BackgroundVideo className={styles.bg} />
      <div className={styles.card}>
        <LoginForm />
      </div>
    </div>
  );
}

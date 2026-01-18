"use client";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import type { User } from "better-auth";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./login.module.css";

export default function Login() {
  const [user, setUser] = useState<User | null | undefined>(null);

  const logout = async () => {
    await authClient.signOut();
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: session } = await authClient.getSession();
      setUser(session?.user);
    };

    getSession();
  }, []);

  if (!user) {
    return (
      <div className={styles.wrap}>
        <div className={styles.mainWrap}>
          <div className={styles.svgWrap}>
            <svg
              role="img"
              aria-label="Abstract shape"
              version="1.1"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              width="700"
              height="700"
              className={styles.svg}
            >
              <defs>
                <clipPath id="svgPath">
                  <path
                    fill="#000000"
                    d="M42.9,-50.6C56.5,-39.6,69.3,-27,76.3,-10.1C83.3,6.9,84.7,28.3,76.5,45.8C68.3,63.4,50.7,77.2,33,78.2C15.3,79.3,-2.5,67.5,-21.3,60C-40.1,52.5,-59.8,49.2,-72.6,37.1C-85.3,24.9,-91.1,3.9,-83.6,-10.6C-76.1,-25.1,-55.3,-33.2,-39.2,-43.7C-23.1,-54.3,-11.5,-67.3,1.5,-69.1C14.6,-70.9,29.2,-61.5,42.9,-50.6Z"
                    transform="translate(100 100)"
                  >
                    <animate
                      attributeType="XML"
                      attributeName="d"
                      dur="10s"
                      repeatCount="indefinite"
                      values="M42.9,-50.6C56.5,-39.6,69.3,-27,76.3,-10.1C83.3,6.9,84.7,28.3,76.5,45.8C68.3,63.4,50.7,77.2,33,78.2C15.3,79.3,-2.5,67.5,-21.3,60C-40.1,52.5,-59.8,49.2,-72.6,37.1C-85.3,24.9,-91.1,3.9,-83.6,-10.6C-76.1,-25.1,-55.3,-33.2,-39.2,-43.7C-23.1,-54.3,-11.5,-67.3,1.5,-69.1C14.6,-70.9,29.2,-61.5,42.9,-50.6Z;M40.6,-50.4C49.7,-40.8,52,-25.2,58.5,-7.5C64.9,10.2,75.6,30,70.1,41.4C64.6,52.9,43.1,56.1,25,58.1C6.9,60.1,-7.8,61,-20.1,56.1C-32.3,51.3,-42.1,40.6,-53.6,27.6C-65.1,14.6,-78.2,-0.8,-77.9,-15.7C-77.6,-30.6,-63.8,-45.1,-48.6,-53.6C-33.3,-62,-16.7,-64.5,-0.4,-63.9C15.8,-63.4,31.6,-59.9,40.6,-50.4Z;M48.7,-58.7C62.8,-46.2,73.7,-30.6,75.1,-14.5C76.4,1.7,68.3,18.2,59.3,34.5C50.2,50.8,40.2,66.8,26.8,70.1C13.5,73.3,-3.2,63.9,-17.3,55.3C-31.5,46.8,-43.1,39.2,-55,27.5C-66.9,15.7,-78.9,-0.2,-77.5,-14.6C-76.1,-29,-61.1,-42,-46,-54.3C-30.8,-66.6,-15.4,-78.2,1,-79.3C17.3,-80.4,34.6,-71.2,48.7,-58.7Z;M45.7,-52.9C59.9,-42.5,72.8,-28.8,74.3,-14C75.8,0.8,66.1,16.7,55.7,29.7C45.2,42.7,34.1,52.8,21.1,57.3C8.1,61.8,-6.8,60.5,-22.5,56.9C-38.2,53.3,-54.8,47.2,-61.6,35.5C-68.5,23.8,-65.6,6.4,-59.2,-7C-52.7,-20.4,-42.7,-29.7,-32.3,-40.8C-21.8,-51.9,-10.9,-64.7,2.4,-67.6C15.7,-70.4,31.4,-63.3,45.7,-52.9Z;M42.9,-50.6C56.5,-39.6,69.3,-27,76.3,-10.1C83.3,6.9,84.7,28.3,76.5,45.8C68.3,63.4,50.7,77.2,33,78.2C15.3,79.3,-2.5,67.5,-21.3,60C-40.1,52.5,-59.8,49.2,-72.6,37.1C-85.3,24.9,-91.1,3.9,-83.6,-10.6C-76.1,-25.1,-55.3,-33.2,-39.2,-43.7C-23.1,-54.3,-11.5,-67.3,1.5,-69.1C14.6,-70.9,29.2,-61.5,42.9,-50.6Z"
                    ></animate>
                  </path>
                </clipPath>
              </defs>
              <image
                x="0"
                y="0"
                width="100%"
                height="100%"
                clipPath="url(#svgPath)"
                href="/images/Period.png"
                preserveAspectRatio="none"
              ></image>
            </svg>
          </div>
          <div className={styles.title}>
            <Image
              className={styles.logo}
              src="/images/Period-logo.png"
              width={2078}
              height={581}
              alt="Period."
            />
            <p className={styles.subtitle}>パートナーとココロでつながる</p>
          </div>
        </div>

        <button
          className={styles.gsiMaterialButton}
          type="button"
          onClick={() => loginWithGoogle()}
        >
          <div className={styles.gsiMaterialButtonState}></div>
          <div className={styles.gsiMaterialButtonContentWrapper}>
            <div className={styles.gsiMaterialButtonIcon}>
              <svg role="img" aria-label="Google logo" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className={styles.gsiMaterialButtonContents}>
              Googleでログイン
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>トップページ</h1>
      こんにちは、{user.name}さん！ ログインに成功しました
      <button type="button" onClick={() => logout()}>
        ログアウト
      </button>
    </div>
  );
}

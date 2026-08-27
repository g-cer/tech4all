import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "@/context/AuthContext";
import "../src/css/global.css";
import "react-tabs/style/react-tabs.css";
import "../src/css/react-tabs-modificato.css";
import "../src/css/Tutorial.css";
import "quill/dist/quill.snow.css";
import "../src/css/textEditor.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Tech4All</title>
        <meta
          name="description"
          content="Tutorial e quiz per l'alfabetizzazione digitale."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Media/LogoT4A.jpeg" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

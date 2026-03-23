import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Play Pong against an AI opponent. Fast, responsive, and installable as a web app. Built by AnointedTheDeveloper." />
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" />

        {/* Open Graph */}
        <meta property="og:title" content="PaddleForge – AI Pong Game" />
        <meta property="og:description" content="Challenge the AI in this modern Pong web app." />
        <meta property="og:image" content="/preview.png" />
        <meta property="og:url" content="https://paddleforge.vercel.app" />
        <meta property="og:type" content="website" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoGame",
              name: "PaddleForge",
              author: { "@type": "Person", name: "AnointedTheDeveloper" },
              applicationCategory: "Game",
              operatingSystem: "Web",
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

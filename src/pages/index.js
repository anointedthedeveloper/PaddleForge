import Head from "next/head";
import GameCanvas from "../components/GameCanvas";

export default function Home() {
  return (
    <>
      <Head>
        <title>PaddleForge – Play AI Pong Online</title>
      </Head>
      <GameCanvas />
    </>
  );
}

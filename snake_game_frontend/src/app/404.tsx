import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-white pb-32">
      <h1 className="text-5xl font-black text-[#FFD700] mb-4">404</h1>
      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[#228B22]">Page Not Found</h2>
      <p className="text-[#444] mb-6">
        Sorry, the page you&apos;re looking for does not exist.<br />
        <Link href="/" className="text-[#FFD700] underline hover:text-[#ffa700]">Go back to game</Link>
      </p>
    </div>
  );
}

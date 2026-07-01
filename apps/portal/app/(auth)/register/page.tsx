import { prisma } from "@1000mm/db";
import { RegisterForm } from "./_components/RegisterForm";
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null },
    select: { code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 bg-[#f4f9f9]" />
      <div
        className="blob absolute -left-24 -top-24 h-96 w-96 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(0,127,152,0.82), transparent 72%)",
          animation: "blobFloat1 24s linear infinite",
        }}
      />
      <div
        className="blob absolute -bottom-28 -right-20 h-[28rem] w-[28rem] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(249,115,22,0.76), transparent 72%)",
          animation: "blobFloat2 30s linear infinite",
        }}
      />
      <div
        className="blob absolute left-1/4 top-1/4 h-80 w-80 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(74,222,128,0.64), transparent 72%)",
          animation: "blobFloat3 26s linear infinite",
        }}
      />
      <div
        className="blob absolute -top-16 right-10 h-72 w-72 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 40% 60%, rgba(0,127,152,0.66), transparent 72%)",
          animation: "blobFloat4 28s linear infinite",
        }}
      />

      <RegisterForm
        missions={missions.map((m) => ({
          code: m.code,
          name: `${m.name} (${m.code})`,
        }))}
      />

      <style>{`
        @keyframes blobFloat1 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(68vw, 12vh); }
          50%  { transform: translate(52vw, 70vh); }
          75%  { transform: translate(6vw, 48vh); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobFloat2 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-72vw, -18vh); }
          50%  { transform: translate(-55vw, -68vh); }
          75%  { transform: translate(-12vw, -42vh); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobFloat3 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(48vw, 38vh); }
          50%  { transform: translate(8vw, 58vh); }
          75%  { transform: translate(40vw, 4vh); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobFloat4 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-46vw, 46vh); }
          50%  { transform: translate(-18vw, 16vh); }
          75%  { transform: translate(-58vw, 64vh); }
          100% { transform: translate(0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .blob { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

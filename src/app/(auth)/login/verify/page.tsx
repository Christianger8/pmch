import { redirect } from "next/navigation";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verificar codigo" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; next?: string; channel?: string }>;
}) {
  const { phone, next, channel } = await searchParams;
  if (!phone) redirect("/login");

  const resolvedChannel = channel === "sms" ? "sms" : "whatsapp";
  const via = resolvedChannel === "whatsapp" ? "por WhatsApp" : "por SMS";

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Ingresa el codigo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Te lo enviamos {via} a{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-200">{phone}</span>
        </p>
      </div>
      <VerifyForm phone={phone} next={next ?? "/"} channel={resolvedChannel} />
    </div>
  );
}

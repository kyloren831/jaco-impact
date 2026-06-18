import ResetPasswordForm from "./form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token as string | undefined;

  return <ResetPasswordForm token={token || ""} />;
}

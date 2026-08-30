import "../load-env";
import { sendPasswordResetEmail } from "@/modules/core/email";

/** One-off: verify Resend + domain. `pnpm tsx modules/core/data/scripts/send-test-email.ts you@domain` */
async function main() {
  const to = process.argv[2] ?? process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1];
  if (!to) throw new Error("pass a recipient address");
  console.log("sending test password-reset email to", to);
  const r = await sendPasswordResetEmail(to, { token: "TEST-TOKEN-not-real" });
  console.log(JSON.stringify(r, null, 2));
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

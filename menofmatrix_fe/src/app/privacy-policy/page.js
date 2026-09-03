import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — MenOfMatrix",
  description: "How MenOfMatrix and the LLM Usage extension handle your data. Private by default, only your usage numbers are synced when you choose to.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-[#fafaf8] pb-32 text-neutral-800">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← MenOfMatrix
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: 30 August 2026</p>

        <p className="mt-6 leading-relaxed text-neutral-700">
          MenOfMatrix helps you see your AI usage in one place. This policy explains in plain language what we collect, what we
          don&apos;t, and what happens when you use our website and our Chrome extension for tracking Claude and ChatGPT limits.
        </p>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight">In short</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            By default, everything stays on your device. Your usage limits are shown right in your browser. Only if you sign in with
            Google and turn on Sync do we save your usage numbers to your MenOfMatrix account so you can see them on our website.
            We never read your chats, prompts, or passwords, and we never sell your data.
          </p>
        </div>

        <h2 className="mt-10 text-lg font-semibold">What we collect</h2>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>
            <b>If you just browse or use the extension without signing in:</b> We collect nothing. No tracking, no analytics, no
            advertising data.
          </li>
          <li>
            <b>If you sign in with Google and turn on Sync on the Feed page:</b> We save your email address and your usage numbers —
            like how much of your Claude or ChatGPT limit you&apos;ve used, how much you&apos;ve spent, and when it resets. This lets us
            show your dashboard on MenOfMatrix.
          </li>
          <li>
            <b>If you use Sync without signing in:</b> We create a random ID for your browser so your data stays separate from others.
            Once you sign in, future data is linked to your email instead.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">What we never collect</h2>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>Your chat conversations or prompts</li>
          <li>Your passwords or login credentials</li>
          <li>Your browsing history, location, or any data beyond the usage limits you choose to sync</li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">How we use your information</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          We only use your email and usage numbers to show you your own dashboard on MenOfMatrix. We don&apos;t use your data for
          advertising, we don&apos;t share it with other companies, and we don&apos;t use it to make decisions about credit or lending.
        </p>

        <h2 className="mt-10 text-lg font-semibold">When we share your information</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          We don&apos;t sell your data. We only share your usage numbers with our own service to display your dashboard. If you never turn
          on Sync, nothing leaves your device at all.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Chrome extension permissions</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          Our extension asks for access only when you need it, and only for the sites you choose:
        </p>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>
            <b>Access to claude.ai and chatgpt.com:</b> Only when you click Refresh to see your limits. We check your usage on those
            sites the same way you would by visiting them yourself.
          </li>
          <li>
            <b>Access to MenOfMatrix:</b> So the widget on our Feed page can show the same limits without you having to open the
            extension again.
          </li>
          <li>Nothing is accessed at install time — you grant access only when you connect a service.</li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">How long we keep your data</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          If you use Sync, we keep your usage snapshots until you delete them or delete your account. If you never use Sync, we keep
          nothing on our servers — your data is only on your device and is removed when you uninstall the extension.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Your choices</h2>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>Sync is off by default. You can turn it on or off anytime from the widget on the Feed page.</li>
          <li>You need to be signed in with Google to use Sync.</li>
          <li>
            To delete your synced data, email us at{" "}
            <a href="mailto:privacy@menofmatrix.vercel.app" className="underline">
              privacy@menofmatrix.vercel.app
            </a>{" "}
            and we&apos;ll remove it. Removing the extension also clears everything stored locally on your device.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">Contact us</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          Have questions about privacy? Reach us at{" "}
          <a href="mailto:privacy@menofmatrix.vercel.app" className="underline">
            privacy@menofmatrix.vercel.app
          </a>
          .
        </p>

        <p className="mt-12 text-xs text-neutral-400">
          This policy applies to https://menofmatrix.vercel.app and the LLM Usage extension for Claude & ChatGPT. If we make changes,
          we&apos;ll update the date above and post the new version here.
        </p>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Privacy Policy — MenOfMatrix",
  description: "Privacy policy for MenOfMatrix and the LLM Usage Chrome Extension (Claude & ChatGPT limits). Nothing is sold; local by default, optional Google sync.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-[#fafaf8] text-neutral-800">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <a href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← MenOfMatrix
        </a>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: 30 August 2026</p>
        <p className="mt-6 leading-relaxed text-neutral-700">
          MenOfMatrix and the <b>LLM Usage — Claude & ChatGPT</b> Chrome extension (ID: <code>pcgifekofbcponilchdgoglcmklmpdfl</code>) are
          built to be <b>local by default</b>. This policy explains what is collected, what stays on your device, and what is sent only when you
          explicitly enable it. This page serves as the privacy policy for the Chrome Web Store listing.
        </p>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight">The short version</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            The widget shows your own Claude and ChatGPT limits from sessions you are already signed into. By default nothing leaves your
            device. If you sign in with Google on{" "}
            <a href="https://menofmatrix.vercel.app/feed" className="underline">
              menofmatrix.vercel.app/feed
            </a>{" "}
            and enable <b>Sync</b>, only the normalized numbers (percent used, spend, reset times) plus your Google email are posted to{" "}
            <code>/api/usage</code> to power your dashboard. No prompts, conversations, passwords, or cookies are ever sent to us or sold.
          </p>
        </div>

        <h2 className="mt-10 text-lg font-semibold">What is collected</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          <b>Nothing by default.</b> No analytics, no ads, no tracking, no remote code. The extension has no backend and assigns no
          advertising identifier.
        </p>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>
            <b>Without Sync:</b> No data is collected or transmitted. The popup reads cached values from <code>chrome.storage.local</code>{" "}
            (<code>usageCache:claude</code>, <code>usageCache:chatgpt</code>).
          </li>
          <li>
            <b>With Sync enabled + Google Sign-In:</b> We collect your Google email (from NextAuth) and the normalized usage snapshot:{" "}
            <code>provider</code>, <code>windows: [{`{label, percent, resetsAt}`}]</code>, <code>spend: {`{used, limit, currency, resetsAt}`}</code>,{" "}
            <code>captured_at</code>. This is stored as <code>llm_usage_snapshots.user_identifier = your email</code>.
          </li>
          <li>
            <b>Guests without Google (device fallback):</b> If you enable Sync without signing in, a per-browser ID <code>mom_device_id</code>{" "}
            (UUID) is used as <code>device:&lt;uuid&gt;</code> so your rows are isolated. Upgrading to Google Sign-In moves future rows to
            your email.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">What stays on your device</h2>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>
            Extension reads via <code>chrome.scripting.executeScript</code> in <code>world:MAIN</code> on <code>https://claude.ai/*</code> and{" "}
            <code>https://chatgpt.com/*</code> — a same-origin <code>fetch</code> to that site&apos;s own usage endpoint (
            <code>/api/organizations/*/usage</code> or <code>/backend-api/wham/usage</code>) using your existing session cookie. Only the numbers
            return; cookies/tokens never leave the tab and are never stored by us.
          </li>
          <li>
            Cached readings live in <code>chrome.storage.local</code> and are also bridged to <code>https://menofmatrix.vercel.app</code> via{" "}
            <code>content.js</code> + <code>window.postMessage</code> (GET_LLM_USAGE / LLM_USAGE). No browsing history, location, or keystrokes are collected.
          </li>
          <li>
            Uninstalling the extension removes all locally cached usage. You can clear <code>mom_device_id</code> and{" "}
            <code>llmSyncEnabled</code> from <code>localStorage</code> at any time.
          </li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">Permissions and why each is needed</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="py-2 pr-4 font-semibold">Permission</th>
              <th className="py-2 font-semibold">Why</th>
            </tr>
          </thead>
          <tbody className="text-neutral-700">
            <tr className="border-b border-neutral-100">
              <td className="py-2 pr-4 font-mono text-xs">storage</td>
              <td className="py-2">Store normalized usage locally (chrome.storage.local) and read it on menofmatrix.vercel.app.</td>
            </tr>
            <tr className="border-b border-neutral-100">
              <td className="py-2 pr-4 font-mono text-xs">tabs + scripting (optional)</td>
              <td className="py-2">Find/reuse a tab on claude.ai/chatgpt.com, inject a same-origin fetch, then close the tab if we opened it.</td>
            </tr>
            <tr className="border-b border-neutral-100">
              <td className="py-2 pr-4 font-mono text-xs">https://claude.ai/*</td>
              <td className="py-2">Read Claude usage only when you click Refresh/Connect.</td>
            </tr>
            <tr className="border-b border-neutral-100">
              <td className="py-2 pr-4 font-mono text-xs">https://chatgpt.com/*</td>
              <td className="py-2">Read ChatGPT usage only when you click Refresh/Connect.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs">https://menofmatrix.vercel.app/*</td>
              <td className="py-2">Content script bridge so /feed can display your local usage and, if you opt into Sync, POST numbers to /api/usage.</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-neutral-500">
          All host permissions are granted at use time; nothing is granted at install.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Network requests</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          The extension makes no request on its own behalf. When you click Refresh, it calls your provider&apos;s own usage endpoint inside a tab
          on that site (carrying your existing session, as if you loaded the page). When you enable Sync on /feed while signed in with Google,
          /feed POSTs to <code>/api/usage</code> with <code>{`{snapshots: [{provider, at, usage}]}`}</code> and headers{" "}
          <code>x-user-email</code>/<code>x-device-id</code>. No request carries our identifier and no chat content is included.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Remote code</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          No remote code. No &lt;script&gt; to external files, no eval of remote strings, no Wasm from a CDN. All JS is in the package
          (background.js, popup.js, content.js). Responses are parsed as JSON data only.
        </p>

        <h2 className="mt-10 text-lg font-semibold">Data usage disclosure (Chrome Web Store)</h2>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>
            <b>Website content:</b> Yes — usage JSON from claude.ai/chatgpt.com.
          </li>
          <li>
            <b>Personally identifiable information:</b> Only if you opt into Sync — your Google email. Otherwise none.
          </li>
          <li>We do not sell or transfer data to third parties outside the single purpose, do not use it for unrelated purposes, and do not use it for credit/lending.</li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">Choice, deletion, and retention</h2>
        <ul className="mt-3 list-disc pl-6 text-sm leading-relaxed text-neutral-700">
          <li>Sync is off by default. Toggle it in the /feed widget. You must be signed in with Google to enable it.</li>
          <li>
            Delete your synced data: email <a href="mailto:privacy@menofmatrix.vercel.app" className="underline">privacy@menofmatrix.vercel.app</a> or
            POST to <code>/api/usage/delete</code> (coming soon) with your Google email. Local cache is deleted when you remove the extension.
          </li>
          <li>Synced snapshots are retained until you delete them or your account is removed.</li>
        </ul>

        <h2 className="mt-10 text-lg font-semibold">Contact</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          Questions: <a href="mailto:privacy@menofmatrix.vercel.app" className="underline">privacy@menofmatrix.vercel.app</a> or open an issue at
          your repository. For extension ID <code>pcgifekofbcponilchdgoglcmklmpdfl</code> please reference this page in the Web Store listing.
        </p>

        <p className="mt-12 text-xs text-neutral-400">
          This policy covers both https://menofmatrix.vercel.app and the LLM Usage extension. If it changes, the updated version will be published
          here with a new date.
        </p>
      </div>
    </div>
  );
}

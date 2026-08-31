"use client";

import { useEffect, useRef } from "react";

// Bundler-opaque runtime import.
const dynImport = new Function("u", "return import(u)");

const REACT = "https://esm.sh/react@19.0.0";
const REACT_DOM_CLIENT = "https://esm.sh/react-dom@19.0.0/client";
const FRAMER_MOTION = "https://esm.sh/framer-motion@11?deps=react@19.0.0";

/*
 * A permissive stand-in for Framer's `framer` runtime package. Real shapes for
 * the exports that get destructured downstream; a universal stub (usable as a
 * component / HOC / hook / helper) for everything else. Consumed via a default
 * Proxy so unknown named imports never fail.
 */
const FRAMER_SHIM = `
import * as React from "${REACT}";
const _jsx = (tag, props = {}) => {
  const { children, ...rest } = props;
  return React.createElement(tag, rest, children);
};

const universal = new Proxy(function () {}, {
  get: () => universal,
  apply: (_t, _this, args) => {
    const a = args[0];
    if (a && typeof a === "object" && "children" in a) return a.children ?? null;
    if (typeof a === "function") return a;
    return undefined;
  },
});

// inject a Framer-generated stylesheet once
const _injected = new Set();
function injectCSS(css) {
  const text = Array.isArray(css) ? css.join("\\n") : String(css || "");
  if (!text || _injected.has(text) || typeof document === "undefined") return;
  _injected.add(text);
  const el = document.createElement("style");
  el.setAttribute("data-framer-embed", "");
  el.textContent = text;
  document.head.appendChild(el);
}

// resolve Framer asset references -> real URLs
function toResponsiveImage(x) {
  if (!x) return {};
  if (typeof x === "object" && (x.src || x.srcSet)) return x;
  if (typeof x === "string") {
    const m = x.match(/asset-reference,([^?]+)/);
    if (m) return { src: "https://framerusercontent.com/images/" + m[1] };
    if (/^https?:|^data:/.test(x)) return { src: x };
  }
  return {};
}

function Image(props = {}) {
  const bg = props.background || {};
  const src = bg.src || (bg.srcSet ? bg.srcSet.split(",")[0].trim().split(" ")[0] : null);
  // Outer element keeps Framer's className/style (which carries the sizing);
  // the actual image fills it 100%.
  const inner = src
    ? _jsx("img", {
        src,
        alt: bg.alt || "",
        draggable: false,
        loading: "lazy",
        style: {
          width: "100%",
          height: "100%",
          objectFit: bg.fit === "fit" ? "contain" : bg.fit || "cover",
          objectPosition: "center",
          display: "block",
          borderRadius: "inherit",
        },
      })
    : null;
  return _jsx("div", {
    className: props.className,
    style: { ...props.style, overflow: "hidden" },
    children: inner,
  });
}

function RichText(props = {}) {
  if (props.html != null)
    return _jsx("div", { className: props.className, style: props.style, dangerouslySetInnerHTML: { __html: props.html } });
  return _jsx("div", { className: props.className, style: props.style, children: props.children });
}

const known = {
  ControlType: new Proxy({}, { get: (_, k) => String(k) }),
  RenderTarget: {
    current: () => "preview", hasRestrictions: () => false,
    canvas: "CANVAS", export: "EXPORT", preview: "PREVIEW", thumbnail: "THUMBNAIL",
  },
  addPropertyControls: () => {},
  addFonts: () => {},
  getFonts: () => [],
  getFontsFromSharedStyle: () => [],
  getPropertyControls: () => ({}),
  getLoadingLazyAtYPosition: () => "lazy",
  toResponsiveImage,
  useIsStaticRenderer: () => false,
  useLocaleInfo: () => ({ activeLocale: undefined, locales: [], setLocale: () => {} }),
  useLocaleCode: () => undefined,
  useComponentViewport: () => undefined,
  useIsInCurrentNavigationTarget: () => false,
  useOnFramerRender: () => {},
  useVariantState: (o = {}) => {
    const v = o.variant || o.defaultVariant;
    return {
      variants: v ? [v] : [], baseVariant: v, gestureVariant: undefined,
      classNames: [], transition: undefined, setVariant: () => {}, setGestureState: () => {},
    };
  },
  useActiveVariantCallback: () => ({
    activeVariantCallback: (cb) => (...a) => (typeof cb === "function" ? cb(...a) : undefined),
  }),
  cx: (...a) => a.flat(Infinity).filter(Boolean).join(" "),
  withCSS: (Component, css) => {
    injectCSS(css);
    return Component;
  },
  withFX: (c) => c,
  Link: (props = {}) => _jsx("a", { href: props.href, target: props.openInNewTab ? "_blank" : undefined, rel: "noreferrer", className: props.className, style: props.style, children: props.children }),
  RichText,
  Text: RichText,
  Image,
  SmartComponentScopedContainer: (props = {}) => _jsx("div", { className: props.className, style: props.style, children: props.children }),
  ComponentViewportProvider: (props = {}) => props.children ?? null,
};

export default new Proxy(known, { get: (t, k) => (k in t ? t[k] : universal) });
`;

let SHIM_URL = null;
function shimUrl() {
  if (!SHIM_URL) SHIM_URL = URL.createObjectURL(new Blob([FRAMER_SHIM], { type: "text/javascript" }));
  return SHIM_URL;
}

function rewrite(code) {
  const shim = shimUrl();
  return (
    code
      // bare specifiers → CDN
      .replace(/(["'])react\/jsx-runtime\1/g, `"${REACT}/jsx-runtime"`)
      .replace(/(["'])react\/jsx-dev-runtime\1/g, `"${REACT}/jsx-dev-runtime"`)
      .replace(/(["'])react-dom\/client\1/g, `"${REACT_DOM_CLIENT}"`)
      .replace(/(["'])react-dom\1/g, `"https://esm.sh/react-dom@19.0.0"`)
      .replace(/(["'])react\1/g, `"${REACT}"`)
      .replace(/(["'])framer-motion\1/g, `"${FRAMER_MOTION}"`)
      .replace(/(["'])motion\/react\1/g, `"${FRAMER_MOTION}"`)
      // `import { a, b } from "framer"` → namespace default + destructure (no static export needed)
      .replace(
        /import\s*\{([^}]+)\}\s*from\s*["']framer["'];?/g,
        (_m, names) => `import __FRAMER__ from "${shim}"; const {${names}} = __FRAMER__;`
      )
      // `export { a, b } from "framer"` → re-export via the proxy
      .replace(
        /export\s*\{([^}]+)\}\s*from\s*["']framer["'];?/g,
        (_m, names) => `import __FRAMER_RX__ from "${shim}"; const {${names}} = __FRAMER_RX__; export {${names}};`
      )
      // `import * as X from "framer"` / `import X from "framer"`
      .replace(/import\s+\*\s+as\s+(\w+)\s+from\s*["']framer["'];?/g, `import $1 from "${shim}";`)
      .replace(/import\s+(\w+)\s+from\s*["']framer["'];?/g, `import $1 from "${shim}";`)
  );
}

// Recursively localise a Framer module + every framerusercontent .js sub-module.
const urlCache = new Map();
function localise(url) {
  if (urlCache.has(url)) return urlCache.get(url);
  const p = (async () => {
    let code = await fetch(url).then((r) => r.text());

    const reExport = code.match(
      /^\s*export\s*\*\s*from\s*["'](https:\/\/framerusercontent\.com\/[^"']+)["']/m
    );
    if (reExport && url.includes("framer.com/m/")) return localise(reExport[1]);

    const deps = [
      ...new Set(
        [...code.matchAll(/["'](https:\/\/framerusercontent\.com\/modules\/[^"']+\.js)["']/g)].map(
          (m) => m[1]
        )
      ),
    ];
    for (const dep of deps) {
      const depBlob = await localise(dep);
      code = code.split(dep).join(depBlob);
    }

    code = rewrite(code);
    return URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  })();
  urlCache.set(url, p);
  return p;
}

const componentCache = new Map();
function loadFramerComponent(url) {
  if (componentCache.has(url)) return componentCache.get(url);
  const p = localise(url)
    .then((blobUrl) => dynImport(blobUrl))
    .then((mod) => mod?.default || mod?.Component || null);
  componentCache.set(url, p);
  return p;
}

/**
 * Mounts a published Framer component (framer.com/m/… URL) in its own isolated
 * React root. `props` are the Framer property-control values (obfuscated keys ok).
 */
export default function FramerEmbed({ url, props, className, style }) {
  const hostRef = useRef(null);

  useEffect(() => {
    let root;
    let cancelled = false;
    (async () => {
      try {
        const [Comp, React, { createRoot }] = await Promise.all([
          loadFramerComponent(url),
          dynImport(REACT),
          dynImport(REACT_DOM_CLIENT),
        ]);
        if (cancelled || !Comp || !hostRef.current) return;
        root = createRoot(hostRef.current);
        root.render(React.createElement(Comp, props || {}));
      } catch (e) {
        console.warn("[FramerEmbed] failed to load", url, e);
      }
    })();
    return () => {
      cancelled = true;
      if (root) setTimeout(() => root.unmount(), 0);
    };
  }, [url, props]);

  return <div ref={hostRef} className={className} style={style} />;
}

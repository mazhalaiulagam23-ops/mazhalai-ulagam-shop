import { fontHref, themeCss, useThemeSettings } from "@/lib/design";

/**
 * Applies the admin-managed design settings (colours, fonts, radius, layout)
 * to the whole site by injecting CSS variable overrides.
 */
export function DesignTokens() {
  const { data } = useThemeSettings();
  if (!data) return null;

  const href = fontHref(data.heading_font, data.body_font);
  const css = themeCss(data);

  return (
    <>
      {href ? <link rel="stylesheet" href={href} /> : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}

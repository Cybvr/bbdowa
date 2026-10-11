import assert from "node:assert/strict";
import { TEMPLATE_DEFAULTS, fillTemplate, validTemplate } from "../lib/email/template-definitions.ts";
import { templates, applySavedTemplate } from "../lib/email/templates.ts";
import { renderMessageEmail } from "../lib/email/brand.ts";

assert.equal(TEMPLATE_DEFAULTS.filter((row) => row.kind === "message").length, 8);
assert.equal(TEMPLATE_DEFAULTS.filter((row) => row.kind === "transactional").length, 13);
for (const row of TEMPLATE_DEFAULTS) assert.ok(validTemplate(row, row), row.key);
const examples = { to: "Ada", by: "Jide", signer: "Ada", person: "Ada", from: "Jide", title: "Campaign", description: "Review assets", client: "Example", job: "Campaign", due: "2026-10-20", signedAt: "2026-10-11", period: "October 2026", message: "Complete the review", number: "INV-001", amount: 125000, currency: "NGN", preview: "Review the update", company: "Example", url: "https://bbdowa.com/dashboard" };
for (const row of TEMPLATE_DEFAULTS.filter((row) => row.kind === "transactional")) {
  const fallback = templates[row.key](examples);
  const rendered = applySavedTemplate(fallback, row);
  assert.notEqual(rendered, fallback, row.key);
  assert.ok(!rendered.html.includes("{{"), row.key);
}
assert.throws(() => fillTemplate("{{unknown}}", {}));
const fallback = templates.taskAssigned({ to: "Ada", by: "Jide", title: "<Campaign>", description: "Review assets", client: "Example", job: "Campaign", due: "2026-10-20", url: "https://bbdowa.com/dashboard/tasks" });
const saved = { ...TEMPLATE_DEFAULTS.find((row) => row.key === "taskAssigned"), subject: "Action: {{title}}", message: "Hello {{to}}, please review {{title}}." };
const content = applySavedTemplate(fallback, saved);
assert.equal(content.subject, "Action: <Campaign>");
assert.ok(content.html.includes("Hello Ada, please review &lt;Campaign&gt;."));
assert.ok(content.html.includes("Open task"));
assert.ok(content.html.includes("Example"));
assert.equal(applySavedTemplate(fallback, { ...saved, published: false }), fallback);
assert.equal(applySavedTemplate(fallback, { ...saved, message: "{{bad}}" }), fallback);
assert.equal(applySavedTemplate(fallback, null), fallback);
for (const html of [content.html, renderMessageEmail("Hello", "<script>alert(1)</script>")]) {
  assert.ok(html.includes("bbdo-west-africa.png"));
  assert.ok(html.includes("Plot 5 Chief Yesufu"));
  assert.ok(html.includes("bbdo_westafrica"));
  assert.ok(html.includes("intended only for the named recipient"));
  assert.ok(!html.includes("<script>"));
}
console.log("21 templates validated; saved rendering, dynamic details, branding, escaping and fallback checks passed.");

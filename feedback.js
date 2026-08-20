(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PLOTYPUS_FEEDBACK = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FEEDBACK_EMAIL_ADDRESS = "web@fin.gc.ca";
  const FEEDBACK_EMAIL_CC = "itthiphol.piromnam@fin.gc.ca";
  const FEEDBACK_EMAIL_SUBJECT = "Plotypus feedback";
  const GITHUB_NEW_ISSUE_URL = "https://github.com/BobPiromnam/Plotypus/issues/new";
  const BUG_REPORT_TEMPLATE = "bug_report.yml";
  const FEATURE_REQUEST_TEMPLATE = "feature_request.yml";
  const UNKNOWN_BROWSER_DETAIL = "Not detected";

  function detectFeedbackDistribution({ protocol = "", hostname = "" } = {}) {
    if (protocol === "file:") return "Portable or local-file version";

    const normalizedHostname = hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "[::1]"].includes(normalizedHostname)) {
      return "Development or local web server";
    }

    if (protocol === "http:" || protocol === "https:") return "Web deployment";
    return UNKNOWN_BROWSER_DETAIL;
  }

  function detectFeedbackBrowser(userAgent = "") {
    const browserPatterns = [
      ["Microsoft Edge", /(?:Edg|EdgA|EdgiOS)\/([0-9.]+)/],
      ["Opera", /(?:OPR|Opera)\/([0-9.]+)/],
      ["Google Chrome", /(?:Chrome|CriOS)\/([0-9.]+)/],
      ["Mozilla Firefox", /(?:Firefox|FxiOS)\/([0-9.]+)/],
      ["Safari", /Version\/([0-9.]+).*Safari/]
    ];

    for (const [name, pattern] of browserPatterns) {
      const match = userAgent.match(pattern);
      if (match) return `${name} ${match[1]}`;
    }

    return UNKNOWN_BROWSER_DETAIL;
  }

  function detectFeedbackOperatingSystem(userAgent = "") {
    let match = userAgent.match(/(?:iPhone OS|CPU(?: iPhone)? OS) ([0-9_]+)/);
    if (match) return `iOS ${match[1].replaceAll("_", ".")}`;

    match = userAgent.match(/Android ([0-9.]+)/);
    if (match) return `Android ${match[1]}`;

    match = userAgent.match(/Windows NT ([0-9.]+)/);
    if (match) {
      const versions = {
        "10.0": "Windows 10 or 11",
        "6.3": "Windows 8.1",
        "6.2": "Windows 8",
        "6.1": "Windows 7"
      };
      return versions[match[1]] || `Windows (NT ${match[1]})`;
    }

    match = userAgent.match(/CrOS [^ ]+ ([0-9.]+)/);
    if (match) return `ChromeOS ${match[1]}`;

    match = userAgent.match(/Mac OS X ([0-9_]+)/);
    if (match) return `macOS ${match[1].replaceAll("_", ".")}`;

    if (/Linux/.test(userAgent)) return "Linux";
    return UNKNOWN_BROWSER_DETAIL;
  }

  function normalizeFeedbackLanguage(language = "") {
    return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(language)
      ? language
      : UNKNOWN_BROWSER_DETAIL;
  }

  function getFeedbackEnvironmentDetails({
    appVersion = "Not detected",
    protocol = "",
    hostname = "",
    userAgent = "",
    browserLanguage = ""
  } = {}) {
    return {
      version: appVersion,
      distribution: detectFeedbackDistribution({ protocol, hostname }),
      browser: detectFeedbackBrowser(userAgent),
      operatingSystem: detectFeedbackOperatingSystem(userAgent),
      browserLanguage: normalizeFeedbackLanguage(browserLanguage)
    };
  }

  function getFeedbackContent({ type = "problem", title = "", details = "" } = {}) {
    return {
      type: type === "improvement" ? "Suggestion" : "Issue",
      title: title.trim(),
      details: details.trim()
    };
  }

  function buildEnvironmentSummary(environment) {
    const details = getFeedbackEnvironmentDetails(environment);
    return [
      `Plotypus version: ${details.version}`,
      `Distribution: ${details.distribution}`,
      `Browser: ${details.browser}`,
      `Operating system: ${details.operatingSystem}`,
      `Browser language: ${details.browserLanguage}`
    ].join("\n");
  }

  function buildFeedbackEmailBody(environment = {}, feedback = {}) {
    const content = getFeedbackContent(feedback);
    return `Hello Plotypus team,

Type: ${content.type}
Title: ${content.title}

Details:
${content.details}

Environment:
${buildEnvironmentSummary(environment)}

Please remove map or project content, personal or protected information, credentials, internal URLs, and full local file paths before sending.`;
  }

  function buildEmailUrl(subject, body) {
    const query = [
      ["cc", FEEDBACK_EMAIL_CC],
      ["subject", subject],
      ["body", body]
    ].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("&");
    return `mailto:${FEEDBACK_EMAIL_ADDRESS}?${query}`;
  }

  function buildGitHubIssueUrl(template, fields) {
    const url = new URL(GITHUB_NEW_ISSUE_URL);
    url.searchParams.set("template", template);
    Object.entries(fields).forEach(([id, value]) => url.searchParams.set(id, value));
    return url.toString();
  }

  function buildBugReportUrl(environment, feedback = {}) {
    const content = getFeedbackContent(feedback);
    return buildGitHubIssueUrl(BUG_REPORT_TEMPLATE, {
      title: content.title,
      details: content.details,
      environment: buildEnvironmentSummary(environment)
    });
  }

  function buildFeatureRequestUrl(environment, feedback = {}) {
    const content = getFeedbackContent(feedback);
    return buildGitHubIssueUrl(FEATURE_REQUEST_TEMPLATE, {
      title: content.title,
      details: content.details,
      environment: buildEnvironmentSummary(environment)
    });
  }

  function buildFeedbackEmailUrl(environment, feedback = {}) {
    const content = getFeedbackContent(feedback);
    const subject = content.title
      ? `${FEEDBACK_EMAIL_SUBJECT}: ${content.title}`
      : FEEDBACK_EMAIL_SUBJECT;
    return buildEmailUrl(subject, buildFeedbackEmailBody(environment, feedback));
  }

  function createFeedbackComposer({
    form,
    typeInputs = [],
    titleInput,
    detailsInput,
    detailsLabel,
    destinationButtons = [],
    sendLink
  }, environment, options = {}) {
    const inputList = Array.from(typeInputs);
    const destinationList = Array.from(destinationButtons);
    const translate = typeof options.t === "function" ? options.t : key => key;
    let destination = destinationList.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.feedbackDestination || "github";
    const getFeedback = () => ({
      type: inputList.find(input => input.checked)?.value || "problem",
      title: titleInput?.value || "",
      details: detailsInput?.value || ""
    });

    const update = () => {
      const feedback = getFeedback();
      const isImprovement = feedback.type === "improvement";
      if (titleInput) {
        titleInput.placeholder = translate(isImprovement
          ? "feedback.title.improvementPlaceholder"
          : "feedback.title.problemPlaceholder");
      }
      if (detailsLabel) {
        detailsLabel.textContent = translate(isImprovement
          ? "feedback.details.improvementLabel"
          : "feedback.details.problemLabel");
      }
      if (detailsInput) {
        detailsInput.placeholder = translate(isImprovement
          ? "feedback.details.improvementPlaceholder"
          : "feedback.details.problemPlaceholder");
      }
      if (sendLink) {
        const isGithub = destination === "github";
        sendLink.href = isGithub
          ? (isImprovement ? buildFeatureRequestUrl(environment, feedback) : buildBugReportUrl(environment, feedback))
          : buildFeedbackEmailUrl(environment, feedback);
        if (isGithub) {
          sendLink.target = "_blank";
          sendLink.rel = "noopener noreferrer";
        } else {
          sendLink.removeAttribute("target");
          sendLink.removeAttribute("rel");
        }
        const label = sendLink.querySelector("[data-feedback-action-label]");
        if (label) label.textContent = translate(isGithub ? "feedback.continueGithub" : "feedback.continueEmail");
        const newTab = sendLink.querySelector("[data-feedback-new-tab]");
        if (newTab) newTab.hidden = !isGithub;
      }
    };

    const requireCompleteEntry = event => {
      update();
      if (form && !form.reportValidity()) event.preventDefault();
    };

    [...inputList, titleInput, detailsInput].forEach(input => {
      input?.addEventListener("input", update);
      input?.addEventListener("change", update);
    });
    destinationList.forEach(button => {
      button.addEventListener("click", () => {
        destination = button.dataset.feedbackDestination || "github";
        destinationList.forEach(option => {
          const selected = option === button;
          option.classList.toggle("is-active", selected);
          option.setAttribute("aria-pressed", String(selected));
        });
        update();
      });
    });
    sendLink?.addEventListener("click", requireCompleteEntry);
    update();

    return { update };
  }

  return Object.freeze({
    BUG_REPORT_TEMPLATE,
    FEATURE_REQUEST_TEMPLATE,
    FEEDBACK_EMAIL_ADDRESS,
    FEEDBACK_EMAIL_CC,
    FEEDBACK_EMAIL_SUBJECT,
    GITHUB_NEW_ISSUE_URL,
    buildBugReportUrl,
    buildFeatureRequestUrl,
    buildFeedbackEmailBody,
    buildFeedbackEmailUrl,
    createFeedbackComposer,
    detectFeedbackBrowser,
    detectFeedbackDistribution,
    detectFeedbackOperatingSystem,
    getFeedbackEnvironmentDetails,
    normalizeFeedbackLanguage
  });
});

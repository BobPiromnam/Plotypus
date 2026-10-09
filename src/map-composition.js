(function (global) {
  "use strict";

  // Editorial starting points from the supplied sample. They are candidates,
  // never hard constraints: the solver still checks land, furniture and leaders.
  const samplePositions = [
    [/grays bay/, "left", .32, .075],
    [/arctic economic/, "left", .30, .14],
    [/mackenzie valley/, "left", .235, .20],
    [/red chris/, "left", .235, .26],
    [/ksi lisims/, "left", .165, .32],
    [/north coast/, "left", .205, .55],
    [/lng canada/, "left", .20, .69],
    [/northwest critical/, "bottom", .15, .75],
    [/pathways/, "bottom", .28, .74],
    [/mcilvenna/, "bottom", .29, .80],
    [/crawford/, "bottom", .55, .84],
    [/darlington/, "bottom", .61, .86],
    [/nouveau monde/, "bottom", .72, .94],
    [/contrecoeur/, "right", .74, .86],
    [/northcliff/, "right", .76, .78],
    [/wind west/, "right", .79, .67],
    [/iqaluit/, "right", .69, .38],
    [/port of churchill/, "right", .61, .25],
    [/taltson/, "right", .61, .18],
    [/alto high-speed/, "right", .71, .44]
  ];

  function sampleCandidates(row, settings) {
    if (row.labelStyle === "rich") return [];
    const match = samplePositions.find(([pattern]) => pattern.test(String(row.name || "").toLowerCase()));
    if (!match) return [];
    const [, side, x, y] = match;
    const dx = settings.width * .018;
    const dy = settings.height * .026;
    return [[0, 0], [-dx, 0], [dx, 0], [0, -dy], [0, dy], [-dx, -dy], [dx, dy],
      [0, -3 * dy], [0, 3 * dy], [-3 * dx, -3 * dy], [3 * dx, 3 * dy], [4 * dx, 5 * dy], [-4 * dx, -5 * dy]]
      .map(([offsetX, offsetY]) => ({ side, x: x * settings.width + offsetX, y: y * settings.height + offsetY, kind: "composition" }));
  }

  const regions = [
    { id: "north", name: "North / Arctic", nameFr: "Nord / Arctique", colour: "#14958f", provinces: ["Yukon", "Northwest Territories", "Nunavut"], lon: -124, lat: 67,
      position: [.025, .045], imageSize: 90,
      items: [
        ["Renew northern operating locations and support hubs.", "Renouveler les sites opérationnels et les centres de soutien du Nord."],
        ["Improve Arctic airport facilities and runway infrastructure.", "Améliorer les installations aéroportuaires et les pistes dans l’Arctique."],
        ["Expand communications and ground surveillance capacity.", "Accroître les capacités de communication et de surveillance au sol."]
      ] },
    { id: "bc", name: "British Columbia", nameFr: "Colombie-Britannique", colour: "#df7d28", provinces: ["British Columbia"], lon: -129.7, lat: 55.6,
      position: [.025, .60], imageSize: 90,
      items: [
        ["Maintain search-and-rescue aircraft and support equipment.", "Entretenir les aéronefs de recherche et sauvetage et le matériel de soutien."],
        ["Strengthen maritime support and coastal operations.", "Renforcer le soutien maritime et les opérations côtières."]
      ] },
    { id: "prairies", name: "Central / Prairies", nameFr: "Centre / Prairies", colour: "#9e796c", provinces: ["Alberta", "Saskatchewan", "Manitoba"], lon: -106, lat: 52,
      position: [.05, .80], imageSize: 85,
      items: [
        ["Modernize aircrew training facilities, aircraft and simulators.", "Moderniser les installations de formation des équipages, les aéronefs et les simulateurs."],
        ["Renew infrastructure supporting northern air defence.", "Renouveler les infrastructures de défense aérienne du Nord."]
      ] },
    { id: "ontario", name: "Ontario", nameFr: "Ontario", colour: "#0c5952", provinces: ["Ontario"], lon: -83, lat: 48,
      position: [.47, .80], imageSize: 85,
      items: [
        ["Support transport aircraft and humanitarian operations.", "Soutenir les aéronefs de transport et les opérations humanitaires."],
        ["Expand advanced manufacturing and logistics capacity.", "Accroître les capacités de fabrication de pointe et de logistique."]
      ] },
    { id: "quebec", name: "Québec", nameFr: "Québec", colour: "#208fa7", provinces: ["Quebec"], lon: -72, lat: 48,
      position: [.81, .68], imageSize: 65,
      items: [
        ["Build and maintain vessels for northern operations.", "Construire et entretenir des navires destinés aux opérations nordiques."],
        ["Strengthen industrial facilities and fleet support.", "Renforcer les installations industrielles et le soutien des flottes."]
      ] },
    { id: "atlantic", name: "Atlantic Canada", nameFr: "Canada atlantique", colour: "#0b3c56", provinces: ["New Brunswick", "Nova Scotia", "Prince Edward Island", "Newfoundland and Labrador"], lon: -57, lat: 53,
      position: [.69, .12], imageSize: 90,
      items: [
        ["Modernize naval vessels and maintain maritime capability.", "Moderniser les navires et maintenir les capacités maritimes."],
        ["Develop infrastructure for future regional operations.", "Développer les infrastructures pour les futures opérations régionales."]
      ] }
  ];

  function regionFills() {
    return Object.fromEntries(regions.flatMap(region => region.provinces.map(name => [name, region.colour])));
  }

  function createRegionalRows(artwork = {}) {
    return regions.map((region, index) => {
      const image = artwork[region.id];
      return {
        rowId: `briefing-${region.id}`, mapNumber: String(index + 1), name: region.name, nameFr: region.nameFr,
        lon: region.lon, lat: region.lat, type: region.id, labelStyle: "rich", labelMaxChars: region.id === "quebec" ? 24 : 42,
        leaderLineColour: region.colour,
        content: [
          { type: "bullets", items: region.items.map(([en, fr]) => ({ en, fr })) },
          ...(image ? [{ type: "image", assetRef: image.dataUrl, naturalWidth: image.width, naturalHeight: image.height, displaySize: region.imageSize,
            caption: { en: "", fr: "" }, alt: { en: image.altEn, fr: image.altFr } }] : [])
        ]
      };
    });
  }

  function regionalPositions(width, height) {
    return Object.fromEntries(regions.map(region => [`row:briefing-${region.id}`, {
      x: region.position[0] * width, y: region.position[1] * height, side: "right"
    }]));
  }

  function regionalCandidates(row, settings) {
    const region = regions.find(item => row.rowId === `briefing-${item.id}`);
    if (!region || row.labelStyle !== "rich") return [];
    const x = region.position[0] * settings.width;
    const y = region.position[1] * settings.height;
    return [[0, 0], [-.025, 0], [.025, 0], [0, -.04], [0, .04], [-.04, -.04], [.04, .04]]
      .map(([dx, dy]) => ({ side: "right", x: x + dx * settings.width, y: y + dy * settings.height, kind: "composition" }));
  }

  const api = Object.freeze({ sampleCandidates, regions, regionFills, createRegionalRows, regionalPositions, regionalCandidates });
  if (typeof module === "object" && module.exports) module.exports = api;
  else global.PLOTYPUS_MAP_COMPOSITION = api;
})(typeof window === "undefined" ? globalThis : window);

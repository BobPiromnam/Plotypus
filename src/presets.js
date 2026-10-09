(function () {
  /*
    Developer note: add map styles here.

    1. Create a matching CSS file in styles/themes/, for example styles/themes/my-style.css.
       The CSS file should usually override :root variables only.
    2. Add a new entry to MAP_APP_STYLE_PRESETS.
       - label: what users see in the Map style dropdown.
       - stylesheet: path to the theme CSS file.
       - regionColours: approved region fill colours from lowest value to highest value.
       - categoryStyles: default marker/line styles applied to legend categories in order.
    3. To change the marker colour picker, edit MAP_APP_CATEGORY_COLOUR_PRESETS below.
    4. No build step is required. The app reads this file before app.js.
  */

  window.MAP_APP_CATEGORY_COLOUR_PRESETS = [
    { value: "", label: "Custom", labelFr: "Personnalisée" },
    { value: "#26374a", label: "GoC blue", labelFr: "Bleu GC" },
    { value: "#284162", label: "Deep blue", labelFr: "Bleu foncé" },
    { value: "#1c578a", label: "Accessible blue", labelFr: "Bleu accessible" },
    { value: "#217346", label: "Excel green", labelFr: "Vert Excel" },
    { value: "#0b6b57", label: "Map green", labelFr: "Vert cartographique" },
    { value: "#7834bc", label: "Purple", labelFr: "Violet" },
    { value: "#a05a00", label: "Ochre", labelFr: "Ocre" },
    { value: "#d3080c", label: "Alert red", labelFr: "Rouge alerte" },
    { value: "#444444", label: "Charcoal", labelFr: "Anthracite" },
    { value: "#ffffff", label: "White", labelFr: "Blanc" }
  ];

  window.MAP_APP_STYLE_PRESETS = {
    "regional-briefing": {
      "label": "Regional briefing",
      "labelFr": "Portrait régional",
      "stylesheet": "styles/themes/regional-briefing.css?v=20261008",
      "exampleKind": "regional-briefing",
      "regionColours": ["#14958f", "#df7d28", "#9e796c", "#0c5952", "#208fa7", "#0b3c56"],
      "regionFills": {
        "Yukon": "#14958f",
        "Northwest Territories": "#14958f",
        "Nunavut": "#14958f",
        "British Columbia": "#df7d28",
        "Alberta": "#9e796c",
        "Saskatchewan": "#9e796c",
        "Manitoba": "#9e796c",
        "Ontario": "#0c5952",
        "Quebec": "#208fa7",
        "New Brunswick": "#0b3c56",
        "Nova Scotia": "#0b3c56",
        "Prince Edward Island": "#0b3c56",
        "Newfoundland and Labrador": "#0b3c56"
      },
      "categoryStyles": [
        { "colour": "#14958f", "stroke": "#ffffff", "markerSize": 4, "lineWidth": 1.5, "shape": "circle" },
        { "colour": "#df7d28", "stroke": "#ffffff", "markerSize": 4, "lineWidth": 1.5, "shape": "circle" },
        { "colour": "#9e796c", "stroke": "#ffffff", "markerSize": 4, "lineWidth": 1.5, "shape": "circle" },
        { "colour": "#0c5952", "stroke": "#ffffff", "markerSize": 4, "lineWidth": 1.5, "shape": "circle" },
        { "colour": "#208fa7", "stroke": "#ffffff", "markerSize": 4, "lineWidth": 1.5, "shape": "circle" },
        { "colour": "#0b3c56", "stroke": "#ffffff", "markerSize": 4, "lineWidth": 1.5, "shape": "circle" }
      ],
      "headingColours": { "#14958f": "#0d716c", "#df7d28": "#9b5010", "#9e796c": "#745548", "#0c5952": "#0c5952", "#208fa7": "#116b7f", "#0b3c56": "#0b3c56" }
    },
    "project-atlas": {
      "label": "Numbered projects",
      "labelFr": "Projets numérotés",
      "stylesheet": "styles/themes/project-atlas.css?v=20261008",
      "defaultLabelDisplay": "numbers",
      "regionColours": [
        "#a7aebd",
        "#7d899f",
        "#49637f",
        "#124c68"
      ],
      "categoryStyles": [
        {
          "colour": "#ffffff",
          "stroke": "#124c68",
          "markerSize": 11,
          "lineWidth": 1,
          "shape": "circle"
        },
        {
          "colour": "#ffffff",
          "stroke": "#124c68",
          "markerSize": 11,
          "lineWidth": 1,
          "shape": "square"
        },
        {
          "colour": "#ffffff",
          "stroke": "#124c68",
          "markerSize": 11,
          "lineWidth": 1,
          "shape": "diamond"
        }
      ]
    },
    "goc-green": {
      label: "GoC green",
      labelFr: "Vert GC",
      stylesheet: "styles/themes/goc-green.css?v=20260612-map-only",
      regionColours: ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"],
      categoryStyles: [
        { colour: "#444444", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
        { colour: "#ffffff", stroke: "#555555", markerSize: 10, lineWidth: 2 },
        { colour: "#0b6b57", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
      ]
    },
    "goc-blue": {
      label: "GoC blue",
      labelFr: "Bleu GC",
      stylesheet: "styles/themes/goc-blue.css?v=20260612-map-only",
      regionColours: ["#d7e5f5", "#9dbbe0", "#26374a"],
      categoryStyles: [
        { colour: "#26374a", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
        { colour: "#ffffff", stroke: "#26374a", markerSize: 10, lineWidth: 2 },
        { colour: "#1c578a", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
      ]
    },
    "neutral-print": {
      label: "Neutral print",
      labelFr: "Impression neutre",
      stylesheet: "styles/themes/neutral-print.css?v=20260612-map-only",
      regionColours: ["#efefef", "#d8d8d8", "#bdbdbd"],
      categoryStyles: [
        { colour: "#222222", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
        { colour: "#ffffff", stroke: "#222222", markerSize: 10, lineWidth: 2 },
        { colour: "#777777", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
      ]
    },
    "high-contrast": {
      label: "High contrast",
      labelFr: "Contraste élevé",
      stylesheet: "styles/themes/high-contrast.css?v=20260612-map-only",
      regionColours: ["#ffffff", "#d8d8d8", "#000000"],
      categoryStyles: [
        { colour: "#000000", stroke: "#ffffff", markerSize: 11, lineWidth: 3 },
        { colour: "#ffffff", stroke: "#000000", markerSize: 11, lineWidth: 3 },
        { colour: "#b00000", stroke: "#ffffff", markerSize: 11, lineWidth: 3 }
      ]
    }
  };
})();

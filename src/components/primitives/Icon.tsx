type IconName =
  | "download"
  | "eraser"
  | "file-text"
  | "folder-open"
  | "image"
  | "pencil"
  | "plus"
  | "save"
  | "sliders"
  | "svg-file"
  | "table"
  | "trash"
  | "undo"
  | "upload"
  | "wand"
  | "x";

const iconPaths: Record<IconName, string[]> = {
  download: [
    "M12 4v12",
    "m7 11 5 5 5-5",
    "M4 20h16"
  ],
  eraser: [
    "m7 21-4-4 10-10 6 6-8 8H7Z",
    "m14 6 4-4 4 4-4 4",
    "M11 21h10"
  ],
  "file-text": [
    "M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M14 3v5h5",
    "M8 13h8",
    "M8 17h6"
  ],
  "folder-open": [
    "M3 7.5V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1.5",
    "M3.6 18.5 5.2 10h16l-1.6 8.5a2 2 0 0 1-2 1.5h-12a2 2 0 0 1-2-1.5Z"
  ],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "m21 15-5-5L5 21",
    "M8.5 8.5h.01"
  ],
  pencil: [
    "M12 20h9",
    "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
  ],
  plus: [
    "M12 5v14",
    "M5 12h14"
  ],
  save: [
    "M5 3h12l2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M7 3v6h9V3",
    "M7 21v-7h10v7"
  ],
  sliders: [
    "M4 21v-7",
    "M4 10V3",
    "M12 21v-9",
    "M12 8V3",
    "M20 21v-5",
    "M20 12V3",
    "M2 14h4",
    "M10 8h4",
    "M18 16h4"
  ],
  "svg-file": [
    "M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M14 3v5h5",
    "M7 15h2",
    "M11 15h2",
    "M15 15h2"
  ],
  table: [
    "M3 4h18v16H3z",
    "M3 10h18",
    "M9 4v16",
    "M15 4v16"
  ],
  trash: [
    "M4 7h16",
    "M10 11v6",
    "M14 11v6",
    "M6 7l1 14h10l1-14",
    "M9 7V4h6v3"
  ],
  undo: [
    "M9 14 4 9l5-5",
    "M4 9h10a6 6 0 1 1-4.2 10.2"
  ],
  upload: [
    "M12 20V8",
    "m7 13 5-5 5 5",
    "M4 20h16"
  ],
  wand: [
    "m14 4 6 6",
    "m5 19 9-9",
    "m13 5 6 6",
    "M5 5h2",
    "M6 4v2",
    "M19 17h2",
    "M20 16v2"
  ],
  x: [
    "M18 6 6 18",
    "m6 6 12 12"
  ]
};

export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <svg
      className="pt-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
    >
      {label ? <title>{label}</title> : null}
      {iconPaths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export type { IconName };

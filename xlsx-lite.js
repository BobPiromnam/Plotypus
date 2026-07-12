(function () {
  "use strict";

  const DEFAULT_MESSAGES = {
    invalidWorkbook: "The workbook could not be read.",
    unsupportedCompression: "This workbook uses unsupported compression."
  };

  function getMessage(messages, key) {
    return (messages && messages[key]) || DEFAULT_MESSAGES[key] || DEFAULT_MESSAGES.invalidWorkbook;
  }

  function isWorkbookFile(file) {
    const name = String(file && file.name || "").toLowerCase();
    const type = String(file && file.type || "").toLowerCase();
    return name.endsWith(".xlsx") || type.includes("spreadsheetml.sheet");
  }

  function readUint16(view, offset) {
    return view.getUint16(offset, true);
  }

  function readUint32(view, offset) {
    return view.getUint32(offset, true);
  }

  async function inflateZipEntry(bytes, method, messages) {
    if (method === 0) return bytes;
    if (method !== 8 || typeof DecompressionStream !== "function") {
      throw new Error(getMessage(messages, "unsupportedCompression"));
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function readZipEntries(buffer, messages) {
    const view = new DataView(buffer);
    let eocdOffset = -1;
    for (let offset = view.byteLength - 22; offset >= 0 && offset >= view.byteLength - 66000; offset -= 1) {
      if (readUint32(view, offset) === 0x06054b50) {
        eocdOffset = offset;
        break;
      }
    }
    if (eocdOffset < 0) throw new Error(getMessage(messages, "invalidWorkbook"));
    const entryCount = readUint16(view, eocdOffset + 10);
    let centralOffset = readUint32(view, eocdOffset + 16);
    const decoder = new TextDecoder("utf-8");
    const entries = new Map();
    for (let index = 0; index < entryCount; index += 1) {
      if (readUint32(view, centralOffset) !== 0x02014b50) throw new Error(getMessage(messages, "invalidWorkbook"));
      const method = readUint16(view, centralOffset + 10);
      const compressedSize = readUint32(view, centralOffset + 20);
      const nameLength = readUint16(view, centralOffset + 28);
      const extraLength = readUint16(view, centralOffset + 30);
      const commentLength = readUint16(view, centralOffset + 32);
      const localOffset = readUint32(view, centralOffset + 42);
      const nameBytes = new Uint8Array(buffer, centralOffset + 46, nameLength);
      const name = decoder.decode(nameBytes).replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
      const localNameLength = readUint16(view, localOffset + 26);
      const localExtraLength = readUint16(view, localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(buffer, dataOffset, compressedSize);
      entries.set(name, await inflateZipEntry(compressed, method, messages));
      centralOffset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  function decodeZipText(entries, path) {
    const bytes = entries.get(String(path || "").toLowerCase());
    return bytes ? new TextDecoder("utf-8").decode(bytes) : "";
  }

  function parseWorkbookXml(text, messages) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error(getMessage(messages, "invalidWorkbook"));
    return doc;
  }

  function normalizeWorkbookPath(base, target) {
    const parts = `${base}/${target}`.split("/");
    const output = [];
    parts.forEach(part => {
      if (!part || part === ".") return;
      if (part === "..") output.pop();
      else output.push(part);
    });
    return output.join("/").toLowerCase();
  }

  function getFirstWorksheetPath(entries, messages) {
    const workbookText = decodeZipText(entries, "xl/workbook.xml");
    if (!workbookText) return "xl/worksheets/sheet1.xml";
    const workbook = parseWorkbookXml(workbookText, messages);
    const firstSheet = workbook.getElementsByTagName("sheet")[0];
    const relationId = firstSheet ? firstSheet.getAttribute("r:id") : "";
    if (!relationId) return "xl/worksheets/sheet1.xml";
    const relsText = decodeZipText(entries, "xl/_rels/workbook.xml.rels");
    if (!relsText) return "xl/worksheets/sheet1.xml";
    const rels = parseWorkbookXml(relsText, messages).getElementsByTagName("Relationship");
    for (let index = 0; index < rels.length; index += 1) {
      if (rels[index].getAttribute("Id") === relationId) {
        return normalizeWorkbookPath("xl", rels[index].getAttribute("Target") || "worksheets/sheet1.xml");
      }
    }
    return "xl/worksheets/sheet1.xml";
  }

  function readSharedStrings(entries, messages) {
    const sharedText = decodeZipText(entries, "xl/sharedStrings.xml");
    if (!sharedText) return [];
    const shared = parseWorkbookXml(sharedText, messages);
    return Array.from(shared.getElementsByTagName("si")).map(item => Array.from(item.getElementsByTagName("t")).map(node => node.textContent || "").join(""));
  }

  function xlsxColumnIndex(reference) {
    const letters = String(reference || "").match(/^[A-Z]+/i);
    if (!letters) return 0;
    return letters[0].toUpperCase().split("").reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  }

  function readWorksheetCellValue(cell, sharedStrings) {
    const type = cell.getAttribute("t") || "";
    if (type === "inlineStr") return Array.from(cell.getElementsByTagName("t")).map(node => node.textContent || "").join("");
    const value = cell.getElementsByTagName("v")[0]?.textContent || "";
    if (type === "s") return sharedStrings[Number(value)] || "";
    if (type === "b") return value === "1" ? "TRUE" : "FALSE";
    return value;
  }

  async function readWorkbookRows(file, messages = DEFAULT_MESSAGES) {
    const entries = await readZipEntries(await file.arrayBuffer(), messages);
    const sheetText = decodeZipText(entries, getFirstWorksheetPath(entries, messages));
    if (!sheetText) throw new Error(getMessage(messages, "invalidWorkbook"));
    const sheet = parseWorkbookXml(sheetText, messages);
    const sharedStrings = readSharedStrings(entries, messages);
    return Array.from(sheet.getElementsByTagName("row")).map(row => {
      const output = [];
      Array.from(row.getElementsByTagName("c")).forEach(cell => {
        output[xlsxColumnIndex(cell.getAttribute("r"))] = readWorksheetCellValue(cell, sharedStrings);
      });
      return output.map(value => value || "");
    });
  }

  window.PlotypusXlsx = {
    isWorkbookFile,
    readWorkbookRows
  };
})();

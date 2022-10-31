"use strict";

// Prepares CSV file for BriTOL results upload
// Invalid BOF numbers are removed
// P-class competitors have SEGP prepended to their BOF number, to avoid clashes by BOF number with other leagues, and (P) appended to their name

function writeMsg(msg) {
  const contentEl = document.createElement("li");
  contentEl.textContent = msg;
  document.getElementById("status").appendChild(contentEl);
}

function loadFile() {
  // Reset log
  const statusBox = document.getElementById("status");
  removeAllChildren(statusBox);
  writeMsg("Reading file...");

  const file = document.getElementById("fileSelector").files[0];
  const freader = new FileReader();
  freader.addEventListener("load", () => { editCsv(freader.result, file.name); });
  freader.addEventListener("error", (err) => {
    writeMsg("Could not read file.", statusBox);
    fileReject(err);
  });
  freader.readAsText(file);
}

function removeAllChildren(parentNode) {
  let iterNode;
  while ((iterNode = parentNode.lastElementChild) !== null) { iterNode.remove(); }
}

function editCsv(inString, inName) {
  const inLines = inString.split(/\r\n|\n/);

  // Valid file? Which delimeter?
  let delim = ",";
  const minCols = 7;
  if (inLines[0].split(delim).length < minCols) {
    delim = ";";
    if (inLines[0].split(delim).length < minCols) {
      writeMsg("Not a valid CSV file");
      return;
    }
  }

  // Process file
  let outString = "ID,Class,Forename,Lastname,AgeClass,Club,Position\n";
  inLines.forEach((line) => {
    const cols = line.split(delim);

    // Check number of columns
    if (cols.length < minCols) {
      writeMsg("Not enough columns in row: " + line);
      return;
    }

    // Check BOF number
    const bof = cols[0];
    if (cols[0] === "BOF") {
      // Header row
      return;
    }
    if (bof.length !== 6 || !(parseInt(bof) > 0 && parseInt(bof) < 1000000)) {
      writeMsg("Invalid BOF number, row ignored: " + line);
      return;
    }

    // Set of classes that will be accepted as physically challenged
    const accept_para = new Set();
    accept_para.add("P");
    accept_para.add("p");
    accept_para.add("PJ");
    accept_para.add("pj");

    const para = accept_para.has(cols[1])

    // Write row to CSV, prepending BOF number if P-class to avoid clashing with other leagues
    const dispClass = "All"
    if (para) {
      outString += "SEGP" + bof + delim + dispClass + delim + cols[2] + delim + cols[3] + " (P)" + delim + cols[4] + delim + cols[5] + delim + cols[6] + "\n";
    } else {
      outString += bof + delim + dispClass + delim + cols[2] + delim + cols[3] + delim + cols[4] + delim + cols[5] + delim + cols[6] + "\n";
    }
  });

  //Save
  const extInd = inName.lastIndexOf(".");
  const outName = (extInd === -1 ? inName : inName.substring(0, extInd)) + "_processed.csv";
  downloadFile(new Blob([outString], { type: "text/csv" }), outName);
  writeMsg("Processed results saved to downloads. Now upload them to league tables.");
}

function downloadFile(fileBlob, fileName) {
  //Downloads a file blob
  const downloadElement = document.createElement("a");
  const url = URL.createObjectURL(fileBlob);
  downloadElement.href = url;
  downloadElement.download = fileName;
  document.body.appendChild(downloadElement);
  downloadElement.click();
  setTimeout(() => {
    document.body.removeChild(downloadElement);
    URL.revokeObjectURL(url);
  }, 0);
}

addEventListener("load", () => {
  // Check dependencies
  document.getElementById("missingAPIs").hidden = true;

  // Add events to DOM objects
  document.getElementById("fileSelector").addEventListener("change", loadFile);
  document.getElementById("runBtn").addEventListener("click", loadFile);
});

"use strict";

function writeMsg(msg) {
  const contentEl = document.createElement("li");
  contentEl.textContent = msg;
  document.getElementById("status").appendChild(contentEl);
}

function loadFile() {
  // Reset log
  removeAllChildren(document.getElementById("status"));
  writeMsg("Reading file...");

  const file = document.getElementById("fileSelector").files[0]
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
      segol.writeMsg("Not a valid CSV file");
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

    // Write row to All class
    outString += bof + delim + "O" + delim + cols[2] + delim + cols[3] + delim + cols[4] + delim + cols[5] + delim + cols[6] + "\n";

    // Set of classes that will be accepted as physically challenged
    const accept_para = new Set();
    accept_para.add("P");
    accept_para.add("p");
    accept_para.add("PJ");
    accept_para.add("pj");

    const para = accept_para.has(cols[1])
    const junior = parseInt(cols[4].substring(1)) < 21

    // Check for other class eligibility and add rows, prepending BOF number to make unique
    if (para) {
      outString += "SEGP" + bof + delim + "P" + delim + cols[2] + delim + cols[3] + delim + cols[4] + delim + cols[5] + delim + cols[6] + "\n";
    }
    if (junior) {
      outString += "SEGJ" + bof + delim + "J" + delim + cols[2] + delim + cols[3] + delim + cols[4] + delim + cols[5] + delim + cols[6] + "\n";
    }
    if (para && junior) {
      outString += "SEGPJ" + bof + delim + "PJ" + delim + cols[2] + delim + cols[3] + delim + cols[4] + delim + cols[5] + delim + cols[6] + "\n";
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

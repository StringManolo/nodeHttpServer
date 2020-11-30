const http = require("http");
const path = require("path");
const fs = require("fs");
const showTime = require("./modules/showTime/showTime.js").showTime;

const PORT = 8001;
const webFolder = "./public";
const logsFolder = "./logs/";

let options = {};

let log = (fileName, data) => {
  fs.appendFile(logsFolder + fileName, `${showTime()} ${data}

`, err => {
    if (err) throw err;
  });
}

log("serverStatus.log", "Starting server...");


let getFiles = (dir, files_) => {
    files_ = files_ || [];
    let files = fs.readdirSync(dir);
    for (let i in files){
        let name = dir + "/" + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

let fileNames = getFiles(webFolder);


let getFileContent = filePath => fs.readFileSync(filePath, { encoding: "utf-8" });

let generalConfig = () => getFileContent("./config/general").split(/\r\n|\r|\n/g);



let useErrorPages = () => {
  options.useErrorPages = true; 
  console.log("Using error pages");
};


let generalConfigFile = generalConfig();
generalConfigFile.forEach( file => {
  if (file) { 
    let [key, value] = file.split("=");
    if (/useErrorPages/gi.test(key) && /yes/gi.test(value)) {
      useErrorPages();
    } else {
      options.useErrorPages = false;
    }
  }
});


let getWhitelist = () => getFileContent("./config/files/whitelist");

let getBlacklist = () => getFileContent("./config/files/blacklist");

log("flow.log", "Getting Whitelist...");
let whitelist = getWhitelist();
let allFilesAllowed;
if (whitelist.replace(/\r\n|\r|\n/g, "").replace(/\ /g, "")  === "*") {
  allFilesAllowed = true;
//  console.log("All files allowed");
} else {
  allFilesAllowed = false;
  fileName = whitelist.split(/\r\n|\r|\n/g);
}

let blacklist = getBlacklist();
let blacklisted;
if (blacklist.replace(/\r\n|\r|\n/g, "").replace(/\ /g, "").length) {
  blacklisted = true;
  blacklist = blacklist.split("\n");
  log("flow.log", `Blaclisted files: ${blacklist}`);
} else {
 // console.log(`No files blacklisted.`);
  log("flow.log", "No files blacklisted");
}


if (!allFilesAllowed) {
  fileNames = whitelist.split("\n");
  //console.log(`Allowed whitelisted files: ${fileName}`);
  log("flow.log", `Allowed whitelisted files: ${fileName}`);
} 

if (blacklisted) {
  for(let i in blacklist) {
    for(let j in fileNames) {
      if (blacklist[i] == fileNames[j]) {
        fileNames.splice(j, 1);
      }
    }
  }
//  console.log(`ALLOWED: ${fileNames}
//BLOCKED: ${blacklist}`);
  log("flow.log", `ALLOWED: ${fileNames}
BLOCKED: ${blacklist}`);
}

let securePath = path => {
  return path.replace(/\.\.\//g, "").replace(/\/\//g, ""); 
};

/* Add extension/blacklist and extension/whitelist */

let getContentType = ext => {
  switch(ext) {
    case ".html":
    case ".htm":
      return "text/html";

    case ".js":
      return "text/javascript";

    case ".legacyjs":
      return "application/javascript";

    case ".css":
      return "text/css";

    case ".txt":
      return "text/plain";

    case ".png":
      return "image/png";

    case ".jpg":
    case ".jpeg":
    case ".jfif":
    case ".pjpeg":
    case ".pjp":
      return "image/jpg";
    
    case ".svg":
      return "image/svg+xml";

    case ".apng":
      return "image/apng";

    case ".bmp":
      return "image/bmp";

    case ".gif":
      return "image/gif";

    case ".ico":
      return "image/x-icon";

    case ".tif":
    case ".tiff":
      return "image/tiff";

    case ".webp":
      return "image/webp";

    case ".csv": 
      return "text/csv";

    case ".mp4":
      return "video/mp4";

    

    default:
      return "application/octet-stream";
  }
};

/*
let four04 = () => {
  res.writeHead(404, {"Content-Type": "text/html"});
  res.end("Resource not found")
};*/


const staticHeaders = {
  "server": "Apache",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
};

http.createServer( (req, res) => {
  log("serverStatus.log", `server is listening on port ${PORT}`);
  let requestedPath = webFolder;
  if (path.basename(decodeURI(req.url))) {
    requestedPath +=  decodeURI(req.url);
  } else {
    requestedPath += "/index.html";
  }

  requestedPath = securePath(requestedPath); 
  let notResponse = true;
  for(let i in fileNames) {
    if (fileNames[i] == requestedPath) {
//      console.log(`Allowed Access to ${requestedPath}`);
      let contentType = getContentType(path.extname(fileNames[i]));
      if (contentType) {
	staticHeaders["Content-Type"] = contentType;
        res.writeHead(200, staticHeaders);
        res.end(getFileContent(fileNames[i]));
	notResponse = false;
      } 
    } else {
     // console.log(`Requested Path: ${requestedPath}
//Resource ${fileNames[i]} not allowed.`);;
    }
  }
  if (notResponse) {
    staticHeaders["Content-Type"] = "text/html";
    res.writeHead(404, staticHeaders);
    res.end("404");
  }	

  log("serverStatus.log", "End request.");
}).listen(PORT);

console.log(`http://127.0.0.1:${PORT}`);


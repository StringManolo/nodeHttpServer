const http = require("http");
const path = require("path");
const fs = require("fs");

const webFolder = "./public";

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


let getWhitelist = () => getFileContent("./config/files/whitelist");

let getBlacklist = () => getFileContent("./config/files/blacklist");

let whitelist = getWhitelist();
let allFilesAllowed;
if (whitelist.replace(/\r\n|\r|\n/g, "").replace(/\ /g, "")  === "*") {
  allFilesAllowed = true;
  console.log("All files allowed");
} else {
  allFilesAllowed = false;
}

let blacklist = getBlacklist();
let blacklisted;
if (blacklist.replace(/\r\n|\r|\n/g, "").replace(/\ /g, "").length) {
  blacklisted = true;
  blacklist = blacklist.split("\n");
} else {
  console.log(`No files blacklisted.`);
}


if (!allFilesAllowed) {
  fileNames = whitelist.split("\n");
  console.log(`Allowed whitlisted files: ${fileName}`);
} 

if (blacklisted) {
  for(let i in blacklist) {
    for(let j in fileNames) {
      if (blacklist[i] == fileNames[j]) {
        fileNames.splice(j, 1);
      }
    }
  }
  console.log(`ALLOWED: ${fileNames}
BLOCKED: ${blacklist}`);
}

let securePath = path => {
  return path.replace(/\.\.\//g, "").replace(/\/\//g, ""); 
};


/*let getExtension = url => path.extname(Url.parse(url).pathname); // '.jpg' */

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
      console.log(`Allowed Access to ${requestedPath}`);
      let contentType = getContentType(path.extname(fileNames[i]));
      if (contentType) {
        res.writeHead(200, {"Content-Type": `${contentType}`} + staticHeaders);
        res.end(getFileContent(fileNames[i]));
	notResponse = false;
      } 
    } else {
      console.log(`Requested Path: ${requestedPath}
Resource ${fileNames[i]} not allowed.`);;
    }
  }
  if (notResponse) {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.writeHead(404, staticHeaders);
    res.end("404");
  }	

}).listen(8001);

console.log("http://127.0.0.1:8001");


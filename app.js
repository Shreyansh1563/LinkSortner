import {createServer} from "http"
import {readFile, writeFile} from "fs/promises"
import crypto from "crypto"
import path from "path"

const PORT = 3002;
const DATA_FILE = path.join("data", "links.json");

const serveFile = async (res, filePath, contentType)=>{
    try {
        const data = await readFile(filePath);
        res.writeHead(200, {"Content-Type": contentType});
        res.end(data);
    } catch (error) {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("404 page not found");
    }
}

const loadLinks = async ()=>{
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if(error.code == "ENOENT"){
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
}

const saveLinks = async (links)=>{
    await writeFile(DATA_FILE, JSON.stringify(links), "utf-8");
}

const server = createServer(async(req, res)=>{
    if(req.method === "GET"){
        if(req.url === "/"){
            serveFile(res, path.join("public", "index.html"), "text/html")
        }
        else if(req.url === "/style.css"){
            serveFile(res, path.join("public", "style.css"), "text/css");
        }
        else if(req.url === "/links"){
            const links = await loadLinks();
            res.writeHead(200, {"Content-Type": "application/json"});
            return res.end(JSON.stringify(links));
        }
    }
    else if (req.method === "POST" && req.url === "/shorten"){
        const links = await loadLinks();
        let body = "";
        req.on("data", (chunk)=>{
            body += chunk;
        })
        req.on("end", ()=>{
            console.log(body);
            const {url, shortCode} = JSON.parse(body);

            if(!url){
                res.writeHead(404, {"Content-Type": "text/plain"});
                return res.end("Url is Required");
            }

            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

            if(links[finalShortCode]){
                res.writeHead(400, {"Content-Type": "text/plain"});
                return res.end("Short code already Exist please choose another");
            }

            links[finalShortCode] = url;

            saveLinks(links);

            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end(JSON.stringify({success :true, shortCode: finalShortCode}))
        })
    }
})

server.listen(PORT, ()=>{
    console.log(`server running at https://localhost:${PORT}`);
})
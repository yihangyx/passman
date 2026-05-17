const crypto = require("crypto");

const key = crypto.randomBytes(32).toString("hex");
console.log("ENCRYPTION_KEY=" + key);
console.log("");
console.log("请将以上内容添加到 .env.local 文件，并同步到 Vercel 环境变量中。");
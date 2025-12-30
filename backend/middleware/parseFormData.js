const busboy = require("busboy");

/**
 * multipart/form-data를 메모리에 파싱하는 미들웨어
 * Vercel 서버리스 환경에서 Multer의 EROFS 문제를 피하기 위해 busboy 사용
 */
function parseFormData(req, res, next) {
  // OPTIONS preflight 요청은 그냥 통과 (CORS 미들웨어가 처리)
  if (req.method === "OPTIONS") {
    return next();
  }

  if (req.method !== "POST" && req.method !== "PUT") {
    return next();
  }

  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    return next();
  }

  req.body = {};
  req.files = [];

  const bb = busboy({
    headers: req.headers,
    limits: {
      fileSize: 8 * 1024 * 1024, // 8MB max per file
      files: 5,
    },
  });

  let fileCount = 0;
  let filesProcessed = 0;

  bb.on("file", (fieldname, file, info) => {
    fileCount++;
    const chunks = [];

    file.on("data", (data) => {
      chunks.push(data);
    });

    file.on("end", () => {
      const buffer = Buffer.concat(chunks);
      req.files.push({
        fieldname,
        originalname: info.filename,
        mimetype: info.encoding,
        size: buffer.length,
        buffer,
      });
      filesProcessed++;
      console.log(`✅ File processed: ${info.filename} (${filesProcessed}/${fileCount})`);
    });

    file.on("error", (err) => {
      console.error("❌ File parse error:", err);
    });
  });

  bb.on("field", (fieldname, val) => {
    req.body[fieldname] = val;
  });

  bb.on("close", () => {
    console.log(
      `✅ Busboy close event: ${filesProcessed}/${fileCount} files ready`
    );
    // 모든 파일이 처리될 때까지 대기
    if (filesProcessed < fileCount) {
      console.log(
        "⏳ Waiting for remaining files to be processed..."
      );
      const waitInterval = setInterval(() => {
        if (filesProcessed >= fileCount) {
          clearInterval(waitInterval);
          console.log("✅ Form data parsing complete");
          next();
        }
      }, 10);
      // 안전장치: 최대 5초 대기
      setTimeout(() => {
        clearInterval(waitInterval);
        if (filesProcessed < fileCount) {
          console.warn(
            `⚠️  Timeout: only ${filesProcessed}/${fileCount} files ready`
          );
        }
        next();
      }, 5000);
    } else {
      console.log("✅ Form data parsing complete");
      next();
    }
  });

  bb.on("error", (err) => {
    console.error("❌ Busboy error:", err);
    return res.status(400).json({
      success: false,
      code: "FORM_PARSE_ERROR",
      message: err.message,
    });
  });

  req.pipe(bb);
}

module.exports = parseFormData;

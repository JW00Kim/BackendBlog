const cloudinary = require("cloudinary").v2;

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  console.log("🔧 Cloudinary config:", {
    CLOUD_NAME: CLOUDINARY_CLOUD_NAME,
    API_KEY: CLOUDINARY_API_KEY ? "***" + CLOUDINARY_API_KEY.slice(-4) : "없음",
    API_SECRET: CLOUDINARY_API_SECRET ? "***" : "없음",
  });

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary 환경변수(CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)가 설정되지 않았습니다"
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  console.log("✅ Cloudinary configured successfully");
  configured = true;
}

function uploadImageBuffer(buffer, options = {}) {
  ensureConfigured();

  const uploadOptions = {
    folder: options.folder || "blog-posts",
    resource_type: "image",
    timeout: 35000, // 35초 타임아웃
    ...options,
  };

  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Cloudinary upload timeout (35s)"));
    }, 35000);

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        clearTimeout(timeoutHandle);
        if (error) {
          console.error("❌ Cloudinary upload error:", {
            message: error.message,
            statusCode: error.status,
            errorCode: error.http_code,
          });
          return reject(error);
        }
        console.log("✅ Cloudinary upload success:", result.secure_url);
        resolve(result);
      }
    );

    stream.on("error", (err) => {
      clearTimeout(timeoutHandle);
      console.error("❌ Cloudinary stream error:", err);
      reject(err);
    });

    stream.end(buffer);
  });
}

module.exports = {
  uploadImageBuffer,
};

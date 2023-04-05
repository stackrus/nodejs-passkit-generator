const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const { getStorage } = require("firebase-admin/storage");
const cors = require("cors")({ origin: true });

const admin = require("firebase-admin");

var fs = require("file-system");
var path = require("path");
var axios = require("axios");

var serviceAccount = require("./firebase_creds/serviceAccountKey.json");

const fn = functions.region("europe-west1");

// it should work but it doesn't -__-
const IS_DEV = process.env.FUNCTIONS_EMULATOR === true;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "p11-loyalty-card.appspot.com",
});

const storage = getStorage();
var storageRef = storage.bucket();

const convertHexToRgb = (hex) => {
  const hexValue = hex.replace("#", "");
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  return `rgb(${r},${g},${b})`;
};

exports.genericPass = fn.https.onRequest((request, response) => {
  cors(request, response, () => {
    PKPass.from(
      {
        model: "./models/generic.pass",
        certificates: {
          wwdr: fs.fs.readFileSync("./certs/wwdr.pem"),
          signerCert: fs.fs.readFileSync("./certs/signerCert.pem"),
          signerKey: fs.fs.readFileSync("./certs/signerKey.pem"),
          signerKeyPassphrase: "test",
        },
      },
      {
        serialNumber: "id" + Math.random().toString(16).slice(2),
        webServiceURL: "https://example.com/passes/",
        authenticationToken: "vxwxd7J8AlNNFPS8k0a0FfUFtq0ewzFdc",
        logoText: "new logo text",
        description: "Generic card",
        logoText: "Perspektives",
        foregroundColor: convertHexToRgb("#" + request.body.textColor),
        backgroundColor: convertHexToRgb("#" + request.body.backgroundColor),
      }
    ).then(async (newPass) => {
      newPass.primaryFields.push({
        key: "primary",
        label: request.body.primary.label,
        value: request.body.primary.value,
      });
      newPass.secondaryFields.push(
        {
          key: "secondary0",
          label: request.body.secondary[0].label,
          value: request.body.secondary[0].value,
        },
        {
          key: "secondary1",
          label: request.body.secondary[1].label,
          value: request.body.secondary[1].value,
        }
      );
      newPass.auxiliaryFields.push(
        {
          key: "auxiliary0",
          label: request.body.auxiliary[0].label,
          value: request.body.auxiliary[0].value,
        },
        {
          key: "auxiliary1",
          label: request.body.auxiliary[1].label,
          value: request.body.auxiliary[1].value,
        }
      );

      newPass.setBarcodes("https://p11.co/");

      const resp = await axios.get(request.body.thumbnail, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(resp.data, "utf-8");
      newPass.addBuffer("thumbnail.png", buffer);
      newPass.addBuffer("thumbnail@2x.png", buffer);
      const bufferData = newPass.getAsBuffer();

      if (IS_DEV) {
        fs.writeFileSync(
          `tmp/generic_${"id" + Math.random().toString(16).slice(2)}.pkpass`,
          bufferData
        );
      }

      storageRef
        .file(
          `passes/generic_${"id" + Math.random().toString(16).slice(2)}.pkpass`
        )
        .save(bufferData, (error) => {
          if (!error) {
            console.log("Pass was uploaded successfully");
            response
              .status(200)
              .json({ message: "Pass was uploaded successfully" });
          }
        });
    });
  });
});

exports.storeCardPass = fn.https.onRequest((request, response) => {
  cors(request, response, () => {
    PKPass.from(
      {
        model: "./models/storeCard.pass",
        certificates: {
          wwdr: fs.fs.readFileSync("./certs/wwdr.pem"),
          signerCert: fs.fs.readFileSync("./certs/signerCert.pem"),
          signerKey: fs.fs.readFileSync("./certs/signerKey.pem"),
          signerKeyPassphrase: "test",
        },
      },
      {
        serialNumber: "id" + Math.random().toString(16).slice(2),
        webServiceURL: "https://example.com/passes/",
        authenticationToken: "vxwxd7J8AlNNFPS8k0a0FfUFtq0ewzFdc",
        description: "Loyalty card",
      }
    ).then(async (newPass) => {
      newPass.logoText = request.body.name;
      newPass.auxiliaryFields.push({
        key: "auxiliary",
        label: "email",
        value: request.body.email,
      });

      newPass.setBarcodes("https://p11.co/");

      const bufferData = newPass.getAsBuffer();

      if (IS_DEV) {
        fs.writeFileSync(
          `tmp/loyalty_${"id" + Math.random().toString(16).slice(2)}.pkpass`,
          bufferData
        );
      }

      storageRef
        .file(
          `passes/loyalty_${"id" + Math.random().toString(16).slice(2)}.pkpass`
        )
        .save(bufferData, (error) => {
          if (!error) {
            console.log("Pass was uploaded successfully");
            response
              .status(200)
              .json({ message: "Pass was uploaded successfully" });
          }
        });
    });
  });
});

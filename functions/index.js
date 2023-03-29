const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const { getStorage } = require("firebase-admin/storage");

const admin = require("firebase-admin");

var fs = require("file-system");
var path = require("path");
var axios = require("axios");

var serviceAccount = require("./firebase_creds/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "node-passkit-generator.appspot.com",
});

var storageRef = getStorage().bucket();

const hexToRgb = (hex) => {
  var bigint = parseInt(hex);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return `rgb(${r},${g},${b})`;
};

exports.pass = functions.https.onRequest((request, response) => {
  PKPass.from(
    {
      model: "./model/custom.pass",
      certificates: {
        wwdr: fs.fs.readFileSync("./certs/wwdr.pem"),
        signerCert: fs.fs.readFileSync("./certs/signerCert.pem"),
        signerKey: fs.fs.readFileSync("./certs/signerKey.pem"),
        signerKeyPassphrase: "test",
      },
    },
    {
      serialNumber: "8j23fm3",
      webServiceURL: "https://example.com/passes/",
      authenticationToken: "vxwxd7J8AlNNFPS8k0a0FfUFtq0ewzFdc",
      logoText: "new logo text",
      description: "Toy Town Membership",
      logoText: "Toy Town",
      foregroundColor: hexToRgb("#" + request.body.textColor),
      backgroundColor: hexToRgb("#" + request.body.backgroundColor),
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

    const resp = await axios.get(request.body.thumbnail, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(resp.data, "utf-8");
    newPass.addBuffer("thumbnail.png", buffer);
    const bufferData = newPass.getAsBuffer();
    fs.writeFileSync("new.pkpass", bufferData);

    storageRef.file("passes/custom.pkpass").save(bufferData, (error) => {
      if (!error) {
        console.log("Pass was uploaded successfully");
        response.status(200).send("Pass was uploaded successfully");
      }
    });
  });
});

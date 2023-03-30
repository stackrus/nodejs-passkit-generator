const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const { getStorage } = require("firebase-admin/storage");
const cors = require("cors")({ origin: true });

const admin = require("firebase-admin");

var fs = require("file-system");
var path = require("path");
var axios = require("axios");

var serviceAccount = require("./firebase_creds/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "node-passkit-generator.appspot.com",
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

exports.pass = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
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
        description: "description",
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
      // fs.writeFileSync("new.pkpass", bufferData);

      storageRef.file("passes/custom.pkpass").save(bufferData, (error) => {
        if (!error) {
          console.log("Pass was uploaded successfully");
          // const passkitRef = storage.ref("passes/custom.pkpass");
          // console.log(passkitRef);
          response
            .status(200)
            .json({ message: "Pass was uploaded successfully" });
        }
      });

      // var storageReference = storage.ref();
      // var fileRef = storageReference.child("passes/custom.pkpass");

      // Get the download URL
      // fileRef
      //   .getDownloadURL()
      //   .then(function (url) {
      //     // Use the download URL to send the file to the client
      //     console.log("Download URL:", url);
      //   })
      //   .catch(function (error) {
      //     // Handle any errors
      //     console.error(error);
      //   });

      // var gsReference = storage.refFromURL("gs://bucket/images/stars.jpg");

      // Get the download URL
      // passkitRef
      //   .getDownloadURL()
      //   .then((url) => {
      //     // Insert url into an <img> tag to "download"
      //     response.status(200).send(url);
      //   })
      //   .catch((error) => {
      //     // A full list of error codes is available at
      //     // https://firebase.google.com/docs/storage/web/handle-errors
      //     switch (error.code) {
      //       case "storage/object-not-found":
      //         // File doesn't exist
      //         break;
      //       case "storage/unauthorized":
      //         // User doesn't have permission to access the object
      //         break;
      //       case "storage/canceled":
      //         // User canceled the upload
      //         break;

      //       // ...

      //       case "storage/unknown":
      //         // Unknown error occurred, inspect the server response
      //         break;
      //     }
      //   });

      //
    });
  });
});

const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const { getStorage } = require("firebase-admin/storage");
const { GoogleAuth } = require("google-auth-library");

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
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

exports.genericPassApple = fn.https.onRequest((request, response) => {
  cors(request, response, () => {
    const fileName = `generic_${
      "id" + Math.random().toString(16).slice(2)
    }.pkpass`;
    const expirationDate = new Date(Date.now() + 60 * 60000);
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
        serialNumber: "id" + Math.random().toString(16),
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
        fs.writeFileSync(`tmp/${fileName}}`, bufferData);
      }

      storageRef
        .file(`passes/${fileName}`)
        .save(bufferData, (error) => {
          if (!error) {
            console.log("Pass was uploaded successfully");
          }
        })
        .then(async () => {
          const signedUrlResponse = await storageRef
            .file(`passes/${fileName}`)
            .getSignedUrl({
              action: "read",
              expires: expirationDate,
            });

          const assetUrl = signedUrlResponse[0];

          response.status(200).json({
            message: "Generic pass link",
            assetUrl,
          });
        });
    });
  });
});

exports.loyaltyCardApple = fn.https.onRequest((request, response) => {
  const fileName = `loyalty_${
    "id" + Math.random().toString(16).slice(2)
  }.pkpass`;
  const expirationDate = new Date(Date.now() + 60 * 60000);

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
        serialNumber: fileName,
        webServiceURL: "https://example.com/passes/",
        authenticationToken: "vxwxd7J8AlNNFPS8k0a0FfUFtq0ewzFdc",
        description: "Loyalty card",
        logoText: "Perspektives",
      }
    ).then(async (newPass) => {
      newPass.secondaryFields.push({
        key: "secondary",
        label: "Name",
        value: request.body.name,
      });
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
        .file(`passes/${fileName}`)
        .save(bufferData, async (error) => {
          if (!error) {
            console.log("Pass was uploaded successfully");
          }
        })
        .then(async () => {
          const signedUrlResponse = await storageRef
            .file(`passes/${fileName}`)
            .getSignedUrl({
              action: "read",
              expires: expirationDate,
            });

          const assetUrl = signedUrlResponse[0];

          response.status(200).json({
            message: "Loyalty pass link",
            assetUrl,
          });
        });
    });
  });
});

// Android part ---__--_-____-_--_//
const createClass = async (issuerId, classSuffix) => {
  let response;

  // Check if the class exists
  try {
    response = await this.httpClient.request({
      url: `${this.classUrl}/${issuerId}.${classSuffix}`,
      method: "GET",
    });

    console.log(`Class ${issuerId}.${classSuffix} already exists!`);

    return `${issuerId}.${classSuffix}`;
  } catch (err) {
    if (err.response && err.response.status !== 404) {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${classSuffix}`;
    }
  }

  // See link below for more information on required properties
  // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyclass
  let newClass = {
    id: `${issuerId}.${classSuffix}`,
    issuerName: "CardPlus Oy",
    reviewStatus: "UNDER_REVIEW",
    programName: "CardPlus",
    programLogo: {
      sourceUri: {
        uri: "https://korttilinna.fi/images/category/uutiset/CardPlus_logo_cmyk.png",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "CardPlus Oy description",
        },
      },
    },
  };

  response = await this.httpClient.request({
    url: this.classUrl,
    method: "POST",
    data: newClass,
  });

  console.log("Class insert response");
  console.log(response);

  return `${issuerId}.${classSuffix}`;
};
// [END createClass]

// [START updateClass]
/**
 * Update a class.
 *
 * **Warning:** This replaces all existing class attributes!
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} classSuffix Developer-defined unique ID for this pass class.
 *
 * @returns {string} The pass class ID: `${issuerId}.${classSuffix}`
 */
const updateClass = async (issuerId, classSuffix) => {
  let response;

  // Check if the class exists
  try {
    response = await this.httpClient.request({
      url: `${this.classUrl}/${issuerId}.${classSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Class ${issuerId}.${classSuffix} not found!`);
      return `${issuerId}.${classSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${classSuffix}`;
    }
  }

  // Class exists
  let updatedClass = response.data;

  // Update the class by adding a homepage
  updatedClass["homepageUri"] = {
    uri: "https://developers.google.com/wallet",
    description: "Homepage description",
  };

  // Note: reviewStatus must be 'UNDER_REVIEW' or 'DRAFT' for updates
  updatedClass["reviewStatus"] = "UNDER_REVIEW";

  response = await this.httpClient.request({
    url: `${this.classUrl}/${issuerId}.${classSuffix}`,
    method: "PUT",
    data: updatedClass,
  });

  console.log("Class update response");
  // console.log(response);

  return `${issuerId}.${classSuffix}`;
};
// [END updateClass]

// [START patchClass]
/**
 * Patch a class.
 *
 * The PATCH method supports patch semantics.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} classSuffix Developer-defined unique ID for this pass class.
 *
 * @returns {string} The pass class ID: `${issuerId}.${classSuffix}`
 */
const patchClass = async (issuerId, classSuffix) => {
  let response;

  // Check if the class exists
  try {
    response = await this.httpClient.request({
      url: `${this.classUrl}/${issuerId}.${classSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Class ${issuerId}.${classSuffix} not found!`);
      return `${issuerId}.${classSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${classSuffix}`;
    }
  }

  // Patch the class by adding a homepage
  let patchBody = {
    homepageUri: {
      uri: "https://developers.google.com/wallet",
      description: "Homepage description",
    },

    // Note: reviewStatus must be 'UNDER_REVIEW' or 'DRAFT' for updates
    reviewStatus: "UNDER_REVIEW",
  };

  response = await this.httpClient.request({
    url: `${this.classUrl}/${issuerId}.${classSuffix}`,
    method: "PATCH",
    data: patchBody,
  });

  console.log("Class patch response");
  // console.log(response);

  return `${issuerId}.${classSuffix}`;
};
// [END patchClass]

// [START addMessageClass]
/**
 * Add a message to a pass class.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} classSuffix Developer-defined unique ID for this pass class.
 * @param {string} header The message header.
 * @param {string} body The message body.
 *
 * @returns {string} The pass class ID: `${issuerId}.${classSuffix}`
 */
const addClassMessage = async (issuerId, classSuffix, header, body) => {
  let response;

  // Check if the class exists
  try {
    response = await this.httpClient.request({
      url: `${this.classUrl}/${issuerId}.${classSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Class ${issuerId}.${classSuffix} not found!`);
      return `${issuerId}.${classSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${classSuffix}`;
    }
  }

  response = await this.httpClient.request({
    url: `${this.classUrl}/${issuerId}.${classSuffix}/addMessage`,
    method: "POST",
    data: {
      message: {
        header: header,
        body: body,
      },
    },
  });

  console.log("Class addMessage response");
  // console.log(response);

  return `${issuerId}.${classSuffix}`;
};
// [END addMessageClass]

// [START createObject]
/**
 * Create an object.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} classSuffix Developer-defined unique ID for the pass class.
 * @param {string} objectSuffix Developer-defined unique ID for the pass object.
 *
 * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
 */
const createObject = async (issuerId, classSuffix, objectSuffix) => {
  let response;

  // Check if the object exists
  try {
    response = await this.httpClient.request({
      url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
      method: "GET",
    });

    console.log(`Object ${issuerId}.${objectSuffix} already exists!`);

    return `${issuerId}.${objectSuffix}`;
  } catch (err) {
    if (err.response && err.response.status !== 404) {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${objectSuffix}`;
    }
  }

  // See link below for more information on required properties
  // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyobject
  let newObject = {
    id: `${issuerId}.${objectSuffix}`,
    classId: `${issuerId}.${classSuffix}`,
    state: "ACTIVE",
    heroImage: {
      sourceUri: {
        uri: "https://korttilinna.fi/images/category/uutiset/CardPlus_logo_cmyk.png",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "Hero image description",
        },
      },
    },
    textModulesData: [
      {
        header: "Text module header",
        body: "Text module body",
        id: "TEXT_MODULE_ID",
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: "http://maps.google.com/",
          description: "Link module URI description",
          id: "LINK_MODULE_URI_ID",
        },
        {
          uri: "tel:6505555555",
          description: "Link module tel description",
          id: "LINK_MODULE_TEL_ID",
        },
      ],
    },
    imageModulesData: [
      {
        mainImage: {
          sourceUri: {
            uri: "http://farm4.staticflickr.com/3738/12440799783_3dc3c20606_b.jpg",
          },
          contentDescription: {
            defaultValue: {
              language: "en-US",
              value: "Image module description",
            },
          },
        },
        id: "IMAGE_MODULE_ID",
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: "QR code",
    },
    locations: [
      {
        latitude: 37.424015499999996,
        longitude: -122.09259560000001,
      },
    ],
    accountId: "Account id",
    accountName: "Account name",
    loyaltyPoints: {
      label: "Points",
      balance: {
        int: 800,
      },
    },
  };

  response = await this.httpClient.request({
    url: this.objectUrl,
    method: "POST",
    data: newObject,
  });

  console.log("Object insert response");
  // console.log(response);

  return `${issuerId}.${objectSuffix}`;
};
// [END createObject]

// [START updateObject]
/**
 * Update an object.
 *
 * **Warning:** This replaces all existing object attributes!
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} objectSuffix Developer-defined unique ID for the pass object.
 *
 * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
 */
const updateObject = async (issuerId, objectSuffix) => {
  let response;

  // Check if the object exists
  try {
    response = await this.httpClient.request({
      url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Object ${issuerId}.${objectSuffix} not found!`);
      return `${issuerId}.${objectSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${objectSuffix}`;
    }
  }

  // Object exists
  let updatedObject = response.data;

  // Update the object by adding a link
  let newLink = {
    uri: "https://developers.google.com/wallet",
    description: "New link description",
  };
  if (updatedObject["linksModuleData"] === undefined) {
    updatedObject["linksModuleData"] = {
      uris: [newLink],
    };
  } else {
    updatedObject["linksModuleData"]["uris"].push(newLink);
  }

  response = await this.httpClient.request({
    url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
    method: "PUT",
    data: updatedObject,
  });

  console.log("Object update response");
  // console.log(response);

  return `${issuerId}.${objectSuffix}`;
};
// [END updateObject]

// [START patchObject]
/**
 * Patch an object.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} objectSuffix Developer-defined unique ID for the pass object.
 *
 * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
 */
const patchObject = async (issuerId, objectSuffix) => {
  let response;

  // Check if the object exists
  try {
    response = await this.httpClient.request({
      url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Object ${issuerId}.${objectSuffix} not found!`);
      return `${issuerId}.${objectSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${objectSuffix}`;
    }
  }

  // Object exists
  let existingObject = response.data;

  // Patch the object by adding a link
  let newLink = {
    uri: "https://developers.google.com/wallet",
    description: "New link description",
  };

  let patchBody = {};
  if (existingObject["linksModuleData"] === undefined) {
    patchBody["linksModuleData"] = {
      uris: [],
    };
  } else {
    patchBody["linksModuleData"] = {
      uris: existingObject["linksModuleData"]["uris"],
    };
  }
  patchBody["linksModuleData"]["uris"].push(newLink);

  response = await this.httpClient.request({
    url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
    method: "PATCH",
    data: patchBody,
  });

  console.log("Object patch response");
  // console.log(response);

  return `${issuerId}.${objectSuffix}`;
};
// [END patchObject]

// [START expireObject]
/**
 * Expire an object.
 *
 * Sets the object's state to Expired. If the valid time interval is
 * already set, the pass will expire automatically up to 24 hours after.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} objectSuffix Developer-defined unique ID for the pass object.
 *
 * @returns {string} The pass object ID: `${issuerId}.${objectSuffix}`
 */
const expireObject = async (issuerId, objectSuffix) => {
  let response;

  // Check if the object exists
  try {
    response = await this.httpClient.request({
      url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Object ${issuerId}.${objectSuffix} not found!`);
      return `${issuerId}.${objectSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${objectSuffix}`;
    }
  }

  // Patch the object, setting the pass as expired
  let patchBody = {
    state: "EXPIRED",
  };

  response = await this.httpClient.request({
    url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
    method: "PATCH",
    data: patchBody,
  });

  console.log("Object expiration response");
  // console.log(response);

  return `${issuerId}.${objectSuffix}`;
};
// [END expireObject]

// [START addMessageObject]
/**
 * Add a message to a pass object.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} objectSuffix Developer-defined unique ID for this pass object.
 * @param {string} header The message header.
 * @param {string} body The message body.
 *
 * @returns {string} The pass class ID: `${issuerId}.${classSuffix}`
 */
const addObjectMessage = async (issuerId, objectSuffix, header, body) => {
  let response;

  // Check if the object exists
  try {
    response = await this.httpClient.request({
      url: `${this.objectUrl}/${issuerId}.${objectSuffix}`,
      method: "GET",
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`Object ${issuerId}.${objectSuffix} not found!`);
      return `${issuerId}.${objectSuffix}`;
    } else {
      // Something else went wrong...
      console.log(err);
      return `${issuerId}.${objectSuffix}`;
    }
  }

  response = await this.httpClient.request({
    url: `${this.objectUrl}/${issuerId}.${objectSuffix}/addMessage`,
    method: "POST",
    data: {
      message: {
        header: header,
        body: body,
      },
    },
  });

  console.log("Object addMessage response");
  // console.log(response);

  return `${issuerId}.${objectSuffix}`;
};
// [END addMessageObject]

// [START jwtNew]
/**
 * Generate a signed JWT that creates a new pass class and object.
 *
 * When the user opens the "Add to Google Wallet" URL and saves the pass to
 * their wallet, the pass class and object defined in the JWT are
 * created. This allows you to create multiple pass classes and objects in
 * one API call when the user saves the pass to their wallet.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} classSuffix Developer-defined unique ID for the pass class.
 * @param {string} objectSuffix Developer-defined unique ID for the pass object.
 *
 * @returns {string} An "Add to Google Wallet" link.
 */
const createJwtNewObjects = async (issuerId, classSuffix, objectSuffix) => {
  // See link below for more information on required properties
  // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyclass
  let newClass = {
    id: `${issuerId}.${classSuffix}`,
    issuerName: "Issuer name",
    reviewStatus: "UNDER_REVIEW",
    programName: "Program name",
    programLogo: {
      sourceUri: {
        uri: "http://farm8.staticflickr.com/7340/11177041185_a61a7f2139_o.jpg",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "Logo description",
        },
      },
    },
  };

  // See link below for more information on required properties
  // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyobject
  let newObject = {
    id: `${issuerId}.${objectSuffix}`,
    classId: `${issuerId}.${classSuffix}`,
    state: "ACTIVE",
    heroImage: {
      sourceUri: {
        uri: "https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg",
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "Hero image description",
        },
      },
    },
    textModulesData: [
      {
        header: "Text module header",
        body: "Text module body",
        id: "TEXT_MODULE_ID",
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: "http://maps.google.com/",
          description: "Link module URI description",
          id: "LINK_MODULE_URI_ID",
        },
        {
          uri: "tel:6505555555",
          description: "Link module tel description",
          id: "LINK_MODULE_TEL_ID",
        },
      ],
    },
    imageModulesData: [
      {
        mainImage: {
          sourceUri: {
            uri: "http://farm4.staticflickr.com/3738/12440799783_3dc3c20606_b.jpg",
          },
          contentDescription: {
            defaultValue: {
              language: "en-US",
              value: "Image module description",
            },
          },
        },
        id: "IMAGE_MODULE_ID",
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: "QR code",
    },
    locations: [
      {
        latitude: 37.424015499999996,
        longitude: -122.09259560000001,
      },
    ],
    accountId: "Account id",
    accountName: "Account name",
    loyaltyPoints: {
      label: "Points",
      balance: {
        int: 800,
      },
    },
  };

  // Create the JWT claims
  let claims = {
    iss: this.credentials.client_email,
    aud: "google",
    origins: ["www.example.com"],
    typ: "savetowallet",
    payload: {
      // The listed classes and objects will be created
      loyaltyClasses: [newClass],
      loyaltyObjects: [newObject],
    },
  };

  // The service account credentials are used to sign the JWT
  let token = jwt.sign(claims, this.credentials.private_key, {
    algorithm: "RS256",
  });

  console.log("Add to Google Wallet link");
  console.log(`https://pay.google.com/gp/v/save/${token}`);

  return `https://pay.google.com/gp/v/save/${token}`;
};
// [END jwtNew]

// [START jwtExisting]
/**
 * Generate a signed JWT that references an existing pass object.
 *
 * When the user opens the "Add to Google Wallet" URL and saves the pass to
 * their wallet, the pass objects defined in the JWT are added to the
 * user's Google Wallet app. This allows the user to save multiple pass
 * objects in one API call.
 *
 * The objects to add must follow the below format:
 *
 *  {
 *    'id': 'ISSUER_ID.OBJECT_SUFFIX',
 *    'classId': 'ISSUER_ID.CLASS_SUFFIX'
 *  }
 *
 * @param {string} issuerId The issuer ID being used for this request.
 *
 * @returns {string} An "Add to Google Wallet" link.
 */
const createJwtExistingObjects = async (issuerId) => {
  // Multiple pass types can be added at the same time
  // At least one type must be specified in the JWT claims
  // Note: Make sure to replace the placeholder class and object suffixes
  let objectsToAdd = {
    // Event tickets
    eventTicketObjects: [
      {
        id: `${issuerId}.EVENT_OBJECT_SUFFIX`,
        classId: `${issuerId}.EVENT_CLASS_SUFFIX`,
      },
    ],

    // Boarding passes
    flightObjects: [
      {
        id: `${issuerId}.FLIGHT_OBJECT_SUFFIX`,
        classId: `${issuerId}.FLIGHT_CLASS_SUFFIX`,
      },
    ],

    // Generic passes
    genericObjects: [
      {
        id: `${issuerId}.GENERIC_OBJECT_SUFFIX`,
        classId: `${issuerId}.GENERIC_CLASS_SUFFIX`,
      },
    ],

    // Gift cards
    giftCardObjects: [
      {
        id: `${issuerId}.GIFT_CARD_OBJECT_SUFFIX`,
        classId: `${issuerId}.GIFT_CARD_CLASS_SUFFIX`,
      },
    ],

    // Loyalty cards
    loyaltyObjects: [
      {
        id: `${issuerId}.LOYALTY_OBJECT_SUFFIX`,
        classId: `${issuerId}.LOYALTY_CLASS_SUFFIX`,
      },
    ],

    // Offers
    offerObjects: [
      {
        id: `${issuerId}.OFFER_OBJECT_SUFFIX`,
        classId: `${issuerId}.OFFER_CLASS_SUFFIX`,
      },
    ],

    // Transit passes
    transitObjects: [
      {
        id: `${issuerId}.TRANSIT_OBJECT_SUFFIX`,
        classId: `${issuerId}.TRANSIT_CLASS_SUFFIX`,
      },
    ],
  };

  // Create the JWT claims
  let claims = {
    iss: this.credentials.client_email,
    aud: "google",
    origins: ["www.example.com"],
    typ: "savetowallet",
    payload: objectsToAdd,
  };

  // The service account credentials are used to sign the JWT
  let token = jwt.sign(claims, this.credentials.private_key, {
    algorithm: "RS256",
  });

  console.log("Add to Google Wallet link");
  console.log(`https://pay.google.com/gp/v/save/${token}`);

  return `https://pay.google.com/gp/v/save/${token}`;
};
// [END jwtExisting]

// [START batch]
/**
 * Batch create Google Wallet objects from an existing class.
 *
 * @param {string} issuerId The issuer ID being used for this request.
 * @param {string} classSuffix Developer-defined unique ID for this pass class.
 */
const batchCreateObjects = async (issuerId, classSuffix) => {
  // See below for more information
  // https://cloud.google.com/compute/docs/api/how-tos/batch#example
  let data = "";
  let batchObject;
  let objectSuffix;

  // Example: Generate three new pass objects
  for (let i = 0; i < 3; i++) {
    // Generate a random object suffix
    objectSuffix = uuidv4().replace("[^w.-]", "_");

    // See link below for more information on required properties
    // https://developers.google.com/wallet/retail/loyalty-cards/rest/v1/loyaltyobject
    batchObject = {
      id: `${issuerId}.${objectSuffix}`,
      classId: `${issuerId}.${classSuffix}`,
      state: "ACTIVE",
      heroImage: {
        sourceUri: {
          uri: "https://farm4.staticflickr.com/3723/11177041115_6e6a3b6f49_o.jpg",
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "Hero image description",
          },
        },
      },
      textModulesData: [
        {
          header: "Text module header",
          body: "Text module body",
          id: "TEXT_MODULE_ID",
        },
      ],
      linksModuleData: {
        uris: [
          {
            uri: "http://maps.google.com/",
            description: "Link module URI description",
            id: "LINK_MODULE_URI_ID",
          },
          {
            uri: "tel:6505555555",
            description: "Link module tel description",
            id: "LINK_MODULE_TEL_ID",
          },
        ],
      },
      imageModulesData: [
        {
          mainImage: {
            sourceUri: {
              uri: "http://farm4.staticflickr.com/3738/12440799783_3dc3c20606_b.jpg",
            },
            contentDescription: {
              defaultValue: {
                language: "en-US",
                value: "Image module description",
              },
            },
          },
          id: "IMAGE_MODULE_ID",
        },
      ],
      barcode: {
        type: "QR_CODE",
        value: "QR code",
      },
      locations: [
        {
          latitude: 37.424015499999996,
          longitude: -122.09259560000001,
        },
      ],
      accountId: "Account id",
      accountName: "Account name",
      loyaltyPoints: {
        label: "Points",
        balance: {
          int: 800,
        },
      },
    };

    data += "--batch_createobjectbatch\n";
    data += "Content-Type: application/json\n\n";
    data += "POST /walletobjects/v1/loyaltyObject\n\n";

    data += JSON.stringify(batchObject) + "\n\n";
  }
  data += "--batch_createobjectbatch--";

  // Invoke the batch API calls
  let response = await this.httpClient.request({
    url: this.batchUrl,
    method: "POST",
    data: data,
    headers: {
      // `boundary` is the delimiter between API calls in the batch request
      "Content-Type": "multipart/mixed; boundary=batch_createobjectbatch",
    },
  });

  console.log("Batch insert response");
  // console.log(response);
};
// [END batch]

exports.loyaltyCardAndroid = fn.https.onRequest((request, response) => {
  cors(request, response, async () => {
    // keyFile is service account key file
    this.keyFilePath = serviceAccount;
    this.baseUrl = "https://walletobjects.googleapis.com/walletobjects/v1";
    this.batchUrl = "https://walletobjects.googleapis.com/batch";
    this.classUrl = `${this.baseUrl}/loyaltyClass`;
    this.objectUrl = `${this.baseUrl}/loyaltyObject`;
    const ISSUER_ID = process.env.ISSUER_ID;
    // const ISSUER_ID = process;
    const CLASS_SUFFIX = process.env.CLASS_SUFFIX;
    const OBJECT_SUFFIX = process.env.OBJECT_SUFFIX;

    const auth = () => {
      this.credentials = this.keyFilePath;

      this.httpClient = new GoogleAuth({
        credentials: this.keyFilePath,
        scopes: "https://www.googleapis.com/auth/wallet_object.issuer",
      });
    };

    auth();

    createClass(ISSUER_ID, CLASS_SUFFIX);
    // updateObject(ISSUER_ID, OBJECT_SUFFIX);

    // // // Patch a pass class
    // patchClass(ISSUER_ID, CLASS_SUFFIX);

    // // // Add a message to a pass class
    // addClassMessage(ISSUER_ID, CLASS_SUFFIX, "header", "body");

    // // // Create a pass object
    // createObject(ISSUER_ID, CLASS_SUFFIX, OBJECT_SUFFIX);

    // // // Update a pass object
    // updateObject(ISSUER_ID, OBJECT_SUFFIX);

    // // // Patch a pass object
    // patchObject(ISSUER_ID, OBJECT_SUFFIX);

    // // // Add a message to a pass object
    // addObjectMessage(ISSUER_ID, OBJECT_SUFFIX, "header", "body");

    // // // Expire a pass object
    // expireObject(ISSUER_ID, OBJECT_SUFFIX);

    // // Generate an Add to Google Wallet link that creates a new pass class and object
    const passUrl = await createJwtNewObjects(
      ISSUER_ID,
      CLASS_SUFFIX,
      OBJECT_SUFFIX
    );

    // // Generate an Add to Google Wallet link that references existing pass object(s)
    createJwtExistingObjects(ISSUER_ID);

    // // Create pass objects in batch
    batchCreateObjects(ISSUER_ID, CLASS_SUFFIX);

    response.status(200).json({
      message: "Successfully generated pass for Android",
      assetUrl: passUrl,
    });
  });
});


const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID // 'p11-loyalty-card'
const REGION = process.env.REACT_APP_REGION // 'europe-west1'
const IS_PROD = process.env.NODE_ENV === 'production'

const API_URL = IS_PROD 
  ? `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/`
  : `http://localhost:5000/${PROJECT_ID}/${REGION}/` 

const request = async (path, params) => {
  const response = await fetch(API_URL + path, {
    crossDomain: true,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  return data
}

export const api = {
  request,
  storeCardPass: async (params) => {
    return request('storeCardPass', params)
  },
  generatePass: async (params) => {
    return request('generatePass', params)
  }
}


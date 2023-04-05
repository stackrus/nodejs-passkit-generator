import { useState } from "react";
import GeneriCard from "./GenericCard";
import LoyaltyCard from "./LoyaltyCard";

const CARD_TYPES = {
  LOYALTY: "Loyalty",
  GENERIC: "Generic",
};

const paramsExample = {
  qrText: "https://developer.apple.com",
  thumbnail:
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  primary: {
    value: "primary value",
    label: "primary label",
  },
  secondary: [
    {
      value: "secondary value 1",
      label: "secondary label 1",
    },
    {
      value: "secondary value 2",
      label: "secondary label 2",
    },
  ],
  auxiliary: [
    {
      value: "auxiliary value 1",
      label: "auxiliary label 1",
    },
    {
      value: "auxiliary value 2",
      label: "auxiliary label 1",
    },
  ],
  //   backgroundColor: "000000",
  backgroundColor: "FFFFFF",
  textColor: "000000",
  //   textColor: "FFFFFF",
};

const MainPage = () => {
  const [currentTab, setCurrentTab] = useState(CARD_TYPES.LOYALTY);

  return (
    <div className="main-page">
      <div className="flex flex-col items-center">
        <div className="mb-4 space-x-4 bg-slate-50 border rounded-md p-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentTab(CARD_TYPES.LOYALTY)}
            className={`${
              currentTab === CARD_TYPES.LOYALTY ? "text-blue-600" : "text-black"
            }`}
          >
            Loyalty card
          </button>
          <hr className="border h-6 bg-gray-300" />
          <button
            onClick={() => setCurrentTab(CARD_TYPES.GENERIC)}
            className={`${
              currentTab === CARD_TYPES.GENERIC ? "text-blue-600" : "text-black"
            }`}
          >
            Generic card
          </button>
        </div>

        {
          {
            [CARD_TYPES.LOYALTY]: <LoyaltyCard />,
            [CARD_TYPES.GENERIC]: <GeneriCard />,
          }[currentTab]
        }
      </div>
    </div>
  );
};

export default MainPage;

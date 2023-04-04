import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FB_APPLE_PASSKIT_PROD =
  "https://us-central1-node-passkit-generator.cloudfunctions.net/genericPass";
const FB_APPLE_PASSKIT_DEV =
  "http://localhost:5000/node-passkit-generator/us-central1/genericPass";

const Input = ({ className, placeholder = "", ...props }) => {
  return (
    <input
      type="text"
      className={`h-10 rounded-md border-gray-300 px-4 shadow-sm focus:border-primary-400 focus:ring focus:ring-primary-200 focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
      placeholder={placeholder}
      {...props}
    />
  );
};

const GeneriCard = ({}) => {
  const [isLoading, setLoading] = useState(false);
  const [primaryLabel, setPrimaryLabel] = useState("");
  const [primaryValue, setPrimaryValue] = useState("");
  const [secondaryLabel1, setSecondaryLabel1] = useState("");
  const [secondaryValue1, setSecondaryValue1] = useState("");
  const [secondaryLabel2, setSecondaryLabel2] = useState("");
  const [secondaryValue2, setSecondaryValue2] = useState("");
  const [auxiliaryLabel1, setAuxiliaryLabel1] = useState("");
  const [auxiliaryValue1, setAuxiliaryValue1] = useState("");
  const [auxiliaryLabel2, setAuxiliaryLabel2] = useState("");
  const [auxiliaryValue2, setAuxiliaryValue2] = useState("");
  const [bgColor, setBgColor] = useState("FFFFFF");
  const [textColor, setTextColor] = useState("000000");
  const [qrText, setQrText] = useState("https://p11.co");
  const [thumbnail, setThumbnail] = useState(
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
  );

  const generateApplePasskit = async () => {
    setLoading(true);

    const params = {
      qrText,
      thumbnail,
      primary: {
        value: primaryValue,
        label: primaryLabel,
      },
      secondary: [
        {
          value: secondaryValue1,
          label: secondaryLabel1,
        },
        {
          value: secondaryValue2,
          label: secondaryLabel2,
        },
      ],
      auxiliary: [
        {
          value: auxiliaryValue1,
          label: auxiliaryLabel1,
        },
        {
          value: auxiliaryValue2,
          label: auxiliaryLabel2,
        },
      ],
      backgroundColor: bgColor,
      textColor,
    };

    const response = await fetch(FB_APPLE_PASSKIT_DEV, {
      crossDomain: true,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    setLoading(false);
    const data = await response.json();
    console.log(data);
    toast.success("Passkit generated successfully");
  };

  return (
    <>
      <div className="w-[30rem] h-[40rem] mb-4 bg-slate-50 border rounded-md p-4 flex flex-col">
        <div className="flex space-x-4 items-center">
          <div className="w-10 h-10 bg-slate-400">Icon</div>
          <Input className="h-6" placeholder="Main label" disabled />
        </div>
        <div className="flex space-x-8 mt-14 justify-between items-center">
          <div className="flex flex-col space-y-2">
            <Input
              value={primaryLabel}
              onChange={(e) => setPrimaryLabel(e.target.value)}
              className="h-6"
              placeholder="Primary label"
            />
            <Input
              value={primaryValue}
              onChange={(e) => setPrimaryValue(e.target.value)}
              placeholder="Primary value"
            />
          </div>
          <div className="w-16 h-16 bg-slate-400">Icon</div>
        </div>
        <div className="flex space-x-8 mt-6 justify-between items-center w-full">
          <div className="flex flex-col space-y-2">
            <Input
              value={secondaryLabel1}
              onChange={(e) => setSecondaryLabel1(e.target.value)}
              className="h-6"
              placeholder="Secondary label 1"
            />
            <Input
              value={secondaryValue1}
              onChange={(e) => setSecondaryValue1(e.target.value)}
              placeholder="Secondary value 1"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Input
              value={secondaryLabel2}
              onChange={(e) => setSecondaryLabel2(e.target.value)}
              className="h-6"
              placeholder="Secondary label 2"
            />
            <Input
              value={secondaryValue2}
              onChange={(e) => setSecondaryValue2(e.target.value)}
              placeholder="Secondary value 2"
            />
          </div>
        </div>

        <div className="flex space-x-8 mt-6 justify-between items-center w-full">
          <div className="flex flex-col space-y-2">
            <Input
              value={auxiliaryLabel1}
              onChange={(e) => setAuxiliaryLabel1(e.target.value)}
              className="h-6"
              placeholder="Auxiliary label 1"
            />
            <Input
              value={auxiliaryValue1}
              onChange={(e) => setAuxiliaryValue1(e.target.value)}
              placeholder="Auxiliary value 1"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Input
              value={auxiliaryLabel2}
              onChange={(e) => setAuxiliaryLabel2(e.target.value)}
              className="h-6"
              placeholder="Auxiliary label 2"
            />
            <Input
              value={auxiliaryValue2}
              onChange={(e) => setAuxiliaryValue2(e.target.value)}
              placeholder="Auxiliary value 2"
            />
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-center space-y-4">
          <Input
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            placeholder="QR code link"
          />
          <div className="bg-slate-700 h-[7rem] w-[7rem]"></div>
        </div>
      </div>
      <button
        onClick={generateApplePasskit}
        disabled={isLoading}
        type="button"
        className="w-[18rem] rounded-lg border border-blue-500 bg-blue-500 px-5 py-1.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:border-blue-700 hover:bg-blue-700 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:border-blue-300 disabled:bg-blue-300"
      >
        Generate a passkit
      </button>
    </>
  );
};

export default GeneriCard;

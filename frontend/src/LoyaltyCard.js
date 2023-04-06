import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api } from "./api";

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

const LoyaltyCard = () => {
  const [isLoading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [downloadUrlApple, setDownloadUrlApple] = useState("");
  const [downloadUrlAndroid, setDownloadUrlAndroid] = useState("");

  const generateApplePasskit = async () => {
    setDownloadUrlApple("");
    setDownloadUrlAndroid("");
    setLoading(true);

    const params = {
      name,
      email,
    };

    const applePass = await api.loyaltyCardApple(params);
    const androidPass = await api.loyaltyCardAndroid(params);

    setDownloadUrlApple(applePass.assetUrl);
    setDownloadUrlAndroid(androidPass.assetUrl);
    setLoading(false);

    toast.success("Passkits were generated successfully");
  };

  return (
    <div className="flex flex-col mt-4">
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <span>Your name</span>
          <Input
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <span>Your Email</span>
          <Input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={generateApplePasskit}
        disabled={isLoading}
        type="button"
        className="self-center h-10 mt-6 w-[18rem] rounded-lg border border-blue-500 bg-blue-500 px-5 py-1.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:border-blue-700 hover:bg-blue-700 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:border-blue-300 disabled:bg-blue-300"
      >
        Generate a new passkit
      </button>

      <div className="flex space-x-2 items-center justify-center">
        {downloadUrlApple && (
          <div className="mt-10 flex flex-col space-y-3 items-center">
            <a
              className="w-full rounded-lg border border-gray-500 bg-gray-500 px-5 py-1.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:border-gray-700 hover:bg-gray-700 focus:ring focus:ring-gray-200 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
              href={downloadUrlApple}
            >
              Download Apple pass 🍎
            </a>
          </div>
        )}

        {downloadUrlAndroid && (
          <div className="mt-10 flex flex-col space-y-3 items-center">
            <a
              className="w-full rounded-lg border border-green-500 bg-green-500 px-5 py-1.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:border-green-700 hover:bg-green-700 focus:ring focus:ring-green-200 disabled:cursor-not-allowed disabled:border-green-300 disabled:bg-green-300"
              href={downloadUrlAndroid}
            >
              Open Android pass 🤖
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyCard;

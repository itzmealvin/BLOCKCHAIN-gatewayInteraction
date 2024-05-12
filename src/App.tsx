import { zodResolver } from "@hookform/resolvers/zod";
import { Contract } from "ethers";
import { BrowserProvider } from "ethers/providers";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
import gatewayABI from "../contracts/Gateway.json";
import "./App.css";
import BlockchainServices from "./services/BlockchainServices";

const schema = z.object({
  contract: z.string(),
});

type FormData = z.infer<typeof schema>;

function App() {
  const [address, setAddress] = useState("");
  const [hash, setHash] = useState("");
  const [gatewayContract, setGatewayContract] = useState<Contract | null>(null);
  const browserWallet = BlockchainServices.getProvider() as BrowserProvider;

  const handleClick = async () => {
    if (browserWallet) {
      if (!(await BlockchainServices.isOnRightNetwork(browserWallet))) {
        await BlockchainServices.switchNetwork(browserWallet);
      }
      const signer = await browserWallet.getSigner();
      setGatewayContract(
        new Contract(
          "0xF871c929bE8Cd8382148C69053cE5ED1a9593EA7",
          gatewayABI,
          signer
        )
      );
      setAddress(signer.address);
    }
  };

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FieldValues) => {
    const execPromise = gatewayContract!.submitMessage(
      data.contract,
      81,
      100_000,
      "0x"
    );
    const transaction = await toast
      .promise(execPromise, {
        pending: "Sending transaction",
        success: "Transaction submitted 👌",
        error: "Transaction failed 🤯",
      })
      .then();
    setHash(transaction.hash);
  };

  return (
    <div>
      <p>ASTAR GATEWAY APP</p>
      <button onClick={handleClick} disabled={address !== ""}>
        Connect Wallet
      </button>
      {address !== "" && <p>Connected Address: {address}</p>}
      <p>Your deployed contract (on Shibuya) </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("contract")} type="text" />
        <button type="submit">Submit</button>
      </form>
      {hash !== "" && <p>Transaction hash: {hash}</p>}
      <ToastContainer
        stacked
        position="bottom-right"
        autoClose={1000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default App;
